<?php

use App\Models\Admin\Dictamen;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\Admin\Sede;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function crearAdminVeredictoTest(): User
{
    return User::factory()->create(['id_rol' => 1]);
}

/**
 * @return array<int, User>
 */
function crearDocentesVeredictoTest(User $admin, int $cantidad = 5): array
{
    return collect(range(1, $cantidad))
        ->map(function (int $indice) use ($admin): User {
            $docente = User::factory()->create([
                'id_rol' => 4,
                'name' => "Docente {$indice} ".Str::random(4),
            ]);

            DB::table('tbldocentes')->insert([
                'id_usuario' => $docente->id,
                'id_usuario_registro' => $admin->id,
                'nombre' => $docente->name,
                'apellido_p' => 'Pérez',
                'apellido_m' => 'García',
                'telefono' => '9610000000',
                'cedula_profesional' => (string) (2000000000 + $docente->id),
                'curp' => Str::upper(Str::random(14)).str_pad((string) $docente->id, 4, '0', STR_PAD_LEFT),
                'especialidad' => 'Ingeniería en Sistemas',
                'grado_academico' => 'Doctorado',
                'tipo_contrato' => 'Tiempo completo',
                'estado' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $docente;
        })
        ->all();
}

/**
 * @param  array<int, User>  $docentes
 * @return array<int, JuradoProyecto>
 */
function asignarJuradoVeredictoTest(int $proyectoId, array $docentes): array
{
    return collect(JuradoProyecto::CARGOS)
        ->map(function (string $cargo, int $indice) use ($proyectoId, $docentes): JuradoProyecto {
            return JuradoProyecto::query()->create([
                'id_usuario' => $docentes[$indice]->id,
                'id_proyecto' => $proyectoId,
                'cargo' => $cargo,
                'estado_aceptacion' => JuradoProyecto::ESTADO_ACEPTADO,
            ]);
        })
        ->all();
}

/**
 * @return array{proyecto: Proyecto, examen: ExamenProfesional, jurados: array<int, JuradoProyecto>}
 */
function crearProyectoConExamenVeredictoTest(
    User $admin,
    string $titulo,
    string $fechaExamen,
): array {
    $carreraId = DB::table('tblcarreras')->insertGetId([
        'nombre_carrera' => 'Carrera '.Str::random(8),
        'descripcion' => 'Carrera de prueba',
        'duracion_semestres' => 8,
        'estado' => true,
        'id_usuario_registro' => $admin->id,
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_carrera');

    $estudiante = User::factory()->create([
        'id_rol' => 5,
        'name' => 'Alumno '.Str::random(6),
    ]);

    DB::table('tblalumnos')->insert([
        'id_usuario' => $estudiante->id,
        'id_usuario_registro' => $admin->id,
        'id_carrera' => $carreraId,
        'nombre' => 'Alumno',
        'apellido_p' => 'Sustentante',
        'apellido_m' => 'Prueba',
        'fecha_nacimiento' => '2000-01-01',
        'sexo' => 'Masculino',
        'curp' => Str::upper(Str::random(18)),
        'telefono' => '9610000000',
        'matricula' => Str::upper(Str::random(9)),
        'turno' => 'Matutino',
        'fecha_ingreso' => '2022-08-01',
        'generacion' => '2022 - 2026',
        'estado_academico' => 'Activo',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $proyecto = Proyecto::factory()->create(['titulo' => $titulo]);

    DB::table('tblalumnos_proyectos')->insert([
        'id_alumno' => $estudiante->id,
        'id_proyecto' => $proyecto->id_proyecto,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $docentes = crearDocentesVeredictoTest($admin);
    $jurados = asignarJuradoVeredictoTest($proyecto->id_proyecto, $docentes);

    $sede = Sede::factory()->create();

    $examen = ExamenProfesional::factory()->create([
        'id_proyecto' => $proyecto->id_proyecto,
        'id_sede' => $sede->id_sede,
        'fecha_examen' => $fechaExamen,
        'hora_examen' => '10:00',
        'sede' => $sede->nombre_sede,
    ]);

    return [
        'proyecto' => $proyecto,
        'examen' => $examen,
        'jurados' => $jurados,
    ];
}

function registrarVotoVeredictoTest(
    JuradoProyecto $jurado,
    string $voto,
    ?string $observaciones = null,
): Dictamen {
    return Dictamen::query()->create([
        'id_jurado_proyecto' => $jurado->id_jurado_proyecto,
        'voto' => $voto,
        'observaciones' => $observaciones,
    ]);
}

test('renders verdicts with aggregated titular votes and metrics', function () {
    $admin = crearAdminVeredictoTest();

    $aprobado = crearProyectoConExamenVeredictoTest(
        $admin,
        'Tesis aprobada',
        now()->subDay()->toDateString(),
    );
    foreach (array_slice($aprobado['jurados'], 0, 3) as $jurado) {
        registrarVotoVeredictoTest($jurado, Dictamen::VOTO_A_FAVOR);
    }
    $aprobado['examen']->update([
        'resultado_final' => ExamenProfesional::RESULTADO_APROBADO,
        'estado_examen' => ExamenProfesional::ESTADO_REALIZADO,
    ]);

    $observado = crearProyectoConExamenVeredictoTest(
        $admin,
        'Tesis con observaciones',
        now()->subDays(2)->toDateString(),
    );
    registrarVotoVeredictoTest($observado['jurados'][0], Dictamen::VOTO_A_FAVOR);
    registrarVotoVeredictoTest($observado['jurados'][1], Dictamen::VOTO_A_FAVOR);
    registrarVotoVeredictoTest($observado['jurados'][2], Dictamen::VOTO_EN_CONTRA);
    $observado['examen']->update([
        'resultado_final' => ExamenProfesional::RESULTADO_CON_OBSERVACIONES,
        'estado_examen' => ExamenProfesional::ESTADO_REALIZADO,
    ]);

    $pendiente = crearProyectoConExamenVeredictoTest(
        $admin,
        'Tesis pendiente',
        now()->addDays(5)->toDateString(),
    );
    $pendiente['examen']->update(['estado_examen' => ExamenProfesional::ESTADO_PROGRAMADO]);

    $revision = crearProyectoConExamenVeredictoTest(
        $admin,
        'Tesis en revisión',
        now()->subDays(3)->toDateString(),
    );
    registrarVotoVeredictoTest($revision['jurados'][0], Dictamen::VOTO_A_FAVOR);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.veredictos.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/veredictos/index')
        ->where('stats.total', 4)
        ->where('stats.aprobados', 1)
        ->where('stats.observaciones', 1)
        ->where('stats.por_resolver', 2)
        ->has('veredictos.data', 4)
        ->where('veredictos.data.0.estado_key', 'pendiente')
        ->where('veredictos.data.0.voto_resumen', 'Pendiente')
        ->where('veredictos.data.1.estado_key', 'aprobado')
        ->where('veredictos.data.1.voto_resumen', '3 — 0')
        ->where('veredictos.data.2.estado_key', 'observaciones')
        ->where('veredictos.data.2.voto_resumen', '2 — 1')
        ->where('veredictos.data.3.estado_key', 'revision')
        ->where('veredictos.data.3.voto_resumen', '1 — 0')
        ->has('veredictos.data.0.jurados', 5)
        ->where('veredictos.data.0.jurados.0.es_titular', true)
        ->where('veredictos.data.0.jurados.3.es_titular', false)
        ->where('filters.estado', 'todos')
    );
});

test('filters verdicts by search term and status', function () {
    $admin = crearAdminVeredictoTest();

    $aprobado = crearProyectoConExamenVeredictoTest(
        $admin,
        'Energías renovables en comunidades rurales',
        now()->subDay()->toDateString(),
    );
    foreach (array_slice($aprobado['jurados'], 0, 3) as $jurado) {
        registrarVotoVeredictoTest($jurado, Dictamen::VOTO_A_FAVOR);
    }
    $aprobado['examen']->update([
        'resultado_final' => ExamenProfesional::RESULTADO_APROBADO,
        'estado_examen' => ExamenProfesional::ESTADO_REALIZADO,
    ]);

    $pendiente = crearProyectoConExamenVeredictoTest(
        $admin,
        'Mercados financieros digitales',
        now()->addDays(3)->toDateString(),
    );

    $porBusqueda = $this
        ->actingAs($admin)
        ->get(route('admin.veredictos.index', ['search' => 'renovables']));

    $porBusqueda->assertOk();
    $porBusqueda->assertInertia(fn (Assert $page) => $page
        ->has('veredictos.data', 1)
        ->where('veredictos.data.0.id_examen', $aprobado['examen']->id_examen)
        ->where('filters.search', 'renovables')
    );

    $porEstado = $this
        ->actingAs($admin)
        ->get(route('admin.veredictos.index', ['estado' => 'pendiente']));

    $porEstado->assertOk();
    $porEstado->assertInertia(fn (Assert $page) => $page
        ->has('veredictos.data', 1)
        ->where('veredictos.data.0.id_examen', $pendiente['examen']->id_examen)
        ->where('filters.estado', 'pendiente')
    );
});

test('forbids students from accessing verdict management', function () {
    $student = User::factory()->create(['id_rol' => 5]);

    $this->actingAs($student)
        ->get(route('admin.veredictos.index'))
        ->assertForbidden();
});
