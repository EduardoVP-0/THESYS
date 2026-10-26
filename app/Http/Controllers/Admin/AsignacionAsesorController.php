<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AsignarAsesorRequest;
use App\Models\Admin\Alumno;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Docente;
use App\Models\Admin\Proyecto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE ASIGNACIÓN DE ASESORES
 *
 * Permite vincular un asesor académico a los anteproyectos aprobados que
 * todavía no cuentan con uno.
 */
class AsignacionAsesorController extends Controller
{
    /**
     * Muestra los sustentantes pendientes y los docentes disponibles.
     */
    public function index(): Response
    {
        $solicitudes = Alumno::query()
            ->with([
                'carrera:id_carrera,nombre_carrera',
                'proyectos' => function ($query) {
                    $query
                        ->whereIn('tblproyectos.estado', Proyecto::ESTADOS_APROBADOS)
                        ->whereDoesntHave('asesores', function ($asesores) {
                            $asesores->where(
                                'tblasesores_proyectos.estado_asignacion',
                                AsignacionAsesor::ESTADO_ACTIVO,
                            );
                        })
                        ->orderBy('tblproyectos.titulo');
                },
            ])
            ->whereHas('proyectos', function ($query) {
                $query
                    ->whereIn('tblproyectos.estado', Proyecto::ESTADOS_APROBADOS)
                    ->whereDoesntHave('asesores', function ($asesores) {
                        $asesores->where(
                            'tblasesores_proyectos.estado_asignacion',
                            AsignacionAsesor::ESTADO_ACTIVO,
                        );
                    });
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
                ];
            })
            ->filter()
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
     * Registra la asignación de un asesor a un anteproyecto aprobado.
     */
    public function store(AsignarAsesorRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $proyecto = Proyecto::query()
                ->lockForUpdate()
                ->findOrFail($validated['id_proyecto']);

            $docente = Docente::query()
                ->lockForUpdate()
                ->findOrFail($validated['id_asesor']);

            $perteneceAlAlumno = DB::table('tblalumnos_proyectos')
                ->where('id_alumno', $validated['id_alumno'])
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->exists();

            if (! $perteneceAlAlumno || ! $proyecto->estaAprobado()) {
                throw ValidationException::withMessages([
                    'id_proyecto' => 'El anteproyecto seleccionado no es válido para este sustentante.',
                ]);
            }

            $tieneAsesorActivo = AsignacionAsesor::query()
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                ->exists();

            if ($tieneAsesorActivo) {
                throw ValidationException::withMessages([
                    'id_proyecto' => 'Este anteproyecto ya cuenta con un asesor asignado.',
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
            ->with('success', 'Asesor asignado correctamente al anteproyecto.');
    }
}
