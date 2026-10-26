<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSedeRequest;
use App\Http\Requests\UpdateSedeRequest;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\Sede;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE SEDES PARA EXÁMENES PROFESIONALES
 */
class SedeController extends Controller
{
    /**
     * Muestra el catálogo de sedes con métricas y filtros.
     */
    public function index(Request $request): Response
    {
        $query = Sede::query()->withCount('examenes');

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $query->where(function ($consulta) use ($search): void {
                $consulta
                    ->where('nombre_sede', 'ilike', "%{$search}%")
                    ->orWhere('direccion', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $query->where('estado', $request->input('estado') === 'activa');
        }

        $sedes = $query
            ->latest('id_sede')
            ->paginate(6)
            ->withQueryString();

        return Inertia::render('admin/sedes/index', [
            'sedes' => $sedes,
            'stats' => [
                'total' => Sede::query()->count(),
                'activas' => Sede::query()->where('estado', true)->count(),
                'inactivas' => Sede::query()->where('estado', false)->count(),
                'examenes_programados' => ExamenProfesional::query()->count(),
            ],
            'filters' => $request->only(['search', 'estado']),
        ]);
    }

    /**
     * Registra una nueva sede.
     */
    public function store(StoreSedeRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['id_usuario_registro'] = Auth::id();
        $validated['estado'] = $request->boolean('estado', true);

        Sede::query()->create($validated);

        return redirect()
            ->route('admin.sedes.index')
            ->with('success', 'Sede registrada exitosamente.');
    }

    /**
     * Actualiza los datos de una sede.
     */
    public function update(UpdateSedeRequest $request, Sede $sede): RedirectResponse
    {
        $validated = $request->validated();
        $validated['estado'] = $request->boolean('estado', $sede->estado);

        $sede->update($validated);

        return redirect()
            ->route('admin.sedes.index')
            ->with('success', 'Sede actualizada correctamente.');
    }

    /**
     * Alterna el estado lógico de una sede.
     */
    public function toggleStatus(Sede $sede): RedirectResponse
    {
        $sede->update([
            'estado' => ! $sede->estado,
        ]);

        return redirect()
            ->route('admin.sedes.index')
            ->with(
                'success',
                $sede->estado
                    ? 'Sede activada exitosamente.'
                    : 'Sede dada de baja exitosamente.',
            );
    }
}
