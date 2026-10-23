<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * VALIDACIÓN PARA EL REGISTRO DE UN NUEVO ALUMNO
 * Valida tanto los datos de la cuenta de usuario (users)
 * como el expediente académico y personal (tblalumnos)
 */
class StoreAlumnoRequest extends FormRequest
{
    /**
     * Determina si el usuario autenticado tiene permiso de ejecutar esta accion
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
            // DATOS DE LA CUENTA DE USUARIO (users)
            // Obligatorio, formato de correo válido, único en users y debe terminar en @unach.mx
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'ends_with:@unach.mx',
                'unique:users,email',
            ],
            // DATOS PERSONALES DEL ALUMNO (tblalumnos)
            'nombre' => ['required', 'string', 'max:100'],
            'apellido_p' => ['required', 'string', 'max:100'],
            'apellido_m' => ['required', 'string', 'max:100'],
            'fecha_nacimiento' => ['required', 'date', 'before:today'],
            'sexo' => ['required', 'string', 'in:Masculino,Femenino,Otro'],
            'curp' => [
                'required',
                'string',
                'size:18',
                'unique:tblalumnos,curp',
            ],
            'telefono' => ['nullable', 'string', 'max:20'],
            'matricula' => [
                'required',
                'string',
                'max:10',
                'unique:tblalumnos,matricula',
            ],
            // DIRECCION (Opcional)
            'calle' => ['nullable', 'string', 'max:150'],
            'colonia' => ['nullable', 'string', 'max:100'],
            'codigo_postal' => ['nullable', 'string', 'max:10'],
            // DATOS ACADEMICOS (tblalumnos)
            // La carrera debe existir en la tabla tblcarreras
            'id_carrera' => ['required', 'integer', 'exists:tblcarreras,id_carrera'],
            'turno' => ['required', 'string', 'in:Matutino,Vespertino,Mixto'],
            'fecha_ingreso' => ['required', 'date'],
            'generacion' => ['required', 'string', 'max:50'],
            'estado_academico' => ['nullable', 'string', 'in:Activo,Egresado,Baja temporal,Baja definitiva'],
        ];
    }

    // Mensajes descriptivos en caso de error de validación.
    public function messages(): array
    {
        return [
            // Correo institucional
            'email.required' => 'El correo institucional es obligatorio.',
            'email.email' => 'Ingresa un formato de correo electrónico válido.',
            'email.ends_with' => 'El correo debe ser institucional con terminación obligatoria @unach.mx.',
            'email.unique' => 'Ya existe un usuario registrado con este correo institucional.',
            // Datos personales
            'nombre.required' => 'El nombre del alumno es obligatorio.',
            'apellido_p.required' => 'El apellido paterno es obligatorio.',
            'apellido_m.required' => 'El apellido materno es obligatorio.',
            'fecha_nacimiento.required' => 'La fecha de nacimiento es obligatoria.',
            'fecha_nacimiento.before' => 'La fecha de nacimiento no puede ser futura.',
            'sexo.required' => 'Debes seleccionar el sexo del alumno.',
            'sexo.in' => 'El sexo seleccionado no es válido.',
            'curp.required' => 'La CURP es obligatoria.',
            'curp.size' => 'La CURP debe tener exactamente 18 caracteres.',
            'curp.unique' => 'Ya existe un alumno registrado con esta CURP.',
            'matricula.required' => 'La matrícula escolar es obligatoria.',
            'matricula.unique' => 'Ya existe un alumno registrado con esta matrícula.',
            // Datos académicos
            'id_carrera.required' => 'Debes asignar una carrera al alumno.',
            'id_carrera.exists' => 'La carrera seleccionada no existe en el catálogo.',
            'turno.required' => 'Debes especificar el turno escolar.',
            'turno.in' => 'El turno debe ser Matutino, Vespertino o Mixto.',
            'fecha_ingreso.required' => 'La fecha de ingreso es obligatoria.',
            'generacion.required' => 'Debes especificar la generación escolar (ej: 2022-2026).',
        ];
    }
}
