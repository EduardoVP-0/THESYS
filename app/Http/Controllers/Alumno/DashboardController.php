<?php

namespace App\Http\Controllers\Alumno;

use App\Models\Admin\RevisionAsesor;
use App\Support\Portal\NotificacionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PANEL PRINCIPAL DEL SUSTENTANTE
 */
class DashboardController extends AlumnoPortalController
{
    /**
     * Muestra el resumen del proceso de titulación del alumno autenticado.
     */
    public function index(Request $request, NotificacionService $notificaciones): Response
    {
        $alumno = $this->alumno($request);
        $proyecto = $alumno
            ? $this->proyecto($alumno, [
                'asesores.user',
                'jurados.docente',
                'jurados.user',
                'examen.sedeRelacionada',
                'versiones.revisiones.asignacionAsesor.docente',
                'versiones.revisiones.asignacionAsesor.proyecto',
            ])
            : null;

        $ultimaVersion = $proyecto?->versiones->first();
        $revisiones = $proyecto
            ? $proyecto->versiones->flatMap(fn ($version) => $version->revisiones)
            : collect();
        $revisionesPendientes = $revisiones
            ->where('estado_revision', RevisionAsesor::ESTADO_PENDIENTE)
            ->count();
        $retroalimentaciones = $revisiones
            ->filter(fn (RevisionAsesor $revision): bool => filled($revision->observaciones))
            ->sortByDesc(fn (RevisionAsesor $revision): string => (string) $revision->updated_at)
            ->values();
        $retroalimentacionReciente = $retroalimentaciones->first();
        $jurados = $proyecto?->jurados ?? collect();
        $examen = $proyecto?->examen;
        $asesor = $proyecto?->asesores->first();
        $estadoLiberacion = $this->estadoLiberacion($proyecto);

        $avance = 0;
        $avance += $proyecto ? 20 : 0;
        $avance += $proyecto?->estaAprobado() ? 20 : 0;
        $avance += $asesor ? 20 : 0;
        $avance += $ultimaVersion ? 20 : 0;
        $avance += $ultimaVersion && $revisionesPendientes === 0 && $revisiones->isNotEmpty() ? 10 : 0;
        $avance += $examen ? 10 : 0;

        $conteoRevisiones = collect(RevisionAsesor::ESTADOS)
            ->map(function (string $estado) use ($revisiones): array {
                return [
                    'estado' => $estado,
                    'total' => $revisiones->where('estado_revision', $estado)->count(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('alumno/dashboard/index', [
            'alumno' => $alumno ? [
                'id_usuario' => $alumno->id_usuario,
                'nombre_completo' => $alumno->nombre_completo,
                'iniciales' => $alumno->iniciales,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera,
                'email' => $alumno->user?->email,
                'generacion' => $alumno->generacion,
                'turno' => $alumno->turno,
            ] : null,
            'perfil_incompleto' => ! $alumno,
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'resumen' => $proyecto->resumen,
                'estado' => $proyecto->estado,
                'fecha_envio' => $proyecto->fecha_envio?->format('d/m/Y'),
                'observaciones_coordinacion' => $proyecto->observaciones_coordinacion,
                'estado_liberacion' => $estadoLiberacion,
                'url_anteproyecto' => route('alumno.documentos.anteproyecto', $proyecto->id_proyecto),
            ] : null,
            'asesor' => $asesor ? [
                'nombre_completo' => $asesor->nombre_completo,
                'grado_academico' => $asesor->grado_academico,
                'especialidad' => $asesor->especialidad,
                'email' => $asesor->user?->email,
            ] : null,
            'ultima_version' => $ultimaVersion ? [
                'id_version' => $ultimaVersion->id_version,
                'numero_version' => $ultimaVersion->numero_version,
                'comentario_alumno' => $ultimaVersion->comentario_alumno,
                'fecha' => $ultimaVersion->created_at?->format('d/m/Y H:i'),
                'url_documento' => route('alumno.documentos.version', $ultimaVersion->id_version),
            ] : null,
            'retroalimentacion_reciente' => $retroalimentacionReciente ? [
                'id_revision' => $retroalimentacionReciente->id_revision,
                'estado' => $retroalimentacionReciente->estado_revision,
                'observaciones' => $retroalimentacionReciente->observaciones,
                'asesor' => $retroalimentacionReciente->asignacionAsesor?->docente?->nombre_completo,
                'fecha' => $retroalimentacionReciente->updated_at?->format('d/m/Y H:i'),
            ] : null,
            'jurado' => $jurados
                ->map(fn ($jurado): array => [
                    'id_jurado_proyecto' => $jurado->id_jurado_proyecto,
                    'cargo' => $jurado->cargo,
                    'nombre_completo' => $jurado->docente?->nombre_completo ?? $jurado->user?->name ?? 'Integrante por definir',
                    'grado_academico' => $jurado->docente?->grado_academico,
                    'estado_aceptacion' => $jurado->estado_aceptacion,
                    'es_titular' => $jurado->esTitular(),
                ])
                ->values()
                ->all(),
            'examen' => $examen ? [
                'id_examen' => $examen->id_examen,
                'fecha' => CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y'),
                'fecha_iso' => CarbonImmutable::parse($examen->fecha_examen)->toDateString(),
                'hora' => substr((string) $examen->hora_examen, 0, 5),
                'sede' => $examen->sede,
                'estado' => $examen->estado_examen,
                'resultado' => $examen->resultado_final,
            ] : null,
            'stats' => [
                'estado_proyecto' => $proyecto?->estado ?? 'Sin anteproyecto',
                'versiones' => $proyecto?->versiones->count() ?? 0,
                'revisiones_pendientes' => $revisionesPendientes,
                'retroalimentaciones' => $retroalimentaciones->count(),
                'jurados' => $jurados->count(),
                'jurados_aceptados' => $jurados->where('estado_aceptacion', 'Aceptado')->count(),
                'examen_programado' => $examen !== null,
                'avance' => min(100, $avance),
            ],
            'grafica_revisiones' => $conteoRevisiones,
            'notificaciones' => $alumno ? array_slice($notificaciones->paraAlumno($alumno), 0, 6) : [],
            'fecha_actual' => CarbonImmutable::now()->format('d/m/Y'),
            'proxima_entrega' => null,
            'ultima_entrega' => $ultimaVersion?->created_at?->format('d/m/Y'),
        ]);
    }
}
