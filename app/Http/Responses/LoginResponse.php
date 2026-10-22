<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * @param  Request  $request
     */
    public function toResponse($request): Response
    {
        $roleId = $request->user()?->id_rol;

        return match ($roleId) {
            1, 2, 3 => redirect()->intended(route('admin.dashboard')), // Superadmin y Admin van a su módulo
            4 => redirect()->intended(route('asesor.dashboard')),   // Para cuando agregues asesor
            5 => redirect()->intended(route('alumno.dashboard')),   // Para cuando agregues alumno
            default => redirect()->intended('/dashboard'),
        };
    }
}
