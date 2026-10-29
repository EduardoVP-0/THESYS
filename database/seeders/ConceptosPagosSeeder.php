<?php

namespace Database\Seeders;

use App\Models\Admin\ConceptoPago;
use App\Models\Admin\Pago;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConceptosPagosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Catálogo inicial de conceptos oficiales
        $conceptos = [
            [
                'clave' => 'TES-001',
                'nombre' => 'Inscripción del tema de tesis',
                'descripcion' => 'Pago inicial para registrar formalmente el tema o anteproyecto de investigación ante la unidad académica correspondiente.',
                'monto' => 85.00,
                'orden' => 1,
                'activo' => true,
            ],
            [
                'clave' => 'TES-002',
                'nombre' => 'Liberación de tesis y servicio social',
                'descripcion' => 'Trámite para validar administrativamente que el estudiante ha concluido su servicio social y que su trabajo de tesis ha sido aprobado por los asesores.',
                'monto' => 85.00,
                'orden' => 2,
                'activo' => true,
            ],
            [
                'clave' => 'TES-003',
                'nombre' => 'Autorización de examen profesional',
                'descripcion' => 'Derecho administrativo que se cubre para que las autoridades académicas validen el expediente completo y den luz verde para continuar con el proceso de evaluación.',
                'monto' => 115.00,
                'orden' => 3,
                'activo' => true,
            ],
            [
                'clave' => 'TES-004',
                'nombre' => 'Donación a biblioteca, pasante de examen profesional',
                'descripcion' => 'Aportación institucional requerida a los pasantes como parte de los requisitos previos para poder sustentar su examen.',
                'monto' => 285.00,
                'orden' => 4,
                'activo' => true,
            ],
            [
                'clave' => 'TES-005',
                'nombre' => 'Examen profesional',
                'descripcion' => 'Pago por el derecho a presentar la defensa oral de la tesis ante el jurado asignado y, en caso de aprobar, realizar la toma de protesta pública.',
                'monto' => 1430.00,
                'orden' => 5,
                'activo' => true,
            ],
        ];

        $conceptosCreados = [];
        foreach ($conceptos as $c) {
            $conceptosCreados[] = ConceptoPago::updateOrCreate(
                ['nombre' => $c['nombre']],
                $c
            );
        }

        // 2. Asignar los conceptos a los alumnos existentes que aún no los tengan
        $alumnos = User::where('id_rol', 5)->get(); // Rol 5 = Alumnos

        foreach ($alumnos as $alumno) {
            foreach ($conceptosCreados as $concepto) {
                // Verificar si ya existe este pago para evitar duplicados
                $existe = Pago::where('id_usuario', $alumno->id)
                    ->where(function ($q) use ($concepto) {
                        $q->where('id_concepto', $concepto->id_concepto)
                          ->orWhere('concepto', $concepto->nombre);
                    })
                    ->exists();

                if (! $existe) {
                    Pago::create([
                        'id_usuario' => $alumno->id,
                        'id_concepto' => $concepto->id_concepto,
                        'concepto' => $concepto->nombre,
                        'monto' => $concepto->monto,
                        'referencia_bancaria' => null,
                        'estado_validacion' => 'Pendiente',
                    ]);
                }
            }
        }
    }
}