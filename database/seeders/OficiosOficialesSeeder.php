<?php

namespace Database\Seeders;

use App\Models\Admin\Oficios_Oficiales;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OficiosOficialesSeeder extends Seeder
{
    /**
     * Inserta los trámites restantes ajustando la secuencia de PostgreSQL.
     */
    public function run(): void
    {
        // 1. Sincroniza la secuencia de PostgreSQL al número máximo actual (para evitar error de llave 1)
        DB::statement("SELECT setval(pg_get_serial_sequence('tbloficios_oficiales', 'id_oficio_oficial'), COALESCE(MAX(id_oficio_oficial), 1)) FROM tbloficios_oficiales;");

        // 2. Insertamos registros de prueba, incluyendo 11 más de Titulación para paginación
        $datos = [
            // 11 Registros de Titulación para probar la paginación de 10 en 10
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Daniela Ruiz',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_001.pdf',
                'estado' => true,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Carlos Santana',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_002.pdf',
                'estado' => true,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Mariana Garza',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_003.pdf',
                'estado' => false,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Fernando López',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_004.pdf',
                'estado' => true,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Patricia Mora',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_005.pdf',
                'estado' => true,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Gabriel Vargas',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_006.pdf',
                'estado' => true,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Lucía Méndez',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_007.pdf',
                'estado' => true,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Jorge Ortiz',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_008.pdf',
                'estado' => false,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Elena Ramos',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_009.pdf',
                'estado' => true,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Sebastián Peña',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_010.pdf',
                'estado' => true,
            ],
            [
                'nombre_oficio' => 'Formato Solicitud de Titulación - Diana Salgado',
                'tipo' => 'Registro de Titulación',
                'url_archivo' => '/storage/oficios/reg_titulacion_011.pdf',
                'estado' => true,
            ],
        ];

        foreach ($datos as $item) {
            Oficios_Oficiales::firstOrCreate(
                ['nombre_oficio' => $item['nombre_oficio']],
                $item
            );
        }
    }
}
