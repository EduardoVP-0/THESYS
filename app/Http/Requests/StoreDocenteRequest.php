<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * VALIDACIÓN PARA EL REGISTRO DE UN NUEVO DOCENTE
 * Valida tanto los datos de la cuenta (users) como el expediente (tbldocentes)
 */
class StoreDocenteRequest extends FormRequest
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
        return [
            // DATOS DE LA CUENTA (users)
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'ends_with:@unach.mx',
                'unique:users,email',
            ],
            // DATOS PERSONALES (tbldocentes)
            'nombre' => ['required', 'string', 'max:100', 'regex:/^[\pL\s]+$/u'],
            'apellido_p' => ['required', 'string', 'max:100', 'regex:/^[\pL\s]+$/u'],
            'apellido_m' => ['required', 'string', 'max:100', 'regex:/^[\pL\s]+$/u'],
            'telefono' => ['nullable', 'string', 'digits:10'],
            'cedula_profesional' => [
                'required',
                'string',
                'regex:/^\d{7,10}$/',
                'unique:tbldocentes,cedula_profesional',
            ],
            'curp' => [
                'required',
                'string',
                'size:18',
                'regex:/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i',
                'unique:tbldocentes,curp',
            ],
            // DATOS ACADÉMICOS / LABORALES
            'especialidad' => ['required', 'string', 'max:100'],
            'grado_academico' => ['required', 'string', 'in:Licenciatura,Maestría,Doctorado,Especialidad'],
            'tipo_contrato' => ['required', 'string', 'in:Tiempo completo,Medio tiempo,Por horas,Interino'],
        ];
    }

    public function messages(): array
    {
        return [
            // Cuenta
            'email.required' => 'El correo institucional es obligatorio.',
            'email.email' => 'Ingresa un formato de correo válido.',
            'email.ends_with' => 'El correo debe terminar en @unach.mx.',
            'email.unique' => 'Ya existe un usuario registrado con este correo.',
            // Personales
            'nombre.required' => 'El nombre del docente es obligatorio.',
            'nombre.regex' => 'El nombre solo puede contener letras y espacios.',
            'apellido_p.required' => 'El apellido paterno es obligatorio.',
            'apellido_p.regex' => 'El apellido paterno solo puede contener letras y espacios.',
            'apellido_m.required' => 'El apellido materno es obligatorio.',
            'apellido_m.regex' => 'El apellido materno solo puede contener letras y espacios.',
            'telefono.digits' => 'El teléfono debe contener exactamente 10 dígitos numéricos.',
            'cedula_profesional.required' => 'La cédula profesional es obligatoria.',
            'cedula_profesional.regex' => 'La cédula profesional debe contener entre 7 y 10 dígitos numéricos.',
            'cedula_profesional.unique' => 'Ya existe un docente con esta cédula profesional.',
            'curp.required' => 'La CURP es obligatoria.',
            'curp.size' => 'La CURP debe tener exactamente 18 caracteres.',
            'curp.regex' => 'El formato de la CURP no es válido (ej: MOSL800101MDFRRN01).',
            'curp.unique' => 'Ya existe un docente registrado con esta CURP.',
            // Laborales
            'especialidad.required' => 'La especialidad es obligatoria.',
            'grado_academico.required' => 'El grado académico es obligatorio.',
            'grado_academico.in' => 'El grado seleccionado no es válido.',
            'tipo_contrato.required' => 'El tipo de contrato es obligatorio.',
            'tipo_contrato.in' => 'El tipo de contrato seleccionado no es válido.',
        ];
    }
}
