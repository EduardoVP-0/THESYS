<?php

use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\Sede;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function crearAdminSedeTest(): User
{
    return User::factory()->create(['id_rol' => 1]);
}

test('renders sedes with metrics, exam counts and pagination', function () {
    $admin = crearAdminSedeTest();
    $sedeActiva = Sede::factory()->create([
        'nombre_sede' => 'Sede Xalapa',
        'direccion' => 'Calle Principal 100',
    ]);
    Sede::factory()->create(['nombre_sede' => 'Sede Orizaba']);
    $sedeInactiva = Sede::factory()->inactiva()->create([
        'nombre_sede' => 'Sede Córdoba',
    ]);

    ExamenProfesional::factory()->create([
        'id_sede' => $sedeActiva->id_sede,
        'sede' => $sedeActiva->nombre_sede,
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.sedes.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/sedes/index')
        ->where('stats.total', 3)
        ->where('stats.activas', 2)
        ->where('stats.inactivas', 1)
        ->where('stats.examenes_programados', 1)
        ->has('sedes.data', 3)
        ->where('sedes.data.0.id_sede', $sedeInactiva->id_sede)
        ->where('sedes.data.0.estado', false)
        ->where('sedes.data.0.clave', 'SED-'.str_pad((string) $sedeInactiva->id_sede, 5, '0', STR_PAD_LEFT))
        ->where('sedes.data.2.id_sede', $sedeActiva->id_sede)
        ->where('sedes.data.2.examenes_count', 1)
        ->where('sedes.data.2.estado', true)
        ->has('filters')
    );
});

test('filters sedes by search and status', function () {
    $admin = crearAdminSedeTest();
    $sedeXalapa = Sede::factory()->create([
        'nombre_sede' => 'Sede Xalapa',
        'direccion' => 'Av. Xalapa 123',
    ]);
    $sedeInactiva = Sede::factory()->inactiva()->create([
        'nombre_sede' => 'Sede Orizaba',
        'direccion' => 'Calle Orizaba 456',
    ]);
    Sede::factory()->create([
        'nombre_sede' => 'Sede Córdoba',
        'direccion' => 'Av. Córdoba 789',
    ]);

    $porNombre = $this
        ->actingAs($admin)
        ->get(route('admin.sedes.index', ['search' => 'Xalapa']));

    $porNombre->assertOk();
    $porNombre->assertInertia(fn (Assert $page) => $page
        ->has('sedes.data', 1)
        ->where('sedes.data.0.id_sede', $sedeXalapa->id_sede)
        ->where('filters.search', 'Xalapa')
    );

    $porEstado = $this
        ->actingAs($admin)
        ->get(route('admin.sedes.index', ['estado' => 'inactiva']));

    $porEstado->assertOk();
    $porEstado->assertInertia(fn (Assert $page) => $page
        ->has('sedes.data', 1)
        ->where('sedes.data.0.id_sede', $sedeInactiva->id_sede)
        ->where('filters.estado', 'inactiva')
    );
});

test('registers a new sede with an active status and audit user', function () {
    $admin = crearAdminSedeTest();

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.sedes.store'), [
            'nombre_sede' => 'Sala de titulación',
            'direccion' => 'Edificio A, primer piso',
        ]);

    $response->assertRedirect(route('admin.sedes.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('tblsedes', [
        'nombre_sede' => 'Sala de titulación',
        'direccion' => 'Edificio A, primer piso',
        'estado' => true,
        'id_usuario_registro' => $admin->id,
    ]);
});

test('validates required and unique fields when registering a sede', function () {
    $admin = crearAdminSedeTest();
    Sede::factory()->create(['nombre_sede' => 'Sede única']);

    $sinNombre = $this
        ->from(route('admin.sedes.index'))
        ->actingAs($admin)
        ->post(route('admin.sedes.store'), [
            'direccion' => 'Calle sin nombre',
        ]);

    $sinNombre->assertRedirect(route('admin.sedes.index'));
    $sinNombre->assertSessionHasErrors('nombre_sede');

    $duplicada = $this
        ->from(route('admin.sedes.index'))
        ->actingAs($admin)
        ->post(route('admin.sedes.store'), [
            'nombre_sede' => 'Sede única',
        ]);

    $duplicada->assertRedirect(route('admin.sedes.index'));
    $duplicada->assertSessionHasErrors('nombre_sede');

    $this->assertDatabaseCount('tblsedes', 1);
});

test('updates a sede without changing its current status', function () {
    $admin = crearAdminSedeTest();
    $sede = Sede::factory()->inactiva()->create([
        'nombre_sede' => 'Sede original',
        'direccion' => 'Dirección original',
    ]);

    $response = $this
        ->actingAs($admin)
        ->put(route('admin.sedes.update', $sede), [
            'nombre_sede' => 'Sede actualizada',
            'direccion' => 'Dirección actualizada',
        ]);

    $response->assertRedirect(route('admin.sedes.index'));
    $response->assertSessionHas('success');

    $sede->refresh();

    expect($sede->nombre_sede)->toBe('Sede actualizada')
        ->and($sede->direccion)->toBe('Dirección actualizada')
        ->and($sede->estado)->toBeFalse();
});

test('toggles a sede between active and inactive', function () {
    $admin = crearAdminSedeTest();
    $sede = Sede::factory()->create(['nombre_sede' => 'Sede con historial']);

    $baja = $this
        ->actingAs($admin)
        ->patch(route('admin.sedes.toggle-status', $sede));

    $baja->assertRedirect(route('admin.sedes.index'));
    $baja->assertSessionHas('success');
    expect($sede->refresh()->estado)->toBeFalse();

    $alta = $this
        ->actingAs($admin)
        ->patch(route('admin.sedes.toggle-status', $sede));

    $alta->assertRedirect(route('admin.sedes.index'));
    $alta->assertSessionHas('success');
    expect($sede->refresh()->estado)->toBeTrue();
});

test('forbids students from managing sedes', function () {
    $student = User::factory()->create(['id_rol' => 5]);
    $sede = Sede::factory()->create();

    $this->actingAs($student)
        ->get(route('admin.sedes.index'))
        ->assertForbidden();

    $this->actingAs($student)
        ->patch(route('admin.sedes.toggle-status', $sede))
        ->assertForbidden();

    $this->assertDatabaseHas('tblsedes', [
        'id_sede' => $sede->id_sede,
        'estado' => true,
    ]);
});
