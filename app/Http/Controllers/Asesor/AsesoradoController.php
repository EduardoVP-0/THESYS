<?php

namespace App\Http\Controllers\Asesor;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\RevisionAsesor;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * LISTADO DE ESTUDIANTES ASIGNADOS AL ASESOR
 */
class AsesoradoController extends AsesorPortalController
{
    /**
     * Muestra las tarjetas de seguimiento de cada asesorado.
     */
    public function index(Request $request): Response
    {
        $docente = $this->docente($request);
        $busqueda = trim((string) $request->input('search', ''));
        $busquedaNormalizada = mb_strtolower(Str::ascii($busqueda));

        $asignaciones = $docente
            ? AsignacionAsesor::query()
                ->where('id_usuario', $docente->id_usuario)
                ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                ->with([
                    'proyecto.alumnos.carrera',
                    'proyecto.alumnos.user',
                    'proyecto.examen',
                    'proyecto.versiones.revisiones',
                    'revisiones.version',
                ])
                ->get()
            : collect();

        $asesorados = $asignaciones
            ->map(fn (AsignacionAsesor $asignacion): array => $this->transformarAsignacion($asignacion))
            ->when($busquedaNormalizada !== '', function (Collection $items) use ($busquedaNormalizada): Collection {
                return $items->filter(function (array $item) use ($busquedaNormalizada): bool {
                    $texto = mb_strtolower(Str::ascii(implode(' ', [
                        $item['titulo'],
                        $item['estudiante']['nombre_completo'],
                        $item['estudiante']['matricula'],
                        $item['estudiante']['carrera'],
                    ])));

                    return str_contains($texto, $busquedaNormalizada);
                });
            })
            ->sortBy(fn (array $item): string => Str::ascii($item['estudiante']['nombre_completo']))
            ->values();

        return Inertia::render('asesor/asesorados/index', [
            'docente' => $docente ? [
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
            ] : null,
            'perfil_incompleto' => ! $docente,
            'asesorados' => $asesorados->all(),
            'stats' => [
                'total' => $asesorados->count(),
                'con_pendientes' => $asesorados->where('revisiones_pendientes', '>', 0)->count(),
                'liberados' => $asesorados->where('liberado', true)->count(),
                'con_examen' => $asesorados->where('examen.programado', true)->count(),
            ],
            'filters' => [
                'search' => $busqueda,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformarAsignacion(AsignacionAsesor $asignacion): array
    {
        $proyecto = $asignacion->proyecto;
        $alumno = $proyecto?->alumnos->first();
        $ultimaVersion = $proyecto?->versiones->first();
        $revisionesAsignacion = $asignacion->revisiones;
        $pendientes = $revisionesAsignacion
            ->where('estado_revision', RevisionAsesor::ESTADO_PENDIENTE)
            ->count();
        $liberado = $ultimaVersion !== null
            && $revisionesAsignacion
                ->where('id_version', $ultimaVersion->id_version)
                ->isNotEmpty()
            && $revisionesAsignacion
                ->where('id_version', $ultimaVersion->id_version)
                ->every(fn (RevisionAsesor $revision): bool => $revision->estado_revision === RevisionAsesor::ESTADO_APROBADA);

        $conCambios = $revisionesAsignacion
            ->whereIn('estado_revision', [RevisionAsesor::ESTADO_CON_CAMBIOS, RevisionAsesor::ESTADO_RECHAZADA])
            ->isNotEmpty();

        $estadoLiberacion = match (true) {
            $liberado => 'Liberada',
            $pendientes > 0 => 'En revisión',
            $conCambios => 'Con observaciones',
            $ultimaVersion === null => 'Sin versión',
            default => 'En proceso',
        };

        $avance = 20;
        $avance += $proyecto?->estaAprobado() ? 20 : 0;
        $avance += $ultimaVersion ? 20 : 0;
        $avance += $ultimaVersion && $pendientes === 0 ? 20 : 0;
        $avance += $liberado ? 20 : 0;

        $examen = $proyecto?->examen;

        return [
            'id_proyecto' => $proyecto?->id_proyecto,
            'id_asesor_proyecto' => $asignacion->id_asesor_proyecto,
            'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
            'resumen' => $proyecto?->resumen,
            'estado' => $proyecto?->estado ?? 'Sin proyecto',
            'fecha_envio' => $proyecto?->fecha_envio?->format('d/m/Y'),
            'estudiante' => [
                'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                'iniciales' => $alumno?->iniciales ?? 'NA',
                'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera',
                'email' => $alumno?->user?->email,
            ],
            'ultima_version' => $ultimaVersion?->numero_version,
            'fecha_ultima_version' => $ultimaVersion?->created_at?->format('d/m/Y'),
            'versiones_count' => $proyecto?->versiones->count() ?? 0,
            'revisiones_pendientes' => $pendientes,
            'liberado' => $liberado,
            'estado_liberacion' => $estadoLiberacion,
            'avance' => min(100, $avance),
            'examen' => [
                'programado' => $examen !== null,
                'fecha' => $examen?->fecha_examen
                    ? CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y')
                    : null,
                'hora' => substr((string) $examen?->hora_examen, 0, 5),
                'sede' => $examen?->sede,
                'resultado' => $examen?->resultado_final,
            ],
            'url_revisiones' => $proyecto
                ? route('asesor.revisiones.index', ['proyecto' => $proyecto->id_proyecto])
                : route('asesor.revisiones.index'),
            'url_retroalimentacion' => $proyecto
                ? route('asesor.retroalimentacion.index', ['proyecto' => $proyecto->id_proyecto])
                : route('asesor.retroalimentacion.index'),
            'url_anteproyecto' => $proyecto
                ? route('asesor.documentos.anteproyecto', $proyecto->id_proyecto)
                : null,
            'url_ultima_version' => $ultimaVersion
                ? route('asesor.documentos.version', $ultimaVersion->id_version)
                : null,
        ];
    }
}
