<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Pago;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class PagoController extends Controller
{
    /**
     * Obtiene el adaptador del disco S3 de Supabase.
     */
    private function s3(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        return $disk;
    }

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

        $pagos->getCollection()->transform(function (Pago $pago) {
            $pago->setAttribute(
                'url_comprobante',
                $pago->referencia_bancaria
                    ? route('admin.pagos.documento', ['pago' => $pago->id_pago])
                    : null
            );

            return $pago;
        });

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

    // Valida o rechaza un pago desde el panel lateral y guarda el comentario del administrador
    public function updateEstado(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'estado_validacion' => 'required|in:Pendiente,Validado,Rechazado',
            'comentarios' => 'nullable|string|max:1500',
        ]);

        $pago = Pago::findOrFail($id);
        $pago->update([
            'estado_validacion' => $request->estado_validacion,
            'comentarios' => $request->filled('comentarios')
                ? trim((string) $request->input('comentarios'))
                : $pago->comentarios,
        ]);

        return redirect()->back()->with('success', "Pago marcado como {$request->estado_validacion} correctamente.");
    }

    /**
     * Visualiza el comprobante PDF del pago desde Supabase Storage (carpeta pagos_alumnos).
     */
    public function verDocumento(Request $request, Pago $pago): SymfonyResponse
    {
        if (! $pago->referencia_bancaria) {
            abort(404, 'Este pago aún no cuenta con un comprobante registrado por el alumno.');
        }

        $filename = basename($pago->referencia_bancaria);
        if (! str_ends_with(strtolower($filename), '.pdf')) {
            $filename .= '.pdf';
        }

        $s3Path = "pagos_alumnos/{$filename}";
        $pdfContent = null;

        try {
            if ($this->s3()->exists($s3Path)) {
                $pdfContent = $this->s3()->get($s3Path);
            }
        } catch (\Throwable $e) {
            Log::warning("Error al leer comprobante {$s3Path} desde S3 en Admin: {$e->getMessage()}");
        }

        if (! $pdfContent) {
            $pago->loadMissing(['conceptoPago', 'usuario']);
            $alumno = Alumno::where('id_usuario', $pago->id_usuario)->with('carrera')->first();
            $refCodigo = preg_replace('/\.pdf$/i', '', $filename);
            $serieFolio = 'THS-' . date('Y') . '-' . str_pad((string) $pago->id_pago, 5, '0', STR_PAD_LEFT);
            $matricula = $alumno?->matricula ?? "USR-{$pago->id_usuario}";
            $claveConcepto = $pago->conceptoPago?->clave ?? 'TES-001';
            $cadenaOriginal = "||1.0|{$serieFolio}|{$refCodigo}|{$matricula}|"
                . number_format((float) $pago->monto, 2, '.', '')
                . "|MXN|{$claveConcepto}|" . ($pago->fecha_pago ?? $pago->updated_at ?? now())->toIso8601String() . '||';

            $selloDigital = base64_encode(hash('sha256', $cadenaOriginal . config('app.key'), false))
                . base64_encode(hash('sha256', $refCodigo . $serieFolio, false));

            $pdf = Pdf::loadView('pdfs.comprobante_pago', [
                'referenciaBancaria' => $refCodigo,
                'serieFolio' => $serieFolio,
                'nombreAlumno' => $alumno
                    ? trim("{$alumno->nombre} {$alumno->apellido_p} {$alumno->apellido_m}")
                    : ($pago->usuario?->name ?? 'Sustentante UNACH'),
                'fecha' => ($pago->fecha_pago ?? $pago->updated_at ?? now())->format('d/m/Y H:i:s'),
                'matricula' => $matricula,
                'ciclo' => date('Y') . '-' . ((int) date('n') <= 6 ? '1' : '2'),
                'semestre' => '9',
                'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Licenciatura en Ingeniería en Desarrollo y Tecnologías de Software',
                'conceptos' => [
                    [
                        'clave' => $claveConcepto,
                        'cantidad' => 1,
                        'p_unitario' => (float) $pago->monto,
                        'importe' => (float) $pago->monto,
                        'descripcion' => $pago->concepto . ($pago->conceptoPago?->descripcion ? ' — ' . $pago->conceptoPago->descripcion : ''),
                    ],
                ],
                'subtotal' => (float) $pago->monto,
                'total' => (float) $pago->monto,
                'observaciones' => 'Comprobante oficial emitido mediante modalidad: ' . ($pago->metodo_pago ?? 'Tarjeta / Ventanilla') . '.',
                'cadenaOriginal' => $cadenaOriginal,
                'selloDigital' => $selloDigital,
            ])->setPaper('letter', 'portrait');

            $pdfContent = $pdf->output();
        }

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ]);
    }
}
