<?php

namespace Database\Seeders;

use App\Models\Admin\Carrera;
use Illuminate\Database\Seeder;

class CarreraSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $carreras = [
            [
                'nombre_carrera' => 'Licenciatura en Sistemas Computacionales',
                'descripcion' => 'Formación integral en desarrollo de software, redes, bases de datos y administración de tecnologías de cómputo.',
                'duracion_semestres' => 9,
                'estado' => true,
            ],
            [
                'nombre_carrera' => 'Ingeniería en Desarrollo y Tecnologías de Software',
                'descripcion' => 'Especialización en arquitectura de software, cómputo en la nube, aplicaciones móviles y ciberseguridad.',
                'duracion_semestres' => 9,
                'estado' => true,
            ],
            [
                'nombre_carrera' => 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
                'descripcion' => 'Modelado computacional, aprendizaje automático, minería de datos, visión por computadora y analítica predictiva.',
                'duracion_semestres' => 9,
                'estado' => true,
            ],
            [
                'nombre_carrera' => 'Ingeniería en Semiconductores',
                'descripcion' => 'Diseño, fabricación y optimización de microelectrónica, circuitos integrados, dispositivos optoelectrónicos y sistemas embebidos.',
                'duracion_semestres' => 9,
                'estado' => true,
            ],
        ];

        foreach ($carreras as $carrera) {
            Carrera::updateOrCreate(
                ['nombre_carrera' => $carrera['nombre_carrera']],
                $carrera
            );
        }
    }
}

