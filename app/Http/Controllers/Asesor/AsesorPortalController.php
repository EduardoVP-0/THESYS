<?php

namespace App\Http\Controllers\Asesor;

use App\Http\Controllers\Controller;
use App\Models\Admin\Docente;
use Illuminate\Http\Request;

/**
 * Utilidades compartidas por los controladores del portal del docente.
 */
abstract class AsesorPortalController extends Controller
{
    /**
     * Devuelve el expediente del docente autenticado.
     */
    protected function docente(Request $request): ?Docente
    {
        return Docente::query()
            ->with('user')
            ->find($request->user()?->id);
    }
}
