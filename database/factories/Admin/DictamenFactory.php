<?php

namespace Database\Factories\Admin;

use App\Models\Admin\Dictamen;
use App\Models\Admin\JuradoProyecto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Dictamen>
 */
class DictamenFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_jurado_proyecto' => JuradoProyecto::factory(),
            'voto' => fake()->randomElement(Dictamen::VOTOS),
            'observaciones' => null,
        ];
    }

    /**
     * Dictamen a favor.
     */
    public function aFavor(): static
    {
        return $this->state(fn (array $attributes): array => [
            'voto' => Dictamen::VOTO_A_FAVOR,
        ]);
    }

    /**
     * Dictamen en contra.
     */
    public function enContra(): static
    {
        return $this->state(fn (array $attributes): array => [
            'voto' => Dictamen::VOTO_EN_CONTRA,
        ]);
    }
}
