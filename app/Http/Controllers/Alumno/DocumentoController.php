<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DocumentoController extends Controller
{
    /**
     * Muestra la vista principal de Mis Documentos para el alumno.
     */
    public function index(): Response
    {
        return Inertia::render('Alumno/documentos/index');
    }
}
