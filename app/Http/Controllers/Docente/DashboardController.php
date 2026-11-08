<?php

namespace App\Http\Controllers\Docente;

use App\Http\Controllers\Controller;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Docente;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use App\Support\Portal\FlujoRevisionTesis;
use App\Support\Portal\PresentacionExamen;
use App\Support\Portal\RevisionesRevisor;
use App\Support\Portal\RolesDocente;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DASHBOARD DEL DOCENTE
 *
 * Presenta un resumen distinto según la función que el docente tenga asignada
 * en el proceso de titulación: Asesor (Director de Tesis), Revisor o Jurado.
 * El docente puede desempeñar una o varias funciones, por lo que la vista
 * inicial se elige desde el encabezado y solo se calcula la información de
 * los roles que realmente tiene asignados.
 */
class DashboardController extends Controller
{
    /**
     * Meses abreviados usados en la gráfica de actividad.
     *
     * @var array<int, string>
     */
    private const MESES_CORTOS = [
        'ENE',
        'FEB',
        'MAR',
        'ABR',
        'MAY',
        'JUN',
        'JUL',
        'AGO',
        'SEP',
        'OCT',
        'NOV',
        'DIC',
    ];

    /**
     * Muestra el dashboard con los bloques de los roles disponibles.
     */
    public function index(Request $request): Response
    {
        $userId = (int) Auth::id();
        $roles = RolesDocente::disponibles($userId);
        $vistaInicial = $this->resolverVista($request, $roles);

        $dashboards = [];

        foreach ($roles as $rol) {
            $dashboards[$rol['clave']] = match ($rol['clave']) {
                'asesor' => $this->dashboardAsesor($userId),
                'revisor' => $this->dashboardRevisor($userId),
                'jurado' => $this->dashboardJurado($userId),
            };
        }

        return Inertia::render('docentes/dashboard', [
            'nombre' => $this->nombreCorto($userId),
            'saludo' => $this->saludo(),
            'fecha_larga' => PresentacionExamen::fechaLarga(CarbonImmutable::today()),
            'roles_disponibles' => $roles,
            'vista_inicial' => $vistaInicial,
            'dashboards' => $dashboards,
        ]);
    }

    /**
     * Respeta la vista solicitada en la URL o elige la primera función disponible.
     *
     * @param  array<int, array{clave: string, etiqueta: string, descripcion: string}>  $roles
     */
    private function resolverVista(Request $request, array $roles): ?string
    {
        if ($roles === []) {
            return null;
        }

        $claves = array_column($roles, 'clave');
        $solicitada = (string) $request->query('vista', '');

        return in_array($solicitada, $claves, true) ? $solicitada : $claves[0];
    }

    /**
     * Construye el resumen del rol Asesor.
     *
     * @return array<string, mixed>
     */
    private function dashboardAsesor(int $userId): array
    {
        $asignaciones = AsignacionAsesor::query()
            ->where('id_usuario', $userId)
            ->whereIn('estado_asignacion', AsignacionAsesor::ESTADOS_VISIBLES_DOCENTE)
            ->with([
                'proyecto.alumnos',
                'proyecto.versiones' => function ($query): void {
                    $query->where('ruta_archivo', 'not like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
                        ->with('revisiones')
                        ->orderByDesc('id_version');
                },
            ])
            ->orderByDesc('id_asesor_proyecto')
            ->get();

        $proyectos = $asignaciones
            ->filter(fn (AsignacionAsesor $asignacion): bool => $asignacion->proyecto instanceof Proyecto)
            ->map(function (AsignacionAsesor $asignacion): array {
                /** @var Proyecto $proyecto */
                $proyecto = $asignacion->proyecto;
                $alumno = $proyecto->alumnos->first();
                /** @var VersionTesis|null $ultimaVersion */
                $ultimaVersion = $proyecto->versiones->first();
                $estado = $this->estadoAsesor($ultimaVersion, (int) $asignacion->id_asesor_proyecto);

                return [
                    'id_proyecto' => $proyecto->id_proyecto,
                    'titulo' => $proyecto->titulo,
                    'sustentante' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                    'estado' => $estado['etiqueta'],
                    'tono' => $estado['tono'],
                    'numero_version' => $ultimaVersion?->numero_version,
                    'fecha_entrega' => $ultimaVersion?->created_at?->toDateString(),
                ];
            })
            ->values();

        $actividades = $asignaciones
            ->flatMap(function (AsignacionAsesor $asignacion): array {
                if (! $asignacion->proyecto instanceof Proyecto) {
                    return [];
                }

                /** @var Proyecto $proyecto */
                $proyecto = $asignacion->proyecto;
                $alumno = $proyecto->alumnos->first();
                $urlRevisiones = route('docente.revisiones.index', ['rol' => 'Asesor']);

                return $proyecto->versiones
                    ->map(function (VersionTesis $version) use ($proyecto, $alumno, $asignacion, $urlRevisiones): array {
                        $estado = $this->estadoAsesor($version, (int) $asignacion->id_asesor_proyecto);

                        return [
                            'id' => 'asesor-version-'.$version->id_version,
                            'titulo' => (string) $proyecto->titulo,
                            'descripcion' => implode(' · ', array_filter([
                                $alumno?->nombre_completo ?? 'Sustentante no disponible',
                                $version->numero_version,
                            ])),
                            'fecha' => $version->created_at
                                ? PresentacionExamen::fechaSinDia($version->created_at)
                                : null,
                            'fecha_iso' => $version->created_at?->toDateString(),
                            'etiqueta' => $estado['etiqueta'],
                            'tono' => $estado['tono'],
                            'url' => $urlRevisiones,
                            '_orden' => $version->created_at?->getTimestamp() ?? 0,
                        ];
                    })
                    ->all();
            })
            ->sortByDesc('_orden')
            ->take(4)
            ->map(function (array $actividad): array {
                unset($actividad['_orden']);

                return $actividad;
            })
            ->values()
            ->all();

        $total = $proyectos->count();
        $enRevision = $proyectos->where('estado', 'En revisión')->count();
        $conCambios = $proyectos->where('estado', 'Con cambios')->count();
        $aprobados = $proyectos->where('estado', 'Aprobado')->count();

        $stats = [
            [
                'clave' => 'total',
                'etiqueta' => 'Proyectos asesorados',
                'valor' => $total,
                'detalle' => $total === 1 ? 'Asignación activa' : 'Asignaciones activas',
                'tono' => 'info',
            ],
            [
                'clave' => 'en_revision',
                'etiqueta' => 'En revisión',
                'valor' => $enRevision,
                'detalle' => $enRevision > 0 ? 'Esperando tu dictamen' : 'Sin entregas pendientes',
                'tono' => 'info',
            ],
            [
                'clave' => 'con_cambios',
                'etiqueta' => 'Con cambios',
                'valor' => $conCambios,
                'detalle' => $conCambios > 0 ? 'Correcciones solicitadas' : 'Sin correcciones abiertas',
                'tono' => 'warning',
            ],
            [
                'clave' => 'aprobados',
                'etiqueta' => 'Aprobados',
                'valor' => $aprobados,
                'detalle' => $aprobados > 0 ? 'Listos para revisores' : 'Sin aprobaciones',
                'tono' => 'success',
            ],
        ];

        $fechasVersiones = $asignaciones
            ->flatMap(function (AsignacionAsesor $asignacion): Collection {
                return $asignacion->proyecto instanceof Proyecto
                    ? $asignacion->proyecto->versiones->pluck('created_at')
                    : collect();
            });

        return $this->construirDashboard(
            clave: 'asesor',
            etiqueta: 'Asesor',
            descripcion: 'Seguimiento de tus proyectos como Director de Tesis.',
            stats: $stats,
            graficaTitulo: 'Entregas de tesis',
            graficaDetalle: 'Versiones recibidas en los últimos 12 meses.',
            fechasGrafica: $fechasVersiones,
            listaTitulo: 'Últimas entregas',
            listaDetalle: 'Movimientos recientes de tus proyectos asesorados.',
            actividades: $actividades,
            accion: [
                'etiqueta' => 'Ver mis asesorados',
                'url' => route('docente.asesorados.index'),
            ],
        );
    }

    /**
     * Construye el resumen del rol Revisor.
     *
     * @return array<string, mixed>
     */
    private function dashboardRevisor(int $userId): array
    {
        $asignaciones = DB::table('tblrevisores_proyectos')
            ->where('id_usuario', $userId)
            ->whereIn('estado_asignacion', ['Activo', 'Finalizado'])
            ->orderByDesc('id_revisor_proyecto')
            ->get();

        $proyectos = Proyecto::query()
            ->whereIn('id_proyecto', $asignaciones->pluck('id_proyecto')->unique()->all())
            ->with([
                'alumnos',
                'versiones' => function ($query): void {
                    $query->where('ruta_archivo', 'like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
                        ->orderByDesc('id_version');
                },
            ])
            ->get()
            ->keyBy('id_proyecto');

        $items = $asignaciones
            ->map(function (object $fila) use ($proyectos): ?array {
                /** @var Proyecto|null $proyecto */
                $proyecto = $proyectos->get((int) $fila->id_proyecto);

                if (! $proyecto) {
                    return null;
                }

                $alumno = $proyecto->alumnos->first();
                /** @var VersionTesis|null $ultimaVersion */
                $ultimaVersion = $proyecto->versiones->first();
                $estado = RevisionesRevisor::etiqueta((string) ($fila->estado_revision ?? RevisionesRevisor::ESTADO_PENDIENTE));
                $fechaReferencia = $ultimaVersion?->created_at
                    ?? ($fila->created_at ? CarbonImmutable::parse($fila->created_at) : null);

                return [
                    'id' => 'revisor-'.$fila->id_revisor_proyecto,
                    'id_proyecto' => (int) $fila->id_proyecto,
                    'titulo' => $proyecto->titulo,
                    'sustentante' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                    'estado' => $estado,
                    'tono' => match ($estado) {
                        'Aprobado' => 'success',
                        'Con cambios' => 'warning',
                        default => 'info',
                    },
                    'numero_version' => $ultimaVersion?->numero_version ?? 'Sin entrega para revisores',
                    'fecha' => $fechaReferencia ? PresentacionExamen::fechaSinDia($fechaReferencia) : null,
                    'fecha_iso' => $fechaReferencia?->toDateString(),
                    'orden' => $fechaReferencia?->getTimestamp() ?? 0,
                ];
            })
            ->filter()
            ->values();

        $total = $items->count();
        $pendientes = $items->where('estado', 'En revisión')->count();
        $conCambios = $items->where('estado', 'Con cambios')->count();
        $aprobados = $items->where('estado', 'Aprobado')->count();

        $stats = [
            [
                'clave' => 'total',
                'etiqueta' => 'Proyectos asignados',
                'valor' => $total,
                'detalle' => $total === 1 ? 'Asignación activa' : 'Asignaciones activas',
                'tono' => 'info',
            ],
            [
                'clave' => 'pendientes',
                'etiqueta' => 'Por dictaminar',
                'valor' => $pendientes,
                'detalle' => $pendientes > 0 ? 'Requieren tu revisión' : 'Sin dictámenes pendientes',
                'tono' => 'info',
            ],
            [
                'clave' => 'con_cambios',
                'etiqueta' => 'Con cambios',
                'valor' => $conCambios,
                'detalle' => $conCambios > 0 ? 'Observaciones enviadas' : 'Sin observaciones abiertas',
                'tono' => 'warning',
            ],
            [
                'clave' => 'aprobados',
                'etiqueta' => 'Aprobados',
                'valor' => $aprobados,
                'detalle' => $aprobados > 0 ? 'Documentos aprobados' : 'Sin aprobaciones',
                'tono' => 'success',
            ],
        ];

        $actividades = $items
            ->sortBy([
                fn (array $item): int => match ($item['estado']) {
                    'En revisión' => 0,
                    'Con cambios' => 1,
                    'Aprobado' => 2,
                    default => 3,
                },
                fn (array $item): int => -$item['orden'],
            ])
            ->take(4)
            ->map(fn (array $item): array => [
                'id' => $item['id'],
                'titulo' => $item['titulo'],
                'descripcion' => $item['sustentante'].' · '.$item['numero_version'],
                'fecha' => $item['fecha'],
                'fecha_iso' => $item['fecha_iso'],
                'etiqueta' => $item['estado'],
                'tono' => $item['tono'],
                'url' => route('docente.revisiones.index', ['rol' => 'Revisor']),
            ])
            ->values()
            ->all();

        $listaTitulo = $pendientes > 0 ? 'Revisiones por atender' : 'Revisiones asignadas';
        $listaDetalle = $pendientes > 0
            ? ($pendientes === 1
                ? 'Tienes 1 proyecto esperando tu dictamen.'
                : "Tienes {$pendientes} proyectos esperando tu dictamen.")
            : 'Consulta el estado de los proyectos que revisas.';

        $fechasVersiones = $proyectos
            ->flatMap(fn (Proyecto $proyecto): Collection => $proyecto->versiones->pluck('created_at'));

        return $this->construirDashboard(
            clave: 'revisor',
            etiqueta: 'Revisor',
            descripcion: 'Resumen de los documentos que evalúas como parte del comité revisor.',
            stats: $stats,
            graficaTitulo: 'Actividad de revisión',
            graficaDetalle: 'Versiones para revisores recibidas en los últimos 12 meses.',
            fechasGrafica: $fechasVersiones,
            listaTitulo: $listaTitulo,
            listaDetalle: $listaDetalle,
            actividades: $actividades,
            accion: [
                'etiqueta' => 'Ir a revisiones',
                'url' => route('docente.revisiones.index', ['rol' => 'Revisor']),
            ],
        );
    }

    /**
     * Construye el resumen del rol Jurado.
     *
     * @return array<string, mixed>
     */
    private function dashboardJurado(int $userId): array
    {
        $hoyIso = CarbonImmutable::today()->toDateString();

        JuradoProyecto::query()
            ->where('id_usuario', $userId)
            ->where('estado_aceptacion', JuradoProyecto::ESTADO_PENDIENTE)
            ->whereHas('proyecto.examen', function ($q) use ($hoyIso): void {
                $q->whereDate('fecha_examen', '<=', $hoyIso);
            })
            ->update([
                'estado_aceptacion' => JuradoProyecto::ESTADO_RECHAZADO,
                'updated_at' => now(),
            ]);

        $asignaciones = JuradoProyecto::query()
            ->where('id_usuario', $userId)
            ->with([
                'proyecto.alumnos',
                'proyecto.examen',
                'dictamen',
            ])
            ->orderByDesc('id_jurado_proyecto')
            ->get();

        $items = $asignaciones
            ->filter(fn (JuradoProyecto $jurado): bool => $jurado->proyecto instanceof Proyecto)
            ->map(function (JuradoProyecto $jurado): array {
                /** @var Proyecto $proyecto */
                $proyecto = $jurado->proyecto;
                $alumno = $proyecto->alumnos->first();
                $examen = $proyecto->examen;
                $fechaExamen = $examen?->fecha_examen
                    ? CarbonImmutable::parse($examen->fecha_examen)->startOfDay()
                    : null;
                $fechaAsignacion = $jurado->created_at
                    ? CarbonImmutable::parse($jurado->created_at)->startOfDay()
                    : null;
                $horaExamen = $examen?->hora_examen
                    ? PresentacionExamen::hora((string) $examen->hora_examen)
                    : null;

                return [
                    'id' => 'jurado-'.$jurado->id_jurado_proyecto,
                    'id_proyecto' => $jurado->id_proyecto,
                    'titulo' => $proyecto->titulo,
                    'sustentante' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                    'cargo' => $jurado->cargo,
                    'estado_aceptacion' => $jurado->estado_aceptacion,
                    'voto' => $jurado->dictamen?->voto ?? 'Pendiente',
                    'fecha_examen_iso' => $fechaExamen?->toDateString(),
                    'fecha_examen' => $fechaExamen ? PresentacionExamen::fechaSinDia($fechaExamen) : null,
                    'fecha_asignacion' => $fechaAsignacion ? PresentacionExamen::fechaSinDia($fechaAsignacion) : null,
                    'fecha_asignacion_iso' => $fechaAsignacion?->toDateString(),
                    'hora_examen' => $horaExamen,
                    'sede' => $examen?->sede,
                    'es_proximo' => $fechaExamen !== null && $fechaExamen->greaterThanOrEqualTo(CarbonImmutable::today()),
                    'orden' => $fechaExamen?->getTimestamp() ?? 0,
                    'orden_asignacion' => $fechaAsignacion?->getTimestamp() ?? 0,
                ];
            })
            ->values();

        $total = $items->count();
        $aceptados = $items->where('estado_aceptacion', JuradoProyecto::ESTADO_ACEPTADO)->count();
        $pendientes = $items->where('estado_aceptacion', JuradoProyecto::ESTADO_PENDIENTE)->count();
        $proximos = $items
            ->filter(fn (array $item): bool => $item['es_proximo']
                && $item['estado_aceptacion'] !== JuradoProyecto::ESTADO_RECHAZADO)
            ->values();

        $stats = [
            [
                'clave' => 'total',
                'etiqueta' => 'Designaciones',
                'valor' => $total,
                'detalle' => $total === 1 ? 'Proyecto asignado' : 'Proyectos asignados',
                'tono' => 'info',
            ],
            [
                'clave' => 'aceptados',
                'etiqueta' => 'Cargos aceptados',
                'valor' => $aceptados,
                'detalle' => $aceptados > 0 ? 'Participación confirmada' : 'Sin cargos aceptados',
                'tono' => 'success',
            ],
            [
                'clave' => 'pendientes',
                'etiqueta' => 'Por responder',
                'valor' => $pendientes,
                'detalle' => $pendientes > 0 ? 'Confirma tu participación' : 'Sin respuestas pendientes',
                'tono' => 'warning',
            ],
            [
                'clave' => 'examenes',
                'etiqueta' => 'Próximos exámenes',
                'valor' => $proximos->count(),
                'detalle' => $proximos->count() > 0 ? 'Exámenes programados' : 'Sin exámenes próximos',
                'tono' => 'info',
            ],
        ];

        if ($proximos->isNotEmpty()) {
            $seleccion = $proximos->sortBy('orden')->take(4)->values();
            $listaTitulo = 'Próximos exámenes';
            $listaDetalle = 'Exámenes programados para tus proyectos de jurado.';
        } else {
            $seleccion = $items->sortByDesc('orden_asignacion')->take(4)->values();
            $listaTitulo = 'Tus designaciones';
            $listaDetalle = 'Estado actual de los cargos que tienes asignados.';
        }

        $actividades = $seleccion
            ->map(function (array $item): array {
                $partes = array_filter([
                    $item['sustentante'],
                    $item['cargo'],
                    $item['hora_examen'] ? $item['hora_examen'].' hrs' : null,
                    $item['sede'],
                    'Voto: '.$item['voto'],
                ], fn (?string $valor): bool => $valor !== null && trim($valor) !== '');

                return [
                    'id' => $item['id'],
                    'titulo' => $item['titulo'],
                    'descripcion' => implode(' · ', $partes),
                    'fecha' => $item['fecha_examen'] ?? $item['fecha_asignacion'],
                    'fecha_iso' => $item['fecha_examen_iso'] ?? $item['fecha_asignacion_iso'],
                    'etiqueta' => $item['estado_aceptacion'],
                    'tono' => match ($item['estado_aceptacion']) {
                        JuradoProyecto::ESTADO_ACEPTADO => 'success',
                        JuradoProyecto::ESTADO_PENDIENTE => 'warning',
                        JuradoProyecto::ESTADO_RECHAZADO => 'danger',
                        default => 'neutral',
                    },
                    'url' => route('docente.jurado.proyectos-asignados'),
                ];
            })
            ->values()
            ->all();

        $fechasExamenes = $items
            ->pluck('fecha_examen_iso')
            ->filter()
            ->values();

        return $this->construirDashboard(
            clave: 'jurado',
            etiqueta: 'Jurado',
            descripcion: 'Designaciones y exámenes profesionales que tienes asignados.',
            stats: $stats,
            graficaTitulo: 'Exámenes programados',
            graficaDetalle: 'Exámenes de tus proyectos en los últimos 12 meses.',
            fechasGrafica: $fechasExamenes,
            listaTitulo: $listaTitulo,
            listaDetalle: $listaDetalle,
            actividades: $actividades,
            accion: [
                'etiqueta' => 'Ver proyectos asignados',
                'url' => route('docente.jurado.proyectos-asignados'),
            ],
        );
    }

    /**
     * Estado del flujo del asesor para una versión de tesis.
     *
     * @return array{etiqueta: string, tono: string}
     */
    private function estadoAsesor(?VersionTesis $version, int $idAsesorProyecto): array
    {
        if (! $version) {
            return ['etiqueta' => 'Sin entregas', 'tono' => 'neutral'];
        }

        $revision = $version->revisiones
            ->firstWhere('id_asesor_proyecto', $idAsesorProyecto)
            ?? $version->revisiones->sortByDesc('id_revision')->first();

        $estado = $revision?->estado_revision ?? RevisionAsesor::ESTADO_PENDIENTE;

        return match ($estado) {
            RevisionAsesor::ESTADO_APROBADA, 'Aprobado' => [
                'etiqueta' => 'Aprobado',
                'tono' => 'success',
            ],
            RevisionAsesor::ESTADO_CON_CAMBIOS, RevisionAsesor::ESTADO_RECHAZADA => [
                'etiqueta' => 'Con cambios',
                'tono' => 'warning',
            ],
            default => [
                'etiqueta' => 'En revisión',
                'tono' => 'info',
            ],
        };
    }

    /**
     * Agrupa las fechas recibidas en los últimos 12 meses.
     *
     * @param  Collection<int, mixed>  $fechas
     * @return array<int, array{clave: string, etiqueta: string, total: int}>
     */
    private function actividadMensual(Collection $fechas): array
    {
        $inicio = CarbonImmutable::today()->startOfMonth()->subMonths(11);

        $conteos = $fechas
            ->filter()
            ->map(function (mixed $fecha): string {
                return $fecha instanceof DateTimeInterface
                    ? CarbonImmutable::instance($fecha)->format('Y-m')
                    : CarbonImmutable::parse((string) $fecha)->format('Y-m');
            })
            ->countBy();

        $datos = [];

        for ($indice = 0; $indice < 12; $indice++) {
            $mes = $inicio->addMonths($indice);
            $clave = $mes->format('Y-m');

            $datos[] = [
                'clave' => $clave,
                'etiqueta' => self::MESES_CORTOS[(int) $mes->format('n') - 1],
                'total' => (int) ($conteos->get($clave) ?? 0),
            ];
        }

        return $datos;
    }

    /**
     * Une la información común que consumen los tres dashboards.
     *
     * @param  array<int, array{clave: string, etiqueta: string, valor: int, detalle: string, tono: string}>  $stats
     * @param  Collection<int, mixed>  $fechasGrafica
     * @param  array<int, array{id: string, titulo: string, descripcion: string, fecha: string|null, fecha_iso: string|null, etiqueta: string, tono: string, url: string|null}>  $actividades
     * @param  array{etiqueta: string, url: string}  $accion
     * @return array<string, mixed>
     */
    private function construirDashboard(
        string $clave,
        string $etiqueta,
        string $descripcion,
        array $stats,
        string $graficaTitulo,
        string $graficaDetalle,
        Collection $fechasGrafica,
        string $listaTitulo,
        string $listaDetalle,
        array $actividades,
        array $accion,
    ): array {
        $datosGrafica = $this->actividadMensual($fechasGrafica);

        return [
            'clave' => $clave,
            'etiqueta' => $etiqueta,
            'descripcion' => $descripcion,
            'stats' => $stats,
            'grafica' => [
                'titulo' => $graficaTitulo,
                'detalle' => $graficaDetalle,
                'total' => array_sum(array_column($datosGrafica, 'total')),
                'datos' => $datosGrafica,
            ],
            'lista' => [
                'titulo' => $listaTitulo,
                'detalle' => $listaDetalle,
                'items' => $actividades,
            ],
            'accion' => $accion,
        ];
    }

    /**
     * Obtiene el nombre de pila del docente autenticado.
     */
    private function nombreCorto(int $userId): string
    {
        $docente = Docente::query()->find($userId);

        return $docente?->nombre ?: (string) Auth::user()?->name;
    }

    /**
     * Saludo de acuerdo con la hora actual.
     */
    private function saludo(): string
    {
        $hora = (int) CarbonImmutable::now()->format('G');

        return match (true) {
            $hora < 12 => 'Buenos días',
            $hora < 19 => 'Buenas tardes',
            default => 'Buenas noches',
        };
    }
}
