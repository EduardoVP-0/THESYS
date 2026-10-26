<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * VALIDACIÓN PARA LA ACTUALIZACIÓN DE UN ADMINISTRADOR
 */
class UpdateAdministradorRequest extends FormRequest
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
        // $this->route('administrador') resuelve el modelo ligado por Route Model Binding
        $adminId = $this->route('administrador')->id_usuario;

        return [
            // CUENTA (users)
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'ends_with:@unach.mx',
                "unique:users,email,{$adminId},id",
            ],
            'id_rol' => [
                'required',
                'integer',
                'in:2,3', // 2=Administrador, 3=Coordinacion (1=Superadmin restringido)
            ],
            // DATOS PERSONALES
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
            'email.required' => 'El correo institucional es obligatorio.',
            'email.ends_with' => 'El correo debe terminar en @unach.mx.',
            'email.unique' => 'Este correo ya está en uso por otro usuario.',
            'id_rol.required' => 'Debes seleccionar un rol para el administrador.',
            'id_rol.in' => 'El rol seleccionado no es válido para administradores.',
            'nombre.required' => 'El nombre del administrador es obligatorio.',
            'apellido_p.required' => 'El apellido paterno es obligatorio.',
            'apellido_m.required' => 'El apellido materno es obligatorio.',
            'area.required' => 'El área de adscripción es obligatoria.',
        ];
    }
}
