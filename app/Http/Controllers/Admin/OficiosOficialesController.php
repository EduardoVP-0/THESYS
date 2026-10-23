<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Oficios_Oficiales;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OficiosOficialesController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Oficios_Oficiales::query();

        if ($request->filled('tipo')) {
            $tipo = $request->input('tipo');
            $query->where(function ($q) use ($tipo) {
                $q->where('tipo', 'like', "%{$tipo}%")
                    ->orWhereRaw('LOWER(tipo) LIKE LOWER(?)', ["%{$tipo}%"]);
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre_oficio', 'like', "%{$search}%")
                    ->orWhere('tipo', 'like', "%{$search}%");
            });
        }

        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $query->where('estado', $request->input('estado') === '1');
        }

        $oficios = $query->orderBy('id_oficio_oficial', 'desc')
            ->paginate(6)
            ->withQueryString();

        $pendientesPorTipo = Oficios_Oficiales::where('estado', false)
            ->selectRaw('tipo, count(*) as total')
            ->groupBy('tipo')
            ->pluck('total', 'tipo')
            ->toArray();

        return Inertia::render('admin/oficios_oficiales/index', [
            'oficios' => $oficios,
            'pendientesPorTipo' => $pendientesPorTipo,
            'filters' => $request->only(['search', 'estado', 'tipo']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre_oficio' => 'required|string|max:100',
            'tipo' => 'required|string',
            'archivo' => 'required|file|mimes:pdf|max:20480',
        ]);

        // 1. Guarda el archivo localmente en storage/app/public/oficios
        $path = $request->file('archivo')->store('oficios', 'public');

        // 2. Genera la URL local correspondiente (ej: http://localhost:8000/storage/oficios/...)
        $urlCompleta = Storage::url($path);

        // 3. Guarda la URL local en tu base de datos de pgAdmin
        Oficios_Oficiales::create([
            'nombre_oficio' => $request->nombre_oficio,
            'tipo' => $request->tipo,
            'url_archivo' => $urlCompleta,
            'estado' => $request->estado ?? true,
        ]);

        return redirect()->back()->with('success', 'Oficio oficial registrado correctamente.');
    }

    public function update(Request $request, $id)
    {
        $oficio = Oficios_Oficiales::findOrFail($id);

        $request->validate([
            'nombre_oficio' => 'required|string|max:100',
            'tipo' => 'required|string',
            'archivo' => 'nullable|file|mimes:pdf|max:20480',
            'estado' => 'nullable',
        ]);

        $data = [
            'nombre_oficio' => $request->nombre_oficio,
            'tipo' => $request->tipo,
            'estado' => $request->boolean('estado', true),
        ];

        if ($request->hasFile('archivo')) {
            $path = $request->file('archivo')->store('oficios', 'public');
            $data['url_archivo'] = Storage::url($path);
        }

        $oficio->update($data);

        return redirect()->back()->with('success', 'Oficio oficial actualizado correctamente.');
    }

    public function toggleStatus($id)
    {
        $oficio = Oficios_Oficiales::findOrFail($id);
        $oficio->update([
            'estado' => ! $oficio->estado,
        ]);

        $mensaje = $oficio->estado
            ? 'Oficio oficial activado exitosamente.'
            : 'Oficio oficial desactivado exitosamente.';

        return redirect()->back()->with('success', $mensaje);
    }

    public function destroy($id)
    {
        $oficio = Oficios_Oficiales::findOrFail($id);
        $oficio->delete();

        return redirect()->back()->with('success', 'Oficio oficial eliminado correctamente.');
    }
}
