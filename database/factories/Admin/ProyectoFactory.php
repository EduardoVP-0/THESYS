<?php

namespace Database\Factories\Admin;

use App\Models\Admin\Proyecto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Proyecto>
 */
class ProyectoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'titulo' => fake()->sentence(8),
            'resumen' => fake()->paragraph(),
            'estado' => Proyecto::ESTADO_APROBADO,
            'fecha_envio' => now(),
            'ruta_documento' => null,
            'observaciones_coordinacion' => null,
        ];
    }

    /**
     * Indica que el proyecto aún no ha sido enviado.
     */
    public function borrador(): static
    {
        return $this->state(fn (array $attributes): array => [
            'estado' => 'Borrador',
            'fecha_envio' => null,
        ]);
    }
}
