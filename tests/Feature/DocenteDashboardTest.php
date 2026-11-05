<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->seed(RoleSeeder::class);
});

test('docente sin asignaciones ve un dashboard vacío', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $this->actingAs($docente)
        ->get(route('docente.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docentes/dashboard')
            ->where('roles_disponibles', [])
            ->where('vista_inicial', null)
            ->where('dashboards', [])
        );
});

test('docente asesor solo recibe el bloque de asesor y sus propios proyectos', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);
    $otroDocente = User::factory()->create(['id_rol' => 4]);

    $proyecto = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto del docente autenticado',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    $otroProyecto = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto de otro docente',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    DB::table('tblasesores_proyectos')->insert([
        [
            'id_usuario' => $docente->id,
            'id_proyecto' => $proyecto,
            'estado_asignacion' => 'Activo',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id_usuario' => $otroDocente->id,
            'id_proyecto' => $otroProyecto,
            'estado_asignacion' => 'Activo',
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    DB::table('tblversiones_tesis')->insert([
        'id_proyecto' => $proyecto,
        'numero_version' => 'Versión 1',
        'comentario_alumno' => 'Entrega inicial',
        'ruta_archivo' => 'versiones_tesis/proyecto_v1.pdf',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($docente)
        ->get(route('docente.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docentes/dashboard')
            ->has('roles_disponibles', 1)
            ->where('roles_disponibles.0.clave', 'asesor')
            ->where('vista_inicial', 'asesor')
            ->where('dashboards.asesor.stats.0.etiqueta', 'Proyectos asesorados')
            ->where('dashboards.asesor.stats.0.valor', 1)
            ->where('dashboards.asesor.stats.1.etiqueta', 'En revisión')
            ->where('dashboards.asesor.stats.1.valor', 1)
            ->where('dashboards.asesor.lista.items.0.etiqueta', 'En revisión')
            ->missing('dashboards.revisor')
            ->missing('dashboards.jurado')
        );
});

test('docente revisor y jurado elige una sola vista y conserva ambos bloques', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $proyecto = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto con revisor y jurado',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    DB::table('tblrevisores_proyectos')->insert([
        'id_usuario' => $docente->id,
        'id_proyecto' => $proyecto,
        'estado_asignacion' => 'Activo',
        'estado_revision' => 'Pendiente',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('tbljurados_proyectos')->insert([
        'id_usuario' => $docente->id,
        'id_proyecto' => $proyecto,
        'cargo' => 'Presidente',
        'estado_aceptacion' => 'Aceptado',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($docente)
        ->get(route('docente.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docentes/dashboard')
            ->has('roles_disponibles', 2)
            ->where('roles_disponibles.0.clave', 'revisor')
            ->where('roles_disponibles.1.clave', 'jurado')
            ->where('vista_inicial', 'revisor')
            ->where('dashboards.revisor.stats.0.valor', 1)
            ->where('dashboards.jurado.stats.0.valor', 1)
            ->missing('dashboards.asesor')
        );

    $this->actingAs($docente)
        ->get(route('docente.dashboard', ['vista' => 'jurado']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('vista_inicial', 'jurado')
        );
});

test('docente jurado ve el detalle de su designación', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $proyecto = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto de jurado',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    DB::table('tbljurados_proyectos')->insert([
        'id_usuario' => $docente->id,
        'id_proyecto' => $proyecto,
        'cargo' => 'Secretario',
        'estado_aceptacion' => 'Pendiente',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($docente)
        ->get(route('docente.dashboard', ['vista' => 'jurado']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('dashboards.jurado.stats.0.etiqueta', 'Designaciones')
            ->where('dashboards.jurado.stats.0.valor', 1)
            ->where('dashboards.jurado.stats.2.etiqueta', 'Por responder')
            ->where('dashboards.jurado.stats.2.valor', 1)
            ->where('dashboards.jurado.lista.items.0.etiqueta', 'Pendiente')
            ->where('dashboards.jurado.lista.items.0.descripcion', fn (string $descripcion): bool => str_contains($descripcion, 'Secretario'))
        );
});
