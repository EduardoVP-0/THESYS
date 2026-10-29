<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Pago;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

    /**
     * Muestra la vista de Pagos del alumno con sus aranceles asignados.
     */
    public function index(): Response
    {
        $pagos = Pago::where('id_usuario', Auth::id())
            ->with('conceptoPago')
            ->orderBy('id_pago', 'asc')
            ->get()
            ->map(function (Pago $pago) {
                $tieneComprobante = ! empty($pago->referencia_bancaria);

                return [
                    'id_pago' => $pago->id_pago,
                    'id_usuario' => $pago->id_usuario,
                    'id_concepto' => $pago->id_concepto,
                    'concepto' => $pago->concepto,
                    'monto' => (float) $pago->monto,
                    'referencia_bancaria' => $pago->referencia_bancaria,
                    'metodo_pago' => $pago->metodo_pago,
                    'estado_validacion' => $pago->estado_validacion,
                    'comentarios' => $pago->comentarios,
                    'fecha_pago' => $pago->fecha_pago?->toIso8601String(),
                    'created_at' => $pago->created_at?->toIso8601String(),
                    'updated_at' => $pago->updated_at?->toIso8601String(),
                    'concepto_pago' => $pago->conceptoPago,
                    'url_comprobante' => $tieneComprobante
                        ? route('alumno.pagos.documento', ['pago' => $pago->id_pago])
                        : null,
                    'url_descarga' => $tieneComprobante
                        ? route('alumno.pagos.documento', ['pago' => $pago->id_pago, 'download' => 1])
                        : null,
                ];
            });

        return Inertia::render('Alumno/pagos/index', [
            'pagos' => $pagos,
        ]);
    }

    /**
     * Muestra el formulario para realizar / registrar un nuevo pago.
     */
    public function create(Request $request): Response
    {
        $userId = Auth::id();
        $idPago = $request->query('id_pago');

        $query = Pago::where('id_usuario', $userId)->with('conceptoPago');

        if ($idPago) {
            $pago = (clone $query)->find($idPago);
        } else {
            $pago = (clone $query)
                ->whereIn('estado_validacion', ['Pendiente', 'Rechazado'])
                ->orderBy('id_pago', 'asc')
                ->first();
        }

        if (! $pago) {
            $pago = $query->orderBy('id_pago', 'asc')->first();
        }

        $alumno = Alumno::where('id_usuario', $userId)
            ->with(['carrera', 'proyectos'])
            ->first();

        $proyecto = $alumno?->proyectos?->first();
        $claveConcepto = $pago?->conceptoPago?->clave ?? 'REV';
        $sufijo = str_pad((string) ($pago?->id_pago ?? 1), 3, '0', STR_PAD_LEFT);
        $referenciaSugerida = "UNACH-{$claveConcepto}-" . date('Y') . "-{$sufijo}";

        $tieneComprobante = ! empty($pago?->referencia_bancaria);

        return Inertia::render('Alumno/pagos/create-pago', [
            'pago' => $pago ? [
                'id_pago' => $pago->id_pago,
                'id_concepto' => $pago->id_concepto,
                'concepto' => $pago->concepto,
                'descripcion' => $pago->conceptoPago?->descripcion ?? 'Arancel oficial del proceso de titulación.',
                'clave' => $pago->conceptoPago?->clave ?? 'TES-001',
                'monto' => (float) $pago->monto,
                'referencia_bancaria' => $pago->referencia_bancaria,
                'metodo_pago' => $pago->metodo_pago,
                'estado_validacion' => $pago->estado_validacion,
                'comentarios' => $pago->comentarios,
                'url_comprobante' => $tieneComprobante
                    ? route('alumno.pagos.documento', ['pago' => $pago->id_pago])
                    : null,
                'url_descarga' => $tieneComprobante
                    ? route('alumno.pagos.documento', ['pago' => $pago->id_pago, 'download' => 1])
                    : null,
            ] : null,
            'alumno' => [
                'nombre_completo' => $alumno
                    ? trim("{$alumno->nombre} {$alumno->apellido_p} {$alumno->apellido_m}")
                    : Auth::user()?->name,
                'matricula' => $alumno?->matricula ?? 'S/M',
                'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Ingeniería en Desarrollo y Tecnologías de Software',
                'tesis_titulo' => $proyecto?->titulo ?? 'Proyecto de titulación registrado en THESYS',
            ],
            'referenciaSugerida' => $referenciaSugerida,
        ]);
    }

    /**
     * Registra el pago del alumno, genera el comprobante PDF y lo sube a Supabase (pagos_alumnos).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_pago' => ['required', 'integer', 'exists:tblpagos,id_pago'],
            'metodo_pago' => ['required', 'string', 'in:card,cash'],
            'referencia_codigo' => ['nullable', 'string', 'max:80'],
        ]);

        $userId = Auth::id();
        $pago = Pago::where('id_usuario', $userId)
            ->with('conceptoPago')
            ->findOrFail($validated['id_pago']);

        $claveConcepto = $pago->conceptoPago?->clave ?? 'TES-001';
        $sufijoPago = str_pad((string) $pago->id_pago, 3, '0', STR_PAD_LEFT);
        $randomPin = random_int(100, 999);

        // Generamos código de referencia único sin extensión .pdf para mostrar en la plantilla
        $refBase = $validated['referencia_codigo'] ?? "UNACH-{$claveConcepto}-" . date('Y') . "-{$sufijoPago}";
        $refBase = preg_replace('/\.pdf$/i', '', trim($refBase));

        // Si ya existe otro pago con ese mismo nombre de archivo, agregamos sufijo único
        $nombreArchivo = "{$refBase}.pdf";
        $existeOtro = Pago::where('referencia_bancaria', $nombreArchivo)
            ->where('id_pago', '!=', $pago->id_pago)
            ->exists();

        if ($existeOtro || $pago->estado_validacion === 'Rechazado') {
            $refBase = "{$refBase}-{$randomPin}";
            $nombreArchivo = "{$refBase}.pdf";
        }

        $metodoTexto = $validated['metodo_pago'] === 'card'
            ? 'Tarjeta de crédito o débito'
            : 'Pago en persona (Ventanilla)';

        // Generamos el contenido binario del PDF con el diseño oficial de referencia bancaria
        $pdfContent = $this->generarPdfComprobante($pago, $refBase, $metodoTexto);

        // Guardamos en Supabase S3 dentro de la carpeta pagos_alumnos/
        try {
            $this->s3()->put("pagos_alumnos/{$nombreArchivo}", $pdfContent);
        } catch (\Throwable $e) {
            Log::error("Error al subir comprobante a Supabase (pagos_alumnos/{$nombreArchivo}): {$e->getMessage()}");
        }

        // Actualizamos el registro en tblpagos guardando el nombre con .pdf en referencia_bancaria
        $pago->update([
            'referencia_bancaria' => $nombreArchivo,
            'metodo_pago' => $metodoTexto,
            'estado_validacion' => 'Pendiente', // Queda pendiente de validación por Admin (en vista de alumno se muestra como 'En revisión')
            'comentarios' => null,
            'fecha_pago' => now(),
        ]);

        return redirect()->route('alumno.pagos.create', ['id_pago' => $pago->id_pago])
            ->with('success', 'El pago ha sido procesado y el comprobante fue generado correctamente.');
    }

    /**
     * Visualiza o descarga el comprobante PDF desde Supabase Storage (carpeta pagos_alumnos).
     */
    public function verDocumento(Request $request, Pago $pago): SymfonyResponse
    {
        if ((int) $pago->id_usuario !== (int) Auth::id()) {
            abort(403, 'No tienes permiso para consultar este comprobante.');
        }

        if (! $pago->referencia_bancaria) {
            abort(404, 'Este pago aún no cuenta con un comprobante generado.');
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
            Log::warning("No se pudo leer {$s3Path} desde S3, regenerando en memoria: {$e->getMessage()}");
        }

        // Respaldo: si no se encontró en S3, lo generamos al vuelo y lo subimos
        if (! $pdfContent) {
            $refBase = preg_replace('/\.pdf$/i', '', $filename);
            $pdfContent = $this->generarPdfComprobante(
                $pago->loadMissing('conceptoPago'),
                $refBase,
                $pago->metodo_pago ?? 'Tarjeta de crédito o débito'
            );

            try {
                $this->s3()->put($s3Path, $pdfContent);
            } catch (\Throwable) {
                // Ignorar si S3 falla temporalmente
            }
        }

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ]);
    }

    /**
     * Construye el PDF utilizando la plantilla oficial de referencia bancaria.
     */
    private function generarPdfComprobante(Pago $pago, string $refCodigo, string $metodoTexto): string
    {
        $alumno = Alumno::where('id_usuario', $pago->id_usuario)
            ->with('carrera')
            ->first();

        $user = Auth::user();
        $nombreAlumno = $alumno
            ? trim("{$alumno->nombre} {$alumno->apellido_p} {$alumno->apellido_m}")
            : ($user?->name ?? 'Sustentante UNACH');

        $matricula = $alumno?->matricula ?? "USR-{$pago->id_usuario}";
        $carrera = $alumno?->carrera?->nombre_carrera ?? 'Licenciatura en Ingeniería en Desarrollo y Tecnologías de Software';
        $serieFolio = 'THS-' . date('Y') . '-' . str_pad((string) $pago->id_pago, 5, '0', STR_PAD_LEFT);
        $fechaEmision = ($pago->fecha_pago ?? now())->format('d/m/Y H:i:s');
        $ciclo = date('Y') . '-' . ((int) date('n') <= 6 ? '1' : '2');

        $claveConcepto = $pago->conceptoPago?->clave ?? 'TES-001';
        $descripcionConcepto = $pago->concepto;
        if ($pago->conceptoPago?->descripcion) {
            $descripcionConcepto .= ' — ' . $pago->conceptoPago->descripcion;
        }

        $conceptos = [
            [
                'clave' => $claveConcepto,
                'cantidad' => 1,
                'p_unitario' => (float) $pago->monto,
                'importe' => (float) $pago->monto,
                'descripcion' => $descripcionConcepto,
            ],
        ];

        $observaciones = "Comprobante oficial emitido mediante modalidad: {$metodoTexto}. "
            . 'Este documento ampara la recepción del pago y se encuentra sujeto a validación administrativa en el Sistema Integral THESYS.';

        $cadenaOriginal = "||1.0|{$serieFolio}|{$refCodigo}|{$matricula}|"
            . number_format((float) $pago->monto, 2, '.', '')
            . "|MXN|{$claveConcepto}|" . now()->toIso8601String() . '||';

        $selloDigital = base64_encode(hash('sha256', $cadenaOriginal . config('app.key'), false))
            . base64_encode(hash('sha256', $refCodigo . $serieFolio, false));

        $pdf = Pdf::loadView('pdfs.comprobante_pago', [
            'referenciaBancaria' => $refCodigo,
            'serieFolio' => $serieFolio,
            'nombreAlumno' => $nombreAlumno,
            'fecha' => $fechaEmision,
            'matricula' => $matricula,
            'ciclo' => $ciclo,
            'semestre' => '9',
            'carrera' => $carrera,
            'conceptos' => $conceptos,
            'subtotal' => (float) $pago->monto,
            'total' => (float) $pago->monto,
            'observaciones' => $observaciones,
            'cadenaOriginal' => $cadenaOriginal,
            'selloDigital' => $selloDigital,
        ])->setPaper('letter', 'portrait');

        return $pdf->output();
    }
}
