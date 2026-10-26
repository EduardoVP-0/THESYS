<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * VALIDACIÓN PARA EL REGISTRO DE UN NUEVO ADMINISTRADOR
 * Valida tanto los datos de la cuenta (users) como el expediente (tbladministradores)
 */
class StoreAdministradorRequest extends FormRequest
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
            'id_rol' => [
                'required',
                'integer',
                'in:2,3', // 2=Administrador, 3=Coordinacion (1=Superadmin restringido)
            ],
            // DATOS PERSONALES (tbladministradores)
            'nombre' => ['required', 'string', 'max:100'],
            'apellido_p' => ['required', 'string', 'max:100'],
            'apellido_m' => ['required', 'string', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'area' => ['required', 'string', 'max:150'],
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
            'id_rol.required' => 'Debes seleccionar un rol para el administrador.',
            'id_rol.in' => 'El rol seleccionado no es válido para administradores.',
            // Personales
            'nombre.required' => 'El nombre del administrador es obligatorio.',
            'apellido_p.required' => 'El apellido paterno es obligatorio.',
            'apellido_m.required' => 'El apellido materno es obligatorio.',
            'area.required' => 'El área de adscripción es obligatoria.',
        ];
    }
}
