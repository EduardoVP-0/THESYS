<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AlumnoTesisAsesorController extends Controller
{
    /**
     * Muestra la vista de Mi Tesis (Director de Tesis) con el historial de versiones
     * y las revisiones/observaciones de su asesor asignado.
     */
    public function index(Request $request): Response
    {
        $alumno = Alumno::with('carrera')->find($request->user()->id);

        $proyecto = $alumno
            ? $alumno->proyectos()->with(['asesores.user'])->latest('tblproyectos.id_proyecto')->first()
            : null;

        $asignacionAsesor = null;
        if ($proyecto) {
            $asignacionAsesor = AsignacionAsesor::with('docente.user')
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                ->latest('id_asesor_proyecto')
                ->first();

            if (! $asignacionAsesor) {
                $asignacionAsesor = AsignacionAsesor::with('docente.user')
                    ->where('id_proyecto', $proyecto->id_proyecto)
                    ->latest('id_asesor_proyecto')
                    ->first();
            }
        }

        $versionesCollection = collect();
        if ($proyecto) {
            $versionesCollection = VersionTesis::with(['revisiones.asignacionAsesor.docente.user'])
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->orderByDesc('id_version')
                ->get();
        }

        $versionesData = $versionesCollection->map(function (VersionTesis $version) use ($asignacionAsesor) {
            // Buscar la revisión del asesor actual o la última registrada para esta versión
            $revision = null;
            if ($asignacionAsesor) {
                $revision = $version->revisiones
                    ->where('id_asesor_proyecto', $asignacionAsesor->id_asesor_proyecto)
                    ->first();
            }
            if (! $revision) {
                $revision = $version->revisiones->sortByDesc('id_revision')->first();
            }

            $estadoRaw = $revision ? $revision->estado_revision : RevisionAsesor::ESTADO_PENDIENTE;

            // Mapeo visual amigable: "Pendiente" -> "En revisión"
            $estadoLabel = match ($estadoRaw) {
                RevisionAsesor::ESTADO_APROBADA, 'Aprobado' => 'Aprobado',
                RevisionAsesor::ESTADO_CON_CAMBIOS, 'Rechazada' => 'Con cambios',
                default => 'En revisión',
            };

            $docenteRevisor = $revision?->asignacionAsesor?->docente ?? $asignacionAsesor?->docente;

            return [
                'id_version' => $version->id_version,
                'numero_version' => $version->numero_version,
                'comentario_alumno' => $version->comentario_alumno,
                'nombre_archivo' => basename($version->ruta_archivo),
                'url_archivo' => route('alumno.tesis-asesor.documento', $version->id_version),
                'fecha_envio' => $version->created_at?->format('d/m/Y H:i'),
                'estado_revision' => $estadoRaw,
                'estado_label' => $estadoLabel,
                'observaciones' => $revision?->observaciones,
                'fecha_revision' => $revision && $revision->estado_revision !== RevisionAsesor::ESTADO_PENDIENTE
                    ? $revision->updated_at?->format('d/m/Y H:i')
                    : null,
                'asesor_revisor' => $docenteRevisor ? [
                    'nombre_completo' => $docenteRevisor->nombre_completo,
                    'grado_academico' => $docenteRevisor->grado_academico,
                ] : null,
            ];
        })->values();

        // Determinar cuál es el siguiente número de versión (ej: "Versión 1", "Versión 2"...)
        $totalVersiones = $versionesData->count();
        $siguienteNumero = $totalVersiones + 1;
        $siguienteVersionTexto = "Versión {$siguienteNumero}";

        // Determinar estado global y si puede subir una nueva versión
        $ultimaVersion = $versionesData->first();
        $tieneAsesor = (bool) $asignacionAsesor;
        $estadoGlobal = 'Sin entregas';
        $puedeSubir = false;
        $motivoBloqueo = null;

        if (! $proyecto) {
            $motivoBloqueo = 'Primero debes registrar y tener aprobado tu anteproyecto.';
        } elseif (! $tieneAsesor) {
            $motivoBloqueo = 'No puedes subir versiones hasta tener un asesor asignado.';
        } elseif (! $ultimaVersion) {
            // Tiene proyecto y asesor, y va a subir la Versión 1
            $puedeSubir = true;
            $estadoGlobal = 'Listo para primera entrega';
        } else {
            $estadoUltima = $ultimaVersion['estado_label'];
            $estadoGlobal = $estadoUltima;

            if ($estadoUltima === 'En revisión') {
                $puedeSubir = false;
                $motivoBloqueo = "Tu {$ultimaVersion['numero_version']} está en revisión por tu director de tesis. Se habilitará de nuevo si solicita cambios.";
            } elseif ($estadoUltima === 'Aprobado') {
                $puedeSubir = false;
                $motivoBloqueo = '¡Felicidades! Tu tesis ha sido aprobada por tu director de tesis. Ya no es necesario subir más versiones.';
            } elseif ($estadoUltima === 'Con cambios') {
                $puedeSubir = true;
            }
        }

        return Inertia::render('Alumno/tesis_asesor/index', [
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'estado' => $proyecto->estado,
            ] : null,
            'asesor' => $asignacionAsesor?->docente ? [
                'id_asesor_proyecto' => $asignacionAsesor->id_asesor_proyecto,
                'nombre_completo' => $asignacionAsesor->docente->nombre_completo,
                'grado_academico' => $asignacionAsesor->docente->grado_academico,
                'especialidad' => $asignacionAsesor->docente->especialidad,
                'email' => $asignacionAsesor->docente->user?->email,
            ] : null,
            'versiones' => $versionesData,
            'controlCarga' => [
                'puede_subir' => $puedeSubir,
                'siguiente_version' => $siguienteVersionTexto,
                'siguiente_numero' => $siguienteNumero,
                'estado_global' => $estadoGlobal,
                'motivo_bloqueo' => $motivoBloqueo,
                'tiene_asesor' => $tieneAsesor,
            ],
        ]);
    }

    /**
     * Registra una nueva versión de tesis (Versión 1, Versión 2, etc.) y crea su registro
     * en `tblrevisiones_asesor` en estado Pendiente (En revisión).
     */
    public function store(Request $request): RedirectResponse
    {
        $alumno = Alumno::find($request->user()->id);

        if (! $alumno) {
            return redirect()->back()->with('error', 'No se encontró un expediente de alumno asociado a tu cuenta.');
        }

        $proyecto = $alumno->proyectos()->latest('tblproyectos.id_proyecto')->first();

        if (! $proyecto) {
            return redirect()->back()->with('error', 'No cuentas con un proyecto registrado para subir versiones de tesis.');
        }

        $asignacionAsesor = AsignacionAsesor::where('id_proyecto', $proyecto->id_proyecto)
            ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
            ->latest('id_asesor_proyecto')
            ->first()
            ?? AsignacionAsesor::where('id_proyecto', $proyecto->id_proyecto)
                ->latest('id_asesor_proyecto')
                ->first();

        if (! $asignacionAsesor) {
            return redirect()->back()->with('error', 'No puedes subir versiones hasta tener un asesor asignado.');
        }

        // Verificar que la última versión no esté ya "En revisión" ni "Aprobada"
        $ultimaVersion = VersionTesis::with('revisiones')
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->orderByDesc('id_version')
            ->first();

        if ($ultimaVersion) {
            $ultimaRevision = $ultimaVersion->revisiones
                ->where('id_asesor_proyecto', $asignacionAsesor->id_asesor_proyecto)
                ->first()
                ?? $ultimaVersion->revisiones->sortByDesc('id_revision')->first();

            $estadoUltima = $ultimaRevision ? $ultimaRevision->estado_revision : RevisionAsesor::ESTADO_PENDIENTE;

            if ($estadoUltima === RevisionAsesor::ESTADO_PENDIENTE || $estadoUltima === 'En revisión') {
                return redirect()->back()->with('error', 'Ya tienes una versión en revisión. Espera el dictamen de tu asesor.');
            }

            if (in_array($estadoUltima, [RevisionAsesor::ESTADO_APROBADA, 'Aprobado'], true)) {
                return redirect()->back()->with('error', 'Tu tesis ya fue aprobada por tu director de tesis.');
            }
        }

        $validated = $request->validate([
            'archivo' => ['required', 'file', 'mimes:pdf', 'max:10240'], // Máx 10 MB
            'comentario_alumno' => ['nullable', 'string', 'max:1000'],
        ], [
            'archivo.required' => 'Debes seleccionar el archivo PDF de tu versión de tesis.',
            'archivo.mimes' => 'El archivo debe estar estrictamente en formato PDF (.pdf).',
            'archivo.max' => 'El archivo PDF no debe superar los 10 MB.',
            'comentario_alumno.max' => 'El comentario no puede exceder los 1,000 caracteres.',
        ]);

        $conteoActual = VersionTesis::where('id_proyecto', $proyecto->id_proyecto)->count();
        $numeroSiguiente = $conteoActual + 1;
        $etiquetaVersion = "Versión {$numeroSiguiente}";

        $rutaArchivo = $this->almacenarPdfEnSupabase(
            $request->file('archivo'),
            $alumno->matricula,
            $numeroSiguiente
        );

        DB::transaction(function () use ($proyecto, $asignacionAsesor, $etiquetaVersion, $validated, $rutaArchivo): void {
            $nuevaVersion = VersionTesis::create([
                'id_proyecto' => $proyecto->id_proyecto,
                'numero_version' => $etiquetaVersion,
                'comentario_alumno' => isset($validated['comentario_alumno']) && trim($validated['comentario_alumno']) !== ''
                    ? trim($validated['comentario_alumno'])
                    : null,
                'ruta_archivo' => $rutaArchivo,
            ]);

            RevisionAsesor::create([
                'id_version' => $nuevaVersion->id_version,
                'id_asesor_proyecto' => $asignacionAsesor->id_asesor_proyecto,
                'estado_revision' => RevisionAsesor::ESTADO_PENDIENTE,
                'observaciones' => null,
            ]);
        });

        return redirect()->route('alumno.tesis-asesor.index')
            ->with('success', "{$etiquetaVersion} enviada correctamente. Ahora se encuentra en revisión por tu director de tesis.");
    }

    /**
     * Visualiza en línea el PDF de una versión de tesis entregada por el alumno.
     */
    public function verDocumento(Request $request, VersionTesis $version): SymfonyResponse
    {
        $alumno = Alumno::find($request->user()->id);

        $perteneceAlAlumno = $alumno && $alumno->proyectos()
            ->where('tblproyectos.id_proyecto', $version->id_proyecto)
            ->exists();

        abort_unless($perteneceAlAlumno, 403, 'No tienes permiso para visualizar este documento.');

        abort_unless(
            $version->ruta_archivo && trim($version->ruta_archivo) !== '',
            404,
            'Esta versión no cuenta con un archivo adjunto.'
        );

        /** @var FilesystemAdapter $s3 */
        $s3 = Storage::disk('s3');
        $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');

        $cleanPath = $version->ruta_archivo;
        if (str_contains($cleanPath, 'http://') || str_contains($cleanPath, 'https://')) {
            if (str_contains($cleanPath, "/{$bucket}/")) {
                $cleanPath = Str::after($cleanPath, "/{$bucket}/");
            } else {
                $cleanPath = basename($cleanPath);
            }
        }

        $cleanPath = ltrim($cleanPath, '/');
        $filename = basename($cleanPath);

        $candidates = [
            $cleanPath,
            "versiones_tesis/{$filename}",
            "tesis/{$filename}",
            "anteproyectos/{$filename}",
            $filename,
        ];

        $resolvedPath = null;
        foreach ($candidates as $candidate) {
            if ($s3->exists($candidate)) {
                $resolvedPath = $candidate;
                break;
            }
        }

        abort_unless(
            $resolvedPath !== null,
            404,
            "El archivo físico \"{$filename}\" no fue localizado en el almacenamiento en la nube."
        );

        return $s3->response(
            $resolvedPath,
            $filename,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
            ]
        );
    }

    /**
     * Guarda el archivo PDF de la versión de tesis en Supabase Storage (carpeta versiones_tesis)
     * y retorna únicamente el nombre del archivo para almacenarlo en la base de datos.
     */
    private function almacenarPdfEnSupabase(UploadedFile $archivo, string $matricula, int $numeroVersion): string
    {
        $nombreOriginal = pathinfo($archivo->getClientOriginalName(), PATHINFO_FILENAME);
        $nombreLimpio = Str::slug($nombreOriginal, '_') ?: 'tesis';
        $nombreLimpio = Str::limit($nombreLimpio, 50, '');
        $nombreFinal = "{$matricula}_v{$numeroVersion}_{$nombreLimpio}_".time().'.pdf';

        // Guarda físicamente en la carpeta 'versiones_tesis' en Supabase
        $archivo->storeAs('versiones_tesis', $nombreFinal, 's3');

        // Retorna únicamente el nombre del archivo para guardarlo en la base de datos
        return $nombreFinal;
    }
}
