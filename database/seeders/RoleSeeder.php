<?php

namespace Database\Seeders;

use App\Models\Roles;
use Illuminate\Database\Seeder;

/**
 * Seeder para registrar y asegurar los roles base en el sistema THESYS.
 * Coincide con la matriz de roles y la redirección de LoginResponse:
 * - 1: Superadmin (Acceso total)
 * - 2: Administrador (Gestión académica y administrativa)
 * - 3: Coordinación (Personal administrativo y de apoyo)
 * - 4: Docente (Asesor de tesis / Miembro de jurado)
 * - 5: Alumno (Sustentante de titulación)
 */
class RoleSeeder extends Seeder
{
    /**
     * Ejecuta el sembrado de roles en la base de datos.
     * Utiliza updateOrCreate para no duplicar ni alterar IDs existentes.
     */
    public function run(): void
    {
        $roles = [
            ['id_rol' => 1, 'nombre_rol' => 'Superadmin'],
            ['id_rol' => 2, 'nombre_rol' => 'Administrador'],
            ['id_rol' => 3, 'nombre_rol' => 'Coordinación'],
            ['id_rol' => 4, 'nombre_rol' => 'Docente'],
            ['id_rol' => 5, 'nombre_rol' => 'Alumno'],
        ];

        foreach ($roles as $rol) {
            Roles::updateOrCreate(
                ['id_rol' => $rol['id_rol']],
                ['nombre_rol' => $rol['nombre_rol']]
            );
        }
    }
}
