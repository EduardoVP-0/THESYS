<?php

namespace Database\Seeders;

use App\Models\Admin\Alumno;
use App\Models\Admin\Pago;
use App\Models\User;
use Illuminate\Database\Seeder;

class PagoSeeder extends Seeder
{
    public function run(): void
    {
        // Tomamos un alumno existente o el usuario ID 2
        $alumno = Alumno::first();
        $idUsuario = $alumno ? $alumno->id_usuario : (User::first()->id ?? 1);

        $pagos = [
            [
                'id_usuario' => $idUsuario,
                'concepto' => 'Inscripción del tema de tesis',
                'monto' => 85.00,
                'referencia_bancaria' => 'REF-2026-0001',
                'estado_validacion' => 'Validado',
                'created_at' => now()->subDays(10),
            ],
            [
                'id_usuario' => $idUsuario,
                'concepto' => 'Inscripción del tema de tesis',
                'monto' => 85.00,
                'referencia_bancaria' => 'REF-2026-0002',
                'estado_validacion' => 'Pendiente',
                'created_at' => now()->subDays(8),
            ],
            [
                'id_usuario' => $idUsuario,
                'concepto' => 'Liberación de tesis y servicio social',
                'monto' => 85.00,
                'referencia_bancaria' => 'REF-2026-0003',
                'estado_validacion' => 'Validado',
                'created_at' => now()->subDays(5),
            ],
            [
                'id_usuario' => $idUsuario,
                'concepto' => 'Autorización de examen profesional',
                'monto' => 115.00,
                'referencia_bancaria' => 'REF-2026-0004',
                'estado_validacion' => 'Rechazado',
                'created_at' => now()->subDays(3),
            ],
            [
                'id_usuario' => $idUsuario,
                'concepto' => 'Autorización de examen profesional',
                'monto' => 115.00,
                'referencia_bancaria' => 'REF-2026-0005',
                'estado_validacion' => 'Validado',
                'created_at' => now()->subDays(2),
            ],
            [
                'id_usuario' => $idUsuario,
                'concepto' => 'Examen profesional',
                'monto' => 1430.00,
                'referencia_bancaria' => 'REF-2026-0006',
                'estado_validacion' => 'Pendiente',
                'created_at' => now()->subDay(),
            ],
        ];

        foreach ($pagos as $pago) {
            Pago::updateOrCreate(
                ['referencia_bancaria' => $pago['referencia_bancaria']],
                $pago
            );
        }
    }
}
