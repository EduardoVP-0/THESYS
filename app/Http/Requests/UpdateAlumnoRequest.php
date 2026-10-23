<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * VALIDACIÓN PARA LA ACTUALIZACIÓN DE UN ALUMNO
 * Ignora los registros del propio alumno al validar campos únicos (email, matrícula, CURP).
 */
class UpdateAlumnoRequest extends FormRequest
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
        // Obtenemos el ID del alumno o usuario enviado en la ruta (ej: /admin/alumnos/{alumno})
        $alumnoParam = $this->route('alumno');
        $idUsuario = is_object($alumnoParam)
            ? ($alumnoParam->id_usuario ?? $alumnoParam->id)
            : $alumnoParam;

        return [
            // Correo en tabla users: se ignora su propio ID
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'ends_with:@unach.mx',
                Rule::unique('users', 'email')->ignore($idUsuario, 'id'),
            ],
            // Datos personales
            'nombre' => ['required', 'string', 'max:100'],
            'apellido_p' => ['required', 'string', 'max:100'],
            'apellido_m' => ['required', 'string', 'max:100'],
            'fecha_nacimiento' => ['required', 'date', 'before:today'],
            'sexo' => ['required', 'string', 'in:Masculino,Femenino,Otro'],
            'curp' => [
                'required',
                'string',
                'size:18',
                Rule::unique('tblalumnos', 'curp')->ignore($idUsuario, 'id_usuario'),
            ],
            'telefono' => ['nullable', 'string', 'max:20'],
            'matricula' => [
                'required',
                'string',
                'max:10',
                Rule::unique('tblalumnos', 'matricula')->ignore($idUsuario, 'id_usuario'),
            ],
            // Dirección
            'calle' => ['nullable', 'string', 'max:150'],
            'colonia' => ['nullable', 'string', 'max:100'],
            'codigo_postal' => ['nullable', 'string', 'max:10'],
            // Datos académicos
            'id_carrera' => ['required', 'integer', 'exists:tblcarreras,id_carrera'],
            'turno' => ['required', 'string', 'in:Matutino,Vespertino,Mixto'],
            'fecha_ingreso' => ['required', 'date'],
            'generacion' => ['required', 'string', 'max:50'],
            'estado_academico' => ['required', 'string', 'in:Activo,Egresado,Baja temporal,Baja definitiva'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'El correo institucional es obligatorio.',
            'email.email' => 'Ingresa un formato de correo electrónico válido.',
            'email.ends_with' => 'El correo debe ser institucional con terminación obligatoria @unach.mx.',
            'email.unique' => 'Ya existe otro usuario registrado con este correo institucional.',
            'nombre.required' => 'El nombre del alumno es obligatorio.',
            'apellido_p.required' => 'El apellido paterno es obligatorio.',
            'apellido_m.required' => 'El apellido materno es obligatorio.',
            'fecha_nacimiento.required' => 'La fecha de nacimiento es obligatoria.',
            'sexo.required' => 'Debes seleccionar el sexo del alumno.',
            'curp.required' => 'La CURP es obligatoria.',
            'curp.size' => 'La CURP debe tener exactamente 18 caracteres.',
            'curp.unique' => 'Ya existe otro alumno registrado con esta CURP.',
            'matricula.required' => 'La matrícula escolar es obligatoria.',
            'matricula.unique' => 'Ya existe otro alumno registrado con esta matrícula.',
            'id_carrera.required' => 'Debes asignar una carrera al alumno.',
            'id_carrera.exists' => 'La carrera seleccionada no existe en el catálogo.',
            'turno.required' => 'Debes especificar el turno escolar.',
            'fecha_ingreso.required' => 'La fecha de ingreso es obligatoria.',
            'generacion.required' => 'Debes especificar la generación escolar.',
        ];
    }
}
