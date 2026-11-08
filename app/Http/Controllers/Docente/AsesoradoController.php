<?php

namespace App\Http\Controllers\Docente;

use App\Http\Controllers\Controller;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Carrera;
use App\Models\Admin\Proyecto;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use App\Support\Portal\FlujoRevisionTesis;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * CONTROLADOR DE MIS ASESORADOS (MODULO DOCENTE - DIRECTOR DE TESIS)
 *
 * Permite al docente consultar y dar seguimiento a los proyectos de titulacion
 * donde es Director de Tesis (Asesor), visualizando el perfil del
 * sustentante, el documento base del anteproyecto y el historial de versiones
 */
class AsesoradoController extends Controller
{
    /**
     * Muestra el listado de proyectos asesorados con metricas, filtros y panel lateral de detalle
     */
    public function index(Request $request): Response
    {
        $userId = (int) Auth::id();

        $search = trim((string) $request->input('search', ''));
        $estadoFiltro = (string) $request->input('estado', 'todos');
        $carreraFiltro = (string) $request->input('carrera', 'todas');

        $asignaciones = AsignacionAsesor::query()
            ->where('id_usuario', $userId)
            ->whereIn('estado_asignacion', AsignacionAsesor::ESTADOS_VISIBLES_DOCENTE)
            ->with([
                'proyecto.alumnos.user:id,email',
                'proyecto.alumnos.carrera:id_carrera,nombre_carrera',
                'proyecto.versiones' => function ($q): void {
                    $q->where('ruta_archivo', 'not like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
                        ->with('revisiones')
                        ->orderByDesc('id_version');
                },
            ])
            ->orderByDesc('id_asesor_proyecto')
            ->get();

        // Transformar todos los registros asignados para calcular metricas reales y filtrar por estado derivado
        $todosTransformados = $asignaciones
            ->filter(fn (AsignacionAsesor $asignacion): bool => $asignacion->proyecto !== null)
            ->map(fn (AsignacionAsesor $asignacion): array => $this->transformarAsesorado($asignacion))
            ->values();

        // Metricas globales del asesor
        $stats = [
            'total' => $todosTransformados->count(),
            'en_revision' => $todosTransformados->where('estado_tesis', 'En revisión')->count(),
            'con_cambios' => $todosTransformados->where('estado_tesis', 'Con cambios')->count(),
            'aprobados' => $todosTransformados->where('estado_tesis', 'Aprobado')->count(),
            'sin_entregas' => $todosTransformados->where('estado_tesis', 'Sin entregas')->count(),
        ];

        // Aplicar filtros en memoria sobre la coleccion del docente (max 5 asesorados activos)
        $filtrados = $todosTransformados->filter(function (array $item) use ($search, $estadoFiltro, $carreraFiltro): bool {
            if ($estadoFiltro !== 'todos' && $item['estado_tesis'] !== $estadoFiltro) {
                return false;
            }

            if ($carreraFiltro !== 'todas' && (string) $item['id_carrera'] !== $carreraFiltro) {
                return false;
            }

            if ($search !== '') {
                $needle = mb_strtolower($search);
                $haystack = mb_strtolower(
                    implode(' ', [
                        $item['sustentante']['nombre_completo'],
                        $item['sustentante']['matricula'],
                        $item['sustentante']['carrera'],
                        $item['titulo'],
                    ])
                );

                if (! str_contains($haystack, $needle)) {
                    return false;
                }
            }

            return true;
        })->values();

        // Paginacion manual compatible con formato estandar de Inertia
        $perPage = 6;
        $currentPage = max(1, (int) $request->input('page', 1));
        $totalFiltrados = $filtrados->count();
        $itemsPagina = $filtrados->forPage($currentPage, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $itemsPagina,
            $totalFiltrados,
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        $carreras = Carrera::query()
            ->where('estado', true)
            ->orderBy('nombre_carrera')
            ->get(['id_carrera', 'nombre_carrera']);

        return Inertia::render('docentes/asesorados/index', [
            'asesorados' => $paginator,
            'stats' => $stats,
            'carreras' => $carreras,
            'filters' => [
                'search' => $search,
                'estado' => $estadoFiltro,
                'carrera' => $carreraFiltro,
            ],
        ]);
    }

    /**
     * Visualiza en linea el PDF de una version de tesis de un proyecto asesorado por el docente
     */
    public function verVersionDocumento(VersionTesis $version): SymfonyResponse
    {
        $userId = (int) Auth::id();

        $esAsesorDelProyecto = AsignacionAsesor::query()
            ->where('id_usuario', $userId)
            ->where('id_proyecto', $version->id_proyecto)
            ->exists();

        abort_unless($esAsesorDelProyecto, 403, 'No tienes permiso para visualizar este documento.');

        abort_unless(
            $version->ruta_archivo && trim((string) $version->ruta_archivo) !== '',
            404,
            'Esta versión de tesis no cuenta con un archivo adjunto.'
        );

        return $this->streamFromStorage((string) $version->ruta_archivo, 'versiones_tesis');
    }

    /**
     * Visualiza en linea el PDF del anteproyecto base de un proyecto asesorado por el docente
     */
    public function verAnteproyectoDocumento(Proyecto $proyecto): SymfonyResponse
    {
        $userId = (int) Auth::id();

        $esAsesorDelProyecto = AsignacionAsesor::query()
            ->where('id_usuario', $userId)
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->exists();

        abort_unless($esAsesorDelProyecto, 403, 'No tienes permiso para visualizar este anteproyecto.');

        abort_unless(
            $proyecto->ruta_documento && trim((string) $proyecto->ruta_documento) !== '',
            404,
            'Este proyecto no cuenta con un archivo PDF de anteproyecto adjunto.'
        );

        return $this->streamFromStorage((string) $proyecto->ruta_documento, 'anteproyectos');
    }

    /**
     * Construye el objeto completo del proyecto asesorado con su sustentante y versiones
     *
     * @return array<string, mixed>
     */
    private function transformarAsesorado(AsignacionAsesor $asignacion): array
    {
        /** @var Proyecto $proyecto */
        $proyecto = $asignacion->proyecto;
        $alumno = $proyecto->alumnos->first();

        $versiones = $proyecto->versiones->map(function (VersionTesis $version) use ($asignacion): array {
            $revision = $version->revisiones
                ->where('id_asesor_proyecto', $asignacion->id_asesor_proyecto)
                ->first()
                ?? $version->revisiones->sortByDesc('id_revision')->first();

            $estadoRaw = $revision ? $revision->estado_revision : RevisionAsesor::ESTADO_PENDIENTE;

            $estadoLabel = match ($estadoRaw) {
                RevisionAsesor::ESTADO_APROBADA, 'Aprobado' => 'Aprobado',
                RevisionAsesor::ESTADO_CON_CAMBIOS, RevisionAsesor::ESTADO_RECHAZADA => 'Con cambios',
                default => 'En revisión',
            };

            $tieneArchivo = (bool) ($version->ruta_archivo && trim((string) $version->ruta_archivo) !== '');

            return [
                'id_version' => $version->id_version,
                'numero_version' => $version->numero_version,
                'comentario_alumno' => $version->comentario_alumno,
                'nombre_archivo' => $tieneArchivo ? basename((string) $version->ruta_archivo) : null,
                'url_archivo' => $tieneArchivo
                    ? route('docente.asesorados.version.documento', $version->id_version)
                    : null,
                'fecha_envio' => $version->created_at?->format('d/m/Y H:i') ?? 'Sin fecha',
                'fecha_envio_corta' => $version->created_at?->format('d/m/Y') ?? 'Sin fecha',
                'estado_revision' => $estadoLabel,
                'observaciones_asesor' => $revision?->observaciones,
                'fecha_revision' => $revision && $revision->estado_revision !== RevisionAsesor::ESTADO_PENDIENTE
                    ? ($revision->updated_at?->format('d/m/Y H:i') ?? null)
                    : null,
            ];
        })->values();

        $ultimaVersion = $versiones->first();
        $estadoTesis = $ultimaVersion ? $ultimaVersion['estado_revision'] : 'Sin entregas';

        $tieneDocAnteproyecto = (bool) ($proyecto->ruta_documento && trim((string) $proyecto->ruta_documento) !== '');

        return [
            'id_asesor_proyecto' => $asignacion->id_asesor_proyecto,
            'id_proyecto' => $proyecto->id_proyecto,
            'titulo' => $proyecto->titulo,
            'resumen' => $proyecto->resumen ?? 'Sin resumen registrado.',
            'estado_anteproyecto' => $proyecto->estado,
            'estado_tesis' => $estadoTesis,
            'fecha_asignacion' => $asignacion->created_at?->format('d/m/Y') ?? 'Sin fecha',
            'id_carrera' => $alumno?->id_carrera,
            'sustentante' => [
                'id_usuario' => $alumno?->id_usuario,
                'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                'iniciales' => $alumno?->iniciales ?? 'AL',
                'matricula' => $alumno?->matricula ?? 'S/M',
                'email' => $alumno?->user?->email ?? 'Sin correo registrado',
                'telefono' => $alumno?->telefono,
                'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera asignada',
                'turno' => $alumno?->turno,
                'generacion' => $alumno?->generacion,
            ],
            'anteproyecto_archivo' => $tieneDocAnteproyecto ? [
                'nombre_archivo' => basename((string) $proyecto->ruta_documento),
                'url_archivo' => route('docente.asesorados.anteproyecto.documento', $proyecto->id_proyecto),
                'fecha_envio' => $proyecto->fecha_envio?->format('d/m/Y')
                    ?? $proyecto->created_at?->format('d/m/Y')
                    ?? 'Sin fecha',
            ] : null,
            'ultima_version' => $ultimaVersion,
            'total_versiones' => $versiones->count(),
            'versiones' => $versiones->all(),
        ];
    }

    /**
     * Transmite archivos PDF desde Supabase Storage (disco S3)
     */
    private function streamFromStorage(string $rawPath, string $defaultFolder): SymfonyResponse
    {
        /** @var FilesystemAdapter $s3 */
        $s3 = Storage::disk('s3');
        $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');

        $cleanPath = $rawPath;
        if (str_contains($cleanPath, 'http://') || str_contains($cleanPath, 'https://')) {
            if (str_contains($cleanPath, "/{$bucket}/")) {
                $cleanPath = Str::after($cleanPath, "/{$bucket}/");
            } else {
                $cleanPath = basename($cleanPath);
            }
        }

        $cleanPath = ltrim($cleanPath, '/');
        $filename = basename($cleanPath);

        $candidatePaths = [
            $cleanPath,
            "{$defaultFolder}/{$filename}",
            "versiones_tesis/{$filename}",
            "versiones_revisores/{$filename}",
            "anteproyectos/{$filename}",
            $filename,
        ];

        $resolvedPath = null;
        foreach ($candidatePaths as $candidate) {
            if ($s3->exists($candidate)) {
                $resolvedPath = $candidate;
                break;
            }
        }

        abort_unless(
            $resolvedPath !== null,
            404,
            "El archivo físico \"{$filename}\" no fue encontrado en el almacenamiento en la nube."
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
}

