<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string|int  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        if (! $request->user()->estado) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Tu cuenta ha sido suspendida. Contacta al administrador del sistema.',
            ]);
        }

        $userRolID = (string) $request->user()->id_rol;

        // Comprobar si el rol del usuario está entre lod permitidos para esta ruta
        if (! in_array($userRolID, $roles, true)) {
            abort(403, 'Acceso denegado');
        }

        return $next($request);
    }
}
