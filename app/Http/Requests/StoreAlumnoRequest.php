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
            'nombre' => ['required', 'string', 'max:100', 'regex:/^[\pL\s]+$/u'],
            'apellido_p' => ['required', 'string', 'max:100', 'regex:/^[\pL\s]+$/u'],
            'apellido_m' => ['required', 'string', 'max:100', 'regex:/^[\pL\s]+$/u'],
            'fecha_nacimiento' => ['required', 'date', 'before:today'],
            'sexo' => ['required', 'string', 'in:Masculino,Femenino,Otro'],
            'curp' => [
                'required',
                'string',
                'size:18',
                'regex:/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i',
                'unique:tblalumnos,curp',
            ],
            'telefono' => ['nullable', 'string', 'digits:10'],
            'matricula' => [
                'required',
                'string',
                'max:10',
                'regex:/^[A-Z0-9]+$/i',
                'unique:tblalumnos,matricula',
            ],
            // DOMICILIO (tblalumnos)
            'calle' => ['nullable', 'string', 'max:150'],
            'colonia' => ['nullable', 'string', 'max:100'],
            'codigo_postal' => ['nullable', 'string', 'digits:5'],
            // DATOS ACADEMICOS (tblalumnos)
            // La carrera debe existir en la tabla tblcarreras
            'id_carrera' => ['required', 'integer', 'exists:tblcarreras,id_carrera'],
            'turno' => ['required', 'string', 'in:Matutino,Vespertino,Mixto'],
            'fecha_ingreso' => ['required', 'date'],
            'generacion' => [
                'required',
                'string',
                'regex:/^\d{4}-\d{4}$/',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_string($value) && preg_match('/^(\d{4})-(\d{4})$/', $value, $matches)) {
                        if ((int) $matches[2] < (int) $matches[1]) {
                            $fail('El año de término de la generación no puede ser menor al año de inicio.');
                        }
                    }
                },
            ],
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
            'nombre.regex' => 'El nombre solo puede contener letras y espacios.',
            'apellido_p.required' => 'El apellido paterno es obligatorio.',
            'apellido_p.regex' => 'El apellido paterno solo puede contener letras y espacios.',
            'apellido_m.required' => 'El apellido materno es obligatorio.',
            'apellido_m.regex' => 'El apellido materno solo puede contener letras y espacios.',
            'fecha_nacimiento.required' => 'La fecha de nacimiento es obligatoria.',
            'fecha_nacimiento.before' => 'La fecha de nacimiento no puede ser futura.',
            'sexo.required' => 'Debes seleccionar el sexo del alumno.',
            'sexo.in' => 'El sexo seleccionado no es válido.',
            'curp.required' => 'La CURP es obligatoria.',
            'curp.size' => 'La CURP debe tener exactamente 18 caracteres.',
            'curp.regex' => 'El formato de la CURP no es válido (ej: ABCD010203HDFRRN09).',
            'curp.unique' => 'Ya existe un alumno registrado con esta CURP.',
            'telefono.digits' => 'El teléfono debe contener exactamente 10 dígitos numéricos.',
            'matricula.required' => 'La matrícula escolar es obligatoria.',
            'matricula.regex' => 'La matrícula solo puede contener letras y números sin espacios.',
            'matricula.unique' => 'Ya existe un alumno registrado con esta matrícula.',
            'calle.max' => 'La calle y número no pueden exceder 150 caracteres.',
            'colonia.max' => 'La colonia no puede exceder 100 caracteres.',
            'codigo_postal.digits' => 'El código postal debe contener exactamente 5 dígitos numéricos.',
            // Datos académicos
            'id_carrera.required' => 'Debes asignar una carrera al alumno.',
            'id_carrera.exists' => 'La carrera seleccionada no existe en el catálogo.',
            'turno.required' => 'Debes especificar el turno escolar.',
            'turno.in' => 'El turno debe ser Matutino, Vespertino o Mixto.',
            'fecha_ingreso.required' => 'La fecha de ingreso es obligatoria.',
            'generacion.required' => 'Debes especificar la generación escolar (ej: 2022-2026).',
            'generacion.regex' => 'La generación debe tener el formato YYYY-YYYY sin espacios (ej: 2022-2026).',
        ];
    }
}
