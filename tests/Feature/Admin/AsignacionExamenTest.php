<?php

use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\Admin\Sede;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function crearAdminExamenTest(): User
{
    return User::factory()->create(['id_rol' => 1]);
}

/**
 * @return array<int, User>
 */
function crearDocentesExamenTest(User $admin, int $cantidad = 5): array
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
                'cedula_profesional' => (string) (1000000000 + $docente->id),
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
 * @param  array<int, string>  $cargos
 */
function asignarJuradoExamenTest(
    int $proyectoId,
    array $docentes,
    array $cargos = JuradoProyecto::CARGOS,
): void {
    foreach (array_values($cargos) as $indice => $cargo) {
        DB::table('tbljurados_proyectos')->insert([
            'id_usuario' => $docentes[$indice]->id,
            'id_proyecto' => $proyectoId,
            'cargo' => $cargo,
            'estado_aceptacion' => JuradoProyecto::ESTADO_PENDIENTE,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

/**
 * @return array{0: Proyecto, 1: array<int, User>}
 */
function crearProyectoConJuradoExamenTest(
    User $admin,
    int $miembros = 5,
    string $titulo = 'Tesis de prueba',
): array {
    $proyecto = Proyecto::factory()->create(['titulo' => $titulo]);
    $docentes = crearDocentesExamenTest($admin, $miembros);

    asignarJuradoExamenTest(
        $proyecto->id_proyecto,
        $docentes,
        array_slice(JuradoProyecto::CARGOS, 0, $miembros),
    );

    return [$proyecto, $docentes];
}

function proximaFechaHabilExamenTest(): string
{
    $fecha = CarbonImmutable::today()->addDay();

    while (
        $fecha->isWeekend()
        || ExamenProfesional::motivoDiaInhabil($fecha->toDateString()) !== null
    ) {
        $fecha = $fecha->addDay();
    }

    return $fecha->toDateString();
}

function proximoSabadoExamenTest(): string
{
    $fecha = CarbonImmutable::today()->addDay();

    while (! $fecha->isSaturday()) {
        $fecha = $fecha->addDay();
    }

    return $fecha->toDateString();
}

function proximaNavidadHabilExamenTest(): string
{
    $fecha = CarbonImmutable::create((int) now()->year, 12, 25);

    while ($fecha->lessThanOrEqualTo(CarbonImmutable::today()) || $fecha->isWeekend()) {
        $fecha = $fecha->addYear();
    }

    return $fecha->toDateString();
}

test('renders exam assignment with jury, active sedes and calendar availability', function () {
    $admin = crearAdminExamenTest();
    [$proyectoCompleto] = crearProyectoConJuradoExamenTest(
        $admin,
        5,
        '1 Tesis completa',
    );
    [$proyectoIncompleto] = crearProyectoConJuradoExamenTest(
        $admin,
        4,
        '2 Tesis incompleta',
    );

    Proyecto::factory()->create(['titulo' => '3 Tesis sin jurado']);

    $sedeA = Sede::factory()->create(['nombre_sede' => 'Sede A']);
    Sede::factory()->create(['nombre_sede' => 'Sede B']);
    Sede::factory()->inactiva()->create(['nombre_sede' => 'Sede Inactiva']);

    $fechaOcupada = CarbonImmutable::today()->addDays(10)->toDateString();
    $proyectoConExamen = Proyecto::factory()->create([
        'titulo' => '4 Tesis ya programada',
    ]);
    ExamenProfesional::factory()->create([
        'id_proyecto' => $proyectoConExamen->id_proyecto,
        'id_sede' => $sedeA->id_sede,
        'fecha_examen' => $fechaOcupada,
        'sede' => $sedeA->nombre_sede,
    ]);

    $anioActual = (int) now()->year;

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.asignaciones.examenes.index', [
            'proyecto' => $proyectoCompleto->id_proyecto,
        ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/asignaciones/examenes/index')
        ->has('proyectos', 2)
        ->where('proyectos.0.id_proyecto', $proyectoCompleto->id_proyecto)
        ->where('proyectos.0.jurado_completo', true)
        ->where('proyectos.0.jurado_count', 5)
        ->has('proyectos.0.jurado', 5)
        ->where('proyectos.0.jurado.0.cargo', JuradoProyecto::CARGO_PRESIDENTE)
        ->where('proyectos.0.jurado.0.docente.nombre_completo', $proyectoCompleto->jurados()->first()->docente->nombre_completo)
        ->where('proyectos.1.id_proyecto', $proyectoIncompleto->id_proyecto)
        ->where('proyectos.1.jurado_completo', false)
        ->where('proyectos.1.jurado_count', 4)
        ->has('sedes', 2)
        ->where('sedes.0.id_sede', $sedeA->id_sede)
        ->where('sedes.1.nombre_sede', 'Sede B')
        ->where('proyectoSeleccionadoId', $proyectoCompleto->id_proyecto)
        ->where('fechaMinima', CarbonImmutable::today()->toDateString())
        ->where("diasInhabiles.{$anioActual}-12-25", 'Navidad')
        ->where("fechasOcupadas.{$fechaOcupada}", 'Fecha ocupada por otro examen')
        ->has('diasInhabiles')
        ->has('fechasOcupadas')
    );
});

test('programs an exam for a project with a complete jury', function () {
    $admin = crearAdminExamenTest();
    [$proyecto] = crearProyectoConJuradoExamenTest($admin);
    $sede = Sede::factory()->create(['nombre_sede' => 'Sala de titulación']);
    $fecha = proximaFechaHabilExamenTest();

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.asignaciones.examenes.store'), [
            'id_proyecto' => $proyecto->id_proyecto,
            'fecha_examen' => $fecha,
            'hora_examen' => '10:30',
            'id_sede' => $sede->id_sede,
        ]);

    $response->assertRedirect(route('admin.asignaciones.examenes.index'));
    $response->assertSessionHas('success');

    $examen = ExamenProfesional::query()
        ->where('id_proyecto', $proyecto->id_proyecto)
        ->firstOrFail();

    expect($examen->id_sede)->toBe($sede->id_sede)
        ->and($examen->sede)->toBe('Sala de titulación')
        ->and($examen->fecha_examen->toDateString())->toBe($fecha)
        ->and(substr((string) $examen->hora_examen, 0, 5))->toBe('10:30')
        ->and($examen->estado_examen)->toBe(ExamenProfesional::ESTADO_PROGRAMADO);
});

test('rejects a date in the past', function () {
    $admin = crearAdminExamenTest();
    [$proyecto] = crearProyectoConJuradoExamenTest($admin);
    $sede = Sede::factory()->create();

    $response = $this
        ->from(route('admin.asignaciones.examenes.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.examenes.store'), [
            'id_proyecto' => $proyecto->id_proyecto,
            'fecha_examen' => CarbonImmutable::today()->subDay()->toDateString(),
            'hora_examen' => '10:00',
            'id_sede' => $sede->id_sede,
        ]);

    $response->assertRedirect(route('admin.asignaciones.examenes.index'));
    $response->assertSessionHasErrors('fecha_examen');

    $this->assertDatabaseMissing('tblexamenes_profesionales', [
        'id_proyecto' => $proyecto->id_proyecto,
    ]);
});

test('rejects a date that falls on a weekend', function () {
    $admin = crearAdminExamenTest();
    [$proyecto] = crearProyectoConJuradoExamenTest($admin);
    $sede = Sede::factory()->create();

    $response = $this
        ->from(route('admin.asignaciones.examenes.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.examenes.store'), [
            'id_proyecto' => $proyecto->id_proyecto,
            'fecha_examen' => proximoSabadoExamenTest(),
            'hora_examen' => '10:00',
            'id_sede' => $sede->id_sede,
        ]);

    $response->assertRedirect(route('admin.asignaciones.examenes.index'));
    $response->assertSessionHasErrors('fecha_examen');

    $this->assertDatabaseMissing('tblexamenes_profesionales', [
        'id_proyecto' => $proyecto->id_proyecto,
    ]);
});

test('rejects an official holiday', function () {
    $admin = crearAdminExamenTest();
    [$proyecto] = crearProyectoConJuradoExamenTest($admin);
    $sede = Sede::factory()->create();

    $response = $this
        ->from(route('admin.asignaciones.examenes.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.examenes.store'), [
            'id_proyecto' => $proyecto->id_proyecto,
            'fecha_examen' => proximaNavidadHabilExamenTest(),
            'hora_examen' => '10:00',
            'id_sede' => $sede->id_sede,
        ]);

    $response->assertRedirect(route('admin.asignaciones.examenes.index'));
    $response->assertSessionHasErrors([
        'fecha_examen' => 'La fecha seleccionada no está disponible: Navidad.',
    ]);

    $this->assertDatabaseMissing('tblexamenes_profesionales', [
        'id_proyecto' => $proyecto->id_proyecto,
    ]);
});

test('rejects a date that already has another exam', function () {
    $admin = crearAdminExamenTest();
    [$proyecto] = crearProyectoConJuradoExamenTest($admin);
    $sede = Sede::factory()->create();
    $fecha = proximaFechaHabilExamenTest();

    ExamenProfesional::factory()->create([
        'fecha_examen' => $fecha,
        'hora_examen' => '09:00',
    ]);

    $response = $this
        ->from(route('admin.asignaciones.examenes.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.examenes.store'), [
            'id_proyecto' => $proyecto->id_proyecto,
            'fecha_examen' => $fecha,
            'hora_examen' => '11:00',
            'id_sede' => $sede->id_sede,
        ]);

    $response->assertRedirect(route('admin.asignaciones.examenes.index'));
    $response->assertSessionHasErrors('fecha_examen');

    $this->assertDatabaseMissing('tblexamenes_profesionales', [
        'id_proyecto' => $proyecto->id_proyecto,
    ]);
});

test('rejects an inactive sede', function () {
    $admin = crearAdminExamenTest();
    [$proyecto] = crearProyectoConJuradoExamenTest($admin);
    $sede = Sede::factory()->inactiva()->create();

    $response = $this
        ->from(route('admin.asignaciones.examenes.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.examenes.store'), [
            'id_proyecto' => $proyecto->id_proyecto,
            'fecha_examen' => proximaFechaHabilExamenTest(),
            'hora_examen' => '10:00',
            'id_sede' => $sede->id_sede,
        ]);

    $response->assertRedirect(route('admin.asignaciones.examenes.index'));
    $response->assertSessionHasErrors('id_sede');

    $this->assertDatabaseMissing('tblexamenes_profesionales', [
        'id_proyecto' => $proyecto->id_proyecto,
    ]);
});

test('rejects a project with an incomplete jury', function () {
    $admin = crearAdminExamenTest();
    [$proyecto] = crearProyectoConJuradoExamenTest($admin, 4);
    $sede = Sede::factory()->create();

    $response = $this
        ->from(route('admin.asignaciones.examenes.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.examenes.store'), [
            'id_proyecto' => $proyecto->id_proyecto,
            'fecha_examen' => proximaFechaHabilExamenTest(),
            'hora_examen' => '10:00',
            'id_sede' => $sede->id_sede,
        ]);

    $response->assertRedirect(route('admin.asignaciones.examenes.index'));
    $response->assertSessionHasErrors('id_proyecto');

    $this->assertDatabaseMissing('tblexamenes_profesionales', [
        'id_proyecto' => $proyecto->id_proyecto,
    ]);
});

test('rejects a project that already has an exam', function () {
    $admin = crearAdminExamenTest();
    [$proyecto] = crearProyectoConJuradoExamenTest($admin);
    $sede = Sede::factory()->create();
    $fechaExistente = CarbonImmutable::today()->addDays(15)->toDateString();

    ExamenProfesional::factory()->create([
        'id_proyecto' => $proyecto->id_proyecto,
        'id_sede' => $sede->id_sede,
        'fecha_examen' => $fechaExistente,
        'hora_examen' => '09:00',
        'sede' => $sede->nombre_sede,
    ]);

    $response = $this
        ->from(route('admin.asignaciones.examenes.index'))
        ->actingAs($admin)
        ->post(route('admin.asignaciones.examenes.store'), [
            'id_proyecto' => $proyecto->id_proyecto,
            'fecha_examen' => proximaFechaHabilExamenTest(),
            'hora_examen' => '10:00',
            'id_sede' => $sede->id_sede,
        ]);

    $response->assertRedirect(route('admin.asignaciones.examenes.index'));
    $response->assertSessionHasErrors('id_proyecto');

    expect(ExamenProfesional::query()->where('id_proyecto', $proyecto->id_proyecto)->count())
        ->toBe(1);
});

test('forbids students from accessing exam assignment', function () {
    $student = User::factory()->create(['id_rol' => 5]);

    $this->actingAs($student)
        ->get(route('admin.asignaciones.examenes.index'))
        ->assertForbidden();

    $this->actingAs($student)
        ->post(route('admin.asignaciones.examenes.store'), [])
        ->assertForbidden();
});
