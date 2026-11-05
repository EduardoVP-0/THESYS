<?php

namespace App\Http\Controllers\Docente;

use App\Http\Controllers\Controller;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Proyecto;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use App\Support\Portal\FlujoRevisionTesis;
use App\Support\Portal\RevisionesRevisor;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * CONTROLADOR UNIFICADO DE REVISIONES DE TESIS (MODULO DOCENTE)
 *
 * Concentra en una sola bandeja los proyectos donde el docente autenticado
 * participa activamente como Director de Tesis (Asesor) o como Revisor,
 * permitiendo consultar el PDF actual, revisar el historial de versiones PDF
 * previas de cada flujo y emitir dictamen (Aprobar / Solicitar cambios).
 */
class RevisionController extends Controller
{
    /**
     * Muestra la bandeja unificada de revisiones con metricas, filtros y panel lateral.
     */
    public function index(Request $request): Response
    {
        $userId = (int) Auth::id();

        $search = trim((string) $request->input('search', ''));
        $rolFiltro = (string) $request->input('rol', 'todos');
        $estadoFiltro = (string) $request->input('estado', 'todos');

        // 1. Proyectos donde el docente es Director de Tesis (Asesor activo)
        $asignacionesAsesor = AsignacionAsesor::query()
            ->where('id_usuario', $userId)
            ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
            ->with([
                'proyecto.alumnos.user:id,email',
                'proyecto.alumnos.carrera:id_carrera,nombre_carrera',
                'proyecto.versiones' => function ($query): void {
                    $query->where('ruta_archivo', 'not like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
                        ->with('revisiones')
                        ->orderByDesc('id_version');
                },
            ])
            ->orderByDesc('id_asesor_proyecto')
            ->get();

        $itemsAsesor = $asignacionesAsesor
            ->filter(fn (AsignacionAsesor $asignacion): bool => $asignacion->proyecto !== null)
            ->map(fn (AsignacionAsesor $asignacion): array => $this->transformarItemAsesor($asignacion));

        // 2. Proyectos donde el docente es Revisor activo
        $filasRevisor = DB::table('tblrevisores_proyectos')
            ->where('id_usuario', $userId)
            ->where('estado_asignacion', 'Activo')
            ->orderByDesc('id_revisor_proyecto')
            ->get();

        $itemsRevisor = collect();

        if ($filasRevisor->isNotEmpty()) {
            $idsProyectosRevisor = $filasRevisor->pluck('id_proyecto')->unique()->values()->all();

            $proyectosRevisor = Proyecto::query()
                ->whereIn('id_proyecto', $idsProyectosRevisor)
                ->with([
                    'alumnos.user:id,email',
                    'alumnos.carrera:id_carrera,nombre_carrera',
                    'versiones' => function ($query): void {
                        $query->where('ruta_archivo', 'like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
                            ->orderByDesc('id_version');
                    },
                ])
                ->get()
                ->keyBy('id_proyecto');

            // Obtener el orden de revisores por proyecto para etiquetar Revisor 1 / Revisor 2
            $ordenRevisoresPorProyecto = DB::table('tblrevisores_proyectos')
                ->whereIn('id_proyecto', $idsProyectosRevisor)
                ->where('estado_asignacion', 'Activo')
                ->orderBy('id_revisor_proyecto')
                ->get(['id_proyecto', 'id_usuario'])
                ->groupBy('id_proyecto');

            $itemsRevisor = $filasRevisor
                ->map(function (object $fila) use ($proyectosRevisor, $ordenRevisoresPorProyecto, $userId): ?array {
                    /** @var Proyecto|null $proyecto */
                    $proyecto = $proyectosRevisor->get($fila->id_proyecto);

                    if (! $proyecto) {
                        return null;
                    }

                    $compañeros = $ordenRevisoresPorProyecto->get($fila->id_proyecto, collect())->values();
                    $indice = $compañeros->search(fn (object $item): bool => (int) $item->id_usuario === $userId);
                    $numeroRevisor = $indice !== false ? ((int) $indice + 1) : 1;

                    return $this->transformarItemRevisor($fila, $proyecto, $numeroRevisor);
                })
                ->filter()
                ->values();
        }

        // Unificar ambos flujos priorizando los pendientes ("En revisión") primero
        $todosItems = $itemsAsesor
            ->concat($itemsRevisor)
            ->sortBy([
                fn (array $item): int => match ($item['estado']) {
                    'En revisión' => 0,
                    'Con cambios' => 1,
                    'Aprobado' => 2,
                    default => 3,
                },
                fn (array $item): int => -$item['orden_reciente'],
            ])
            ->values();

        // Metricas globales sobre el total de asignaciones del docente
        $stats = [
            'total' => $todosItems->count(),
            'en_revision' => $todosItems->where('estado', 'En revisión')->count(),
            'aprobados' => $todosItems->where('estado', 'Aprobado')->count(),
            'con_cambios' => $todosItems->where('estado', 'Con cambios')->count(),
        ];

        // Aplicar filtros de busqueda, funcion y estado
        $filtrados = $todosItems->filter(function (array $item) use ($search, $rolFiltro, $estadoFiltro): bool {
            if ($rolFiltro !== 'todos' && $item['rol_docente'] !== $rolFiltro) {
                return false;
            }

            if ($estadoFiltro !== 'todos' && $item['estado'] !== $estadoFiltro) {
                return false;
            }

            if ($search !== '') {
                $needle = mb_strtolower($search);
                $haystack = mb_strtolower(
                    implode(' ', [
                        $item['titulo'],
                        $item['sustentante']['nombre_completo'],
                        $item['sustentante']['matricula'],
                        $item['sustentante']['email'],
                        $item['sustentante']['carrera'],
                    ])
                );

                if (! str_contains($haystack, $needle)) {
                    return false;
                }
            }

            return true;
        })->values();

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

        return Inertia::render('docentes/revisiones/index', [
            'revisiones' => $paginator,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'rol' => $rolFiltro,
                'estado' => $estadoFiltro,
            ],
        ]);
    }

    /**
     * Aprueba la version actual de tesis en el flujo de Director de Tesis (Asesor).
     */
    public function aprobarAsesor(Request $request, AsignacionAsesor $asignacion): RedirectResponse
    {
        $userId = (int) Auth::id();

        abort_unless(
            (int) $asignacion->id_usuario === $userId && $asignacion->estado_asignacion === AsignacionAsesor::ESTADO_ACTIVO,
            403,
            'No tienes autorización activa como Director de Tesis para este proyecto.'
        );

        $validated = $request->validate([
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ], [
            'observaciones.max' => 'Las observaciones no pueden exceder los 2,000 caracteres.',
        ]);

        $ultimaVersion = VersionTesis::query()
            ->where('id_proyecto', $asignacion->id_proyecto)
            ->where('ruta_archivo', 'not like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
            ->orderByDesc('id_version')
            ->first();

        if (! $ultimaVersion) {
            return back()->with('error', 'El sustentante aún no ha subido ninguna versión de tesis para evaluar.');
        }

        $revision = RevisionAsesor::query()
            ->where('id_version', $ultimaVersion->id_version)
            ->where('id_asesor_proyecto', $asignacion->id_asesor_proyecto)
            ->first()
            ?? RevisionAsesor::query()
                ->where('id_version', $ultimaVersion->id_version)
                ->orderByDesc('id_revision')
                ->first();

        if ($revision && $revision->estado_revision !== RevisionAsesor::ESTADO_PENDIENTE) {
            return back()->with('error', 'Esta versión de tesis ya cuenta con un dictamen registrado.');
        }

        $observacionesLimpias = isset($validated['observaciones']) && trim((string) $validated['observaciones']) !== ''
            ? trim((string) $validated['observaciones'])
            : null;

        $this->guardarRevisionAsesor(
            $revision,
            $ultimaVersion->id_version,
            $asignacion->id_asesor_proyecto,
            RevisionAsesor::ESTADO_APROBADA,
            $observacionesLimpias
        );

        return back()->with(
            'success',
            "Has aprobado la {$ultimaVersion->numero_version} como Director de Tesis. El sustentante ya puede enviarla a sus revisores."
        );
    }

    /**
     * Solicita cambios sobre la version actual de tesis en el flujo de Director de Tesis (Asesor).
     */
    public function solicitarCambiosAsesor(Request $request, AsignacionAsesor $asignacion): RedirectResponse
    {
        $userId = (int) Auth::id();

        abort_unless(
            (int) $asignacion->id_usuario === $userId && $asignacion->estado_asignacion === AsignacionAsesor::ESTADO_ACTIVO,
            403,
            'No tienes autorización activa como Director de Tesis para este proyecto.'
        );

        $validated = $request->validate([
            'observaciones' => ['required', 'string', 'min:5', 'max:2000'],
        ], [
            'observaciones.required' => 'Debes redactar las observaciones para solicitar cambios al sustentante.',
            'observaciones.min' => 'Detalla las observaciones con al menos 5 caracteres.',
            'observaciones.max' => 'Las observaciones no pueden exceder los 2,000 caracteres.',
        ]);

        $ultimaVersion = VersionTesis::query()
            ->where('id_proyecto', $asignacion->id_proyecto)
            ->where('ruta_archivo', 'not like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
            ->orderByDesc('id_version')
            ->first();

        if (! $ultimaVersion) {
            return back()->with('error', 'El sustentante aún no ha subido ninguna versión de tesis para evaluar.');
        }

        $revision = RevisionAsesor::query()
            ->where('id_version', $ultimaVersion->id_version)
            ->where('id_asesor_proyecto', $asignacion->id_asesor_proyecto)
            ->first()
            ?? RevisionAsesor::query()
                ->where('id_version', $ultimaVersion->id_version)
                ->orderByDesc('id_revision')
                ->first();

        if ($revision && $revision->estado_revision !== RevisionAsesor::ESTADO_PENDIENTE) {
            return back()->with('error', 'Esta versión de tesis ya cuenta con un dictamen registrado.');
        }

        $this->guardarRevisionAsesor(
            $revision,
            $ultimaVersion->id_version,
            $asignacion->id_asesor_proyecto,
            RevisionAsesor::ESTADO_CON_CAMBIOS,
            trim((string) $validated['observaciones'])
        );

        return back()->with(
            'success',
            "Se solicitaron correcciones sobre la {$ultimaVersion->numero_version}. El sustentante podrá atenderlas y enviar una nueva versión."
        );
    }

    /**
     * Aprueba la version actual de tesis en el flujo de Revisor.
     */
    public function aprobarRevisor(Request $request, Proyecto $proyecto): RedirectResponse
    {
        $userId = (int) Auth::id();

        $filaRevisor = DB::table('tblrevisores_proyectos')
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->where('id_usuario', $userId)
            ->where('estado_asignacion', 'Activo')
            ->first();

        abort_unless($filaRevisor !== null, 403, 'No tienes autorización activa como Revisor para este proyecto.');

        $validated = $request->validate([
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ], [
            'observaciones.max' => 'Las observaciones no pueden exceder los 2,000 caracteres.',
        ]);

        $ultimaVersion = VersionTesis::query()
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->where('ruta_archivo', 'like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
            ->orderByDesc('id_version')
            ->first();

        if (! $ultimaVersion) {
            return back()->with('error', 'El sustentante aún no ha subido una versión de tesis para revisores.');
        }

        if ($filaRevisor->estado_revision !== RevisionesRevisor::ESTADO_PENDIENTE) {
            return back()->with('error', 'Ya registraste tu dictamen sobre la versión actual entregada a revisores.');
        }

        $observacionesLimpias = isset($validated['observaciones']) && trim((string) $validated['observaciones']) !== ''
            ? trim((string) $validated['observaciones'])
            : null;

        $ahora = now();

        DB::table('tblrevisores_proyectos')
            ->where('id_revisor_proyecto', $filaRevisor->id_revisor_proyecto)
            ->update([
                'estado_revision' => RevisionesRevisor::ESTADO_APROBADO,
                'comentarios_revision' => $observacionesLimpias,
                'fecha_revision' => $ahora,
                'updated_at' => $ahora,
            ]);

        return back()->with(
            'success',
            "Has aprobado la {$ultimaVersion->numero_version} en tu calidad de Revisor."
        );
    }

    /**
     * Solicita cambios sobre la version actual de tesis en el flujo de Revisor.
     */
    public function solicitarCambiosRevisor(Request $request, Proyecto $proyecto): RedirectResponse
    {
        $userId = (int) Auth::id();

        $filaRevisor = DB::table('tblrevisores_proyectos')
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->where('id_usuario', $userId)
            ->where('estado_asignacion', 'Activo')
            ->first();

        abort_unless($filaRevisor !== null, 403, 'No tienes autorización activa como Revisor para este proyecto.');

        $validated = $request->validate([
            'observaciones' => ['required', 'string', 'min:5', 'max:2000'],
        ], [
            'observaciones.required' => 'Debes redactar las observaciones para solicitar cambios al sustentante.',
            'observaciones.min' => 'Detalla las observaciones con al menos 5 caracteres.',
            'observaciones.max' => 'Las observaciones no pueden exceder los 2,000 caracteres.',
        ]);

        $ultimaVersion = VersionTesis::query()
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->where('ruta_archivo', 'like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
            ->orderByDesc('id_version')
            ->first();

        if (! $ultimaVersion) {
            return back()->with('error', 'El sustentante aún no ha subido una versión de tesis para revisores.');
        }

        if ($filaRevisor->estado_revision !== RevisionesRevisor::ESTADO_PENDIENTE) {
            return back()->with('error', 'Ya registraste tu dictamen sobre la versión actual entregada a revisores.');
        }

        $ahora = now();

        DB::table('tblrevisores_proyectos')
            ->where('id_revisor_proyecto', $filaRevisor->id_revisor_proyecto)
            ->update([
                'estado_revision' => RevisionesRevisor::ESTADO_CON_CAMBIOS,
                'comentarios_revision' => trim((string) $validated['observaciones']),
                'fecha_revision' => $ahora,
                'updated_at' => $ahora,
            ]);

        return back()->with(
            'success',
            "Se solicitaron cambios sobre la {$ultimaVersion->numero_version}. El sustentante deberá corregir el documento con su Director de Tesis."
        );
    }

    /**
     * Visualiza en linea el PDF de una version de tesis (flujo Asesor o Revisor).
     */
    public function verDocumentoVersion(VersionTesis $version): SymfonyResponse
    {
        $userId = (int) Auth::id();

        $esAsesor = AsignacionAsesor::query()
            ->where('id_usuario', $userId)
            ->where('id_proyecto', $version->id_proyecto)
            ->exists();

        $esRevisor = DB::table('tblrevisores_proyectos')
            ->where('id_usuario', $userId)
            ->where('id_proyecto', $version->id_proyecto)
            ->exists();

        abort_unless($esAsesor || $esRevisor, 403, 'No tienes permiso para visualizar este documento.');

        abort_unless(
            $version->ruta_archivo && trim((string) $version->ruta_archivo) !== '',
            404,
            'Esta versión de tesis no cuenta con un archivo adjunto.'
        );

        $esFlujoRevisor = str_contains((string) $version->ruta_archivo, FlujoRevisionTesis::CARPETA_REVISORES);
        $defaultFolder = $esFlujoRevisor ? FlujoRevisionTesis::CARPETA_REVISORES : 'versiones_tesis';

        return $this->streamFromStorage((string) $version->ruta_archivo, $defaultFolder);
    }

    /**
     * Construye el elemento unificado de revision para una asignacion de Director de Tesis.
     *
     * @return array<string, mixed>
     */
    private function transformarItemAsesor(AsignacionAsesor $asignacion): array
    {
        /** @var Proyecto $proyecto */
        $proyecto = $asignacion->proyecto;
        $alumno = $proyecto->alumnos->first();

        $versiones = $proyecto->versiones->map(function (VersionTesis $version, int $indice) use ($asignacion): array {
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
                'es_actual' => $indice === 0,
                'comentario_alumno' => $version->comentario_alumno,
                'nombre_archivo' => $tieneArchivo ? basename((string) $version->ruta_archivo) : null,
                'url_archivo' => $tieneArchivo
                    ? route('docente.revisiones.version.documento', $version->id_version)
                    : null,
                'fecha_envio' => $version->created_at?->format('d/m/Y H:i') ?? 'Sin fecha',
                'fecha_envio_corta' => $version->created_at?->format('d/m/Y') ?? 'Sin fecha',
                'estado_revision' => $estadoLabel,
                'observaciones' => $revision?->observaciones,
                'fecha_revision' => $revision && $revision->estado_revision !== RevisionAsesor::ESTADO_PENDIENTE
                    ? ($revision->updated_at?->format('d/m/Y H:i') ?? null)
                    : null,
            ];
        })->values();

        $ultimaVersion = $versiones->first();
        $estadoActual = $ultimaVersion ? $ultimaVersion['estado_revision'] : 'Sin entregas';
        $puedeDictaminar = $ultimaVersion !== null && $estadoActual === 'En revisión';

        $avisoFlujo = null;
        if (! $ultimaVersion) {
            $avisoFlujo = 'El sustentante aún no ha subido su primera versión de tesis para revisión.';
        } elseif ($estadoActual === 'Aprobado' && FlujoRevisionTesis::asesorDesbloqueadoPorRevisores($proyecto->id_proyecto)) {
            $avisoFlujo = 'Los revisores solicitaron correcciones recientemente. El sustentante tiene habilitada la carga para enviarte una nueva versión corregida.';
        } elseif ($estadoActual === 'Aprobado') {
            $avisoFlujo = 'Ya aprobaste esta versión de tesis. El sustentante puede continuar con el envío a sus revisores.';
        } elseif ($estadoActual === 'Con cambios') {
            $avisoFlujo = 'Solicitaste correcciones sobre esta versión. Las acciones se habilitarán de nuevo cuando el sustentante suba una nueva entrega.';
        }

        return [
            'identificador' => 'asesor_'.$asignacion->id_asesor_proyecto,
            'id_proyecto' => $proyecto->id_proyecto,
            'rol_docente' => 'Asesor',
            'rol_etiqueta' => 'Director de Tesis',
            'rol_detalle' => 'Evaluando como Director de Tesis',
            'titulo' => $proyecto->titulo,
            'resumen' => $proyecto->resumen ?? 'Sin resumen registrado por el sustentante.',
            'estado' => $estadoActual,
            'puede_dictaminar' => $puedeDictaminar,
            'aviso_flujo' => $avisoFlujo,
            'observaciones_actuales' => $ultimaVersion['observaciones'] ?? null,
            'fecha_dictamen_actual' => $ultimaVersion['fecha_revision'] ?? null,
            'url_aprobar' => route('docente.revisiones.asesor.aprobar', $asignacion->id_asesor_proyecto),
            'url_solicitar_cambios' => route('docente.revisiones.asesor.solicitar-cambios', $asignacion->id_asesor_proyecto),
            'orden_reciente' => $ultimaVersion ? (int) $ultimaVersion['id_version'] : 0,
            'sustentante' => [
                'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                'iniciales' => $alumno?->iniciales ?? 'AL',
                'matricula' => $alumno?->matricula ?? 'S/M',
                'email' => $alumno?->user?->email ?? 'Sin correo registrado',
                'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera asignada',
            ],
            'ultima_version' => $ultimaVersion,
            'total_versiones' => $versiones->count(),
            'versiones' => $versiones->all(),
        ];
    }

    /**
     * Construye el elemento unificado de revision para una asignacion de Revisor.
     *
     * @return array<string, mixed>
     */
    private function transformarItemRevisor(object $filaRevisor, Proyecto $proyecto, int $numeroRevisor): array
    {
        $alumno = $proyecto->alumnos->first();

        $estadoIndividualRaw = (string) ($filaRevisor->estado_revision ?? RevisionesRevisor::ESTADO_PENDIENTE);
        $estadoIndividualLabel = RevisionesRevisor::etiqueta($estadoIndividualRaw);
        $observacionesActuales = $filaRevisor->comentarios_revision;
        $fechaDictamenActual = $estadoIndividualRaw !== RevisionesRevisor::ESTADO_PENDIENTE && $filaRevisor->fecha_revision
            ? Carbon::parse($filaRevisor->fecha_revision)->format('d/m/Y H:i')
            : null;

        $versiones = $proyecto->versiones->map(function (VersionTesis $version, int $indice) use (
            $estadoIndividualLabel,
            $observacionesActuales,
            $fechaDictamenActual
        ): array {
            $esActual = $indice === 0;
            $tieneArchivo = (bool) ($version->ruta_archivo && trim((string) $version->ruta_archivo) !== '');

            // En el flujo de revisores, las versiones previas que dieron paso a una nueva
            // entrega cerraron con solicitud de cambios; el dictamen en la pivote pertenece a la actual.
            return [
                'id_version' => $version->id_version,
                'numero_version' => $version->numero_version,
                'es_actual' => $esActual,
                'comentario_alumno' => $version->comentario_alumno,
                'nombre_archivo' => $tieneArchivo ? basename((string) $version->ruta_archivo) : null,
                'url_archivo' => $tieneArchivo
                    ? route('docente.revisiones.version.documento', $version->id_version)
                    : null,
                'fecha_envio' => $version->created_at?->format('d/m/Y H:i') ?? 'Sin fecha',
                'fecha_envio_corta' => $version->created_at?->format('d/m/Y') ?? 'Sin fecha',
                'estado_revision' => $esActual ? $estadoIndividualLabel : 'Entrega anterior',
                'observaciones' => $esActual ? $observacionesActuales : null,
                'fecha_revision' => $esActual ? $fechaDictamenActual : null,
            ];
        })->values();

        $ultimaVersion = $versiones->first();
        $estadoActual = $ultimaVersion ? $estadoIndividualLabel : 'Sin entregas';
        $puedeDictaminar = $ultimaVersion !== null && $estadoActual === 'En revisión';

        $avisoFlujo = null;
        if (! $ultimaVersion) {
            $desbloqueadoPorAsesor = FlujoRevisionTesis::revisoresDesbloqueadosPorAsesor($proyecto->id_proyecto);
            $avisoFlujo = $desbloqueadoPorAsesor
                ? 'El Director de Tesis ya aprobó el documento. Las acciones de dictamen se habilitarán en cuanto el sustentante suba su archivo PDF para revisores.'
                : 'En espera de que el Director de Tesis apruebe el documento inicial antes de que el sustentante pueda enviarlo a revisores.';
        } elseif ($estadoActual === 'Aprobado') {
            $avisoFlujo = 'Ya emitiste tu dictamen aprobatorio sobre esta versión como Revisor.';
        } elseif ($estadoActual === 'Con cambios') {
            $avisoFlujo = 'Solicitaste cambios sobre esta versión. El sustentante deberá corregirla con su Director de Tesis antes de enviar una nueva versión a revisores.';
        }

        return [
            'identificador' => 'revisor_'.$filaRevisor->id_revisor_proyecto,
            'id_proyecto' => $proyecto->id_proyecto,
            'rol_docente' => 'Revisor',
            'rol_etiqueta' => 'Revisor',
            'rol_detalle' => "Evaluando como Revisor {$numeroRevisor}",
            'titulo' => $proyecto->titulo,
            'resumen' => $proyecto->resumen ?? 'Sin resumen registrado por el sustentante.',
            'estado' => $estadoActual,
            'puede_dictaminar' => $puedeDictaminar,
            'aviso_flujo' => $avisoFlujo,
            'observaciones_actuales' => $ultimaVersion ? $observacionesActuales : null,
            'fecha_dictamen_actual' => $ultimaVersion ? $fechaDictamenActual : null,
            'url_aprobar' => route('docente.revisiones.revisor.aprobar', $proyecto->id_proyecto),
            'url_solicitar_cambios' => route('docente.revisiones.revisor.solicitar-cambios', $proyecto->id_proyecto),
            'orden_reciente' => $ultimaVersion ? (int) $ultimaVersion['id_version'] : 0,
            'sustentante' => [
                'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                'iniciales' => $alumno?->iniciales ?? 'AL',
                'matricula' => $alumno?->matricula ?? 'S/M',
                'email' => $alumno?->user?->email ?? 'Sin correo registrado',
                'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera asignada',
            ],
            'ultima_version' => $ultimaVersion,
            'total_versiones' => $versiones->count(),
            'versiones' => $versiones->all(),
        ];
    }

    /**
     * Actualiza o crea el registro de dictamen del Director de Tesis asegurando timestamps frescos.
     */
    private function guardarRevisionAsesor(
        ?RevisionAsesor $revision,
        int $idVersion,
        int $idAsesorProyecto,
        string $nuevoEstado,
        ?string $observaciones
    ): void {
        if ($revision) {
            $revision->estado_revision = $nuevoEstado;
            $revision->observaciones = $observaciones;
            $revision->updated_at = now();
            $revision->save();

            return;
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "SELECT setval(pg_get_serial_sequence('tblrevisiones_asesor', 'id_revision'), COALESCE((SELECT MAX(id_revision) FROM tblrevisiones_asesor), 0) + 1, false)"
            );
        }

        RevisionAsesor::create([
            'id_version' => $idVersion,
            'id_asesor_proyecto' => $idAsesorProyecto,
            'estado_revision' => $nuevoEstado,
            'observaciones' => $observaciones,
        ]);
    }

    /**
     * Transmite archivos PDF desde Supabase Storage (disco S3).
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
