<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AsignarJuradoRequest;
use App\Models\Admin\Alumno;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Docente;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE ASIGNACIÓN DE JURADOS
 *
 * Permite integrar el jurado de un proyecto de tesis y consultar las
 * conformaciones registradas por proyecto.
 */
class AsignacionJuradoController extends Controller
{
    /**
     * Muestra los proyectos con asesor activo y los docentes disponibles.
     */
    public function index(Request $request): Response
    {
        $proyectos = Proyecto::query()
            ->where(function ($query): void {
                $query
                    ->whereHas('docentesAsesores', function ($asesores): void {
                        $asesores->where(
                            'tblasesores_proyectos.estado_asignacion',
                            AsignacionAsesor::ESTADO_ACTIVO,
                        );
                    })
                    ->orWhereHas('jurados');
            })
            ->with($this->relacionesProyecto())
            ->orderBy('titulo')
            ->get()
            ->map(fn (Proyecto $proyecto): array => $this->transformarProyecto($proyecto))
            ->values();

        $docentes = Docente::query()
            ->with('user:id,email,estado')
            ->where('estado', true)
            ->whereHas('user', function ($query): void {
                $query->where('estado', true);
            })
            ->orderBy('apellido_p')
            ->orderBy('apellido_m')
            ->orderBy('nombre')
            ->get()
            ->map(function (Docente $docente): array {
                return [
                    'id_usuario' => $docente->id_usuario,
                    'nombre_completo' => $docente->nombre_completo,
                    'iniciales' => $docente->iniciales,
                    'email' => $docente->user?->email,
                    'cedula_profesional' => $docente->cedula_profesional,
                    'especialidad' => $docente->especialidad,
                    'grado_academico' => $docente->grado_academico,
                    'tipo_contrato' => $docente->tipo_contrato,
                ];
            })
            ->values();

        $proyectoSeleccionadoId = $request->integer('proyecto');
        $proyectoSeleccionadoId = $proyectos->contains(
            fn (array $proyecto): bool => $proyecto['id_proyecto'] === $proyectoSeleccionadoId,
        ) ? $proyectoSeleccionadoId : null;

        return Inertia::render('admin/asignaciones/jurados/index', [
            'proyectos' => $proyectos,
            'docentes' => $docentes,
            'proyectoSeleccionadoId' => $proyectoSeleccionadoId,
        ]);
    }

    /**
     * Registra la estructura completa del jurado de un proyecto.
     */
    public function store(AsignarJuradoRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $proyecto = Proyecto::query()
                ->lockForUpdate()
                ->findOrFail($validated['id_proyecto']);

            if (JuradoProyecto::query()->where('id_proyecto', $proyecto->id_proyecto)->exists()) {
                throw ValidationException::withMessages([
                    'id_proyecto' => 'Este proyecto ya tiene un jurado asignado.',
                ]);
            }

            foreach (JuradoProyecto::CAMPOS_CARGOS as $campo => $cargo) {
                JuradoProyecto::query()->create([
                    'id_usuario' => $validated[$campo],
                    'id_proyecto' => $proyecto->id_proyecto,
                    'cargo' => $cargo,
                    'estado_aceptacion' => JuradoProyecto::ESTADO_PENDIENTE,
                ]);
            }
        });

        return redirect()
            ->route('admin.asignaciones.jurados.index', ['proyecto' => $validated['id_proyecto']])
            ->with('success', 'Jurado asignado correctamente al proyecto de tesis.');
    }

    /**
     * Muestra las conformaciones de jurado registradas por proyecto.
     */
    public function consulta(): Response
    {
        $proyectos = Proyecto::query()
            ->whereHas('jurados')
            ->with($this->relacionesProyecto())
            ->orderBy('titulo')
            ->get()
            ->map(fn (Proyecto $proyecto): array => $this->transformarProyecto($proyecto))
            ->values();

        return Inertia::render('admin/asignaciones/jurados/consulta', [
            'proyectos' => $proyectos,
        ]);
    }

    /**
     * Relaciones necesarias para representar un proyecto y su jurado.
     *
     * @return array<string, mixed>
     */
    private function relacionesProyecto(): array
    {
        return [
            'alumnos:id_usuario,nombre,apellido_p,apellido_m,matricula',
            'docentesAsesores' => function ($query): void {
                $query->where(
                    'tblasesores_proyectos.estado_asignacion',
                    AsignacionAsesor::ESTADO_ACTIVO,
                );
            },
            'jurados' => function ($query): void {
                $query
                    ->with([
                        'docente.user:id,email',
                        'user:id,name,email',
                    ])
                    ->orderBy('id_jurado_proyecto');
            },
        ];
    }

    /**
     * Construye la representación compartida entre la asignación y la consulta.
     *
     * @return array<string, mixed>
     */
    private function transformarProyecto(Proyecto $proyecto): array
    {
        $sustentantes = $proyecto->alumnos
            ->map(fn (Alumno $alumno): array => [
                'id_usuario' => $alumno->id_usuario,
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
            ])
            ->values()
            ->all();

        $asesores = $proyecto->docentesAsesores
            ->map(fn (Docente $docente): array => [
                'id_usuario' => $docente->id_usuario,
                'nombre_completo' => $docente->nombre_completo,
                'iniciales' => $docente->iniciales,
            ])
            ->values()
            ->all();

        $jurado = $proyecto->jurados
            ->sortBy(function (JuradoProyecto $miembro): int {
                $posicion = array_search($miembro->cargo, JuradoProyecto::CARGOS, true);

                return $posicion === false ? count(JuradoProyecto::CARGOS) : $posicion;
            })
            ->map(function (JuradoProyecto $miembro): array {
                $docente = $miembro->docente;

                return [
                    'id_jurado_proyecto' => $miembro->id_jurado_proyecto,
                    'id_usuario' => $miembro->id_usuario,
                    'cargo' => $miembro->cargo,
                    'estado_aceptacion' => $miembro->estado_aceptacion,
                    'docente' => [
                        'id_usuario' => $miembro->id_usuario,
                        'nombre_completo' => $docente?->nombre_completo
                            ?? $miembro->user?->name
                            ?? 'Docente no disponible',
                        'iniciales' => $docente?->iniciales ?? 'NA',
                        'email' => $docente?->user?->email ?? $miembro->user?->email,
                    ],
                ];
            })
            ->values()
            ->all();

        return [
            'id_proyecto' => $proyecto->id_proyecto,
            'titulo' => $proyecto->titulo,
            'resumen' => $proyecto->resumen,
            'estado' => $proyecto->estado,
            'sustentantes' => $sustentantes,
            'asesores' => $asesores,
            'jurado' => $jurado,
            'tiene_jurado' => $jurado !== [],
        ];
    }
}
