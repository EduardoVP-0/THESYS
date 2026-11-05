<?php

namespace App\Http\Controllers\Docente;

use App\Http\Controllers\Controller;
use App\Support\Portal\EventosCalendarioDocente;
use App\Support\Portal\RolesDocente;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CALENDARIO DEL DOCENTE
 *
 * Presenta en una sola agenda los eventos de Asesor, Revisor y Jurado que
 * corresponden al docente autenticado. La vista es de solo lectura y el
 * detalle de cada fecha se consulta desde el modal del calendario.
 */
class CalendarioController extends Controller
{
    /**
     * Muestra el calendario con las funciones activas del docente.
     */
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;
        $roles = RolesDocente::disponibles($userId);

        return Inertia::render('docentes/calendario/index', [
            'roles_disponibles' => $roles,
            'eventos' => EventosCalendarioDocente::paraDocente($userId, $roles),
            'hoy' => CarbonImmutable::today()->toDateString(),
        ]);
    }
}
