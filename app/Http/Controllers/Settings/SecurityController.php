<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Models\ConfiguracionPassword;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    /**
     * Show the user's security settings page.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $config = ConfiguracionPassword::getActive();

        $rule = Password::min($config->longitud_minima);

        if ($config->requiere_mayuscula && $config->requiere_minuscula) {
            $rule->mixedCase();
        }
        if ($config->requiere_numero) {
            $rule->numbers();
        }
        if ($config->requiere_especiales) {
            $rule->symbols();
        }

        $props = [
            'passwordRules' => $rule->toPasswordRulesString(),
            'isSuperAdmin' => ((int) $request->user()->id_rol) === 1,
            'politicas' => [
                'longitud_minima' => (int) $config->longitud_minima,
                'requiere_mayuscula' => (bool) $config->requiere_mayuscula,
                'requiere_minuscula' => (bool) $config->requiere_minuscula,
                'requiere_numero' => (bool) $config->requiere_numero,
                'requiere_especiales' => (bool) $config->requiere_especiales,
                'caracteres_especiales' => (string) ($config->caracteres_especiales ?: '!@#$%^&*()_+-=[]{}|;:,.<>?'),
            ],
        ];

        return Inertia::render('settings/security', $props);
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }

    /**
     * Update password security policies in the database (Solo SuperAdmin).
     */
    public function updatePolicy(Request $request): RedirectResponse
    {
        if (((int) $request->user()->id_rol) !== 1) {
            abort(403, 'Solo el Superadministrador puede modificar las políticas de contraseña.');
        }

        $validated = $request->validate([
            'longitud_minima' => ['required', 'integer', 'min:4', 'max:32'],
            'requiere_mayuscula' => ['required', 'boolean'],
            'requiere_minuscula' => ['required', 'boolean'],
            'requiere_numero' => ['required', 'boolean'],
            'requiere_especiales' => ['required', 'boolean'],
            'caracteres_especiales' => ['nullable', 'string', 'max:255'],
        ]);

        $config = ConfiguracionPassword::getActive();
        $config->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Políticas de contraseña actualizadas con éxito.',
        ]);

        return back();
    }
}
