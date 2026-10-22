<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

// Validacion para el registro de una nueva carrera
class StoreCarreraRequest extends FormRequest
{
    /**
     * Determina si el usuario autenticado tiene permiso de ejecutar esta accion.
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
        return [
            // El nombre es obligatorio, máximo 50 caracteres y no puede repetirse en tblcarreras
            'nombre_carrera' => ['required', 'string', 'max:50', 'unique:tblcarreras,nombre_carrera'],
            'descripcion' => ['nullable', 'string'],
            // La duración debe ser un número entero válido (entre 1 y 9 semestres)
            'duracion_semestres' => ['required', 'integer', 'min:1', 'max:9'],
            'estado' => ['boolean'],
        ];
    }

    // Mensajes descriptivos en caso de error de validacion
    public function messages(): array
    {
        return [
            'nombre_carrera.required' => 'El nombre de la carrera es obligatorio.',
            'nombre_carrera.string' => 'El nombre de la carrera debe ser texto válido.',
            'nombre_carrera.max' => 'El nombre de la carrera no debe exceder los 50 caracteres.',
            'nombre_carrera.unique' => 'Ya existe una carrera registrada con este nombre en la institución.',
            'descripcion.string' => 'La descripción debe ser un texto válido.',
            'duracion_semestres.required' => 'Debes especificar la duración en semestres.',
            'duracion_semestres.integer' => 'La duración en semestres debe ser un número entero.',
            'duracion_semestres.min' => 'La carrera debe durar al menos 1 semestre.',
            'duracion_semestres.max' => 'La duración máxima permitida es de 9 semestres.',
        ];
    }
}
