<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AsignarAsesorRequest;
use App\Models\Admin\Alumno;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Docente;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE ASIGNACIÓN DE ASESORES
 *
 * Permite vincular o reasignar un asesor académico a los anteproyectos aprobados.
 */
class AsignacionAsesorController extends Controller
{
    /**
     * Muestra los sustentantes con anteproyecto aprobado y los docentes disponibles.
     */
    public function index(): Response
    {
        $solicitudes = Alumno::query()
            ->with([
                'carrera:id_carrera,nombre_carrera',
                'proyectos' => function ($query) {
                    $query
                        ->whereIn('tblproyectos.estado', Proyecto::ESTADOS_APROBADOS)
                        ->with([
                            'asesores' => function ($asesores) {
                                $asesores->wherePivot(
                                    'estado_asignacion',
                                    AsignacionAsesor::ESTADO_ACTIVO,
                                );
                            },
                            'revisores' => function ($revisores) {
                                $revisores->wherePivot('estado_asignacion', 'Activo');
                            },
                            'jurados',
                            'examen',
                        ])
                        ->orderBy('tblproyectos.titulo');
                },
            ])
            ->whereHas('proyectos', function ($query) {
                $query->whereIn('tblproyectos.estado', Proyecto::ESTADOS_APROBADOS);
            })
            ->orderBy('apellido_p')
            ->orderBy('apellido_m')
            ->orderBy('nombre')
            ->get()
            ->map(function (Alumno $alumno): ?array {
                $proyecto = $alumno->proyectos->first();

                if (! $proyecto) {
                    return null;
                }

                $asesorActual = $proyecto->asesores->first();
                $examenConcluido = $proyecto->examen?->estado_examen === ExamenProfesional::ESTADO_REALIZADO;
                $revisoresIds = $proyecto->revisores
                    ->pluck('id_usuario')
                    ->map(fn ($id): int => (int) $id)
                    ->values()
                    ->all();
                $presidenteJurado = $proyecto->jurados
                    ->firstWhere('cargo', JuradoProyecto::CARGO_PRESIDENTE);

                return [
                    'id_alumno' => $alumno->id_usuario,
                    'id_proyecto' => $proyecto->id_proyecto,
                    'alumno' => [
                        'nombre_completo' => $alumno->nombre_completo,
                        'matricula' => $alumno->matricula,
                        'carrera' => $alumno->carrera?->nombre_carrera,
                    ],
                    'proyecto' => [
                        'id_proyecto' => $proyecto->id_proyecto,
                        'titulo' => $proyecto->titulo,
                        'resumen' => $proyecto->resumen,
                        'estado' => $proyecto->estado,
                    ],
                    'asesor_actual' => $asesorActual ? [
                        'id_usuario' => $asesorActual->id_usuario,
                        'nombre_completo' => $asesorActual->nombre_completo,
                    ] : null,
                    'revisores_ids' => $revisoresIds,
                    'presidente_jurado_id' => $presidenteJurado ? (int) $presidenteJurado->id_usuario : null,
                    'bloqueado' => $examenConcluido,
                ];
            })
            ->filter()
            ->sortBy(fn (array $item): int => $item['asesor_actual'] === null ? 0 : 1)
            ->values();

        $asesores = Docente::query()
            ->with('user:id,estado')
            ->where('estado', true)
            ->whereHas('user', function ($query) {
                $query->where('estado', true);
            })
            ->withCount([
                'proyectosAsesorados as carga_actual' => function ($query) {
                    $query->where(
                        'tblasesores_proyectos.estado_asignacion',
                        AsignacionAsesor::ESTADO_ACTIVO,
                    );
                },
            ])
            ->orderBy('apellido_p')
            ->orderBy('apellido_m')
            ->orderBy('nombre')
            ->get()
            ->map(function (Docente $docente): array {
                $cargaActual = (int) $docente->carga_actual;

                return [
                    'id_usuario' => $docente->id_usuario,
                    'nombre_completo' => $docente->nombre_completo,
                    'iniciales' => $docente->iniciales,
                    'especialidad' => $docente->especialidad,
                    'grado_academico' => $docente->grado_academico,
                    'carga_actual' => $cargaActual,
                    'carga_maxima' => AsignacionAsesor::MAX_PROYECTOS_ACTIVOS_POR_ASESOR,
                    'disponible' => $cargaActual < AsignacionAsesor::MAX_PROYECTOS_ACTIVOS_POR_ASESOR,
                ];
            })
            ->sortBy('nombre_completo')
            ->sortByDesc('disponible')
            ->values();

        return Inertia::render('admin/asignaciones/asesores/index', [
            'solicitudes' => $solicitudes,
            'asesores' => $asesores,
        ]);
    }

    /**
     * Registra o actualiza la asignación de un asesor a un anteproyecto aprobado.
     */
    public function store(AsignarAsesorRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $esReasignacion = false;

        DB::transaction(function () use ($validated, &$esReasignacion): void {
            $proyecto = Proyecto::query()
                ->with('examen')
                ->lockForUpdate()
                ->findOrFail($validated['id_proyecto']);

            $docente = Docente::query()
                ->with('user')
                ->lockForUpdate()
                ->findOrFail($validated['id_asesor']);

            if (! $docente->estado || ! $docente->user?->estado) {
                throw ValidationException::withMessages([
                    'id_asesor' => 'El docente seleccionado no cuenta con acceso activo en el sistema.',
                ]);
            }

            $perteneceAlAlumno = DB::table('tblalumnos_proyectos')
                ->where('id_alumno', $validated['id_alumno'])
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->exists();

            if (! $perteneceAlAlumno || ! $proyecto->estaAprobado()) {
                throw ValidationException::withMessages([
                    'id_proyecto' => 'El anteproyecto seleccionado no es válido para este sustentante.',
                ]);
            }

            if ($proyecto->examen?->estado_examen === ExamenProfesional::ESTADO_REALIZADO) {
                throw ValidationException::withMessages([
                    'id_proyecto' => 'No se puede cambiar el asesor porque el examen profesional de este proyecto ya fue realizado.',
                ]);
            }

            $esRevisorActivo = DB::table('tblrevisores_proyectos')
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->where('id_usuario', $docente->id_usuario)
                ->where('estado_asignacion', 'Activo')
                ->exists();

            if ($esRevisorActivo) {
                throw ValidationException::withMessages([
                    'id_asesor' => 'Este docente ya participa como revisor activo en este mismo proyecto.',
                ]);
            }

            $esPresidenteJurado = JuradoProyecto::query()
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->where('id_usuario', $docente->id_usuario)
                ->where('cargo', JuradoProyecto::CARGO_PRESIDENTE)
                ->exists();

            if ($esPresidenteJurado) {
                throw ValidationException::withMessages([
                    'id_asesor' => 'Este docente ocupa la presidencia del jurado en este proyecto y no puede ser su asesor.',
                ]);
            }

            $asignacionActual = AsignacionAsesor::query()
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                ->lockForUpdate()
                ->first();

            if ($asignacionActual && (int) $asignacionActual->id_usuario === (int) $docente->id_usuario) {
                throw ValidationException::withMessages([
                    'id_asesor' => 'Este docente ya se encuentra asignado como asesor activo de este proyecto.',
                ]);
            }

            $cargaActual = AsignacionAsesor::query()
                ->where('id_usuario', $docente->id_usuario)
                ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                ->count();

            if ($cargaActual >= AsignacionAsesor::MAX_PROYECTOS_ACTIVOS_POR_ASESOR) {
                throw ValidationException::withMessages([
                    'id_asesor' => 'El asesor seleccionado alcanzó su carga académica máxima.',
                ]);
            }

            if ($asignacionActual) {
                $esReasignacion = true;

                AsignacionAsesor::query()
                    ->where('id_proyecto', $proyecto->id_proyecto)
                    ->where('id_usuario', $docente->id_usuario)
                    ->where('id_asesor_proyecto', '!=', $asignacionActual->id_asesor_proyecto)
                    ->delete();

                $asignacionActual->update([
                    'id_usuario' => $docente->id_usuario,
                    'estado_asignacion' => AsignacionAsesor::ESTADO_ACTIVO,
                ]);

                return;
            }

            AsignacionAsesor::query()->updateOrCreate(
                [
                    'id_usuario' => $docente->id_usuario,
                    'id_proyecto' => $proyecto->id_proyecto,
                ],
                [
                    'estado_asignacion' => AsignacionAsesor::ESTADO_ACTIVO,
                ],
            );
        });

        return redirect()
            ->route('admin.asignaciones.asesores.index')
            ->with(
                'success',
                $esReasignacion
                    ? 'El asesor del proyecto fue actualizado correctamente.'
                    : 'Asesor asignado correctamente al anteproyecto.',
            );
    }
}
