<?php

namespace Database\Factories\Admin;

use App\Models\Admin\Sede;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sede>
 */
class SedeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre_sede' => 'Sede '.fake()->unique()->city(),
            'direccion' => fake()->address(),
            'estado' => true,
            'id_usuario_registro' => null,
        ];
    }

    /**
     * Indica que la sede está dada de baja.
     */
    public function inactiva(): static
    {
        return $this->state(fn (array $attributes): array => [
            'estado' => false,
        ]);
    }
}
