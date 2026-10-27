<?php

namespace App\Http\Controllers\Asesor;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\RevisionAsesor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * HISTORIAL DE RETROALIMENTACIÓN EMITIDA POR EL ASESOR
 */
class RetroalimentacionController extends AsesorPortalController
{
    /**
     * Muestra el historial de observaciones registradas en las revisiones.
     */
    public function index(Request $request): Response
    {
        $docente = $this->docente($request);

        $baseQuery = RevisionAsesor::query()
            ->whereHas('asignacionAsesor', function ($query) use ($docente): void {
                $query
                    ->where('id_usuario', $docente?->id_usuario ?? 0)
                    ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO);
            })
            ->whereNotNull('observaciones')
            ->where('observaciones', '<>', '');

        $stats = [
            'total' => (clone $baseQuery)->count(),
            'con_cambios' => (clone $baseQuery)->where('estado_revision', RevisionAsesor::ESTADO_CON_CAMBIOS)->count(),
            'aprobadas' => (clone $baseQuery)->where('estado_revision', RevisionAsesor::ESTADO_APROBADA)->count(),
            'rechazadas' => (clone $baseQuery)->where('estado_revision', RevisionAsesor::ESTADO_RECHAZADA)->count(),
        ];

        $query = (clone $baseQuery)
            ->with([
                'version.proyecto.alumnos',
                'version.proyecto.alumnos.carrera',
                'asignacionAsesor.proyecto',
            ]);

        $estado = (string) $request->input('estado', 'todos');
        if ($estado !== 'todos' && in_array($estado, RevisionAsesor::ESTADOS, true)) {
            $query->where('estado_revision', $estado);
        } else {
            $estado = 'todos';
        }

        $idProyecto = $request->integer('proyecto');
        if ($idProyecto > 0) {
            $query->whereHas('version.proyecto', fn ($proyectoQuery) => $proyectoQuery->where('id_proyecto', $idProyecto));
        }

        $retroalimentaciones = $query
            ->latest('updated_at')
            ->paginate(10)
            ->withQueryString()
            ->through(function (RevisionAsesor $revision): array {
                $version = $revision->version;
                $proyecto = $revision->asignacionAsesor?->proyecto ?? $version?->proyecto;
                $alumno = $proyecto?->alumnos->first();

                return [
                    'id_revision' => $revision->id_revision,
                    'id_version' => $version?->id_version,
                    'numero_version' => $version?->numero_version,
                    'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
                    'estudiante' => [
                        'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                        'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                        'iniciales' => $alumno?->iniciales ?? 'NA',
                        'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera',
                    ],
                    'estado' => $revision->estado_revision,
                    'observaciones' => $revision->observaciones,
                    'fecha' => $revision->updated_at?->format('d/m/Y H:i'),
                    'fecha_orden' => $revision->updated_at?->toIso8601String(),
                    'url_documento' => $version
                        ? route('asesor.documentos.version', $version->id_version)
                        : null,
                ];
            });

        $proyectos = $docente
            ? AsignacionAsesor::query()
                ->where('id_usuario', $docente->id_usuario)
                ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                ->with('proyecto:id_proyecto,titulo')
                ->get()
                ->map(fn (AsignacionAsesor $asignacion): array => [
                    'id_proyecto' => $asignacion->proyecto?->id_proyecto,
                    'titulo' => $asignacion->proyecto?->titulo,
                ])
                ->filter(fn (array $proyecto): bool => $proyecto['id_proyecto'] !== null)
                ->unique('id_proyecto')
                ->values()
                ->all()
            : [];

        return Inertia::render('asesor/retroalimentacion/index', [
            'docente' => $docente ? [
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
            ] : null,
            'perfil_incompleto' => ! $docente,
            'retroalimentaciones' => $retroalimentaciones,
            'stats' => $stats,
            'proyectos' => $proyectos,
            'estados' => [
                RevisionAsesor::ESTADO_APROBADA,
                RevisionAsesor::ESTADO_CON_CAMBIOS,
                RevisionAsesor::ESTADO_RECHAZADA,
            ],
            'filters' => [
                'estado' => $estado,
                'proyecto' => $idProyecto > 0 ? (string) $idProyecto : '',
            ],
        ]);
    }
}
