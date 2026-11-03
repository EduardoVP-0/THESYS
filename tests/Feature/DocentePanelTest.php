<?php

use App\Models\Admin\Dictamen;
use App\Models\Admin\JuradoProyecto;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->seed(RoleSeeder::class);
});

test('docentes are redirected to the docente dashboard', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $this->actingAs($docente)
        ->get(route('dashboard'))
        ->assertRedirect(route('docente.dashboard'));
});

test('non docentes cannot access the docente panel', function () {
    /** @var TestCase $this */
    $alumno = User::factory()->create(['id_rol' => 5]);

    $this->actingAs($alumno)
        ->get(route('docente.dashboard'))
        ->assertForbidden();
});

test('docente without jury assignment is not flagged as jurado', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $this->actingAs($docente)
        ->get(route('docente.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docentes/dashboard')
            ->where('auth.docente.es_jurado', false)
        );
});

test('docente assigned as jury can view proyectos asignados and accept cargo', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $projectId = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto de prueba',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    $juradoId = DB::table('tbljurados_proyectos')->insertGetId([
        'id_usuario' => $docente->id,
        'id_proyecto' => $projectId,
        'cargo' => 'Presidente',
        'estado_aceptacion' => JuradoProyecto::ESTADO_PENDIENTE,
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_jurado_proyecto');

    $this->actingAs($docente)
        ->get(route('docente.jurado.proyectos-asignados'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docentes/jurado/proyectos-asignados')
            ->where('auth.docente.es_jurado', true)
            ->has('proyectos.data', 1)
            ->where('stats.total', 1)
            ->where('stats.pendientes', 1)
        );

    $this->actingAs($docente)
        ->patch(route('docente.jurado.actualizar-aceptacion', $juradoId), [
            'estado_aceptacion' => JuradoProyecto::ESTADO_ACEPTADO,
        ])
        ->assertRedirect();

    expect(DB::table('tbljurados_proyectos')->where('id_jurado_proyecto', $juradoId)->value('estado_aceptacion'))
        ->toBe(JuradoProyecto::ESTADO_ACEPTADO);
});

test('pending jury assignment is automatically rejected when exam date is reached', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $projectId = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto con examen vencido',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    $juradoId = DB::table('tbljurados_proyectos')->insertGetId([
        'id_usuario' => $docente->id,
        'id_proyecto' => $projectId,
        'cargo' => 'Vocal',
        'estado_aceptacion' => JuradoProyecto::ESTADO_PENDIENTE,
        'created_at' => now()->subDays(10),
        'updated_at' => now()->subDays(10),
    ], 'id_jurado_proyecto');

    DB::table('tblexamenes_profesionales')->insert([
        'id_proyecto' => $projectId,
        'fecha_examen' => now()->subDay()->toDateString(),
        'hora_examen' => '10:00:00',
        'sede' => 'Sala Audiovisual',
        'estado_examen' => 'Programado',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($docente)
        ->get(route('docente.jurado.proyectos-asignados'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('proyectos.data.0.estado_aceptacion', JuradoProyecto::ESTADO_RECHAZADO)
            ->where('proyectos.data.0.expirado_por_fecha', true)
        );

    expect(DB::table('tbljurados_proyectos')->where('id_jurado_proyecto', $juradoId)->value('estado_aceptacion'))
        ->toBe(JuradoProyecto::ESTADO_RECHAZADO);
});

test('docente can emit vote in tbldictamenes and cannot vote twice', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $projectId = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto para votación',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    $juradoId = DB::table('tbljurados_proyectos')->insertGetId([
        'id_usuario' => $docente->id,
        'id_proyecto' => $projectId,
        'cargo' => 'Secretario',
        'estado_aceptacion' => JuradoProyecto::ESTADO_ACEPTADO,
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_jurado_proyecto');

    $this->actingAs($docente)
        ->post(route('docente.jurado.guardar-voto', $juradoId), [
            'voto' => Dictamen::VOTO_A_FAVOR,
            'observaciones' => 'Defensa aprobada por unanimidad.',
        ])
        ->assertRedirect();

    expect(DB::table('tbldictamenes')->where('id_jurado_proyecto', $juradoId)->value('voto'))
        ->toBe(Dictamen::VOTO_A_FAVOR);
});
