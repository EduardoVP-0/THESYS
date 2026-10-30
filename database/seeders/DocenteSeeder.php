<?php

namespace Database\Seeders;

use App\Models\Admin\Docente;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DocenteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $docentes = [
            // 2 Hombres
            [
                'email' => 'carlos.mendoza@unach.mx',
                'name' => 'Dr. Carlos Mendoza Ruiz',
                'nombre' => 'Carlos',
                'apellido_p' => 'Mendoza',
                'apellido_m' => 'Ruiz',
                'telefono' => '9611234567',
                'cedula_profesional' => '12345678',
                'curp' => 'MERC800101HCSNRL01',
                'especialidad' => 'Sistemas Distribuidos e Inteligencia Artificial',
                'grado_academico' => 'Doctorado',
                'tipo_contrato' => 'Tiempo completo',
            ],
            [
                'email' => 'alejandro.morales@unach.mx',
                'name' => 'Mtro. Alejandro Morales Gómez',
                'nombre' => 'Alejandro',
                'apellido_p' => 'Morales',
                'apellido_m' => 'Gómez',
                'telefono' => '9612345678',
                'cedula_profesional' => '23456789',
                'curp' => 'MOGA820315HCSNRM02',
                'especialidad' => 'Arquitectura de Computadoras y Semiconductores',
                'grado_academico' => 'Maestría',
                'tipo_contrato' => 'Tiempo completo',
            ],
            // 4 Mujeres
            [
                'email' => 'elena.vazquez@unach.mx',
                'name' => 'Dra. Elena Vázquez Cruz',
                'nombre' => 'Elena',
                'apellido_p' => 'Vázquez',
                'apellido_m' => 'Cruz',
                'telefono' => '9613456789',
                'cedula_profesional' => '34567890',
                'curp' => 'VACE850720MCSNRN03',
                'especialidad' => 'Ciencia de Datos y Aprendizaje Profundo',
                'grado_academico' => 'Doctorado',
                'tipo_contrato' => 'Tiempo completo',
            ],
            [
                'email' => 'gabriela.toledo@unach.mx',
                'name' => 'Mtra. Gabriela Toledo Solís',
                'nombre' => 'Gabriela',
                'apellido_p' => 'Toledo',
                'apellido_m' => 'Solís',
                'telefono' => '9614567890',
                'cedula_profesional' => '45678901',
                'curp' => 'TOSG881110MCSNRA04',
                'especialidad' => 'Ingeniería de Software y Metodologías Ágiles',
                'grado_academico' => 'Maestría',
                'tipo_contrato' => 'Tiempo completo',
            ],
            [
                'email' => 'patricia.dominguez@unach.mx',
                'name' => 'Dra. Patricia Domínguez Lara',
                'nombre' => 'Patricia',
                'apellido_p' => 'Domínguez',
                'apellido_m' => 'Lara',
                'telefono' => '9615678901',
                'cedula_profesional' => '56789012',
                'curp' => 'DOLP830405MCSNRB05',
                'especialidad' => 'Ciberseguridad y Redes Complejas',
                'grado_academico' => 'Doctorado',
                'tipo_contrato' => 'Tiempo completo',
            ],
            [
                'email' => 'rosaura.aguilar@unach.mx',
                'name' => 'Mtra. Rosaura Aguilar Flores',
                'nombre' => 'Rosaura',
                'apellido_p' => 'Aguilar',
                'apellido_m' => 'Flores',
                'telefono' => '9616789012',
                'cedula_profesional' => '67890123',
                'curp' => 'AUFR900918MCSNRC06',
                'especialidad' => 'Interacción Humano-Computadora y Experiencia de Usuario',
                'grado_academico' => 'Maestría',
                'tipo_contrato' => 'Asignatura',
            ],
        ];

        foreach ($docentes as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password123'),
                    'id_rol' => 4, // Rol Docente
                    'estado' => true,
                ]
            );

            Docente::updateOrCreate(
                ['id_usuario' => $user->id],
                [
                    'nombre' => $data['nombre'],
                    'apellido_p' => $data['apellido_p'],
                    'apellido_m' => $data['apellido_m'],
                    'telefono' => $data['telefono'],
                    'cedula_profesional' => $data['cedula_profesional'],
                    'curp' => $data['curp'],
                    'especialidad' => $data['especialidad'],
                    'grado_academico' => $data['grado_academico'],
                    'tipo_contrato' => $data['tipo_contrato'],
                    'estado' => true,
                ]
            );
        }
    }
}

