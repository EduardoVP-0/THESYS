<?php

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\JuradoProyecto;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function createJuryStudent(User $registeredBy, string $name = 'Ana'): User
{
    $student = User::factory()->create([
        'id_rol' => 5,
        'name' => $name,
    ]);

    $careerId = DB::table('tblcarreras')->insertGetId([
        'nombre_carrera' => 'Carrera de prueba '.Str::random(6),
        'descripcion' => 'Carrera para pruebas de jurado',
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

function createJuryProject(string $estado = 'Aprobado', string $titulo = 'Sistema de gestión académica'): int
{
    return DB::table('tblproyectos')->insertGetId([
        'titulo' => $titulo,
        'resumen' => 'Proyecto de tesis de prueba',
        'estado' => $estado,
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');
}

function linkJuryStudentToProject(User $student, int $projectId): void
{
    DB::table('tblalumnos_proyectos')->insert([
        'id_alumno' => $student->id,
        'id_proyecto' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createJuryDocente(
    User $registeredBy,
    string $name = 'Carlos',
    bool $active = true,
): User {
    $docente = User::factory()->create([
        'id_rol' => 4,
        'name' => $name,
        'estado' => true,
    ]);

    DB::table('tbldocentes')->insert([
        'id_usuario' => $docente->id,
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

    return $docente;
}

function assignJuryAdvisor(
    User $advisor,
    int $projectId,
    string $estado = AsignacionAsesor::ESTADO_ACTIVO,
): void {
    DB::table('tblasesores_proyectos')->insert([
        'id_usuario' => $advisor->id,
        'id_proyecto' => $projectId,
        'estado_asignacion' => $estado,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

/**
 * @param  array<int, User>  $docentes
 */
function createJuryMembers(
    array $docentes,
    int $projectId,
    ?array $estados = null,
): void {
    foreach (JuradoProyecto::CARGOS as $index => $cargo) {
        DB::table('tbljurados_proyectos')->insert([
            'id_usuario' => $docentes[$index]->id,
            'id_proyecto' => $projectId,
            'cargo' => $cargo,
            'estado_aceptacion' => $estados[$index]
                ?? JuradoProyecto::ESTADO_PENDIENTE,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

/**
 * @param  array<int, User>  $docentes
 * @return array<string, int>
 */
function juryPayload(int $projectId, array $docentes): array
{
    return [
        'id_proyecto' => $projectId,
        'presidente' => $docentes[0]->id,
        'secretario' => $docentes[1]->id,
        'vocal' => $docentes[2]->id,
        'suplente_1' => $docentes[3]->id,
        'suplente_2' => $docentes[4]->id,
    ];
}

test('renders projects with an active advisor and active docentes', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createJuryStudent($admin);
    $projectId = createJuryProject('Aprobado', 'Sistema de recomendación académica');
    linkJuryStudentToProject($student, $projectId);

    $advisor = createJuryDocente($admin, 'Carlos');
    assignJuryAdvisor($advisor, $projectId);

    $otherDocente = createJuryDocente($admin, 'Elena');
    createJuryDocente($admin, 'Inactivo', false);

    $projectWithoutAdvisor = createJuryProject('Aprobado', 'Proyecto sin asesor');
    linkJuryStudentToProject($student, $projectWithoutAdvisor);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.asignaciones.jurados.index', ['proyecto' => $projectId]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/asignaciones/jurados/index')
        ->has('proyectos', 1)
        ->where('proyectos.0.id_proyecto', $projectId)
        ->where('proyectos.0.titulo', 'Sistema de recomendación académica')
        ->where('proyectos.0.tiene_jurado', false)
        ->where('proyectos.0.sustentantes.0.id_usuario', $student->id)
        ->where('proyectos.0.asesores.0.id_usuario', $advisor->id)
        ->has('proyectos.0.jurado', 0)
        ->has('docentes', 2)
        ->where('docentes.0.id_usuario', $advisor->id)
        ->where('docentes.1.id_usuario', $otherDocente->id)
        ->where('proyectoSeleccionadoId', $projectId)
    );
});

test('assigns five distinct jury members with pending acceptance', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createJuryStudent($admin);
    $projectId = createJuryProject();
    linkJuryStudentToProject($student, $projectId);

    $advisor = createJuryDocente($admin, 'Carlos');
    assignJuryAdvisor($advisor, $projectId);

    $docentes = [
        createJuryDocente($admin, 'Elena'),
        createJuryDocente($admin, 'Fernanda'),
        $advisor,
        createJuryDocente($admin, 'Gabriel'),
        createJuryDocente($admin, 'Hugo'),
    ];

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.asignaciones.jurados.store'), juryPayload($projectId, $docentes));

    $response->assertRedirect(route('admin.asignaciones.jurados.index', ['proyecto' => $projectId]));
    $response->assertSessionHas('success');

    $miembros = JuradoProyecto::query()
        ->where('id_proyecto', $projectId)
        ->get();

    expect($miembros)->toHaveCount(5);
    $this->assertEqualsCanonicalizing(
        JuradoProyecto::CARGOS,
        $miembros->pluck('cargo')->all(),
    );
    $this->assertEqualsCanonicalizing(
        array_map(fn (User $docente): int => $docente->id, $docentes),
        $miembros->pluck('id_usuario')->all(),
    );
    expect($miembros->every(
        fn (JuradoProyecto $miembro): bool => $miembro->estado_aceptacion === JuradoProyecto::ESTADO_PENDIENTE,
    ))->toBeTrue();
});

test('rejects the same docente in more than one jury position', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createJuryStudent($admin);
    $projectId = createJuryProject();
    linkJuryStudentToProject($student, $projectId);

    $advisor = createJuryDocente($admin, 'Carlos');
    assignJuryAdvisor($advisor, $projectId);

    $docentes = [
        createJuryDocente($admin, 'Elena'),
        createJuryDocente($admin, 'Fernanda'),
        createJuryDocente($admin, 'Gabriel'),
        createJuryDocente($admin, 'Hugo'),
    ];

    $response = $this
        ->from(route('admin.asignaciones.jurados.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.jurados.store'), [
            'id_proyecto' => $projectId,
            'presidente' => $docentes[0]->id,
            'secretario' => $docentes[1]->id,
            'vocal' => $docentes[1]->id,
            'suplente_1' => $docentes[2]->id,
            'suplente_2' => $docentes[3]->id,
        ]);

    $response->assertRedirect(route('admin.asignaciones.jurados.index'));
    $response->assertSessionHasErrors(['secretario', 'vocal']);

    expect(JuradoProyecto::query()->where('id_proyecto', $projectId)->count())
        ->toBe(0);
});

test('rejects the project advisor as jury president', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createJuryStudent($admin);
    $projectId = createJuryProject();
    linkJuryStudentToProject($student, $projectId);

    $advisor = createJuryDocente($admin, 'Carlos');
    assignJuryAdvisor($advisor, $projectId);

    $docentes = [
        $advisor,
        createJuryDocente($admin, 'Elena'),
        createJuryDocente($admin, 'Fernanda'),
        createJuryDocente($admin, 'Gabriel'),
        createJuryDocente($admin, 'Hugo'),
    ];

    $response = $this
        ->from(route('admin.asignaciones.jurados.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.jurados.store'), juryPayload($projectId, $docentes));

    $response->assertRedirect(route('admin.asignaciones.jurados.index'));
    $response->assertSessionHasErrors('presidente');

    expect(JuradoProyecto::query()->where('id_proyecto', $projectId)->count())
        ->toBe(0);
});

test('rejects an inactive docente as jury member', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createJuryStudent($admin);
    $projectId = createJuryProject();
    linkJuryStudentToProject($student, $projectId);

    $advisor = createJuryDocente($admin, 'Carlos');
    assignJuryAdvisor($advisor, $projectId);

    $docentes = [
        createJuryDocente($admin, 'Elena'),
        createJuryDocente($admin, 'Fernanda'),
        createJuryDocente($admin, 'Gabriel'),
        createJuryDocente($admin, 'Hugo', false),
        createJuryDocente($admin, 'Irene'),
    ];

    $response = $this
        ->from(route('admin.asignaciones.jurados.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.jurados.store'), juryPayload($projectId, $docentes));

    $response->assertRedirect(route('admin.asignaciones.jurados.index'));
    $response->assertSessionHasErrors('suplente_1');

    expect(JuradoProyecto::query()->where('id_proyecto', $projectId)->count())
        ->toBe(0);
});

test('does not overwrite a jury that is already registered', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createJuryStudent($admin);
    $projectId = createJuryProject();
    linkJuryStudentToProject($student, $projectId);

    $advisor = createJuryDocente($admin, 'Carlos');
    assignJuryAdvisor($advisor, $projectId);

    $existingMembers = [
        createJuryDocente($admin, 'Elena'),
        createJuryDocente($admin, 'Fernanda'),
        createJuryDocente($admin, 'Gabriel'),
        createJuryDocente($admin, 'Hugo'),
        createJuryDocente($admin, 'Irene'),
    ];
    createJuryMembers($existingMembers, $projectId);

    $this->actingAs($admin)
        ->get(route('admin.asignaciones.jurados.index', ['proyecto' => $projectId]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/asignaciones/jurados/index')
            ->has('proyectos', 1)
            ->where('proyectos.0.id_proyecto', $projectId)
            ->where('proyectos.0.tiene_jurado', true)
            ->has('proyectos.0.jurado', 5)
            ->where('proyectoSeleccionadoId', $projectId)
        );

    $newMembers = [
        createJuryDocente($admin, 'Julia'),
        createJuryDocente($admin, 'Karla'),
        createJuryDocente($admin, 'Laura'),
        createJuryDocente($admin, 'Mario'),
        createJuryDocente($admin, 'Nora'),
    ];

    $response = $this
        ->from(route('admin.asignaciones.jurados.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.jurados.store'), juryPayload($projectId, $newMembers));

    $response->assertRedirect(route('admin.asignaciones.jurados.index'));
    $response->assertSessionHasErrors('id_proyecto');

    expect(JuradoProyecto::query()->where('id_proyecto', $projectId)->count())
        ->toBe(5);

    foreach ($newMembers as $docente) {
        $this->assertDatabaseMissing('tbljurados_proyectos', [
            'id_usuario' => $docente->id,
            'id_proyecto' => $projectId,
        ]);
    }
});

test('rejects a project without an active advisor', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createJuryStudent($admin);
    $projectId = createJuryProject();
    linkJuryStudentToProject($student, $projectId);

    $docentes = [
        createJuryDocente($admin, 'Elena'),
        createJuryDocente($admin, 'Fernanda'),
        createJuryDocente($admin, 'Gabriel'),
        createJuryDocente($admin, 'Hugo'),
        createJuryDocente($admin, 'Irene'),
    ];

    $response = $this
        ->from(route('admin.asignaciones.jurados.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.jurados.store'), juryPayload($projectId, $docentes));

    $response->assertRedirect(route('admin.asignaciones.jurados.index'));
    $response->assertSessionHasErrors('id_proyecto');

    expect(JuradoProyecto::query()->where('id_proyecto', $projectId)->count())
        ->toBe(0);
});

test('renders the consultation of juries grouped by thesis', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $student = createJuryStudent($admin);
    $projectId = createJuryProject('Aprobado', 'Tesis de consulta');
    linkJuryStudentToProject($student, $projectId);

    $advisor = createJuryDocente($admin, 'Carlos');
    assignJuryAdvisor($advisor, $projectId);

    $members = [
        createJuryDocente($admin, 'Elena'),
        createJuryDocente($admin, 'Fernanda'),
        createJuryDocente($admin, 'Gabriel'),
        createJuryDocente($admin, 'Hugo'),
        createJuryDocente($admin, 'Irene'),
    ];

    createJuryMembers($members, $projectId, [
        JuradoProyecto::ESTADO_ACEPTADO,
        JuradoProyecto::ESTADO_ACEPTADO,
        JuradoProyecto::ESTADO_PENDIENTE,
        JuradoProyecto::ESTADO_ACEPTADO,
        JuradoProyecto::ESTADO_ACEPTADO,
    ]);

    $projectWithoutJury = createJuryProject('Aprobado', 'Tesis sin jurado');
    linkJuryStudentToProject($student, $projectWithoutJury);
    assignJuryAdvisor($advisor, $projectWithoutJury);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.asignaciones.jurados.consulta'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/asignaciones/jurados/consulta')
        ->has('proyectos', 1)
        ->where('proyectos.0.id_proyecto', $projectId)
        ->where('proyectos.0.titulo', 'Tesis de consulta')
        ->where('proyectos.0.tiene_jurado', true)
        ->where('proyectos.0.asesores.0.id_usuario', $advisor->id)
        ->has('proyectos.0.jurado', 5)
        ->where('proyectos.0.jurado.0.cargo', JuradoProyecto::CARGO_PRESIDENTE)
        ->where('proyectos.0.jurado.0.estado_aceptacion', JuradoProyecto::ESTADO_ACEPTADO)
        ->where('proyectos.0.jurado.1.cargo', JuradoProyecto::CARGO_SECRETARIO)
        ->where('proyectos.0.jurado.2.estado_aceptacion', JuradoProyecto::ESTADO_PENDIENTE)
    );
});

test('forbids students from accessing jury assignment and consultation', function () {
    $this->seed(RoleSeeder::class);
    $student = User::factory()->create(['id_rol' => 5]);

    $this->actingAs($student)
        ->get(route('admin.asignaciones.jurados.index'))
        ->assertForbidden();

    $this->actingAs($student)
        ->get(route('admin.asignaciones.jurados.consulta'))
        ->assertForbidden();
});
