<?php

use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->seed(RoleSeeder::class);
});

test('docente asesor y jurado recibe sus eventos y un solo examen con roles combinados', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);
    $otroDocente = User::factory()->create(['id_rol' => 4]);

    $proyecto = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto compartido como asesor y jurado',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    $proyectoAjeno = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto de otro docente',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    $asignacion = DB::table('tblasesores_proyectos')->insertGetId([
        'id_usuario' => $docente->id,
        'id_proyecto' => $proyecto,
        'estado_asignacion' => 'Activo',
        'created_at' => '2026-10-10 09:00:00',
        'updated_at' => '2026-10-10 09:00:00',
    ], 'id_asesor_proyecto');

    DB::table('tblasesores_proyectos')->insert([
        'id_usuario' => $otroDocente->id,
        'id_proyecto' => $proyectoAjeno,
        'estado_asignacion' => 'Activo',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $version = DB::table('tblversiones_tesis')->insertGetId([
        'id_proyecto' => $proyecto,
        'numero_version' => 'Versión 1',
        'comentario_alumno' => 'Entrega inicial',
        'ruta_archivo' => 'versiones_tesis/proyecto_v1.pdf',
        'created_at' => '2026-10-12 15:30:00',
        'updated_at' => '2026-10-12 15:30:00',
    ], 'id_version');

    DB::table('tblversiones_tesis')->insert([
        'id_proyecto' => $proyectoAjeno,
        'numero_version' => 'Versión 1',
        'comentario_alumno' => 'Entrega del otro proyecto',
        'ruta_archivo' => 'versiones_tesis/ajeno_v1.pdf',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $revision = DB::table('tblrevisiones_asesor')->insertGetId([
        'id_version' => $version,
        'id_asesor_proyecto' => $asignacion,
        'estado_revision' => 'Aprobada',
        'observaciones' => 'Listo para continuar.',
        'created_at' => '2026-10-13 10:00:00',
        'updated_at' => '2026-10-13 11:00:00',
    ], 'id_revision');

    $juradoAsignacion = DB::table('tbljurados_proyectos')->insertGetId([
        'id_usuario' => $docente->id,
        'id_proyecto' => $proyecto,
        'cargo' => 'Presidente',
        'estado_aceptacion' => 'Aceptado',
        'created_at' => '2026-10-11 08:00:00',
        'updated_at' => '2026-10-11 08:00:00',
    ], 'id_jurado_proyecto');

    $examen = DB::table('tblexamenes_profesionales')->insertGetId([
        'id_proyecto' => $proyecto,
        'fecha_examen' => '2026-10-20',
        'hora_examen' => '18:00:00',
        'sede' => 'Tuxtla',
        'estado_examen' => 'Programado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_examen');

    $this->actingAs($docente)
        ->get(route('docente.calendario.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docentes/calendario/index')
            ->has('roles_disponibles', 2)
            ->where('roles_disponibles.0.clave', 'asesor')
            ->where('roles_disponibles.1.clave', 'jurado')
            ->has('eventos', 5)
            ->where('eventos', function ($eventos) use ($asignacion, $examen, $juradoAsignacion, $revision, $version): bool {
                $eventos = collect($eventos);
                $eventoExamen = $eventos->firstWhere('id', 'examen-'.$examen);

                return $eventos->contains('id', 'asesor-asignacion-'.$asignacion)
                    && $eventos->contains('id', 'asesor-version-'.$version)
                    && $eventos->contains('id', 'asesor-revision-'.$revision)
                    && $eventos->contains('id', 'jurado-asignacion-'.$juradoAsignacion)
                    && $eventoExamen !== null
                    && $eventoExamen['roles'] === ['asesor', 'jurado']
                    && $eventoExamen['fecha'] === '2026-10-20'
                    && $eventoExamen['hora'] === '18:00'
                    && $eventoExamen['lugar'] === 'Tuxtla'
                    && $eventos->where('id', 'examen-'.$examen)->count() === 1
                    && ! $eventos->contains('proyecto', 'Proyecto de otro docente');
            })
        );
});

test('docente revisor recibe asignación, entrega y dictamen de revisión', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $proyecto = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto para revisión',
        'resumen' => 'Resumen de prueba',
        'estado' => 'Aprobado',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    $asignacion = DB::table('tblrevisores_proyectos')->insertGetId([
        'id_usuario' => $docente->id,
        'id_proyecto' => $proyecto,
        'estado_asignacion' => 'Activo',
        'estado_revision' => 'Con cambios',
        'comentarios_revision' => 'Ajustar el capítulo dos.',
        'fecha_revision' => '2026-10-09 12:30:00',
        'created_at' => '2026-10-01 09:00:00',
        'updated_at' => '2026-10-09 12:30:00',
    ], 'id_revisor_proyecto');

    $versionRevision = DB::table('tblversiones_tesis')->insertGetId([
        'id_proyecto' => $proyecto,
        'numero_version' => 'Versión 2',
        'comentario_alumno' => 'Versión para revisores',
        'ruta_archivo' => 'versiones_tesis/versiones_revisores/proyecto_v2.pdf',
        'created_at' => '2026-10-05 16:00:00',
        'updated_at' => '2026-10-05 16:00:00',
    ], 'id_version');

    DB::table('tblversiones_tesis')->insert([
        'id_proyecto' => $proyecto,
        'numero_version' => 'Versión 1',
        'comentario_alumno' => 'Versión del director',
        'ruta_archivo' => 'versiones_tesis/proyecto_v1.pdf',
        'created_at' => '2026-10-03 10:00:00',
        'updated_at' => '2026-10-03 10:00:00',
    ]);

    $this->actingAs($docente)
        ->get(route('docente.calendario.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docentes/calendario/index')
            ->has('roles_disponibles', 1)
            ->where('roles_disponibles.0.clave', 'revisor')
            ->has('eventos', 3)
            ->where('eventos', function ($eventos) use ($asignacion, $versionRevision): bool {
                $eventos = collect($eventos);
                $dictamen = $eventos->firstWhere('id', 'revisor-dictamen-'.$asignacion);

                return $eventos->contains('id', 'revisor-asignacion-'.$asignacion)
                    && $eventos->contains('id', 'revisor-version-'.$versionRevision)
                    && $dictamen !== null
                    && $dictamen['fecha'] === '2026-10-09'
                    && $dictamen['titulo'] === 'Solicitaste cambios como revisor'
                    && $dictamen['descripcion'] === 'Ajustar el capítulo dos.'
                    && $eventos->every(fn (array $evento): bool => $evento['roles'] === ['revisor']);
            })
        );
});

test('docente sin asignaciones ve el calendario vacío', function () {
    /** @var TestCase $this */
    $docente = User::factory()->create(['id_rol' => 4]);

    $this->actingAs($docente)
        ->get(route('docente.calendario.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docentes/calendario/index')
            ->where('roles_disponibles', [])
            ->where('eventos', [])
            ->where('hoy', CarbonImmutable::today()->toDateString())
        );
});

test('un alumno no puede acceder al calendario docente', function () {
    /** @var TestCase $this */
    $alumno = User::factory()->create(['id_rol' => 5]);

    $this->actingAs($alumno)
        ->get(route('docente.calendario.index'))
        ->assertForbidden();
});
