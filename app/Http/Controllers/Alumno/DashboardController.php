<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Docente;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use App\Support\Portal\EventosCalendario;
use App\Support\Portal\FlujoRevisionTesis;
use App\Support\Portal\PresentacionExamen;
use App\Support\Portal\RevisionesRevisor;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DASHBOARD DEL SUSTENTANTE
 *
 * Presenta el resumen del proceso de titulación: estado actual, próximo
 * hito, retroalimentación reciente, avance ponderado por etapas, actividad
 * reciente y fechas pendientes. La línea de tiempo se comparte con el
 * calendario académico mediante `EventosCalendario`.
 */
class DashboardController extends Controller
{
    /**
     * Etapas del proceso con su peso dentro del avance total.
     *
     * @var array<int, array{clave: string, etiqueta: string, corta: string, peso: int, detalle_pendiente: string}>
     */
    private const ETAPAS = [
        [
            'clave' => 'anteproyecto',
            'etiqueta' => 'Anteproyecto',
            'corta' => 'Anteproy.',
            'peso' => 15,
            'detalle_pendiente' => 'Sin enviar',
        ],
        [
            'clave' => 'director',
            'etiqueta' => 'Director de tesis',
            'corta' => 'Director',
            'peso' => 15,
            'detalle_pendiente' => 'En espera de asignación',
        ],
        [
            'clave' => 'revision_director',
            'etiqueta' => 'Revisión del director',
            'corta' => 'Revisión',
            'peso' => 20,
            'detalle_pendiente' => 'Sin versiones',
        ],
        [
            'clave' => 'revisores',
            'etiqueta' => 'Revisores',
            'corta' => 'Revisores',
            'peso' => 20,
            'detalle_pendiente' => 'En espera de asignación',
        ],
        [
            'clave' => 'jurado',
            'etiqueta' => 'Jurado',
            'corta' => 'Jurado',
            'peso' => 15,
            'detalle_pendiente' => 'En espera de asignación',
        ],
        [
            'clave' => 'examen',
            'etiqueta' => 'Examen profesional',
            'corta' => 'Examen',
            'peso' => 15,
            'detalle_pendiente' => 'En espera de programación',
        ],
    ];

    /**
     * Muestra el dashboard inicial del alumno.
     */
    public function index(Request $request): Response
    {
        $alumno = Alumno::with('carrera')->find($request->user()->id);

        $proyecto = $alumno
            ? $alumno->proyectos()
                ->with([
                    'asesores',
                    'jurados.docente',
                    'examen.sedeRelacionada',
                ])
                ->latest('tblproyectos.id_proyecto')
                ->first()
            : null;

        $hoy = CarbonImmutable::today();
        $eventos = $proyecto ? EventosCalendario::paraProyecto($proyecto) : [];

        if ($proyecto) {
            $contexto = $this->contexto($proyecto);
            $progreso = $this->progreso($proyecto, $contexto);
            $estado = $this->estado($contexto, $hoy);
            $proximoHito = $this->proximoHito($contexto, $hoy);
            $retroalimentacion = $this->retroalimentacion($proyecto, $contexto);
            $proximasFechas = $this->proximasFechas($contexto, $hoy);
        } else {
            $progreso = $this->progresoVacio();
            $estado = [
                'label' => 'Sin proyecto',
                'detalle' => 'Registra tu anteproyecto',
                'tono' => 'neutral',
            ];
            $proximoHito = [
                'titulo' => 'Registra tu anteproyecto',
                'fecha' => null,
                'etiqueta_fecha' => null,
                'dias_restantes' => null,
                'detalle' => 'Primer paso del proceso',
                'estado' => 'en_espera',
            ];
            $retroalimentacion = [
                'total' => 0,
                'autor' => null,
                'origen' => null,
                'fecha' => null,
                'texto' => null,
            ];
            $proximasFechas = [
                $this->fechaPendiente(
                    'anteproyecto',
                    'Registra tu anteproyecto',
                    'Académico',
                    'Primer paso del proceso',
                ),
            ];
        }

        return Inertia::render('Alumno/dashboard', [
            'nombre' => $alumno?->nombre ?? $request->user()->name,
            'alumno' => $alumno ? [
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera ?? 'Sin carrera asignada',
            ] : null,
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'estado' => $proyecto->estado,
            ] : null,
            'saludo' => $this->saludo(),
            'fecha_larga' => $this->fechaLarga($hoy),
            'resumen' => [
                'estado' => $estado,
                'proximo_hito' => $proximoHito,
                'retroalimentacion' => $retroalimentacion,
            ],
            'progreso' => $progreso,
            'actividad_reciente' => $this->actividadReciente($eventos, $hoy),
            'proximas_fechas' => $proximasFechas,
        ]);
    }

    /**
     * Reúne el estado del proyecto que comparten los cálculos del dashboard.
     *
     * @return array{
     *     asesor: Docente|null,
     *     revisores: Collection<int, Docente>,
     *     revisores_aprobados: int,
     *     revisores_completos: bool,
     *     revisores_con_cambios: bool,
     *     estado_asesor: array{version: VersionTesis|null, estado: string|null, fecha_decision: Carbon|null},
     *     director_aprobo: bool,
     *     jurados_asignados: int,
     *     examen: ExamenProfesional|null,
     *     resultado_clave: string|null
     * }
     */
    private function contexto(Proyecto $proyecto): array
    {
        $asesor = $proyecto->asesores->first(
            fn (Docente $docente): bool => $docente->pivot->estado_asignacion === 'Activo',
        ) ?? $proyecto->asesores->first();

        $revisores = $proyecto->revisores()
            ->wherePivot('estado_asignacion', 'Activo')
            ->withPivot('estado_revision', 'comentarios_revision', 'fecha_revision')
            ->get();

        $estadoAsesor = FlujoRevisionTesis::estadoAsesor($proyecto->id_proyecto);

        $directorAprobo = in_array(
            $estadoAsesor['estado'],
            [RevisionAsesor::ESTADO_APROBADA, 'Aprobado'],
            true,
        );

        $revisoresAprobados = $revisores->filter(
            fn (Docente $docente): bool => $docente->pivot->estado_revision === RevisionesRevisor::ESTADO_APROBADO,
        )->count();

        $revisoresCompletos = $revisores->count() >= 2
            && $revisores->every(
                fn (Docente $docente): bool => $docente->pivot->estado_revision === RevisionesRevisor::ESTADO_APROBADO,
            );

        return [
            'asesor' => $asesor,
            'revisores' => $revisores,
            'revisores_aprobados' => $revisoresAprobados,
            'revisores_completos' => $revisoresCompletos,
            'revisores_con_cambios' => $revisores->contains(
                fn (Docente $docente): bool => $docente->pivot->estado_revision === RevisionesRevisor::ESTADO_CON_CAMBIOS,
            ),
            'estado_asesor' => $estadoAsesor,
            'director_aprobo' => $directorAprobo,
            'jurados_asignados' => $proyecto->jurados->count(),
            'examen' => $proyecto->examen,
            'resultado_clave' => PresentacionExamen::claveResultado($proyecto->examen?->resultado_final),
        ];
    }

    /**
     * Calcula el avance ponderado de las seis etapas del proceso.
     *
     * @param  array<string, mixed>  $contexto
     * @return array{porcentaje: int, completadas: int, total: int, etapas: array<int, array<string, mixed>>}
     */
    private function progreso(Proyecto $proyecto, array $contexto): array
    {
        if ($proyecto->estaAprobado()) {
            $anteproyecto = [100, 'Aprobado'];
        } elseif ($proyecto->estado === Proyecto::ESTADO_CON_CAMBIOS) {
            $anteproyecto = [50, 'Con cambios'];
        } elseif ($proyecto->fecha_envio) {
            $anteproyecto = [60, 'En revisión'];
        } else {
            $anteproyecto = [0, 'Sin enviar'];
        }

        $director = $contexto['asesor']
            ? [100, 'Asignado a '.EventosCalendario::nombreDocente($contexto['asesor'])]
            : [0, 'En espera de asignación'];

        $estadoAsesor = $contexto['estado_asesor'];

        if ($contexto['director_aprobo']) {
            $revisionDirector = [100, 'Aprobada por el director'];
        } elseif ($estadoAsesor['version'] !== null) {
            $revisionDirector = match ($estadoAsesor['estado']) {
                RevisionAsesor::ESTADO_CON_CAMBIOS => [50, 'Con cambios'],
                RevisionAsesor::ESTADO_RECHAZADA => [40, 'Rechazada'],
                default => [50, 'En revisión'],
            };
        } else {
            $revisionDirector = [0, 'Sin versiones'];
        }

        $revisoresAsignados = $contexto['revisores']->count();

        if ($revisoresAsignados === 0) {
            $revisores = [0, 'En espera de asignación'];
        } elseif ($contexto['revisores_completos']) {
            $revisores = [
                100,
                $contexto['revisores_aprobados'].' de '.$revisoresAsignados.' aprobaron',
            ];
        } else {
            $porcentajeRevisores = (int) round(
                30 + ($contexto['revisores_aprobados'] / max($revisoresAsignados, 2)) * 70,
            );

            $revisores = [
                min(99, $porcentajeRevisores),
                $contexto['revisores_con_cambios']
                    ? 'Con cambios'
                    : ($contexto['revisores_aprobados'] > 0
                        ? $contexto['revisores_aprobados'].' de '.$revisoresAsignados.' aprobaron'
                        : 'En revisión'),
            ];
        }

        $juradosAsignados = $contexto['jurados_asignados'];
        $jurados = [
            (int) round(min(100, ($juradosAsignados / count(JuradoProyecto::CARGOS)) * 100)),
            $juradosAsignados === 0
                ? 'En espera de asignación'
                : $juradosAsignados.' de '.count(JuradoProyecto::CARGOS).' asignados',
        ];

        $examen = $contexto['examen'];

        if (! $examen) {
            $etapaExamen = [0, 'En espera de programación'];
        } elseif (in_array($contexto['resultado_clave'], ['aprobado', 'observaciones'], true)) {
            $etapaExamen = [100, 'Aprobado'];
        } elseif ($contexto['resultado_clave'] === 'rechazado') {
            $etapaExamen = [60, 'Rechazado'];
        } elseif ($examen->estado_examen === ExamenProfesional::ESTADO_REALIZADO) {
            $etapaExamen = [75, 'Realizado'];
        } else {
            $etapaExamen = [50, 'Programado'];
        }

        $etapas = [
            $this->etapa(0, $anteproyecto[0], $anteproyecto[1]),
            $this->etapa(1, $director[0], $director[1]),
            $this->etapa(2, $revisionDirector[0], $revisionDirector[1]),
            $this->etapa(3, $revisores[0], $revisores[1]),
            $this->etapa(4, $jurados[0], $jurados[1]),
            $this->etapa(5, $etapaExamen[0], $etapaExamen[1]),
        ];

        $porcentaje = (int) round(array_sum(array_map(
            fn (array $etapa): float => $etapa['peso'] * $etapa['porcentaje'] / 100,
            $etapas,
        )));

        $completadas = count(array_filter(
            $etapas,
            fn (array $etapa): bool => $etapa['estado'] === 'completado',
        ));

        if ($completadas < count($etapas)) {
            $porcentaje = min(99, $porcentaje);
        }

        return [
            'porcentaje' => $porcentaje,
            'completadas' => $completadas,
            'total' => count($etapas),
            'etapas' => $etapas,
        ];
    }

    /**
     * Avance vacío para alumnos que aún no tienen proyecto.
     *
     * @return array{porcentaje: int, completadas: int, total: int, etapas: array<int, array<string, mixed>>}
     */
    private function progresoVacio(): array
    {
        $etapas = array_map(
            fn (int $indice): array => $this->etapa(
                $indice,
                0,
                self::ETAPAS[$indice]['detalle_pendiente'],
            ),
            array_keys(self::ETAPAS),
        );

        return [
            'porcentaje' => 0,
            'completadas' => 0,
            'total' => count($etapas),
            'etapas' => $etapas,
        ];
    }

    /**
     * Construye una etapa con su estado derivado del porcentaje.
     *
     * @return array<string, mixed>
     */
    private function etapa(int $indice, int $porcentaje, string $detalle): array
    {
        $base = self::ETAPAS[$indice];

        return [
            'clave' => $base['clave'],
            'etiqueta' => $base['etiqueta'],
            'corta' => $base['corta'],
            'peso' => $base['peso'],
            'estado' => $porcentaje >= 100
                ? 'completado'
                : ($porcentaje > 0 ? 'en_curso' : 'pendiente'),
            'porcentaje' => $porcentaje,
            'detalle' => $detalle,
        ];
    }

    /**
     * Estado general del proceso para la tarjeta de resumen.
     *
     * @param  array<string, mixed>  $contexto
     * @return array{label: string, detalle: string, tono: string}
     */
    private function estado(array $contexto, CarbonImmutable $hoy): array
    {
        if (in_array($contexto['resultado_clave'], ['aprobado', 'observaciones'], true)) {
            return [
                'label' => 'Titulación concluida',
                'detalle' => 'Todos los procesos aprobados',
                'tono' => 'success',
            ];
        }

        if ($contexto['resultado_clave'] === 'rechazado') {
            return [
                'label' => 'Examen no aprobado',
                'detalle' => 'Revisa el resultado',
                'tono' => 'danger',
            ];
        }

        $examen = $contexto['examen'];

        if ($examen) {
            if ($examen->estado_examen === ExamenProfesional::ESTADO_REALIZADO) {
                return [
                    'label' => 'Examen realizado',
                    'detalle' => 'Resultado pendiente',
                    'tono' => 'warning',
                ];
            }

            $programado = $examen->fecha_examen->toDateString() >= $hoy->toDateString();

            return [
                'label' => 'Examen programado',
                'detalle' => $programado ? 'En curso' : 'Fecha pasada',
                'tono' => $programado ? 'info' : 'warning',
            ];
        }

        if ($contexto['revisores_con_cambios']
            || $contexto['estado_asesor']['estado'] === RevisionAsesor::ESTADO_CON_CAMBIOS) {
            return [
                'label' => 'Con cambios',
                'detalle' => 'Revisa la retroalimentación',
                'tono' => 'warning',
            ];
        }

        if (! $contexto['asesor']) {
            return [
                'label' => 'En espera de asesor',
                'detalle' => 'Asignación pendiente',
                'tono' => 'neutral',
            ];
        }

        if ($contexto['revisores']->isEmpty()) {
            return [
                'label' => 'En espera de revisores',
                'detalle' => 'Asignación pendiente',
                'tono' => 'neutral',
            ];
        }

        if ($contexto['director_aprobo'] && $contexto['revisores_completos']) {
            return [
                'label' => 'Tesis aprobada',
                'detalle' => 'En espera del examen',
                'tono' => 'success',
            ];
        }

        if (! $contexto['director_aprobo']) {
            return [
                'label' => 'En revisión',
                'detalle' => $contexto['estado_asesor']['version']
                    ? 'Revisión del director'
                    : 'Sube tu primera versión',
                'tono' => 'info',
            ];
        }

        return [
            'label' => 'En revisión',
            'detalle' => 'Dictamen de revisores',
            'tono' => 'info',
        ];
    }

    /**
     * Próximo hito del proceso para la tarjeta de resumen.
     *
     * @param  array<string, mixed>  $contexto
     * @return array{titulo: string, fecha: string|null, etiqueta_fecha: string|null, dias_restantes: int|null, detalle: string, estado: string}
     */
    private function proximoHito(array $contexto, CarbonImmutable $hoy): array
    {
        $examen = $contexto['examen'];

        if (in_array($contexto['resultado_clave'], ['aprobado', 'observaciones'], true)) {
            return [
                'titulo' => 'Proceso concluido',
                'fecha' => $examen?->fecha_examen?->toDateString(),
                'etiqueta_fecha' => $examen
                    ? PresentacionExamen::fechaSinDia($examen->fecha_examen)
                    : null,
                'dias_restantes' => null,
                'detalle' => 'Titulación aprobada',
                'estado' => 'concluida',
            ];
        }

        if ($contexto['resultado_clave'] === 'rechazado') {
            return [
                'titulo' => 'Resultado del examen',
                'fecha' => $examen?->fecha_examen?->toDateString(),
                'etiqueta_fecha' => $examen
                    ? PresentacionExamen::fechaSinDia($examen->fecha_examen)
                    : null,
                'dias_restantes' => null,
                'detalle' => 'Revisa el resultado con el jurado',
                'estado' => 'pendiente',
            ];
        }

        if ($examen) {
            $dias = PresentacionExamen::diasRestantes($examen->fecha_examen);

            if ($examen->estado_examen === ExamenProfesional::ESTADO_REALIZADO || $dias < 0) {
                return [
                    'titulo' => 'Resultado del examen',
                    'fecha' => $examen->fecha_examen->toDateString(),
                    'etiqueta_fecha' => PresentacionExamen::fechaSinDia($examen->fecha_examen),
                    'dias_restantes' => $dias,
                    'detalle' => 'En espera de resultado',
                    'estado' => 'pendiente',
                ];
            }

            return [
                'titulo' => 'Examen profesional',
                'fecha' => $examen->fecha_examen->toDateString(),
                'etiqueta_fecha' => PresentacionExamen::fechaSinDia($examen->fecha_examen),
                'dias_restantes' => $dias,
                'detalle' => 'A las '.PresentacionExamen::horaLarga((string) $examen->hora_examen),
                'estado' => 'programada',
            ];
        }

        if (! $contexto['asesor']) {
            return $this->hitoPendiente(
                'Asignación de director de tesis',
                'En espera de asignación',
            );
        }

        if (! $contexto['director_aprobo']) {
            return $this->hitoPendiente(
                $contexto['estado_asesor']['version']
                    ? 'Revisión de tesis por el director'
                    : 'Sube tu primera versión de tesis',
                $contexto['estado_asesor']['version']
                    ? 'En espera de dictamen'
                    : 'Tu director la revisará',
            );
        }

        if ($contexto['revisores']->count() < 2) {
            return $this->hitoPendiente(
                'Asignación de revisores',
                'En espera de asignación',
            );
        }

        if (! $contexto['revisores_completos']) {
            return $this->hitoPendiente('Dictamen de revisores', 'En revisión');
        }

        if ($contexto['jurados_asignados'] < count(JuradoProyecto::CARGOS)) {
            return $this->hitoPendiente(
                'Asignación de jurado',
                'En espera de asignación',
            );
        }

        return $this->hitoPendiente(
            'Programación del examen profesional',
            'En espera de programación',
        );
    }

    /**
     * Hito sin fecha programada.
     *
     * @return array{titulo: string, fecha: null, etiqueta_fecha: null, dias_restantes: null, detalle: string, estado: string}
     */
    private function hitoPendiente(string $titulo, string $detalle): array
    {
        return [
            'titulo' => $titulo,
            'fecha' => null,
            'etiqueta_fecha' => null,
            'dias_restantes' => null,
            'detalle' => $detalle,
            'estado' => 'en_espera',
        ];
    }

    /**
     * Retroalimentación más reciente del director y los revisores.
     *
     * @param  array<string, mixed>  $contexto
     * @return array{total: int, autor: string|null, origen: string|null, fecha: string|null, texto: string|null}
     */
    private function retroalimentacion(Proyecto $proyecto, array $contexto): array
    {
        $comentarios = [];

        $versiones = VersionTesis::with('revisiones')
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->get();

        foreach ($versiones as $version) {
            if (str_contains((string) $version->ruta_archivo, FlujoRevisionTesis::CARPETA_REVISORES)) {
                continue;
            }

            foreach ($version->revisiones as $revision) {
                $texto = trim((string) $revision->observaciones);

                if ($texto === '') {
                    continue;
                }

                $comentarios[] = [
                    'autor' => $contexto['asesor']
                        ? EventosCalendario::nombreDocente($contexto['asesor'])
                        : 'Director de tesis',
                    'origen' => 'director',
                    'fecha' => $revision->updated_at,
                    'texto' => $texto,
                ];
            }
        }

        foreach ($contexto['revisores'] as $docente) {
            $texto = trim((string) $docente->pivot->comentarios_revision);

            if ($texto === '') {
                continue;
            }

            $comentarios[] = [
                'autor' => EventosCalendario::nombreDocente($docente),
                'origen' => 'revisor',
                'fecha' => $docente->pivot->fecha_revision ?? $docente->pivot->updated_at,
                'texto' => $texto,
            ];
        }

        usort($comentarios, function (array $a, array $b): int {
            return $this->aCarbon($b['fecha'])->timestamp
                <=> $this->aCarbon($a['fecha'])->timestamp;
        });

        $ultimo = $comentarios[0] ?? null;

        return [
            'total' => count($comentarios),
            'autor' => $ultimo['autor'] ?? null,
            'origen' => $ultimo['origen'] ?? null,
            'fecha' => $ultimo ? $this->aCarbon($ultimo['fecha'])->toDateString() : null,
            'texto' => $ultimo['texto'] ?? null,
        ];
    }

    /**
     * Hitos pendientes y examen programado para la sección de próximas fechas.
     *
     * @param  array<string, mixed>  $contexto
     * @return array<int, array<string, string|null>>
     */
    private function proximasFechas(array $contexto, CarbonImmutable $hoy): array
    {
        $fechas = [];
        $examen = $contexto['examen'];
        $resultadoClave = $contexto['resultado_clave'];

        if (in_array($resultadoClave, ['aprobado', 'observaciones'], true)) {
            return [[
                'id' => 'culminacion',
                'titulo' => 'Titulación concluida',
                'categoria' => 'Examen',
                'fecha' => $examen?->fecha_examen?->toDateString(),
                'detalle' => 'Todos los procesos aprobados',
                'estado' => 'concluida',
            ]];
        }

        if ($resultadoClave === 'rechazado') {
            $fechas[] = [
                'id' => 'resultado-examen',
                'titulo' => 'Resultado del examen',
                'categoria' => 'Examen',
                'fecha' => $examen?->fecha_examen?->toDateString(),
                'detalle' => 'Revisa el resultado con el jurado',
                'estado' => 'pendiente',
            ];

            $fechas[] = $this->fechaPendiente(
                'reprogramacion-examen',
                'Reprogramación del examen',
                'Examen',
                'En espera de nueva fecha',
            );

            return array_slice($fechas, 0, 4);
        }

        if ($examen) {
            $programado = $examen->fecha_examen->toDateString() >= $hoy->toDateString();

            $fechas[] = [
                'id' => 'examen',
                'titulo' => 'Examen profesional',
                'categoria' => 'Examen',
                'fecha' => $examen->fecha_examen->toDateString(),
                'detalle' => 'A las '.PresentacionExamen::horaLarga((string) $examen->hora_examen),
                'estado' => $programado ? 'programada' : 'pendiente',
            ];
        }

        if (! $contexto['asesor']) {
            $fechas[] = $this->fechaPendiente(
                'asesor',
                'Asignación de director de tesis',
                'Académico',
                'En espera de asignación',
            );
        } elseif (! $contexto['director_aprobo']) {
            $fechas[] = $this->fechaPendiente(
                'director',
                $contexto['estado_asesor']['version']
                    ? 'Revisión de tesis por el director'
                    : 'Sube tu primera versión de tesis',
                'Académico',
                $contexto['estado_asesor']['version']
                    ? 'En espera de dictamen'
                    : 'Tu director la revisará',
            );
        }

        if ($contexto['revisores']->count() < 2) {
            $fechas[] = $this->fechaPendiente(
                'revisores',
                'Asignación de revisores',
                'Académico',
                'En espera de asignación',
            );
        } elseif (! $contexto['revisores_completos']) {
            $fechas[] = $this->fechaPendiente(
                'dictamen-revisores',
                'Dictamen de revisores',
                'Académico',
                'En revisión',
            );
        }

        if ($contexto['jurados_asignados'] < count(JuradoProyecto::CARGOS)) {
            $fechas[] = $this->fechaPendiente(
                'jurado',
                'Asignación de jurado',
                'Académico',
                'En espera de asignación',
            );
        }

        if (! $examen) {
            $fechas[] = $this->fechaPendiente(
                'programacion-examen',
                'Programación del examen',
                'Examen',
                'En espera de programación',
            );
        }

        return array_slice($fechas, 0, 4);
    }

    /**
     * Fecha pendiente sin programar.
     *
     * @return array{id: string, titulo: string, categoria: string, fecha: null, detalle: string, estado: string}
     */
    private function fechaPendiente(
        string $id,
        string $titulo,
        string $categoria,
        string $detalle,
    ): array {
        return [
            'id' => $id,
            'titulo' => $titulo,
            'categoria' => $categoria,
            'fecha' => null,
            'detalle' => $detalle,
            'estado' => 'en_espera',
        ];
    }

    /**
     * Últimos eventos del proceso para la tarjeta de actividad reciente.
     *
     * @param  array<int, array<string, string|null>>  $eventos
     * @return array<int, array<string, string|null>>
     */
    private function actividadReciente(array $eventos, CarbonImmutable $hoy): array
    {
        $pasados = array_values(array_filter(
            $eventos,
            fn (array $evento): bool => $evento['tipo'] !== 'examen'
                && $evento['fecha'] <= $hoy->toDateString(),
        ));

        $pasados = array_slice(array_reverse($pasados), 0, 4);

        return array_map(function (array $evento) use ($hoy): array {
            $fecha = $this->aCarbon($evento['fecha']);

            return [
                'id' => $evento['id'],
                'tipo' => $evento['tipo'],
                'tono' => $evento['tono'],
                'titulo' => $evento['titulo'],
                'descripcion' => $evento['descripcion'],
                'fecha' => $evento['fecha'],
                'etiqueta_tiempo' => $this->etiquetaTiempo($fecha, $hoy),
            ];
        }, $pasados);
    }

    /**
     * Etiqueta relativa de una fecha: "Hoy", "Ayer", "Hace 3 días"...
     */
    private function etiquetaTiempo(CarbonImmutable $fecha, CarbonImmutable $hoy): string
    {
        $dias = (int) $hoy->startOfDay()->diffInDays($fecha->startOfDay(), false);

        return match (true) {
            $dias === 0 => 'Hoy',
            $dias === -1 => 'Ayer',
            $dias < -1 && $dias >= -30 => 'Hace '.abs($dias).' días',
            $dias === 1 => 'Mañana',
            $dias > 1 && $dias <= 30 => 'En '.$dias.' días',
            default => $fecha->format('d/m/Y'),
        };
    }

    /**
     * Saludo de acuerdo con la hora del servidor.
     */
    private function saludo(): string
    {
        $hora = CarbonImmutable::now()->hour;

        return match (true) {
            $hora < 12 => 'Buenos días',
            $hora < 19 => 'Buenas tardes',
            default => 'Buenas noches',
        };
    }

    /**
     * Fecha del encabezado: "Jueves, 29 de octubre de 2026".
     */
    private function fechaLarga(CarbonImmutable $fecha): string
    {
        $texto = PresentacionExamen::fechaLarga($fecha);

        return preg_replace('/^(\p{L}+)\s/u', '$1, ', $texto) ?? $texto;
    }

    private function aCarbon(DateTimeInterface|string $fecha): CarbonImmutable
    {
        return $fecha instanceof DateTimeInterface
            ? CarbonImmutable::instance($fecha)
            : CarbonImmutable::parse($fecha);
    }
}
