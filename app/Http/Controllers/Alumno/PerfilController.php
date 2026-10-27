<?php

namespace App\Http\Controllers\Alumno;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PERFIL Y HISTORIAL ACADÉMICO DEL SUSTENTANTE
 */
class PerfilController extends AlumnoPortalController
{
    /**
     * Muestra los datos personales y el historial de proyectos del alumno.
     */
    public function index(Request $request): Response
    {
        $alumno = $this->alumno($request);

        $proyectos = $alumno
            ? $alumno->proyectos()
                ->with([
                    'asesores.user',
                    'jurados.docente',
                    'examen',
                    'versiones.revisiones',
                ])
                ->withCount('versiones')
                ->latest('tblproyectos.created_at')
                ->get()
            : collect();

        $historial = $proyectos
            ->map(function ($proyecto): array {
                $revisiones = $proyecto->versiones
                    ->flatMap(fn (VersionTesis $version) => $version->revisiones);
                $asesor = $proyecto->asesores->first();

                return [
                    'id_proyecto' => $proyecto->id_proyecto,
                    'titulo' => $proyecto->titulo,
                    'estado' => $proyecto->estado,
                    'fecha_envio' => $proyecto->fecha_envio?->format('d/m/Y'),
                    'versiones' => $proyecto->versiones_count,
                    'revisiones' => $revisiones->count(),
                    'revisiones_aprobadas' => $revisiones
                        ->where('estado_revision', RevisionAsesor::ESTADO_APROBADA)
                        ->count(),
                    'asesor' => $asesor ? [
                        'nombre_completo' => $asesor->nombre_completo,
                        'grado_academico' => $asesor->grado_academico,
                    ] : null,
                    'jurados' => $proyecto->jurados->count(),
                    'examen' => $proyecto->examen?->estado_examen,
                    'resultado' => $proyecto->examen?->resultado_final,
                ];
            })
            ->values()
            ->all();

        $todasLasVersiones = $proyectos->flatMap(
            fn ($proyecto) => $proyecto->versiones,
        );
        $todasLasRevisiones = $todasLasVersiones->flatMap(
            fn (VersionTesis $version) => $version->revisiones,
        );

        return Inertia::render('alumno/perfil/index', [
            'alumno' => $alumno ? [
                'id_usuario' => $alumno->id_usuario,
                'nombre' => $alumno->nombre,
                'apellido_p' => $alumno->apellido_p,
                'apellido_m' => $alumno->apellido_m,
                'nombre_completo' => $alumno->nombre_completo,
                'iniciales' => $alumno->iniciales,
                'matricula' => $alumno->matricula,
                'curp' => $alumno->curp,
                'telefono' => $alumno->telefono,
                'email' => $alumno->user?->email,
                'fecha_nacimiento' => $alumno->fecha_nacimiento?->format('d/m/Y'),
                'sexo' => $alumno->sexo,
                'calle' => $alumno->calle,
                'colonia' => $alumno->colonia,
                'codigo_postal' => $alumno->codigo_postal,
                'turno' => $alumno->turno,
                'fecha_ingreso' => $alumno->fecha_ingreso?->format('d/m/Y'),
                'generacion' => $alumno->generacion,
                'estado_academico' => $alumno->estado_academico,
                'carrera' => $alumno->carrera?->nombre_carrera,
                'duracion_semestres' => $alumno->carrera?->duracion_semestres,
            ] : null,
            'perfil_incompleto' => ! $alumno,
            'historial' => $historial,
            'stats' => [
                'proyectos' => count($historial),
                'versiones' => $todasLasVersiones->count(),
                'revisiones' => $todasLasRevisiones->count(),
                'revisiones_aprobadas' => $todasLasRevisiones
                    ->where('estado_revision', RevisionAsesor::ESTADO_APROBADA)
                    ->count(),
                'asesor_activo' => $proyectos->contains(
                    fn ($proyecto): bool => $proyecto->asesores->contains(
                        fn ($asesor): bool => $asesor->pivot?->estado_asignacion === AsignacionAsesor::ESTADO_ACTIVO,
                    ),
                ),
                'examen_programado' => $proyectos->contains(
                    fn ($proyecto): bool => $proyecto->examen !== null,
                ),
            ],
        ]);
    }
}
