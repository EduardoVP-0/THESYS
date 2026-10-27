<?php

namespace App\Http\Controllers\Asesor;

use App\Support\Portal\NotificacionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CENTRO DE NOTIFICACIONES DEL DOCENTE
 */
class NotificacionController extends AsesorPortalController
{
    /**
     * Muestra los avisos derivados de la actividad del docente.
     */
    public function index(Request $request, NotificacionService $notificaciones): Response
    {
        $docente = $this->docente($request);
        $todas = $notificaciones->paraDocente($docente);

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

        return Inertia::render('asesor/notificaciones/index', [
            'docente' => $docente ? [
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
            ] : null,
            'perfil_incompleto' => ! $docente,
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
