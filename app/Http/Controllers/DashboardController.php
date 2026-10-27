<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Redirección del panel inicial según el rol autenticado.
 */
class DashboardController extends Controller
{
    /**
     * Envía a cada usuario a su portal correspondiente.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        return match ((int) $request->user()?->id_rol) {
            4 => redirect()->route('asesor.dashboard'),
            5 => redirect()->route('alumno.dashboard'),
            default => redirect()->route('admin.dashboard'),
        };
    }
}
