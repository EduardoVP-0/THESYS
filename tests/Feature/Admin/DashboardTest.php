<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('renders the administrative dashboard', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/dashboard/index')
        ->has('stats')
        ->has('estadoTesis', 4)
        ->has('tesisPorCarrera')
        ->has('ultimasTesis')
        ->has('todasTesis')
        ->has('defensasCalendario')
        ->where('totalTesis', 0)
    );
});

test('calculates dashboard metrics from stored data', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);
    $student = User::factory()->create(['id_rol' => 5]);
    $examDate = now()->addDays(10)->toDateString();

    $careerId = DB::table('tblcarreras')->insertGetId([
        'nombre_carrera' => 'Ingeniería en Sistemas',
        'descripcion' => 'Carrera de prueba',
        'duracion_semestres' => 9,
        'estado' => true,
        'id_usuario_registro' => $admin->id,
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_carrera');

    DB::table('tblalumnos')->insert([
        'id_usuario' => $student->id,
        'id_usuario_registro' => $admin->id,
        'id_carrera' => $careerId,
        'nombre' => 'Ana',
        'apellido_p' => 'Quintana',
        'apellido_m' => 'López',
        'fecha_nacimiento' => '2000-01-01',
        'sexo' => 'Femenino',
        'curp' => 'QUAA000101MCHXXX01',
        'telefono' => '9610000000',
        'matricula' => 'A000000001',
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

    $projectId = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Sistema de recomendación académica',
        'resumen' => 'Proyecto de prueba',
        'estado' => 'En desarrollo',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    DB::table('tblalumnos_proyectos')->insert([
        'id_alumno' => $student->id,
        'id_proyecto' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('tblexamenes_profesionales')->insert([
        'id_proyecto' => $projectId,
        'fecha_examen' => $examDate,
        'hora_examen' => '10:00:00',
        'sede' => 'Sala de titulación',
        'estado_examen' => 'Programado',
        'resultado_final' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/dashboard/index')
        ->where('stats.tesis_en_proceso', 1)
        ->where('stats.tesis_aprobadas', 0)
        ->where('stats.estudiantes_activos', 1)
        ->where('stats.proximas_defensas', 1)
        ->where('totalTesis', 1)
        ->where('estadoTesis.0.estado', 'Planteamiento')
        ->where('estadoTesis.0.total', 0)
        ->where('estadoTesis.1.estado', 'En desarrollo')
        ->where('estadoTesis.1.total', 1)
        ->has('tesisPorCarrera', 1)
        ->where('tesisPorCarrera.0.carrera', 'Ingeniería en Sistemas')
        ->where('tesisPorCarrera.0.total', 1)
        ->has('ultimasTesis', 1)
        ->where('ultimasTesis.0.titulo', 'Sistema de recomendación académica')
        ->where('ultimasTesis.0.estudiante', $student->name)
        ->has('defensasCalendario', 1)
        ->where('defensasCalendario.0.fecha', $examDate)
    );
});

test('forbids students from accessing the administrative dashboard', function () {
    $this->seed(RoleSeeder::class);
    $student = User::factory()->create(['id_rol' => 5]);

    $response = $this->actingAs($student)->get(route('admin.dashboard'));

    $response->assertForbidden();
});

test('downloads the thesis report as CSV', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $response = $this->actingAs($admin)->get(route('admin.dashboard.report', [
        'format' => 'csv',
    ]));

    $response->assertOk();
    $response->assertDownload();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
});

test('renders the printable PDF report', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create(['id_rol' => 1]);

    $response = $this->actingAs($admin)->get(route('admin.dashboard.report', [
        'format' => 'pdf',
    ]));

    $response->assertOk();
    $response->assertSee('Reporte general de tesis');
    $response->assertSee('window.print()', false);
});
