<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AlumnoTesisAsesorController extends Controller
{
    /**
     * Muestra la vista de Mi Tesis (Director de Tesis).
     */
    public function index(): Response
    {
        return Inertia::render('Alumno/tesis_asesor/index');
    }
}
