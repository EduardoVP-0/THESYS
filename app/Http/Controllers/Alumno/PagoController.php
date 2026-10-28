<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PagoController extends Controller
{
    /**
     * Muestra la vista de Pagos del alumno.
     */
    public function index(): Response
    {
        return Inertia::render('Alumno/pagos/index');
    }
}
