<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Validacion para la actualizacion de una carrera
class UpdateCarreraRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Obtenemos el ID de la carrera actual desde la ruta para no marcar error de duplicado sobre sí misma
        $carreraId = $this->route('carrera')?->id_carrera ?? $this->route('carrera');

        return [
            'nombre_carrera' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tblcarreras', 'nombre_carrera')->ignore($carreraId, 'id_carrera'),
            ],
            'descripcion' => ['nullable', 'string'],
            'duracion_semestres' => ['required', 'integer', 'min:1', 'max:9'],
            'estado' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre_carrera.required' => 'El nombre de la carrera es obligatorio.',
            'nombre_carrera.string' => 'El nombre de la carrera debe ser texto válido.',
            'nombre_carrera.max' => 'El nombre de la carrera no debe exceder los 100 caracteres.',
            'nombre_carrera.unique' => 'Ya existe otra carrera registrada con este nombre en la institución.',
            'descripcion.string' => 'La descripción debe ser un texto válido.',
            'duracion_semestres.required' => 'Debes especificar la duración en semestres.',
            'duracion_semestres.integer' => 'La duración en semestres debe ser un número entero.',
            'duracion_semestres.min' => 'La carrera debe durar al menos 1 semestre.',
            'duracion_semestres.max' => 'La duración máxima permitida es de 9 semestres.',
        ];
    }
}
