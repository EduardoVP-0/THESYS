<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Muestra el dashboard inicial del alumno (sin datos de base de datos por ahora).
     */
    public function index(): Response
    {
        return Inertia::render('Alumno/dashboard');
    }
}
