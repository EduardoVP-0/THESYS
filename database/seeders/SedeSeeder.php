<?php

namespace Database\Seeders;

use App\Models\Admin\Sede;
use Illuminate\Database\Seeder;

class SedeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sedes = [
            // 1 Audiovisual
            [
                'nombre_sede' => 'Sala Audiovisual de Tecnologías',
                'direccion' => 'Edificio C, Planta Baja - Campus Tuxtla Gutiérrez, Blvd. Belisario Domínguez Km. 1081',
                'estado' => true,
            ],
            // 3 Salones
            [
                'nombre_sede' => 'Salón 101 - Edificio de Posgrado',
                'direccion' => 'Edificio de Posgrado, Primer Nivel - Campus Tuxtla Gutiérrez',
                'estado' => true,
            ],
            [
                'nombre_sede' => 'Salón 102 - Edificio de Posgrado',
                'direccion' => 'Edificio de Posgrado, Primer Nivel - Campus Tuxtla Gutiérrez',
                'estado' => true,
            ],
            [
                'nombre_sede' => 'Salón de Usos Múltiples 201',
                'direccion' => 'Edificio A, Segundo Nivel - Campus Tuxtla Gutiérrez',
                'estado' => true,
            ],
        ];

        foreach ($sedes as $sede) {
            Sede::updateOrCreate(
                ['nombre_sede' => $sede['nombre_sede']],
                $sede
            );
        }
    }
}

