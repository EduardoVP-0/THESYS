<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Support\Portal\EventosCalendario;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DEL CALENDARIO ACADÉMICO (PORTAL DEL SUSTENTANTE)
 *
 * Reúne en una sola línea de tiempo los hitos del proceso de titulación:
 * envío del anteproyecto, asignación de director, revisores y jurado,
 * versiones de tesis subidas, dictámenes, programación y realización del
 * examen, y la culminación del proceso.
 */
class CalendarioController extends Controller
{
    /**
     * Muestra el calendario con el historial académico del sustentante.
     */
    public function index(Request $request): Response
    {
        $alumno = Alumno::with('carrera')->find($request->user()->id);

        $proyecto = $alumno
            ? $alumno->proyectos()
                ->with([
                    'asesores',
                    'jurados.docente',
                    'examen.sedeRelacionada',
                ])
                ->latest('tblproyectos.id_proyecto')
                ->first()
            : null;

        $eventos = $proyecto ? EventosCalendario::paraProyecto($proyecto) : [];

        return Inertia::render('Alumno/calendario/index', [
            'alumno' => $alumno ? [
                'id_usuario' => $alumno->id_usuario,
                'nombre_completo' => $alumno->nombre_completo,
                'iniciales' => $alumno->iniciales,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera ?? 'Sin carrera asignada',
            ] : null,
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'estado' => $proyecto->estado,
            ] : null,
            'hoy' => CarbonImmutable::today()->toDateString(),
            'eventos' => $eventos,
        ]);
    }
}
