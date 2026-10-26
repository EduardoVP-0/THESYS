<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Pago;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PagoController extends Controller
{
    public function index(Request $request): Response
    {

        // Carga pagos con su usuario y los datos del alumno (nombre y matricula)
        $query = Pago::with(['usuario.alumno']);

        // Filtro si se seleccionó una tarjeta de concepto
        if ($request->filled('concepto')) {
            $query->where('concepto', $request->input('concepto'));
        }

        // Filtro por búsqueda (matricula, nombre o referencia bancaria)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('referencia_bancaria', 'like', "%{$search}%")
                    ->orWhereHas('usuario', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhereHas('alumno', function ($aq) use ($search) {
                                $aq->where('matricula', 'like', "%{$search}%")
                                    ->orWhere('nombre', 'like', "%{$search}%")
                                    ->orWhere('apellido_p', 'like', "%{$search}%");
                            });
                    });
            });
        }

        // Filtro por estado de validación (Pendiente, Validado, Rechazado)
        if ($request->filled('estado') && $request->input('estado') !== 'Todos') {
            $query->where('estado_validacion', $request->input('estado'));
        }

        $pagos = $query->orderBy('id_pago', 'desc')
            ->paginate(6)
            ->withQueryString();

        // Conteo de pagos pendientes por concepto para alertar en las tarjetas superiores
        $pendientesPorConcepto = Pago::where('estado_validacion', 'Pendiente')
            ->selectRaw('concepto, COUNT(*) as total')
            ->groupBy('concepto')
            ->pluck('total', 'concepto')
            ->toArray();

        return Inertia::render('admin/pagos/index', [
            'pagos' => $pagos,
            'pendientesPorConcepto' => $pendientesPorConcepto,
            'filters' => $request->only(['concepto', 'search', 'estado']),
        ]);

    }

    // Valida o rechaza un pago desde el panel lateral
    public function updateEstado(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'estado_validacion' => 'required|in:Pendiente,Validado,Rechazado',
        ]);
        $pago = Pago::findOrFail($id);
        $pago->update([
            'estado_validacion' => $request->estado_validacion,
        ]);

        return redirect()->back()->with('success', "Pago marcado como {$request->estado_validacion} correctamente.");
    }
}
