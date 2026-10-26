<?php

namespace Database\Factories\Admin;

use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JuradoProyecto>
 */
class JuradoProyectoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_usuario' => User::factory()->state(['id_rol' => 4]),
            'id_proyecto' => Proyecto::factory(),
            'cargo' => fake()->randomElement(JuradoProyecto::CARGOS),
            'estado_aceptacion' => JuradoProyecto::ESTADO_ACEPTADO,
        ];
    }

    /**
     * Estado pendiente de aceptación.
     */
    public function pendiente(): static
    {
        return $this->state(fn (array $attributes): array => [
            'estado_aceptacion' => JuradoProyecto::ESTADO_PENDIENTE,
        ]);
    }
}
