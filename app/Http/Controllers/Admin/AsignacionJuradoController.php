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
use Illuminate\Support\Collection;
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

        $docentes = $this->obtenerDocentesDisponibles();

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

        $docentes = $this->obtenerDocentesDisponibles();

        return Inertia::render('admin/asignaciones/jurados/consulta', [
            'proyectos' => $proyectos,
            'docentes' => $docentes,
        ]);
    }

    /**
     * Actualiza el estado de aceptación de un miembro del jurado (Aceptado, Rechazado, Pendiente).
     */
    public function actualizarEstadoMiembro(Request $request, JuradoProyecto $jurado): RedirectResponse
    {
        $validated = $request->validate([
            'estado_aceptacion' => ['required', 'string', 'in:Pendiente,Aceptado,Rechazado'],
        ]);

        $jurado->update([
            'estado_aceptacion' => $validated['estado_aceptacion'],
        ]);

        $docenteNombre = $jurado->docente?->nombre_completo ?? 'El docente';

        return redirect()->back()->with(
            'success',
            "Estado de {$docenteNombre} actualizado a {$validated['estado_aceptacion']}."
        );
    }

    /**
     * Sustituye a un integrante del jurado que rechazó la designación.
     * Si es titular, se promueve a uno de los suplentes y se elige a un nuevo docente para la vacante de suplente.
     * Si es suplente, se reemplaza directamente por un nuevo docente.
     */
    public function sustituir(Request $request, Proyecto $proyecto): RedirectResponse
    {
        $validated = $request->validate([
            'id_jurado_rechazado' => ['required', 'integer', 'exists:tbljurados_proyectos,id_jurado_proyecto'],
            'id_suplente_promovido' => ['nullable', 'integer', 'exists:tbljurados_proyectos,id_jurado_proyecto'],
            'id_nuevo_docente' => ['required', 'integer', 'exists:tbldocentes,id_usuario'],
        ]);

        DB::transaction(function () use ($proyecto, $validated): void {
            /** @var JuradoProyecto $juradoRechazado */
            $juradoRechazado = JuradoProyecto::where('id_proyecto', $proyecto->id_proyecto)
                ->findOrFail($validated['id_jurado_rechazado']);

            $idNuevoDocente = (int) $validated['id_nuevo_docente'];

            // Verificar que el nuevo docente esté activo
            $docenteValido = Docente::where('id_usuario', $idNuevoDocente)
                ->where('estado', true)
                ->exists();

            if (! $docenteValido) {
                throw ValidationException::withMessages([
                    'id_nuevo_docente' => 'El nuevo docente seleccionado no está activo en el sistema.',
                ]);
            }

            // Verificar que el nuevo docente no esté ya en el jurado actual
            $miembrosActuales = JuradoProyecto::where('id_proyecto', $proyecto->id_proyecto)
                ->where('id_jurado_proyecto', '!=', $juradoRechazado->id_jurado_proyecto)
                ->pluck('id_usuario')
                ->all();

            if (in_array($idNuevoDocente, $miembrosActuales, true)) {
                throw ValidationException::withMessages([
                    'id_nuevo_docente' => 'El docente seleccionado ya forma parte de este jurado.',
                ]);
            }

            if ($juradoRechazado->esTitular()) {
                if (empty($validated['id_suplente_promovido'])) {
                    throw ValidationException::withMessages([
                        'id_suplente_promovido' => 'Debes seleccionar qué suplente asumirá el cargo titular.',
                    ]);
                }

                /** @var JuradoProyecto $suplentePromovido */
                $suplentePromovido = JuradoProyecto::where('id_proyecto', $proyecto->id_proyecto)
                    ->whereIn('cargo', [JuradoProyecto::CARGO_SUPLENTE_1, JuradoProyecto::CARGO_SUPLENTE_2])
                    ->findOrFail($validated['id_suplente_promovido']);

                $cargoTitular = $juradoRechazado->cargo;
                $cargoSuplente = $suplentePromovido->cargo;

                // Si asciende a Presidente, el suplente promovido no puede ser el asesor del proyecto
                if ($cargoTitular === JuradoProyecto::CARGO_PRESIDENTE) {
                    $esAsesor = $proyecto->docentesAsesores()
                        ->where('tblasesores_proyectos.id_usuario', $suplentePromovido->id_usuario)
                        ->where('tblasesores_proyectos.estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                        ->exists();

                    if ($esAsesor) {
                        throw ValidationException::withMessages([
                            'id_suplente_promovido' => 'El suplente seleccionado es el Asesor del proyecto y el reglamento le impide presidir el jurado.',
                        ]);
                    }
                }

                // 1. El suplente promovido toma el puesto titular
                $suplentePromovido->update([
                    'cargo' => $cargoTitular,
                ]);

                // 2. La vacante de suplente es ocupada por el nuevo docente
                $juradoRechazado->update([
                    'id_usuario' => $idNuevoDocente,
                    'cargo' => $cargoSuplente,
                    'estado_aceptacion' => JuradoProyecto::ESTADO_PENDIENTE,
                ]);
            } else {
                // El que rechazó era un suplente directamente
                $juradoRechazado->update([
                    'id_usuario' => $idNuevoDocente,
                    'estado_aceptacion' => JuradoProyecto::ESTADO_PENDIENTE,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Sustitución de integrante del jurado realizada correctamente.');
    }

    /**
     * Obtiene la lista de docentes activos disponibles para jurado.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function obtenerDocentesDisponibles()
    {
        return Docente::query()
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
