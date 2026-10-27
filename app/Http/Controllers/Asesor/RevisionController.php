<?php

namespace App\Http\Controllers\Asesor;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\RevisionAsesor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * BANDEJA DE REVISIONES Y DICTÁMENES DEL ASESOR
 */
class RevisionController extends AsesorPortalController
{
    /**
     * Muestra las versiones que el asesor debe revisar o ya dictaminó.
     */
    public function index(Request $request): Response
    {
        $docente = $this->docente($request);

        $baseQuery = RevisionAsesor::query()
            ->whereHas('asignacionAsesor', function ($query) use ($docente): void {
                $query
                    ->where('id_usuario', $docente?->id_usuario ?? 0)
                    ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO);
            });

        $stats = [
            'pendientes' => (clone $baseQuery)->where('estado_revision', RevisionAsesor::ESTADO_PENDIENTE)->count(),
            'aprobadas' => (clone $baseQuery)->where('estado_revision', RevisionAsesor::ESTADO_APROBADA)->count(),
            'con_cambios' => (clone $baseQuery)->where('estado_revision', RevisionAsesor::ESTADO_CON_CAMBIOS)->count(),
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

        $busqueda = trim((string) $request->input('search', ''));
        if ($busqueda !== '') {
            $busquedaNormalizada = '%'.mb_strtolower($busqueda).'%';

            $query->whereHas('version.proyecto', function ($proyectoQuery) use ($busquedaNormalizada): void {
                $proyectoQuery
                    ->whereRaw('LOWER(titulo) LIKE ?', [$busquedaNormalizada])
                    ->orWhereHas('alumnos', function ($alumnoQuery) use ($busquedaNormalizada): void {
                        $alumnoQuery
                            ->whereRaw('LOWER(nombre) LIKE ?', [$busquedaNormalizada])
                            ->orWhereRaw('LOWER(apellido_p) LIKE ?', [$busquedaNormalizada])
                            ->orWhereRaw('LOWER(apellido_m) LIKE ?', [$busquedaNormalizada])
                            ->orWhereRaw('LOWER(matricula) LIKE ?', [$busquedaNormalizada]);
                    });
            });
        }

        $revisiones = $query
            ->latest('updated_at')
            ->paginate(8)
            ->withQueryString()
            ->through(fn (RevisionAsesor $revision): array => $this->transformarRevision($revision));

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

        return Inertia::render('asesor/revisiones/index', [
            'docente' => $docente ? [
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
            ] : null,
            'perfil_incompleto' => ! $docente,
            'revisiones' => $revisiones,
            'stats' => $stats,
            'proyectos' => $proyectos,
            'estados' => [
                RevisionAsesor::ESTADO_PENDIENTE,
                RevisionAsesor::ESTADO_APROBADA,
                RevisionAsesor::ESTADO_CON_CAMBIOS,
                RevisionAsesor::ESTADO_RECHAZADA,
            ],
            'filters' => [
                'search' => $busqueda,
                'estado' => $estado,
                'proyecto' => $idProyecto > 0 ? (string) $idProyecto : '',
                'revision' => $request->integer('revision') ?: null,
            ],
        ]);
    }

    /**
     * Registra el dictamen del asesor sobre una versión.
     */
    public function update(Request $request, RevisionAsesor $revision): RedirectResponse
    {
        $revision->loadMissing('asignacionAsesor');
        $asignacion = $revision->asignacionAsesor;

        abort_unless(
            $asignacion
                && $asignacion->id_usuario === $request->user()?->id
                && $asignacion->estado_asignacion === AsignacionAsesor::ESTADO_ACTIVO,
            403,
            'No tienes permiso para dictaminar esta revisión.',
        );

        $validated = $request->validate([
            'estado_revision' => [
                'required',
                'string',
                Rule::in([
                    RevisionAsesor::ESTADO_APROBADA,
                    RevisionAsesor::ESTADO_CON_CAMBIOS,
                    RevisionAsesor::ESTADO_RECHAZADA,
                ]),
            ],
            'observaciones' => [
                'required_unless:estado_revision,'.RevisionAsesor::ESTADO_APROBADA,
                'nullable',
                'string',
                'min:5',
                'max:2000',
            ],
        ], [
            'estado_revision.required' => 'Selecciona el resultado de la revisión.',
            'estado_revision.in' => 'El resultado seleccionado no es válido.',
            'observaciones.required_unless' => 'Describe los cambios o motivos del rechazo para orientar al sustentante.',
            'observaciones.min' => 'La retroalimentación debe contener al menos 5 caracteres.',
        ]);

        $revision->update([
            'estado_revision' => $validated['estado_revision'],
            'observaciones' => $validated['observaciones'] ?? null,
        ]);

        return redirect()
            ->route('asesor.revisiones.index')
            ->with('success', 'La revisión se guardó correctamente.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformarRevision(RevisionAsesor $revision): array
    {
        $version = $revision->version;
        $proyecto = $revision->asignacionAsesor?->proyecto ?? $version?->proyecto;
        $alumno = $proyecto?->alumnos->first();

        return [
            'id_revision' => $revision->id_revision,
            'id_version' => $version?->id_version,
            'numero_version' => $version?->numero_version,
            'comentario_alumno' => $version?->comentario_alumno,
            'id_proyecto' => $proyecto?->id_proyecto,
            'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
            'estudiante' => [
                'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                'iniciales' => $alumno?->iniciales ?? 'NA',
                'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera',
            ],
            'fecha_entrega' => $version?->created_at?->format('d/m/Y H:i'),
            'fecha_orden' => $version?->created_at?->toIso8601String(),
            'estado' => $revision->estado_revision,
            'observaciones' => $revision->observaciones,
            'url_documento' => $version
                ? route('asesor.documentos.version', $version->id_version)
                : null,
        ];
    }
}
