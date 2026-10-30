<?php

namespace Database\Seeders;

use App\Models\Admin\Administrador;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Sembrado de roles base indispensables para el sistema
        $this->call(RoleSeeder::class);

        // 2. Administrador general inicial
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@unach.mx'],
            [
                'name' => 'Administrador General',
                'password' => Hash::make('password123'),
                'id_rol' => 1, // Superadmin
                'estado' => true,
            ]
        );

        Administrador::firstOrCreate(
            ['id_usuario' => $adminUser->id],
            [
                'nombre' => 'Administrador',
                'apellido_p' => 'General',
                'apellido_m' => 'UNACH',
                'telefono' => '9610000000',
                'area' => 'Coordinación de Titulación',
                'estado' => true,
            ]
        );

        // Usuario de prueba general si no existe
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'id_rol' => 1,
                'estado' => true,
            ]
        );

        // 3. Catálogos y datos esenciales en orden estricto de dependencias
        $this->call([
            CarreraSeeder::class,
            DocenteSeeder::class,
            SedeSeeder::class,
            OficiosOficialesSeeder::class,
            AnteproyectoSeeder::class,
            ConceptosPagosSeeder::class,
        ]);
    }
}
