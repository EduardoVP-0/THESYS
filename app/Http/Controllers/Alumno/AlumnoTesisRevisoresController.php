<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Docente;
use App\Models\Admin\VersionTesis;
use App\Support\Portal\FlujoRevisionTesis;
use App\Support\Portal\RevisionesRevisor;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * CONTROLADOR DE MI TESIS - REVISORES (PORTAL DEL SUSTENTANTE)
 * La tesis del sustentante es dictaminada por 2 revisores asignados por la
 * coordinación. El sustentante consulta el dictamen individual de cada
 * revisor (columnas de tblrevisores_proyectos), sube nuevas versiones y ve
 * el historial. Las versiones del flujo se almacenan en la carpeta
 * `versiones_revisores` de Supabase Storage para no mezclarse con las del
 * flujo del director de tesis.
 */
class AlumnoTesisRevisoresController extends Controller
{
    /**
     * Carpeta de Supabase Storage donde se almacenan las versiones
     * entregadas para el dictamen de los revisores.
     */
    private const CARPETA_REVISORES = 'versiones_revisores';

    /**
     * Muestra la vista de Mi Tesis (Revisores) con el estado individual de
     * los 2 revisores asignados, el historial de versiones entregadas para
     * dictamen y el control de carga de nuevas versiones.
     */
    public function index(Request $request): Response
    {
        $alumno = Alumno::with('carrera')->find($request->user()->id);

        $proyecto = $alumno
            ? $alumno->proyectos()->latest('tblproyectos.id_proyecto')->first()
            : null;

        $revisores = collect();

        if ($proyecto) {
            // Revisores activos del proyecto ordenados por su registro en la
            // tabla pivote para conservar las etiquetas Revisor 1 / Revisor 2.
            $revisores = $proyecto->revisores()
                ->with('user')
                ->withPivot(
                    'id_revisor_proyecto',
                    'estado_revision',
                    'comentarios_revision',
                    'fecha_revision',
                )
                ->orderBy('tblrevisores_proyectos.id_revisor_proyecto')
                ->get()
                ->filter(fn (Docente $docente) => $docente->pivot->estado_asignacion === 'Activo')
                ->values();
        }

        // Estado individual de cada revisor (columnas de tblrevisores_proyectos)
        $revisoresCard = $revisores->values()->map(function (Docente $docente, int $indice): array {
            $estadoRevision = $docente->pivot->estado_revision ?? RevisionesRevisor::ESTADO_PENDIENTE;

            return [
                'id_usuario' => (int) $docente->id_usuario,
                'etiqueta' => 'Revisor '.($indice + 1),
                'nombre_completo' => $docente->nombre_completo,
                'iniciales' => $docente->iniciales,
                'grado_academico' => $docente->grado_academico,
                'especialidad' => $docente->especialidad,
                'email' => $docente->user?->email,
                'estado_label' => RevisionesRevisor::etiqueta($estadoRevision),
                'observaciones' => $docente->pivot->comentarios_revision,
                'fecha_revision' => $estadoRevision !== RevisionesRevisor::ESTADO_PENDIENTE && $docente->pivot->fecha_revision
                    ? Carbon::parse($docente->pivot->fecha_revision)->format('d/m/Y H:i')
                    : null,
            ];
        })->values();

        // Solo las versiones del flujo de revisores (almacenadas en la carpeta
        // versiones_revisores de Supabase), excluyendo las del asesor.
        $versionesCollection = collect();

        if ($proyecto) {
            $versionesCollection = VersionTesis::query()
                ->where('id_proyecto', $proyecto->id_proyecto)
                ->where('ruta_archivo', 'like', '%'.self::CARPETA_REVISORES.'%')
                ->orderByDesc('id_version')
                ->get();
        }

        // Estado global del dictamen sobre la versión actual (recién subida
        // los revisores se reinician a Pendiente, por lo que las columnas de
        // la pivote corresponden siempre a la versión más reciente).
        $estadoGlobalFlujo = RevisionesRevisor::estadoGlobal(
            $revisores->pluck('pivot.estado_revision')->all(),
        );

        // Dictamen detallado de los 2 revisores para la versión actual
        $feedbackActual = $revisoresCard->map(
            fn (array $revisor): array => [
                'id_usuario' => $revisor['id_usuario'],
                'etiqueta' => $revisor['etiqueta'],
                'nombre_completo' => $revisor['nombre_completo'],
                'grado_academico' => $revisor['grado_academico'],
                'estado_label' => $revisor['estado_label'],
                'observaciones' => $revisor['observaciones'],
                'fecha' => $revisor['fecha_revision'],
            ],
        )->values()->all();

        $versionesData = $versionesCollection->map(function (VersionTesis $version, int $indice) use ($estadoGlobalFlujo, $feedbackActual): array {
            // Toda versión que deja de ser la última terminó forzosamente en
            // "Con cambios": es la única salida que habilita subir otra
            // versión (la revisión en curso bloquea la carga y un dictamen
            // aprobado la cierra por completo).
            $esUltimaVersion = $indice === 0;

            return [
                'id_version' => $version->id_version,
                'numero_version' => $version->numero_version,
                'comentario_alumno' => $version->comentario_alumno,
                'nombre_archivo' => basename($version->ruta_archivo),
                'url_archivo' => route('alumno.tesis-revisores.documento', $version->id_version),
                'fecha_envio' => $version->created_at?->format('d/m/Y H:i'),
                'estado_label' => $esUltimaVersion ? $estadoGlobalFlujo : 'Con cambios',
                'es_ultima_version' => $esUltimaVersion,
                // El dictamen detallado por revisor corresponde únicamente a
                // la versión actual (las columnas de la pivote se reinician
                // con cada nueva entrega de la tesis).
                'revisores_feedback' => $esUltimaVersion ? $feedbackActual : [],
            ];
        })->values();

        // Determinar cuál es el siguiente número de versión local del flujo
        $totalVersiones = $versionesData->count();
        $siguienteNumero = $totalVersiones + 1;
        $siguienteVersionTexto = "Versión {$siguienteNumero}";

        // Determinar estado global y si puede subir una nueva versión
        $ultimaVersion = $versionesData->first();
        $tieneDobleRevisor = $revisores->count() >= 2;
        $estadoGlobal = 'Sin entregas';
        $puedeSubir = false;
        $motivoBloqueo = null;

        // Regla de ciclo con el director de tesis: el envío a revisores solo
        // se habilita con la aprobación más reciente del director. Si al menos
        // un revisor marcó "Con cambios", primero debe re-aprobar el director.
        $desbloqueadoPorAsesor = $proyecto
            ? FlujoRevisionTesis::revisoresDesbloqueadosPorAsesor($proyecto->id_proyecto)
            : false;
        $bloqueoPorAsesor = false;

        if (! $proyecto) {
            $motivoBloqueo = 'Primero debes registrar y tener aprobado tu anteproyecto.';
        } elseif (! $tieneDobleRevisor) {
            $motivoBloqueo = 'No puedes subir versiones hasta que la coordinación asigne a tus 2 revisores.';
        } elseif (! $ultimaVersion) {
            if ($desbloqueadoPorAsesor) {
                $puedeSubir = true;
                $estadoGlobal = 'Listo para primera entrega';
            } else {
                $bloqueoPorAsesor = true;
                $motivoBloqueo = 'Tu Director de Tesis debe aprobar tu tesis antes de enviarla a los revisores.';
            }
        } else {
            $estadoGlobal = $ultimaVersion['estado_label'];

            if ($estadoGlobal === 'En revisión') {
                $puedeSubir = false;
                $motivoBloqueo = "Tu {$ultimaVersion['numero_version']} está en dictamen por tus 2 revisores. Se habilitará de nuevo si alguno solicita cambios.";
            } elseif ($estadoGlobal === 'Aprobado') {
                $puedeSubir = false;
                $motivoBloqueo = '¡Felicidades! Tu tesis fue aprobada por tus 2 revisores. Ya no es necesario subir más versiones.';
            } elseif ($desbloqueadoPorAsesor) {
                // "Con cambios" + corrección aprobada por el director:
                // puede reenviar la versión corregida a los revisores.
                $puedeSubir = true;
            } else {
                // "Con cambios" pero el director aún no re-aprueba: se bloquea
                // el envío directo a revisores y se le manda con el director.
                $bloqueoPorAsesor = true;
                $motivoBloqueo = 'Tus revisores solicitaron cambios. Primero sube la versión corregida a tu Director de Tesis y espera su aprobación para reenviarla a los revisores.';
            }
        }

        return Inertia::render('Alumno/tesis_revisores/index', [
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'estado' => $proyecto->estado,
            ] : null,
            'revisores' => $revisoresCard,
            'versiones' => $versionesData,
            'controlCarga' => [
                'puede_subir' => $puedeSubir,
                'siguiente_version' => $siguienteVersionTexto,
                'siguiente_numero' => $siguienteNumero,
                'estado_global' => $estadoGlobal,
                'motivo_bloqueo' => $motivoBloqueo,
                'tiene_revisores' => $revisores->isNotEmpty(),
                'bloqueo_por_asesor' => $bloqueoPorAsesor,
                'desbloqueado_por_asesor' => $desbloqueadoPorAsesor,
            ],
        ]);
    }

    /**
     * Registra una nueva versión de tesis (Versión 1, Versión 2, etc.) para el
     * dictamen de los revisores y reinicia el dictamen de ambos revisores al
     * estado Pendiente en la tabla tblrevisores_proyectos.
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

        $revisores = $proyecto->revisores()
            ->withPivot('estado_revision')
            ->wherePivot('estado_asignacion', 'Activo')
            ->orderBy('tblrevisores_proyectos.id_revisor_proyecto')
            ->get();

        if ($revisores->count() < 2) {
            return redirect()->back()->with('error', 'No puedes subir versiones hasta que la coordinación asigne a tus 2 revisores de anteproyecto.');
        }

        // Verificar que la última versión del flujo no esté en dictamen ni aprobada:
        // el dictamen vigente en la pivote corresponde a la última versión.
        $ultimaVersion = VersionTesis::query()
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->where('ruta_archivo', 'like', '%'.self::CARPETA_REVISORES.'%')
            ->orderByDesc('id_version')
            ->first();

        if ($ultimaVersion) {
            $estadoUltima = RevisionesRevisor::estadoGlobal(
                $revisores->pluck('pivot.estado_revision')->all(),
            );

            if ($estadoUltima === 'En revisión') {
                return redirect()->back()->with('error', 'Ya tienes una versión en dictamen. Espera la decisión de tus 2 revisores.');
            }

            if ($estadoUltima === 'Aprobado') {
                return redirect()->back()->with('error', 'Tu tesis ya fue aprobada por tus 2 revisores.');
            }
        }

        // Regla del ciclo con el director: si al menos un revisor marcó
        // "Con cambios", el alumno debe subir la corrección al director y
        // esperar su nueva aprobación antes de reenviar a revisores.
        if (! FlujoRevisionTesis::revisoresDesbloqueadosPorAsesor($proyecto->id_proyecto)) {
            return redirect()->back()->with('error', $ultimaVersion
                ? 'Tus revisores solicitaron cambios. Sube primero la versión corregida a tu Director de Tesis y espera su aprobación para reenviarla a revisores.'
                : 'Tu Director de Tesis debe aprobar tu tesis antes de enviarla a los revisores.');
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

        $conteoActual = VersionTesis::where('id_proyecto', $proyecto->id_proyecto)
            ->where('ruta_archivo', 'like', '%'.self::CARPETA_REVISORES.'%')
            ->count();
        $numeroSiguiente = $conteoActual + 1;
        $etiquetaVersion = "Versión {$numeroSiguiente}";

        $rutaArchivo = $this->almacenarPdfEnSupabase(
            $request->file('archivo'),
            $alumno->matricula,
            $numeroSiguiente
        );

        DB::transaction(function () use ($proyecto, $revisores, $etiquetaVersion, $validated, $rutaArchivo): void {
            VersionTesis::create([
                'id_proyecto' => $proyecto->id_proyecto,
                'numero_version' => $etiquetaVersion,
                'comentario_alumno' => isset($validated['comentario_alumno']) && trim($validated['comentario_alumno']) !== ''
                    ? trim($validated['comentario_alumno'])
                    : null,
                'ruta_archivo' => $rutaArchivo,
            ]);

            // Reiniciar el dictamen de los 2 revisores para la nueva versión
            foreach ($revisores as $docente) {
                $proyecto->revisores()->updateExistingPivot(
                    $docente->id_usuario,
                    RevisionesRevisor::valoresPendientes(),
                );
            }
        });

        return redirect()->route('alumno.tesis-revisores.index')
            ->with('success', "{$etiquetaVersion} enviada correctamente. Tus 2 revisores ya pueden consultarla para registrar su dictamen.");
    }

    /**
     * Visualiza en línea el PDF de una versión entregada para dictamen.
     */
    public function verDocumento(Request $request, VersionTesis $version): SymfonyResponse
    {
        $alumno = Alumno::find($request->user()->id);

        $perteneceAlAlumno = $alumno && $alumno->proyectos()
            ->where('tblproyectos.id_proyecto', $version->id_proyecto)
            ->exists();

        abort_unless($perteneceAlAlumno, 403, 'No tienes permiso para visualizar este documento.');

        abort_unless(
            $version->ruta_archivo && trim((string) $version->ruta_archivo) !== '',
            404,
            'Esta versión no cuenta con un archivo adjunto.'
        );

        /** @var FilesystemAdapter $s3 */
        $s3 = Storage::disk('s3');
        $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');

        // Soporta tanto rutas/URLs completas de Supabase como nombres de
        // archivo puros (convención actual de las versiones registradas).
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
            self::CARPETA_REVISORES."/{$filename}",
            "versiones_tesis/{$filename}",
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
     * Guarda el archivo PDF de la versión en Supabase Storage (carpeta
     * versiones_revisores) y retorna la ruta relativa dentro del bucket
     * (carpeta/archivo.pdf). Nosotros conservamos la carpeta como parte de la
     * ruta para poder discriminar los flujos de versiones por carpeta.
     */
    private function almacenarPdfEnSupabase(UploadedFile $archivo, string $matricula, int $numeroVersion): string
    {
        $nombreOriginal = pathinfo($archivo->getClientOriginalName(), PATHINFO_FILENAME);
        $nombreLimpio = Str::slug($nombreOriginal, '_') ?: 'tesis';
        $nombreLimpio = Str::limit($nombreLimpio, 50, '');
        $nombreFinal = "{$matricula}_revisor_v{$numeroVersion}_{$nombreLimpio}_".time().'.pdf';

        // Guarda físicamente en la carpeta 'versiones_revisores' en Supabase
        $archivo->storeAs(self::CARPETA_REVISORES, $nombreFinal, 's3');

        return self::CARPETA_REVISORES."/{$nombreFinal}";
    }
}
