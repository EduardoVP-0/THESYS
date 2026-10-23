<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * VALIDACIÓN PARA LA ACTUALIZACIÓN DE UN DOCENTE
 */
class UpdateDocenteRequest extends FormRequest
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
        // $this->route('docente') resuelve el modelo ligado por Route Model Binding
        $docenteId = $this->route('docente')->id_usuario;

        return [
            // CUENTA (users)
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'ends_with:@unach.mx',
                "unique:users,email,{$docenteId},id",
            ],
            // DATOS PERSONALES
            'nombre' => ['required', 'string', 'max:100'],
            'apellido_p' => ['required', 'string', 'max:100'],
            'apellido_m' => ['required', 'string', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'cedula_profesional' => [
                'required',
                'string',
                'max:20',
                "unique:tbldocentes,cedula_profesional,{$docenteId},id_usuario",
            ],
            'curp' => [
                'required',
                'string',
                'size:18',
                "unique:tbldocentes,curp,{$docenteId},id_usuario",
            ],
            // DATOS LABORALES
            'especialidad' => ['required', 'string', 'max:100'],
            'grado_academico' => ['required', 'string', 'in:Licenciatura,Maestría,Doctorado,Especialidad'],
            'tipo_contrato' => ['required', 'string', 'in:Tiempo completo,Medio tiempo,Por horas,Interino'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'El correo institucional es obligatorio.',
            'email.ends_with' => 'El correo debe terminar en @unach.mx.',
            'email.unique' => 'Este correo ya está en uso por otro usuario.',
            'nombre.required' => 'El nombre del docente es obligatorio.',
            'apellido_p.required' => 'El apellido paterno es obligatorio.',
            'apellido_m.required' => 'El apellido materno es obligatorio.',
            'cedula_profesional.required' => 'La cédula profesional es obligatoria.',
            'cedula_profesional.unique' => 'Esta cédula ya está registrada para otro docente.',
            'curp.required' => 'La CURP es obligatoria.',
            'curp.size' => 'La CURP debe tener exactamente 18 caracteres.',
            'curp.unique' => 'Esta CURP ya está registrada para otro docente.',
            'especialidad.required' => 'La especialidad es obligatoria.',
            'grado_academico.required' => 'El grado académico es obligatorio.',
            'tipo_contrato.required' => 'El tipo de contrato es obligatorio.',
        ];
    }
}
