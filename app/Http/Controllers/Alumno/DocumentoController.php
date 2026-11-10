<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\OficioExpediente;
use App\Models\Admin\ProrrogaExpediente;
use App\Models\Admin\RequisitoDocumento;
use Database\Seeders\RequisitosDocumentosSeeder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DocumentoController extends Controller
{
    /**
     * Obtiene el adaptador del disco S3 de Supabase (estándar compartido con PagoController y ExpedienteController).
     */
    private function s3(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        return $disk;
    }

    /**
     * Muestra la vista principal de Mis Documentos para el alumno conectada a la base de datos.
     */
    public function index(Request $request): Response
    {
        // Garantizar que el catálogo de requisitos esté sembrado
        if (RequisitoDocumento::count() === 0) {
            app(RequisitosDocumentosSeeder::class)->run();
        }

        $userId = (int) $request->user()->id;

        $alumno = Alumno::with([
            'proyectos' => fn ($q) => $q->latest('tblproyectos.id_proyecto'),
            'oficiosExpediente.requisito',
            'prorrogasExpediente',
        ])->findOrFail($userId);

        $proyecto = $alumno->proyectos->first();

        $requisitos = RequisitoDocumento::where('activo', true)
            ->orderBy('etapa')
            ->orderBy('orden')
            ->get();

        $oficiosPorRequisito = $alumno->oficiosExpediente
            ->whereNotNull('id_requisito')
            ->keyBy('id_requisito');

        $oficiosPorNombre = $alumno->oficiosExpediente
            ->keyBy(fn (OficioExpediente $o) => Str::lower(trim($o->tipo_oficio)));

        /*
         * TODO (Validaciones futuras):
         * Aquí se activará el candado secuencial por etapa (ej. no habilitar carga en Etapa 3 o 4
         * hasta que todos los documentos obligatorios de la Etapa 1 tengan estado_validacion === 'Validado',
         * y bloquear entregas automáticamente al superar los 60 días desde fecha_ingreso / apertura de etapa
         * salvo que exista una ProrrogaExpediente con estado === 'Aprobada').
         * Por ahora se mantienen abiertas las entregas para demostración y presentación del sistema.
         */

        $documentosMapeados = $requisitos->map(function ($req) use ($proyecto, $oficiosPorRequisito, $oficiosPorNombre) {
            if ($req->es_vinculo_anteproyecto) {
                $tieneAnteproyecto = (bool) ($proyecto && $proyecto->ruta_documento && trim($proyecto->ruta_documento) !== '');

                return [
                    'id_requisito' => $req->id_requisito,
                    'clave' => $req->clave,
                    'title' => $req->nombre,
                    'desc' => $req->descripcion,
                    'etapa' => $req->etapa,
                    'obligatorio' => $req->obligatorio,
                    'isSystem' => true,
                    'isAnteproyectoLink' => true,
                    'isUploaded' => $tieneAnteproyecto,
                    'id_oficio' => null,
                    'fileName' => $tieneAnteproyecto ? basename((string) $proyecto->ruta_documento) : 'Sin anteproyecto cargado en Mi Anteproyecto',
                    'estadoValidacion' => $proyecto?->estado ?? 'Pendiente',
                    'observaciones' => $proyecto?->observaciones_coordinacion,
                    'fechaSubida' => $proyecto?->fecha_envio?->format('d/m/Y H:i') ?? $proyecto?->updated_at?->format('d/m/Y H:i'),
                    'urlVisor' => $tieneAnteproyecto ? route('alumno.expediente.anteproyecto.documento') : null,
                ];
            }

            /** @var OficioExpediente|null $oficio */
            $oficio = $oficiosPorRequisito->get($req->id_requisito)
                ?? $oficiosPorNombre->get(Str::lower(trim($req->nombre)));

            $tieneArchivo = (bool) ($oficio && $oficio->url_archivo && trim($oficio->url_archivo) !== '');

            return [
                'id_requisito' => $req->id_requisito,
                'clave' => $req->clave,
                'title' => $req->nombre,
                'desc' => $req->descripcion,
                'etapa' => $req->etapa,
                'obligatorio' => $req->obligatorio,
                'isSystem' => $req->es_sistema,
                'isAnteproyectoLink' => false,
                'isUploaded' => $tieneArchivo,
                'id_oficio' => $oficio?->id_oficio,
                'fileName' => $tieneArchivo ? basename((string) $oficio->url_archivo) : '',
                'estadoValidacion' => $oficio?->estado_validacion ?? 'Pendiente',
                'observaciones' => $oficio?->observaciones,
                'fechaSubida' => $oficio?->updated_at?->format('d/m/Y H:i'),
                'urlVisor' => ($tieneArchivo && $oficio) ? route('alumno.expediente.oficio.documento', $oficio->id_oficio) : null,
            ];
        });

        $totalDocs = $documentosMapeados->count();
        $subidosDocs = $documentosMapeados->where('isUploaded', true)->count();
        $porcentaje = $totalDocs > 0 ? (int) round(($subidosDocs / $totalDocs) * 100) : 0;

        // Historial del minichat de prórrogas (incluyendo el aviso inicial institucional)
        $mensajesBase = [
            [
                'id' => 0,
                'etapa' => 1,
                'emisor' => 'admin',
                'nombre' => 'Coordinación de Titulación',
                'fecha' => 'Aviso Reglamentario',
                'mensaje' => 'Recuerda que cuentas con un plazo reglamentario de 60 días para completar cada etapa documental. Si tu plazo vence, puedes enviar tu justificación por este medio para solicitar una prórroga.',
                'estado' => 'Informativo',
            ],
        ];

        $mensajesDb = $alumno->prorrogasExpediente->map(fn (ProrrogaExpediente $p) => [
            'id' => $p->id_prorroga,
            'etapa' => $p->etapa,
            'emisor' => $p->emisor,
            'nombre' => $p->emisor === 'alumno' ? 'Tú (Sustentante)' : 'Coordinación de Titulación',
            'fecha' => $p->created_at?->format('d/m/Y H:i') ?? 'Reciente',
            'mensaje' => $p->mensaje,
            'estado' => $p->estado,
        ])->values()->all();

        return Inertia::render('Alumno/documentos/index', [
            'documentosPorEtapa' => [
                'etapa1' => $documentosMapeados->where('etapa', 1)->values(),
                'etapa2' => $documentosMapeados->where('etapa', 2)->values(),
                'etapa3' => $documentosMapeados->where('etapa', 3)->values(),
                'etapa4' => $documentosMapeados->where('etapa', 4)->values(),
            ],
            'resumen' => [
                'total_requeridos' => $totalDocs,
                'total_subidos' => $subidosDocs,
                'porcentaje' => $porcentaje,
            ],
            'historialChat' => array_merge($mensajesBase, $mensajesDb),
        ]);
    }

    /**
     * Sube un documento PDF del alumno a Supabase S3 (carpeta oficios/) y lo registra en tbloficios_expedientes.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_requisito' => ['required', 'integer', 'exists:tblrequisitos_documentos,id_requisito'],
            'documento' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ], [
            'documento.required' => 'Debes seleccionar un archivo PDF para subir.',
            'documento.mimes' => 'El documento debe estar estrictamente en formato PDF.',
            'documento.max' => 'El archivo PDF no debe superar los 10 MB.',
        ]);

        $userId = (int) Auth::id();
        $alumno = Alumno::findOrFail($userId);
        $requisito = RequisitoDocumento::findOrFail($validated['id_requisito']);

        if ($requisito->es_vinculo_anteproyecto) {
            return back()->with('error', 'El protocolo de anteproyecto se gestiona directamente desde el módulo Mi Anteproyecto.');
        }

        $archivo = $request->file('documento');
        $matricula = preg_replace('/[^A-Za-z0-9\-]/', '', (string) ($alumno->matricula ?: "ALU{$userId}"));
        $claveLimpia = preg_replace('/[^A-Za-z0-9\-]/', '', $requisito->clave);
        $nombreOriginalLimpio = Str::slug(pathinfo($archivo->getClientOriginalName(), PATHINFO_FILENAME));
        $nombreOriginalLimpio = Str::limit($nombreOriginalLimpio ?: 'documento', 40, '');

        $nombreArchivo = "UNACH-{$claveLimpia}-{$matricula}-{$nombreOriginalLimpio}-".time().'.pdf';
        $s3Path = "oficios/{$nombreArchivo}";
        $pdfContent = file_get_contents($archivo->getRealPath());

        // Subimos el archivo al bucket de Supabase S3 en la carpeta oficios/ (donde lee ExpedienteController)
        try {
            $this->s3()->put($s3Path, $pdfContent);
        } catch (\Throwable $e) {
            Log::error("Error al subir documento de expediente a Supabase ({$s3Path}): {$e->getMessage()}");
        }

        // Respaldo local en caso de operar sin conexión a internet
        try {
            Storage::disk('local')->put($s3Path, $pdfContent);
        } catch (\Throwable) {
            // Ignorar si falla respaldo local
        }

        // Buscar si ya existía un registro previo de este requisito para este alumno
        $oficioExistente = OficioExpediente::where('id_usuario', $userId)
            ->where(function ($q) use ($requisito) {
                $q->where('id_requisito', $requisito->id_requisito)
                    ->orWhere('tipo_oficio', $requisito->nombre);
            })
            ->first();

        // Si ya existía un archivo anterior, lo eliminamos de Supabase para no dejar basura
        if ($oficioExistente && $oficioExistente->url_archivo) {
            $viejoFilename = basename($oficioExistente->url_archivo);
            try {
                $this->s3()->delete("oficios/{$viejoFilename}");
                Storage::disk('local')->delete("oficios/{$viejoFilename}");
            } catch (\Throwable $e) {
                Log::warning("No se pudo eliminar archivo previo en Supabase (oficios/{$viejoFilename}): {$e->getMessage()}");
            }
        }

        if ($oficioExistente) {
            $oficioExistente->update([
                'id_requisito' => $requisito->id_requisito,
                'tipo_oficio' => $requisito->nombre,
                'url_archivo' => $nombreArchivo, // Guardamos únicamente el nombre limpio del archivo (igual que en Pagos)
                'estado_validacion' => 'Pendiente',
                'observaciones' => null,
            ]);
        } else {
            OficioExpediente::create([
                'id_usuario' => $userId,
                'id_requisito' => $requisito->id_requisito,
                'tipo_oficio' => $requisito->nombre,
                'url_archivo' => $nombreArchivo, // Guardamos únicamente el nombre limpio del archivo (igual que en Pagos)
                'estado_validacion' => 'Pendiente',
            ]);
        }

        return back()->with('success', "El documento \"{$requisito->nombre}\" se subió correctamente a tu expediente digital.");
    }

    /**
     * Elimina un documento subido por el alumno para permitirle cargar otro.
     */
    public function destroy(OficioExpediente $oficio): RedirectResponse
    {
        $userId = (int) Auth::id();

        abort_unless((int) $oficio->id_usuario === $userId, 403, 'No tienes permiso para eliminar este documento.');

        /*
         * TODO (Validaciones futuras):
         * Cuando se activen las validaciones administrativas, impedir eliminar si
         * $oficio->estado_validacion === 'Validado'.
         */

        if ($oficio->url_archivo) {
            $archivoLimpio = basename($oficio->url_archivo);
            try {
                $this->s3()->delete("oficios/{$archivoLimpio}");
                Storage::disk('local')->delete("oficios/{$archivoLimpio}");
            } catch (\Throwable $e) {
                Log::warning("No se pudo eliminar oficios/{$archivoLimpio} de S3: {$e->getMessage()}");
            }
        }

        $nombreDoc = $oficio->tipo_oficio;
        $oficio->delete();

        return back()->with('success', "Se eliminó el archivo de \"{$nombreDoc}\". Puedes cargar uno nuevo cuando lo desees.");
    }

    /**
     * Registra un mensaje o solicitud de prórroga en el minichat del expediente.
     */
    public function enviarProrroga(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'etapa' => ['required', 'integer', 'min:1', 'max:5'],
            'mensaje' => ['required', 'string', 'max:1000'],
        ], [
            'mensaje.required' => 'Por favor escribe el motivo de tu solicitud de prórroga.',
            'mensaje.max' => 'El mensaje no puede exceder los 1,000 caracteres.',
        ]);

        $userId = (int) Auth::id();

        ProrrogaExpediente::create([
            'id_usuario' => $userId,
            'etapa' => $validated['etapa'],
            'emisor' => 'alumno',
            'mensaje' => trim($validated['mensaje']),
            'estado' => 'Pendiente',
        ]);

        return back()->with('success', 'Tu mensaje de solicitud de prórroga fue enviado a Coordinación de Titulación.');
    }
}
