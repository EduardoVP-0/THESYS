<?php

use App\Models\Admin\AsignacionAsesor;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function createAssignmentStudent(User $registeredBy, string $name = 'Ana'): User
{
    $student = User::factory()->create([
        'id_rol' => 5,
        'name' => $name,
    ]);

    $careerId = DB::table('tblcarreras')->insertGetId([
        'nombre_carrera' => 'Carrera de prueba '.Str::random(6),
        'descripcion' => 'Carrera para pruebas de asignación',
        'duracion_semestres' => 9,
        'estado' => true,
        'id_usuario_registro' => $registeredBy->id,
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_carrera');

    DB::table('tblalumnos')->insert([
        'id_usuario' => $student->id,
        'id_usuario_registro' => $registeredBy->id,
        'id_carrera' => $careerId,
        'nombre' => $name,
        'apellido_p' => 'Quintana',
        'apellido_m' => 'López',
        'fecha_nacimiento' => '2000-01-01',
        'sexo' => 'Femenino',
        'curp' => Str::upper(Str::random(18)),
        'telefono' => '9610000000',
        'matricula' => 'A'.str_pad((string) $student->id, 9, '0', STR_PAD_LEFT),
        'calle' => 'Calle 1',
        'colonia' => 'Centro',
        'codigo_postal' => '29000',
        'turno' => 'Matutino',
        'fecha_ingreso' => '2022-08-01',
        'generacion' => '2022 - 2026',
        'estado_academico' => 'Activo',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $student;
}

function createAssignmentProject(string $estado = 'Aprobado', string $titulo = 'Sistema de gestión académica'): int
{
    return DB::table('tblproyectos')->insertGetId([
        'titulo' => $titulo,
        'resumen' => 'Anteproyecto de prueba',
        'estado' => $estado,
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');
}

function linkAssignmentStudentToProject(User $student, int $projectId): void
{
    DB::table('tblalumnos_proyectos')->insert([
        'id_alumno' => $student->id,
        'id_proyecto' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createAssignmentAdvisor(User $registeredBy, bool $active = true, string $name = 'Carlos'): User
{
    $advisor = User::factory()->create([
        'id_rol' => 4,
        'name' => $name,
        'estado' => true,
    ]);

    DB::table('tbldocentes')->insert([
        'id_usuario' => $advisor->id,
        'id_usuario_registro' => $registeredBy->id,
        'nombre' => $name,
        'apellido_p' => 'Ramírez',
        'apellido_m' => 'Torres',
        'telefono' => '9611111111',
        'cedula_profesional' => (string) random_int(1000000000, 9999999999),
        'curp' => Str::upper(Str::random(18)),
        'especialidad' => 'Ingeniería en Sistemas',
        'grado_academico' => 'Doctorado',
        'tipo_contrato' => 'Tiempo completo',
        'estado' => $active,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $advisor;
}

function assignProjectToAdvisor(User $advisor, int $projectId, string $estado = AsignacionAsesor::ESTADO_ACTIVO): void
{
    DB::table('tblasesores_proyectos')->insert([
        'id_usuario' => $advisor->id,
        'id_proyecto' => $projectId,
        'estado_asignacion' => $estado,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

test('renders pending approved projects and advisor workload', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $availableAdvisor = createAssignmentAdvisor($admin, true, 'Carlos');
    $fullAdvisor = createAssignmentAdvisor($admin, true, 'Elena');
    createAssignmentAdvisor($admin, false, 'Inactivo');

    $pendingStudent = createAssignmentStudent($admin, 'Ana');
    $pendingProjectId = createAssignmentProject('Aprobado', 'Sistema de recomendación académica');
    linkAssignmentStudentToProject($pendingStudent, $pendingProjectId);

    $assignedStudent = createAssignmentStudent($admin, 'Beatriz');
    $assignedProjectId = createAssignmentProject('Aprobada', 'Sistema de inventarios');
    linkAssignmentStudentToProject($assignedStudent, $assignedProjectId);
    assignProjectToAdvisor($availableAdvisor, $assignedProjectId);

    $extraProjectId = createAssignmentProject('Aprobado', 'Proyecto adicional');
    assignProjectToAdvisor($availableAdvisor, $extraProjectId);

    for ($index = 0; $index < AsignacionAsesor::MAX_PROYECTOS_ACTIVOS_POR_ASESOR; $index++) {
        $projectId = createAssignmentProject('Aprobado', "Proyecto de carga {$index}");
        assignProjectToAdvisor($fullAdvisor, $projectId);
    }

    $proposedStudent = createAssignmentStudent($admin, 'Carla');
    $proposedProjectId = createAssignmentProject('Propuesta', 'Anteproyecto sin aprobar');
    linkAssignmentStudentToProject($proposedStudent, $proposedProjectId);

    $response = $this->actingAs($admin)->get(route('admin.asignaciones.asesores.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/asignaciones/asesores/index')
        ->has('solicitudes', 1)
        ->where('solicitudes.0.id_alumno', $pendingStudent->id)
        ->where('solicitudes.0.id_proyecto', $pendingProjectId)
        ->where('solicitudes.0.proyecto.titulo', 'Sistema de recomendación académica')
        ->has('asesores', 2)
        ->where('asesores.0.id_usuario', $availableAdvisor->id)
        ->where('asesores.0.carga_actual', 2)
        ->where('asesores.0.carga_maxima', AsignacionAsesor::MAX_PROYECTOS_ACTIVOS_POR_ASESOR)
        ->where('asesores.0.disponible', true)
        ->where('asesores.1.id_usuario', $fullAdvisor->id)
        ->where('asesores.1.carga_actual', AsignacionAsesor::MAX_PROYECTOS_ACTIVOS_POR_ASESOR)
        ->where('asesores.1.disponible', false)
    );
});

test('assigns an available advisor to a pending approved project', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createAssignmentStudent($admin);
    $projectId = createAssignmentProject();
    linkAssignmentStudentToProject($student, $projectId);
    $advisor = createAssignmentAdvisor($admin);

    $response = $this->actingAs($admin)->post(route('admin.asignaciones.asesores.store'), [
        'id_alumno' => $student->id,
        'id_proyecto' => $projectId,
        'id_asesor' => $advisor->id,
    ]);

    $response->assertRedirect(route('admin.asignaciones.asesores.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('tblasesores_proyectos', [
        'id_usuario' => $advisor->id,
        'id_proyecto' => $projectId,
        'estado_asignacion' => AsignacionAsesor::ESTADO_ACTIVO,
    ]);
});

test('rejects assigning a second advisor to the same project', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createAssignmentStudent($admin);
    $projectId = createAssignmentProject();
    linkAssignmentStudentToProject($student, $projectId);

    $assignedAdvisor = createAssignmentAdvisor($admin, true, 'Carlos');
    $otherAdvisor = createAssignmentAdvisor($admin, true, 'Elena');
    assignProjectToAdvisor($assignedAdvisor, $projectId);

    $response = $this
        ->from(route('admin.asignaciones.asesores.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.asesores.store'), [
            'id_alumno' => $student->id,
            'id_proyecto' => $projectId,
            'id_asesor' => $otherAdvisor->id,
        ]);

    $response->assertRedirect(route('admin.asignaciones.asesores.index'));
    $response->assertSessionHasErrors('id_proyecto');

    $this->assertDatabaseMissing('tblasesores_proyectos', [
        'id_usuario' => $otherAdvisor->id,
        'id_proyecto' => $projectId,
    ]);
});

test('rejects an advisor with a full workload', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createAssignmentStudent($admin);
    $projectId = createAssignmentProject();
    linkAssignmentStudentToProject($student, $projectId);
    $advisor = createAssignmentAdvisor($admin);

    for ($index = 0; $index < AsignacionAsesor::MAX_PROYECTOS_ACTIVOS_POR_ASESOR; $index++) {
        $assignedProjectId = createAssignmentProject('Aprobado', "Proyecto de carga {$index}");
        assignProjectToAdvisor($advisor, $assignedProjectId);
    }

    $response = $this
        ->from(route('admin.asignaciones.asesores.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.asesores.store'), [
            'id_alumno' => $student->id,
            'id_proyecto' => $projectId,
            'id_asesor' => $advisor->id,
        ]);

    $response->assertRedirect(route('admin.asignaciones.asesores.index'));
    $response->assertSessionHasErrors('id_asesor');

    $this->assertDatabaseMissing('tblasesores_proyectos', [
        'id_usuario' => $advisor->id,
        'id_proyecto' => $projectId,
    ]);
});

test('rejects an inactive advisor', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createAssignmentStudent($admin);
    $projectId = createAssignmentProject();
    linkAssignmentStudentToProject($student, $projectId);
    $advisor = createAssignmentAdvisor($admin, false);

    $response = $this
        ->from(route('admin.asignaciones.asesores.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.asesores.store'), [
            'id_alumno' => $student->id,
            'id_proyecto' => $projectId,
            'id_asesor' => $advisor->id,
        ]);

    $response->assertRedirect(route('admin.asignaciones.asesores.index'));
    $response->assertSessionHasErrors('id_asesor');

    $this->assertDatabaseMissing('tblasesores_proyectos', [
        'id_usuario' => $advisor->id,
        'id_proyecto' => $projectId,
    ]);
});

test('rejects an anteproyecto that has not been approved', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createAssignmentStudent($admin);
    $projectId = createAssignmentProject('Propuesta');
    linkAssignmentStudentToProject($student, $projectId);
    $advisor = createAssignmentAdvisor($admin);

    $response = $this
        ->from(route('admin.asignaciones.asesores.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.asesores.store'), [
            'id_alumno' => $student->id,
            'id_proyecto' => $projectId,
            'id_asesor' => $advisor->id,
        ]);

    $response->assertRedirect(route('admin.asignaciones.asesores.index'));
    $response->assertSessionHasErrors('id_proyecto');

    $this->assertDatabaseMissing('tblasesores_proyectos', [
        'id_usuario' => $advisor->id,
        'id_proyecto' => $projectId,
    ]);
});

test('rejects a project that does not belong to the selected student', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createAssignmentStudent($admin, 'Ana');
    $otherStudent = createAssignmentStudent($admin, 'Beatriz');
    $otherProjectId = createAssignmentProject('Aprobado', 'Proyecto de otra alumna');
    linkAssignmentStudentToProject($otherStudent, $otherProjectId);
    $advisor = createAssignmentAdvisor($admin);

    $response = $this
        ->from(route('admin.asignaciones.asesores.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.asesores.store'), [
            'id_alumno' => $student->id,
            'id_proyecto' => $otherProjectId,
            'id_asesor' => $advisor->id,
        ]);

    $response->assertRedirect(route('admin.asignaciones.asesores.index'));
    $response->assertSessionHasErrors('id_proyecto');

    $this->assertDatabaseMissing('tblasesores_proyectos', [
        'id_usuario' => $advisor->id,
        'id_proyecto' => $otherProjectId,
    ]);
});

test('forbids students from accessing advisor assignment', function () {
    $this->seed(RoleSeeder::class);
    $student = User::factory()->create(['id_rol' => 5]);

    $response = $this->actingAs($student)->get(route('admin.asignaciones.asesores.index'));

    $response->assertForbidden();
});
