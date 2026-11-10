<?php

use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->seed(RoleSeeder::class);
});

/**
 * Crea una titulación concluida con ambos revisores aprobados y sus
 * asignaciones marcadas como Finalizado, tal como ocurre al cerrar el examen.
 *
 * @return array{alumno: User, proyecto: int}
 */
function crearTitulacionConRevisoresFinalizados(): array
{
    $alumno = User::factory()->create([
        'id_rol' => 5,
        'estado' => true,
    ]);

    $carreraId = DB::table('tblcarreras')->insertGetId([
        'nombre_carrera' => 'Ingeniería en Sistemas',
        'descripcion' => 'Carrera de prueba',
        'duracion_semestres' => 9,
        'estado' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_carrera');

    DB::table('tblalumnos')->insert([
        'id_usuario' => $alumno->id,
        'id_carrera' => $carreraId,
        'nombre' => 'Ana',
        'apellido_p' => 'Quintana',
        'apellido_m' => 'López',
        'fecha_nacimiento' => '2000-01-01',
        'sexo' => 'Femenino',
        'curp' => 'QUAA000101MCHXXX01',
        'matricula' => 'A000000001',
        'turno' => 'Matutino',
        'fecha_ingreso' => '2022-08-01',
        'generacion' => '2022 - 2026',
        'estado_academico' => 'Egresado',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $docentes = collect(range(1, 5))
        ->map(function (int $indice): User {
            $docente = User::factory()->create([
                'id_rol' => 4,
                'estado' => true,
                'name' => "Docente {$indice}",
            ]);

            DB::table('tbldocentes')->insert([
                'id_usuario' => $docente->id,
                'nombre' => "Docente {$indice}",
                'apellido_p' => 'Prueba',
                'apellido_m' => 'Titulación',
                'telefono' => '9610000000',
                'cedula_profesional' => 'CED-'.$indice,
                'curp' => str_pad('CURP'.$indice, 18, '0'),
                'especialidad' => 'Tecnologías de la información',
                'grado_academico' => 'Maestría',
                'tipo_contrato' => 'Tiempo completo',
                'estado' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $docente;
        })
        ->values();

    $proyectoId = DB::table('tblproyectos')->insertGetId([
        'titulo' => 'Proyecto con revisores finalizados',
        'resumen' => 'Resumen de prueba',
        'estado' => Proyecto::ESTADO_APROBADO,
        'fecha_envio' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_proyecto');

    DB::table('tblalumnos_proyectos')->insert([
        'id_alumno' => $alumno->id,
        'id_proyecto' => $proyectoId,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $asesorAsignacionId = DB::table('tblasesores_proyectos')->insertGetId([
        'id_usuario' => $docentes[0]->id,
        'id_proyecto' => $proyectoId,
        'estado_asignacion' => 'Activo',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_asesor_proyecto');

    $versionDirectorId = DB::table('tblversiones_tesis')->insertGetId([
        'id_proyecto' => $proyectoId,
        'numero_version' => 'Versión 1',
        'comentario_alumno' => 'Entrega al director',
        'ruta_archivo' => 'versiones_tesis/proyecto_v1.pdf',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_version');

    DB::table('tblrevisiones_asesor')->insert([
        'id_version' => $versionDirectorId,
        'id_asesor_proyecto' => $asesorAsignacionId,
        'estado_revision' => 'Aprobada',
        'observaciones' => 'Aprobada por el director.',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('tblversiones_tesis')->insert([
        'id_proyecto' => $proyectoId,
        'numero_version' => 'Versión 2',
        'comentario_alumno' => 'Entrega a revisores',
        'ruta_archivo' => 'versiones_revisores/proyecto_v2.pdf',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    foreach ([1, 2] as $indice) {
        DB::table('tblrevisores_proyectos')->insert([
            'id_usuario' => $docentes[$indice]->id,
            'id_proyecto' => $proyectoId,
            'estado_asignacion' => 'Finalizado',
            'estado_revision' => 'Aprobado',
            'comentarios_revision' => null,
            'fecha_revision' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    foreach (JuradoProyecto::CARGOS as $indice => $cargo) {
        DB::table('tbljurados_proyectos')->insert([
            'id_usuario' => $docentes[$indice]->id,
            'id_proyecto' => $proyectoId,
            'cargo' => $cargo,
            'estado_aceptacion' => 'Aceptado',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    DB::table('tblexamenes_profesionales')->insert([
        'id_proyecto' => $proyectoId,
        'fecha_examen' => now()->subDay()->toDateString(),
        'hora_examen' => '10:00:00',
        'sede' => 'Sala de titulación',
        'estado_examen' => ExamenProfesional::ESTADO_REALIZADO,
        'resultado_final' => ExamenProfesional::RESULTADO_APROBADO,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return [
        'alumno' => $alumno,
        'proyecto' => $proyectoId,
    ];
}

test('renders full progress when the reviewer assignments are finalized after approval', function () {
    /** @var TestCase $this */
    $escenario = crearTitulacionConRevisoresFinalizados();

    $this->actingAs($escenario['alumno'])
        ->get(route('alumno.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Alumno/dashboard')
            ->where('progreso.porcentaje', 100)
            ->where('progreso.completadas', 6)
            ->where('progreso.etapas.3.clave', 'revisores')
            ->where('progreso.etapas.3.porcentaje', 100)
            ->where('progreso.etapas.3.estado', 'completado')
            ->where('progreso.etapas.3.detalle', '2 de 2 aprobaron')
            ->where('resumen.estado.label', 'Titulación concluida')
        );
});

test('keeps both reviewers visible after their assignment is finalized', function () {
    /** @var TestCase $this */
    $escenario = crearTitulacionConRevisoresFinalizados();

    $this->actingAs($escenario['alumno'])
        ->get(route('alumno.tesis-revisores.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Alumno/tesis_revisores/index')
            ->has('revisores', 2)
            ->where('controlCarga.tiene_revisores', true)
            ->where('controlCarga.estado_global', 'Aprobado')
            ->where('controlCarga.puede_subir', false)
            ->where(
                'controlCarga.motivo_bloqueo',
                'Tu examen profesional ya fue realizado. El expediente de tesis se encuentra cerrado.',
            )
        );
});

test('keeps reviewer approval in the exam requirements after finalization', function () {
    /** @var TestCase $this */
    $escenario = crearTitulacionConRevisoresFinalizados();

    $this->actingAs($escenario['alumno'])
        ->get(route('alumno.examenes.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Alumno/examen/index')
            ->where('requisitos.revisores_aprobaron', true)
            ->where('requisitos.revisores_asignados', 2)
            ->where('requisitos.director_aprobo', true)
        );
});

test('keeps finalized reviewers visible in alumno and admin expediente views', function () {
    /** @var TestCase $this */
    $escenario = crearTitulacionConRevisoresFinalizados();

    $this->actingAs($escenario['alumno'])
        ->get(route('alumno.expediente.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Alumno/expediente/index')
            ->has('proyecto.revisores', 2)
            ->where('resumen.tiene_revisores', true)
        );

    $admin = User::factory()->create([
        'id_rol' => 1,
        'estado' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.expedientes.show', $escenario['alumno']->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/expedientes/show')
            ->has('proyecto.revisores', 2)
            ->where('resumen.tiene_revisores', true)
        );
});
