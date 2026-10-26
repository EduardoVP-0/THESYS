<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Docente;
use App\Models\Admin\Proyecto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE ASIGNACION DE REVISORES
 * Permite a la coordinacion seleccionar a un alumno, su anteproyecto aprobado
 * y asignarle exactamente dos revisores docentes respetando su carga academica.
 */
class AsignacionRevisorController extends Controller
{
    /**
     * Muestra la interfaz de asignacion con selectores de sustentante/anteproyecto,
     * tabla paginada de docentes con buscador y filtros de disponibilidad.
     */
    public function index(Request $request): Response
    {
        // Alumnos con anteproyectos aprobados que ya cuenten con Director / Asesor de tesis asignado
        $alumnos = Alumno::whereHas('proyectos', function ($q) {
            $q->where('estado', 'Aprobado')->whereHas('asesores');
        })
            ->with([
                'user',
                'carrera',
                'proyectos' => function ($q) {
                    $q->where('estado', 'Aprobado')
                        ->whereHas('asesores')
                        ->with(['asesores.user', 'revisores.user']);
                },
            ])
            ->get()
            ->map(function ($alumno) {
                return [
                    'id_usuario' => $alumno->id_usuario,
                    'nombre_completo' => $alumno->nombre_completo,
                    'matricula' => $alumno->matricula,
                    'carrera' => $alumno->carrera?->nombre_carrera ?? 'Sin carrera',
                    'proyectos' => $alumno->proyectos->map(function ($p) {
                        return [
                            'id_proyecto' => $p->id_proyecto,
                            'titulo' => $p->titulo,
                            'estado' => $p->estado,
                            'asesor' => $p->asesor_asignado ? [
                                'id_usuario' => $p->asesor_asignado->id_usuario,
                                'nombre_completo' => $p->asesor_asignado->nombre_completo,
                                'grado_academico' => $p->asesor_asignado->grado_academico,
                                'email' => $p->asesor_asignado->user?->email,
                            ] : null,
                            'revisores_actuales' => $p->revisores->map(function ($r) {
                                return [
                                    'id_usuario' => $r->id_usuario,
                                    'nombre_completo' => $r->nombre_completo,
                                    'grado_academico' => $r->grado_academico,
                                ];
                            }),
                        ];
                    }),
                ];
            });

        // Consulta de Docentes activos con su carga academica calculada
        $docentesQuery = Docente::where('estado', true)
            ->with('user')
            ->withCount([
                'proyectos as carga_asesor' => function ($q) {
                    $q->where('estado_asignacion', 'Activo');
                },
                'proyectosComoRevisor as carga_revisor' => function ($q) {
                    $q->where('estado_asignacion', 'Activo');
                },
            ]);

        // Buscador por nombre completo, grado, especialidad o correo
        if ($request->filled('search')) {
            $search = $request->input('search');
            $docentesQuery->where(function ($q) use ($search) {
                $q->where('nombre', 'ilike', "%{$search}%")
                    ->orWhere('apellido_p', 'ilike', "%{$search}%")
                    ->orWhere('apellido_m', 'ilike', "%{$search}%")
                    ->orWhere('especialidad', 'ilike', "%{$search}%")
                    ->orWhere('grado_academico', 'ilike', "%{$search}%")
                    ->orWhereRaw("CONCAT(COALESCE(nombre, ''), ' ', COALESCE(apellido_p, ''), ' ', COALESCE(apellido_m, '')) ILIKE ?", ["%{$search}%"])
                    ->orWhereHas('user', function ($qu) use ($search) {
                        $qu->where('email', 'ilike', "%{$search}%");
                    });
            });
        }

        // Obtener todos los docentes filtrados por busqueda
        $todosDocentes = $docentesQuery->get()->map(function ($docente) {
            $cargaTotal = (int) $docente->carga_asesor + (int) $docente->carga_revisor;
            $maxCarga = 5;
            $disponible = $cargaTotal < $maxCarga;

            return [
                'id_usuario' => $docente->id_usuario,
                'nombre_completo' => $docente->nombre_completo,
                'nombre' => $docente->nombre,
                'apellido_p' => $docente->apellido_p,
                'apellido_m' => $docente->apellido_m,
                'grado_academico' => $docente->grado_academico,
                'especialidad' => $docente->especialidad,
                'email' => $docente->user?->email,
                'carga_total' => $cargaTotal,
                'max_carga' => $maxCarga,
                'disponible' => $disponible,
            ];
        });

        // Extraer lista unica de especialidades disponibles
        $especialidades = Docente::where('estado', true)
            ->whereNotNull('especialidad')
            ->where('especialidad', '!=', '')
            ->pluck('especialidad')
            ->unique()
            ->sort()
            ->values();

        // Metricas globales antes de aplicar filtros de disponibilidad y especialidad
        $totalDocentes = Docente::where('estado', true)->count();
        $docentesDisponibles = $todosDocentes->where('disponible', true)->count();
        $docentesCompletos = $todosDocentes->where('disponible', false)->count();

        // Filtro por Especialidad
        $filtroEspecialidad = $request->input('especialidad', 'todas');
        if ($filtroEspecialidad !== 'todas' && ! empty($filtroEspecialidad)) {
            $todosDocentes = $todosDocentes->where('especialidad', $filtroEspecialidad);
        }

        // Filtro por Disponibilidad
        $filtroDisponibilidad = $request->input('disponibilidad', 'todos');
        if ($filtroDisponibilidad === 'disponible') {
            $todosDocentes = $todosDocentes->where('disponible', true);
        } elseif ($filtroDisponibilidad === 'completa') {
            $todosDocentes = $todosDocentes->where('disponible', false);
        }

        // Paginacion personalizada (por defecto 5 docentes por pagina)
        $perPage = (int) $request->input('per_page', 5);
        if ($perPage <= 0 || $perPage > 50) {
            $perPage = 5;
        }

        $page = (int) $request->input('page', 1);
        $total = $todosDocentes->count();
        $items = $todosDocentes->slice(($page - 1) * $perPage, $perPage)->values();

        $paginatedDocentes = new LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('admin/asignaciones/revisores/index', [
            'alumnos' => $alumnos,
            'docentes' => $paginatedDocentes,
            'especialidades' => $especialidades,
            'stats' => [
                'total_docentes' => $totalDocentes,
                'disponibles' => $docentesDisponibles,
                'carga_completa' => $docentesCompletos,
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'disponibilidad' => $filtroDisponibilidad,
                'especialidad' => $filtroEspecialidad,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Almacena la asignacion de los 2 revisores en tblrevisores_proyectos
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_proyecto' => ['required', 'integer', 'exists:tblproyectos,id_proyecto'],
            'revisores' => ['required', 'array', 'size:2'],
            'revisores.*' => ['required', 'integer', 'exists:tbldocentes,id_usuario'],
        ], [
            'id_proyecto.required' => 'Debes seleccionar un anteproyecto aprobado.',
            'revisores.required' => 'Debes seleccionar los revisores académicos.',
            'revisores.size' => 'Debes seleccionar exactamente 2 revisores para el anteproyecto.',
        ]);

        $proyecto = Proyecto::with('asesores')->findOrFail($validated['id_proyecto']);

        // Validar que el proyecto este en estado Aprobado
        if ($proyecto->estado !== 'Aprobado') {
            return redirect()->back()->with('error', 'Solo se pueden asignar revisores a anteproyectos en estado Aprobado.');
        }

        // Validar que el proyecto cuente formalmente con un Director / Asesor de tesis asignado
        if (! $proyecto->asesor_asignado) {
            return redirect()->back()->with('error', 'El anteproyecto debe contar formalmente con un Director / Asesor de tesis asignado antes de poder designarle revisores');
        }

        // Validar que los 2 revisores sean distintos entre si
        if ($validated['revisores'][0] === $validated['revisores'][1]) {
            return redirect()->back()->with('error', 'Debes seleccionar dos docentes distintos como revisores.');
        }

        // Regla academica: Ninguno de los revisores puede ser el Asesor / Director de este mismo proyecto
        $idAsesor = $proyecto->asesor_asignado->id_usuario;
        if (in_array($idAsesor, $validated['revisores'])) {
            return redirect()->back()->with('error', 'El Director / Asesor de tesis no puede ser seleccionado como revisor de su propio anteproyecto.');
        }

        // Guardar en base de datos mediante transaccion
        DB::transaction(function () use ($proyecto, $validated) {
            $syncData = [];
            foreach ($validated['revisores'] as $idDocente) {
                $syncData[$idDocente] = [
                    'estado_asignacion' => 'Activo',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $proyecto->revisores()->sync($syncData);
        });

        return redirect()->route('admin.asignaciones.revisores.index')
            ->with('success', "Se han asignado exitosamente los 2 revisores al anteproyecto \"{$proyecto->titulo}\".");
    }
}
