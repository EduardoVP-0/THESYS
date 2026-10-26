<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * VALIDACIÓN PARA REGISTRAR UNA SEDE
 */
class StoreSedeRequest extends FormRequest
{
    /**
     * Determina si el usuario autenticado puede ejecutar la acción.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para crear una sede.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre_sede' => ['required', 'string', 'max:120', 'unique:tblsedes,nombre_sede'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'estado' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre_sede.required' => 'El nombre de la sede es obligatorio.',
            'nombre_sede.max' => 'El nombre de la sede no debe exceder los 120 caracteres.',
            'nombre_sede.unique' => 'Ya existe una sede registrada con este nombre.',
            'direccion.max' => 'La dirección no debe exceder los 255 caracteres.',
        ];
    }
}
