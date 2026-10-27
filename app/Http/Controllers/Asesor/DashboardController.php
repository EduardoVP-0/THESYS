<?php

namespace App\Http\Controllers\Asesor;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\RevisionAsesor;
use App\Support\Portal\NotificacionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PANEL PRINCIPAL DEL DOCENTE
 *
 * Reúne la carga de asesoría y la participación como jurado del usuario
 * autenticado, sin exponer información de otros docentes.
 */
class DashboardController extends AsesorPortalController
{
    /**
     * Muestra el dashboard del asesor / jurado.
     */
    public function index(Request $request, NotificacionService $notificaciones): Response
    {
        $docente = $this->docente($request);

        if (! $docente) {
            return Inertia::render('asesor/dashboard/index', [
                'docente' => null,
                'perfil_incompleto' => true,
                'stats' => [
                    'asesorados' => 0,
                    'revisiones_pendientes' => 0,
                    'entregas_recientes' => 0,
                    'proyectos_liberados' => 0,
                    'examenes_proximos' => 0,
                ],
                'revisiones_pendientes' => [],
                'asesorados' => [],
                'proximos_examenes' => [],
                'grafica_revisiones' => [],
                'notificaciones' => [],
                'fecha_actual' => CarbonImmutable::now()->format('d/m/Y'),
            ]);
        }

        $asignaciones = AsignacionAsesor::query()
            ->where('id_usuario', $docente->id_usuario)
            ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
            ->with([
                'proyecto.alumnos.carrera',
                'proyecto.alumnos.user',
                'proyecto.examen',
                'proyecto.versiones.revisiones',
                'revisiones.version',
            ])
            ->get();

        $revisionesPendientes = $this->revisionesPendientes($asignaciones);
        $asesorados = $this->asesorados($asignaciones);

        $entregasRecientes = $asignaciones
            ->filter(function (AsignacionAsesor $asignacion): bool {
                $ultimaVersion = $asignacion->proyecto?->versiones->first();

                return $ultimaVersion?->created_at?->gte(now()->subDays(30)) ?? false;
            })
            ->count();

        $proyectosLiberados = $asignaciones
            ->filter(fn (AsignacionAsesor $asignacion): bool => $this->estaLiberado($asignacion))
            ->count();

        $examenes = $this->examenesProximos($docente->id_usuario);

        $todasRevisiones = $asignaciones
            ->flatMap(fn (AsignacionAsesor $asignacion): Collection => $asignacion->revisiones);

        $conteoEstados = collect(RevisionAsesor::ESTADOS)
            ->map(function (string $estado) use ($todasRevisiones): array {
                $total = $todasRevisiones
                    ->where('estado_revision', $estado)
                    ->count();

                return [
                    'estado' => $estado,
                    'total' => $total,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('asesor/dashboard/index', [
            'docente' => [
                'id_usuario' => $docente->id_usuario,
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
                'especialidad' => $docente->especialidad,
                'email' => $docente->user?->email,
            ],
            'perfil_incompleto' => false,
            'stats' => [
                'asesorados' => $asignaciones->count(),
                'revisiones_pendientes' => $revisionesPendientes->count(),
                'entregas_recientes' => $entregasRecientes,
                'proyectos_liberados' => $proyectosLiberados,
                'examenes_proximos' => $examenes->count(),
            ],
            'revisiones_pendientes' => $revisionesPendientes->take(5)->values()->all(),
            'asesorados' => array_slice($asesorados, 0, 5),
            'proximos_examenes' => $examenes->take(5)->values()->all(),
            'grafica_revisiones' => $conteoEstados,
            'notificaciones' => array_slice($notificaciones->paraDocente($docente), 0, 6),
            'fecha_actual' => CarbonImmutable::now()->format('d/m/Y'),
        ]);
    }

    /**
     * @param  Collection<int, AsignacionAsesor>  $asignaciones
     * @return Collection<int, array<string, mixed>>
     */
    private function revisionesPendientes(Collection $asignaciones): Collection
    {
        return $asignaciones
            ->flatMap(fn (AsignacionAsesor $asignacion): Collection => $asignacion->revisiones
                ->where('estado_revision', RevisionAsesor::ESTADO_PENDIENTE)
                ->map(fn (RevisionAsesor $revision): array => $this->revisionResumen($revision, $asignacion)))
            ->sortByDesc('fecha_orden')
            ->values();
    }

    /**
     * @param  Collection<int, AsignacionAsesor>  $asignaciones
     * @return array<int, array<string, mixed>>
     */
    private function asesorados(Collection $asignaciones): array
    {
        return $asignaciones
            ->map(function (AsignacionAsesor $asignacion): array {
                $proyecto = $asignacion->proyecto;
                $alumno = $proyecto?->alumnos->first();
                $ultimaVersion = $proyecto?->versiones->first();
                $pendientes = $asignacion->revisiones
                    ->where('estado_revision', RevisionAsesor::ESTADO_PENDIENTE)
                    ->count();

                return [
                    'id_proyecto' => $proyecto?->id_proyecto,
                    'id_asesor_proyecto' => $asignacion->id_asesor_proyecto,
                    'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
                    'estado' => $proyecto?->estado ?? 'Sin proyecto',
                    'estudiante' => [
                        'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                        'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                        'iniciales' => $alumno?->iniciales ?? 'NA',
                        'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera',
                    ],
                    'ultima_version' => $ultimaVersion?->numero_version,
                    'fecha_ultima_version' => $ultimaVersion?->created_at?->format('d/m/Y'),
                    'revisiones_pendientes' => $pendientes,
                    'liberado' => $this->estaLiberado($asignacion),
                    'url_revisiones' => $proyecto
                        ? route('asesor.revisiones.index', ['proyecto' => $proyecto->id_proyecto])
                        : route('asesor.revisiones.index'),
                    'url_documento' => $ultimaVersion
                        ? route('asesor.documentos.version', $ultimaVersion->id_version)
                        : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function examenesProximos(int $idDocente): Collection
    {
        return JuradoProyecto::query()
            ->where('id_usuario', $idDocente)
            ->whereHas('proyecto.examen', function ($query): void {
                $query->whereDate('fecha_examen', '>=', CarbonImmutable::today()->toDateString());
            })
            ->with(['proyecto.alumnos', 'proyecto.examen'])
            ->get()
            ->sortBy(fn (JuradoProyecto $jurado): string => (string) $jurado->proyecto?->examen?->fecha_examen)
            ->map(function (JuradoProyecto $jurado): array {
                $proyecto = $jurado->proyecto;
                $examen = $proyecto?->examen;
                $alumno = $proyecto?->alumnos->first();
                $fecha = $examen?->fecha_examen
                    ? CarbonImmutable::parse($examen->fecha_examen)
                    : null;

                return [
                    'id_examen' => $examen?->id_examen,
                    'id_proyecto' => $proyecto?->id_proyecto,
                    'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
                    'estudiante' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                    'fecha' => $fecha?->format('d/m/Y'),
                    'fecha_iso' => $fecha?->toDateString(),
                    'hora' => substr((string) $examen?->hora_examen, 0, 5),
                    'sede' => $examen?->sede ?? 'Sede por definir',
                    'cargo' => $jurado->cargo,
                    'estado_aceptacion' => $jurado->estado_aceptacion,
                ];
            })
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function revisionResumen(RevisionAsesor $revision, AsignacionAsesor $asignacion): array
    {
        $proyecto = $asignacion->proyecto;
        $alumno = $proyecto?->alumnos->first();
        $version = $revision->version;

        return [
            'id_revision' => $revision->id_revision,
            'id_version' => $version?->id_version,
            'numero_version' => $version?->numero_version,
            'id_proyecto' => $proyecto?->id_proyecto,
            'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
            'estudiante' => [
                'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                'iniciales' => $alumno?->iniciales ?? 'NA',
            ],
            'estado' => $revision->estado_revision,
            'observaciones' => $revision->observaciones,
            'fecha' => $version?->created_at?->format('d/m/Y'),
            'fecha_orden' => $version?->created_at?->toIso8601String(),
            'url_documento' => $version
                ? route('asesor.documentos.version', $version->id_version)
                : null,
            'url_revisar' => $proyecto
                ? route('asesor.revisiones.index', [
                    'proyecto' => $proyecto->id_proyecto,
                    'revision' => $revision->id_revision,
                ])
                : route('asesor.revisiones.index'),
        ];
    }

    /**
     * Un proyecto se considera liberado cuando la última versión ya recibió
     * el dictamen favorable de esta asignación de asesoría.
     */
    private function estaLiberado(AsignacionAsesor $asignacion): bool
    {
        $ultimaVersion = $asignacion->proyecto?->versiones->first();

        if (! $ultimaVersion) {
            return false;
        }

        $revisionesAsignacion = $asignacion->revisiones
            ->where('id_version', $ultimaVersion->id_version);

        return $revisionesAsignacion->isNotEmpty()
            && $revisionesAsignacion->every(
                fn (RevisionAsesor $revision): bool => $revision->estado_revision === RevisionAsesor::ESTADO_APROBADA,
            );
    }
}
