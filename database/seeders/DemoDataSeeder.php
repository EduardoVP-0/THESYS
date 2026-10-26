<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * CARGA LOS DATOS DEMOSTRATIVOS DE THESYS
 *
 * El contenido vive en `demo_data.sql` para que pueda ejecutarse también
 * directamente desde pgAdmin 4. El seeder se limita a leer el archivo y
 * enviarlo a PostgreSQL.
 */
class DemoDataSeeder extends Seeder
{
    /**
     * Ejecuta el bloque SQL de datos demostrativos.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $ruta = database_path('seeders/demo_data.sql');

        if (! is_file($ruta)) {
            throw new RuntimeException("No se encontró el archivo de datos demo: {$ruta}");
        }

        $sql = file_get_contents($ruta);

        if ($sql === false || trim($sql) === '') {
            throw new RuntimeException('No fue posible leer el archivo de datos demo.');
        }

        DB::unprepared($sql);

        $this->command?->info('Datos demostrativos de THESYS cargados correctamente.');
    }
}
