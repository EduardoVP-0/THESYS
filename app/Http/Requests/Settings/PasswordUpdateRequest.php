<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use App\Models\ConfiguracionPassword;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class PasswordUpdateRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $config = ConfiguracionPassword::getActive();

        $passwordRule = Password::min($config->longitud_minima);

        if ($config->requiere_mayuscula && $config->requiere_minuscula) {
            $passwordRule->mixedCase();
        } elseif ($config->requiere_mayuscula || $config->requiere_minuscula) {
            $passwordRule->letters();
        }

        if ($config->requiere_numero) {
            $passwordRule->numbers();
        }

        if ($config->requiere_especiales) {
            $passwordRule->symbols();
        }

        $passwordRules = ['required', 'string', $passwordRule, 'confirmed'];

        if ($config->requiere_mayuscula && ! $config->requiere_minuscula) {
            $passwordRules[] = 'regex:/[A-Z]/';
        }
        if ($config->requiere_minuscula && ! $config->requiere_mayuscula) {
            $passwordRules[] = 'regex:/[a-z]/';
        }

        return [
            'current_password' => $this->currentPasswordRules(),
            'password' => $passwordRules,
        ];
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.current_password' => 'La contraseña actual no es correcta.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.',
            'password.letters' => 'La contraseña debe contener al menos una letra.',
            'password.mixed' => 'La contraseña debe contener al menos una letra mayúscula y una minúscula.',
            'password.numbers' => 'La contraseña debe contener al menos un número.',
            'password.symbols' => 'La contraseña debe contener al menos un carácter especial.',
            'password.regex' => 'La contraseña no cumple con los requisitos de mayúsculas/minúsculas.',
        ];
    }
}
