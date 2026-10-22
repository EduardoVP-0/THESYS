<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCarreraRequest;
use App\Http\Requests\UpdateCarreraRequest;
use App\Models\Carrera;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

// Controlador de Gestion de carreras (modulo administrativo)
class CarreraController extends Controller
{
    // Muestra la pantalla principal con la tabla de carreras, buscador y estadísticas.
    public function index(Request $request): Response
    {
        $query = Carrera::query();
        // Filtro por buscador (nombre, descripción o duración)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre_carrera', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%")
                    ->orWhere('duracion_semestres', 'like', "%{$search}%");
            });
        }
        // Filtro por estado (activas, inactivas o todas)
        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $query->where('estado', $request->input('estado') === 'activa');
        }
        // Filtro por duración en semestres
        if ($request->filled('duracion') && $request->input('duracion') !== 'todos') {
            $query->where('duracion_semestres', (int) $request->input('duracion'));
        }

        // Obtenemos las carreras paginadas (6 por página para visualización limpia)
        $carreras = $query->latest('id_carrera')->paginate(6)->withQueryString();

        // Métricas calculadas para las 4 Cards superiores del diseño
        $stats = [
            'total' => Carrera::count(),
            'activas' => Carrera::where('estado', true)->count(),
            'inactivas' => Carrera::where('estado', false)->count(),
            'alumnos_vigentes' => 0, // Se conectará dinámicamente cuando esté listo el módulo de alumnos
        ];

        // Enviamos los datos a la vista de React mediante Inertia
        return Inertia::render('admin/carreras/index', [
            'carreras' => $carreras,
            'stats' => $stats,
            'filters' => $request->only(['search', 'estado', 'duracion']),
        ]);
    }

    // Muestra la vista con el formulario para registrar una nueva carrera
    public function create(): Response
    {
        return Inertia::render('admin/carreras/create');
    }

    // Guarda la nueva carrera en la base de datos
    public function store(StoreCarreraRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Asignamos el ID del administrador que está realizando el registro (Auditoría)
        $validated['id_usuario_registro'] = Auth::id();
        $validated['estado'] = $request->boolean('estado', true);
        Carrera::create($validated);

        return redirect()->route('admin.carreras.index')
            ->with('success', 'Carrera registrada exitosamente.');
    }

    // Muestra la vista de edición con los datos de la carrera seleccionada.
    public function edit(Carrera $carrera): Response
    {
        return Inertia::render('admin/carreras/edit', [
            'carrera' => $carrera,
        ]);
    }

    // Actualiza la información de la carrera en la base de datos.
    public function update(UpdateCarreraRequest $request, Carrera $carrera): RedirectResponse
    {
        $validated = $request->validated();
        $validated['estado'] = $request->boolean('estado', true);
        $carrera->update($validated);

        return redirect()->route('admin.carreras.index')
            ->with('success', 'Carrera actualizada correctamente.');
    }

    /*Alterna el estado de la carrera (Activar / Desactivar - Baja lógica)
    No elimina el registro para preservar la integridad de datos
     */
    public function toggleStatus(Carrera $carrera): RedirectResponse
    {
        $carrera->update([
            'estado' => ! $carrera->estado,
        ]);
        $mensaje = $carrera->estado
            ? 'Carrera activada exitosamente.'
            : 'Carrera dada de baja exitosamente.';

        return redirect()->route('admin.carreras.index')
            ->with('success', $mensaje);
    }

    /**
     * Exporta el catálogo completo de carreras a formato CSV con codificación UTF-8.
     */
    public function exportCsv()
    {
        $carreras = Carrera::all();
        $filename = 'carreras_unach_'.date('Y-m-d_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($carreras) {
            $file = fopen('php://output', 'w');
            // BOM UTF-8 para compatibilidad de acentos con Excel
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($file, ['Clave', 'Nombre de la Carrera', 'Descripcion', 'Duracion_Semestres', 'Estado']);

            foreach ($carreras as $carrera) {
                fputcsv($file, [
                    $carrera->clave,
                    $carrera->nombre_carrera,
                    $carrera->descripcion,
                    $carrera->duracion_semestres,
                    $carrera->estado ? 'Vigente' : 'Inactivo',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Importa carreras masivamente desde un archivo CSV.
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'archivo_csv' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ], [
            'archivo_csv.required' => 'Debes seleccionar un archivo CSV para importar.',
            'archivo_csv.mimes' => 'El archivo debe tener formato .csv o .txt.',
            'archivo_csv.max' => 'El archivo no debe exceder 2MB.',
        ]);

        $file = $request->file('archivo_csv');
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle); // Encabezado

        $insertadas = 0;
        while (($row = fgetcsv($handle)) !== false) {
            if (! empty($row[0])) {
                $nombre = trim($row[0]);
                $duracion = isset($row[1]) ? (int) trim($row[1]) : 6;
                $descripcion = isset($row[2]) ? trim($row[2]) : null;

                Carrera::firstOrCreate(
                    ['nombre_carrera' => $nombre],
                    [
                        'duracion_semestres' => ($duracion >= 1 && $duracion <= 9) ? $duracion : 6,
                        'descripcion' => $descripcion,
                        'estado' => true,
                        'id_usuario_registro' => Auth::id(),
                    ]
                );
                $insertadas++;
            }
        }
        fclose($handle);

        return redirect()->route('admin.carreras.index')
            ->with('success', "Se importaron exitosamente {$insertadas} carreras desde el archivo CSV.");
    }
}
