<?php

namespace App\Http\Controllers\Alumno;

use App\Support\Portal\NotificacionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CENTRO DE NOTIFICACIONES DEL SUSTENTANTE
 */
class NotificacionController extends AlumnoPortalController
{
    /**
     * Muestra los avisos derivados de la actividad del expediente.
     */
    public function index(Request $request, NotificacionService $notificaciones): Response
    {
        $alumno = $this->alumno($request);
        $todas = $notificaciones->paraAlumno($alumno);

        $tipo = (string) $request->input('tipo', 'todas');
        $tiposValidos = ['todas', 'info', 'success', 'warning', 'danger'];

        if (! in_array($tipo, $tiposValidos, true)) {
            $tipo = 'todas';
        }

        $filtradas = $tipo === 'todas'
            ? $todas
            : array_values(array_filter(
                $todas,
                fn (array $notificacion): bool => ($notificacion['tipo'] ?? null) === $tipo,
            ));

        return Inertia::render('alumno/notificaciones/index', [
            'alumno' => $alumno ? [
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera,
            ] : null,
            'perfil_incompleto' => ! $alumno,
            'notificaciones' => $filtradas,
            'stats' => [
                'total' => count($todas),
                'info' => collect($todas)->where('tipo', 'info')->count(),
                'warning' => collect($todas)->where('tipo', 'warning')->count(),
                'success' => collect($todas)->where('tipo', 'success')->count(),
                'danger' => collect($todas)->where('tipo', 'danger')->count(),
            ],
            'filters' => [
                'tipo' => $tipo,
            ],
            'nota' => 'Estos avisos se generan a partir de la actividad registrada. El sistema aún no cuenta con una tabla de notificaciones con estado leído/no leído.',
        ]);
    }
}
