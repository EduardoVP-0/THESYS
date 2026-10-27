<?php

namespace App\Http\Controllers\Asesor;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\RevisionAsesor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PERFIL Y TRAYECTORIA DEL DOCENTE
 */
class PerfilController extends AsesorPortalController
{
    /**
     * Muestra los datos personales y el historial de asesorías.
     */
    public function index(Request $request): Response
    {
        $docente = $this->docente($request);

        $asignaciones = $docente
            ? AsignacionAsesor::query()
                ->where('id_usuario', $docente->id_usuario)
                ->with([
                    'proyecto.alumnos',
                    'proyecto.alumnos.carrera',
                    'proyecto.versiones.revisiones',
                    'revisiones.version',
                ])
                ->latest('created_at')
                ->get()
            : collect();

        $asesorados = $asignaciones
            ->map(function (AsignacionAsesor $asignacion): array {
                $proyecto = $asignacion->proyecto;
                $alumno = $proyecto?->alumnos->first();
                $ultimaVersion = $proyecto?->versiones->first();
                $revisiones = $asignacion->revisiones;

                return [
                    'id_proyecto' => $proyecto?->id_proyecto,
                    'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
                    'estado' => $proyecto?->estado ?? 'Sin proyecto',
                    'estado_asignacion' => $asignacion->estado_asignacion,
                    'periodo' => $asignacion->created_at?->format('d/m/Y'),
                    'estudiante' => [
                        'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                        'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                        'iniciales' => $alumno?->iniciales ?? 'NA',
                        'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera',
                    ],
                    'ultima_version' => $ultimaVersion?->numero_version,
                    'revisiones_realizadas' => $revisiones
                        ->whereIn('estado_revision', RevisionAsesor::ESTADOS_FINALES)
                        ->count(),
                ];
            })
            ->values()
            ->all();

        $revisionesDocente = $asignaciones
            ->flatMap(fn (AsignacionAsesor $asignacion) => $asignacion->revisiones);

        return Inertia::render('asesor/perfil/index', [
            'docente' => $docente ? [
                'id_usuario' => $docente->id_usuario,
                'nombre' => $docente->nombre,
                'apellido_p' => $docente->apellido_p,
                'apellido_m' => $docente->apellido_m,
                'nombre_completo' => $docente->nombre_completo,
                'iniciales' => $docente->iniciales,
                'grado_academico' => $docente->grado_academico,
                'abreviatura_grado' => $docente->abreviatura_grado,
                'especialidad' => $docente->especialidad,
                'tipo_contrato' => $docente->tipo_contrato,
                'cedula_profesional' => $docente->cedula_profesional,
                'curp' => $docente->curp,
                'telefono' => $docente->telefono,
                'email' => $docente->user?->email,
                'estado' => $docente->estado,
            ] : null,
            'perfil_incompleto' => ! $docente,
            'asesorados' => $asesorados,
            'stats' => [
                'asesorados' => $asignaciones->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)->count(),
                'proyectos_historicos' => count($asesorados),
                'revisiones' => $revisionesDocente->count(),
                'revisiones_aprobadas' => $revisionesDocente
                    ->where('estado_revision', RevisionAsesor::ESTADO_APROBADA)
                    ->count(),
            ],
        ]);
    }
}
