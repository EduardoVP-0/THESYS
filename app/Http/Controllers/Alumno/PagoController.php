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

    /**
     * Muestra el formulario para realizar / registrar un nuevo pago.
     */
    public function create(): Response
    {
        return Inertia::render('Alumno/pagos/create-pago');
    }
}
