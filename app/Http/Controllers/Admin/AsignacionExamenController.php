<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProgramarExamenRequest;
use App\Models\Admin\Alumno;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Docente;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\Admin\Sede;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE ASIGNACIÓN DE EXÁMENES PROFESIONALES
 */
class AsignacionExamenController extends Controller
{
    /**
     * Muestra los proyectos con jurado que aún no tienen examen programado.
     */
    public function index(Request $request): Response
    {
        $proyectos = Proyecto::query()
            ->whereHas('jurados')
            ->where(function ($query): void {
                $query->whereDoesntHave('examen')
                    ->orWhereHas('examen', function ($eq): void {
                        $eq->where('estado_examen', ExamenProfesional::ESTADO_PROGRAMADO);
                    });
            })
            ->with($this->relacionesProyecto())
            ->orderBy('titulo')
            ->get()
            ->map(fn (Proyecto $proyecto): array => $this->transformarProyecto($proyecto))
            ->sortBy(fn (array $item): int => $item['examen_actual'] === null ? 0 : 1)
            ->values();

        $proyectoSeleccionadoId = $request->integer('proyecto');
        $proyectoSeleccionadoId = $proyectos->contains(
            fn (array $proyecto): bool => $proyecto['id_proyecto'] === $proyectoSeleccionadoId,
        ) ? $proyectoSeleccionadoId : null;

        $sedes = Sede::query()
            ->where('estado', true)
            ->orderBy('nombre_sede')
            ->get()
            ->map(fn (Sede $sede): array => [
                'id_sede' => $sede->id_sede,
                'clave' => $sede->clave,
                'nombre_sede' => $sede->nombre_sede,
                'direccion' => $sede->direccion,
            ])
            ->values();

        $anioActual = (int) now()->year;

        return Inertia::render('admin/asignaciones/examenes/index', [
            'proyectos' => $proyectos,
            'sedes' => $sedes,
            'proyectoSeleccionadoId' => $proyectoSeleccionadoId,
            'fechaMinima' => CarbonImmutable::today()->toDateString(),
            'diasInhabiles' => ExamenProfesional::diasFestivosEntre($anioActual, $anioActual + 2),
            'fechasOcupadas' => ExamenProfesional::fechasOcupadasEntre($anioActual, $anioActual + 2),
        ]);
    }

    /**
     * Programa el examen profesional de un proyecto.
     */
    public function store(ProgramarExamenRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $esReprogramacion = false;

        $examen = DB::transaction(function () use ($validated, &$esReprogramacion): ExamenProfesional {
            $proyecto = Proyecto::query()
                ->with('examen')
                ->lockForUpdate()
                ->findOrFail($validated['id_proyecto']);

            if ($proyecto->examen && $proyecto->examen->estado_examen === ExamenProfesional::ESTADO_REALIZADO) {
                throw ValidationException::withMessages([
                    'id_proyecto' => 'No se puede reprogramar un examen profesional que ya fue realizado.',
                ]);
            }

            $esReprogramacion = $proyecto->examen !== null;

            $miembros = JuradoProyecto::query()
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->lockForUpdate()
                ->get();

            if (! $this->juradoCompleto($miembros)) {
                throw ValidationException::withMessages([
                    'id_proyecto' => 'Los cinco integrantes del jurado deben estar asignados y haber aceptado su designación antes de programar el examen.',
                ]);
            }

            $sede = Sede::query()
                ->whereKey($validated['id_sede'])
                ->where('estado', true)
                ->lockForUpdate()
                ->first();

            if (! $sede) {
                throw ValidationException::withMessages([
                    'id_sede' => 'La sede seleccionada no está activa.',
                ]);
            }

            $fecha = CarbonImmutable::parse($validated['fecha_examen'])->toDateString();

            if (ExamenProfesional::fechaOcupada($fecha, $proyecto->id_proyecto)) {
                throw ValidationException::withMessages([
                    'fecha_examen' => 'La fecha seleccionada ya está ocupada por otro examen profesional.',
                ]);
            }

            return ExamenProfesional::query()->updateOrCreate(
                ['id_proyecto' => $proyecto->id_proyecto],
                [
                    'id_sede' => $sede->id_sede,
                    'fecha_examen' => $fecha,
                    'hora_examen' => $validated['hora_examen'],
                    'sede' => $sede->nombre_sede,
                    'estado_examen' => ExamenProfesional::ESTADO_PROGRAMADO,
                ],
            );
        });

        $fecha = CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y');
        $hora = substr((string) $examen->hora_examen, 0, 5);
        $accion = $esReprogramacion ? 'Examen reprogramado' : 'Examen programado';

        return redirect()
            ->route('admin.asignaciones.examenes.index')
            ->with(
                'success',
                "{$accion} para el {$fecha} a las {$hora} en {$examen->sede}.",
            );
    }

    /**
     * Relaciones necesarias para representar el proyecto y su jurado.
     *
     * @return array<string, mixed>
     */
    private function relacionesProyecto(): array
    {
        return [
            'alumnos:id_usuario,nombre,apellido_p,apellido_m,matricula',
            'examen',
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
     * Construye la representación del proyecto para la vista de programación.
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

        $aceptadosCount = $proyecto->jurados
            ->filter(fn (JuradoProyecto $m): bool => $m->estado_aceptacion === JuradoProyecto::ESTADO_ACEPTADO)
            ->count();

        return [
            'id_proyecto' => $proyecto->id_proyecto,
            'titulo' => $proyecto->titulo,
            'resumen' => $proyecto->resumen,
            'estado' => $proyecto->estado,
            'sustentantes' => $sustentantes,
            'asesores' => $asesores,
            'jurado' => $jurado,
            'jurado_completo' => $this->juradoCompleto($proyecto->jurados),
            'jurado_count' => count($jurado),
            'jurado_aceptados_count' => $aceptadosCount,
            'examen_actual' => $proyecto->examen ? [
                'id_examen' => $proyecto->examen->id_examen,
                'fecha_examen' => CarbonImmutable::parse($proyecto->examen->fecha_examen)->toDateString(),
                'hora_examen' => substr((string) $proyecto->examen->hora_examen, 0, 5),
                'id_sede' => $proyecto->examen->id_sede,
                'sede' => $proyecto->examen->sede,
                'estado_examen' => $proyecto->examen->estado_examen,
            ] : null,
        ];
    }

    /**
     * Verifica que estén cubiertos los cinco cargos con docentes distintos y todos hayan aceptado.
     *
     * @param  Collection<int, JuradoProyecto>  $miembros
     */
    private function juradoCompleto(Collection $miembros): bool
    {
        $cargos = $miembros->pluck('cargo')->unique();
        $docentes = $miembros->pluck('id_usuario')->unique();
        $todosAceptaron = $miembros->every(
            fn (JuradoProyecto $m): bool => $m->estado_aceptacion === JuradoProyecto::ESTADO_ACEPTADO,
        );

        return $docentes->count() === count(JuradoProyecto::CARGOS)
            && $cargos->count() === count(JuradoProyecto::CARGOS)
            && $todosAceptaron
            && collect(JuradoProyecto::CARGOS)->every(
                fn (string $cargo): bool => $cargos->contains($cargo),
            );
    }
}
