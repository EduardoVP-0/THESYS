<?php

namespace Database\Factories\Admin;

use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\Proyecto;
use App\Models\Admin\Sede;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExamenProfesional>
 */
class ExamenProfesionalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_proyecto' => Proyecto::factory(),
            'id_sede' => Sede::factory(),
            'fecha_examen' => now()->addDays(21)->toDateString(),
            'hora_examen' => '10:00',
            'sede' => 'Sala de titulación',
            'estado_examen' => ExamenProfesional::ESTADO_PROGRAMADO,
            'resultado_final' => null,
        ];
    }
}
