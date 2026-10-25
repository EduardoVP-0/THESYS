<?php

namespace Database\Seeders;

use App\Models\Admin\Alumno;
use App\Models\Admin\Carrera;
use App\Models\Admin\Docente;
use App\Models\Admin\Proyecto;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AnteproyectoSeeder extends Seeder
{
    /**
     * Run the database seeds. ELIMINAR DESPUES ----------------------------------------
     */
    public function run(): void
    {
        // 1. Asegurar carrera base
        $carrera = Carrera::firstOrCreate(
            ['nombre_carrera' => 'Licenciatura en Tecnologías de Información'],
            [
                'descripcion' => 'Programa enfocado en desarrollo de software, redes y transformación digital.',
                'duracion_semestres' => 8,
                'estado' => true,
            ]
        );

        // 2. Asegurar docentes para asesores
        $docenteUser = User::firstOrCreate(
            ['email' => 'carlos.mendoza@unach.mx'],
            [
                'name' => 'Dr. Carlos Mendoza Ruiz',
                'password' => Hash::make('password123'),
                'id_rol' => 4, // Rol Docente
                'estado' => true,
            ]
        );

        $docente = Docente::firstOrCreate(
            ['id_usuario' => $docenteUser->id],
            [
                'nombre' => 'Carlos',
                'apellido_p' => 'Mendoza',
                'apellido_m' => 'Ruiz',
                'telefono' => '9611234567',
                'cedula_profesional' => '12345678',
                'curp' => 'MERC800101HCSNRL01',
                'especialidad' => 'Sistemas Distribuidos e Inteligencia Artificial',
                'grado_academico' => 'Doctorado',
                'tipo_contrato' => 'Tiempo completo',
                'estado' => true,
            ]
        );

        // 3. Alumnos de prueba tal como en el mockup
        $alumnosData = [
            [
                'email' => 'sol.martinez@unach.mx',
                'name' => 'Sol Martínez',
                'nombre' => 'Sol',
                'apellido_p' => 'Martínez',
                'apellido_m' => 'Gómez',
                'matricula' => 'ALU-208',
            ],
            [
                'email' => 'noa.castillo@unach.mx',
                'name' => 'Noa Castillo',
                'nombre' => 'Noa',
                'apellido_p' => 'Castillo',
                'apellido_m' => 'Vázquez',
                'matricula' => 'ALU-209',
            ],
            [
                'email' => 'mateo.herrera@unach.mx',
                'name' => 'Mateo Herrera',
                'nombre' => 'Mateo',
                'apellido_p' => 'Herrera',
                'apellido_m' => 'Domínguez',
                'matricula' => 'ALU-210',
            ],
            [
                'email' => 'valeria.rios@unach.mx',
                'name' => 'Valeria Ríos',
                'nombre' => 'Valeria',
                'apellido_p' => 'Ríos',
                'apellido_m' => 'López',
                'matricula' => 'ALU-211',
            ],
        ];

        $alumnosCreados = [];
        foreach ($alumnosData as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password123'),
                    'id_rol' => 5, // Rol Alumno
                    'estado' => true,
                ]
            );

            $alumno = Alumno::firstOrCreate(
                ['id_usuario' => $user->id],
                [
                    'id_carrera' => $carrera->id_carrera,
                    'nombre' => $data['nombre'],
                    'apellido_p' => $data['apellido_p'],
                    'apellido_m' => $data['apellido_m'],
                    'matricula' => $data['matricula'],
                    'telefono' => '961'.rand(1000000, 9999999),
                    'curp' => strtoupper(substr(md5($data['email']), 0, 18)),
                    'fecha_nacimiento' => '2001-05-15',
                    'sexo' => 'Masculino',
                    'turno' => 'Matutino',
                    'fecha_ingreso' => '2022-08-10',
                    'generacion' => '2022-2026',
                    'estado_academico' => 'Activo',
                ]
            );

            $alumnosCreados[$data['matricula']] = $alumno;
        }

        // 4. Anteproyectos de prueba
        $proyectosData = [
            [
                'titulo' => 'Aprendizaje colaborativo en entornos digitales',
                'resumen' => 'Estudio sobre estrategias de aprendizaje colaborativo y su impacto en estudiantes universitarios mediante herramientas digitales interactivas.',
                'estado' => 'Borrador',
                'fecha_envio' => null,
                'ruta_documento' => null,
                'observaciones_coordinacion' => null,
                'alumno_matricula' => 'ALU-208',
                'con_asesor' => false,
            ],
            [
                'titulo' => 'Sistemas de captación de agua para comunidades rurales',
                'resumen' => 'Diseño e implementación de un sistema telemétrico para el monitoreo de calidad y volumen de captación pluvial en la región Altos de Chiapas.',
                'estado' => 'En revisión',
                'fecha_envio' => now()->subDays(16),
                'ruta_documento' => 'anteproyecto-captacion-agua.pdf',
                'observaciones_coordinacion' => null,
                'alumno_matricula' => 'ALU-209',
                'con_asesor' => false,
            ],
            [
                'titulo' => 'Plataforma web para monitoreo y análisis de biodiversidad',
                'resumen' => 'Desarrollo de una arquitectura de microservicios para el registro de avistamientos y preservación de especies protegidas en reservas chiapanecas.',
                'estado' => 'Aprobado',
                'fecha_envio' => now()->subDays(30),
                'ruta_documento' => 'anteproyecto-biodiversidad.pdf',
                'observaciones_coordinacion' => 'La propuesta cuenta con objetivos metodológicos sólidos y viabilidad técnica comprobada.',
                'alumno_matricula' => 'ALU-210',
                'con_asesor' => true,
            ],
            [
                'titulo' => 'Optimización de rutas de transporte público mediante algoritmos genéticos',
                'resumen' => 'Modelado computacional para reducir tiempos de espera y optimizar el consumo energético en flotas de transporte urbano de Tuxtla Gutiérrez.',
                'estado' => 'Con cambios',
                'fecha_envio' => now()->subDays(10),
                'ruta_documento' => 'anteproyecto-transporte-rutas.pdf',
                'observaciones_coordinacion' => 'Se requiere delimitar la muestra de rutas a 3 líneas prioritarias y especificar el método de recolección de coordenadas GPS.',
                'alumno_matricula' => 'ALU-211',
                'con_asesor' => false,
            ],
        ];

        foreach ($proyectosData as $pData) {
            $proyecto = Proyecto::firstOrCreate(
                ['titulo' => $pData['titulo']],
                [
                    'resumen' => $pData['resumen'],
                    'estado' => $pData['estado'],
                    'fecha_envio' => $pData['fecha_envio'],
                    'ruta_documento' => $pData['ruta_documento'],
                    'observaciones_coordinacion' => $pData['observaciones_coordinacion'],
                ]
            );

            // Asociar alumno
            if (isset($alumnosCreados[$pData['alumno_matricula']])) {
                $alumno = $alumnosCreados[$pData['alumno_matricula']];
                DB::table('tblalumnos_proyectos')->updateOrInsert(
                    [
                        'id_alumno' => $alumno->id_usuario,
                        'id_proyecto' => $proyecto->id_proyecto,
                    ],
                    [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }

            // Asociar asesor si aplica
            if ($pData['con_asesor']) {
                DB::table('tblasesores_proyectos')->updateOrInsert(
                    [
                        'id_usuario' => $docente->id_usuario,
                        'id_proyecto' => $proyecto->id_proyecto,
                    ],
                    [
                        'estado_asignacion' => 'Activo',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
