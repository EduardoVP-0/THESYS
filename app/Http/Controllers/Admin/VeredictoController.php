<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Dictamen;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE VEREDICTOS
 *
 * Agrupa los dictámenes individuales del jurado por examen profesional y
 * muestra el resumen de votos y resultado.
 */
class VeredictoController extends Controller
{
    /**
     * Muestra los exámenes con el resumen de votos y el estado del veredicto.
     */
    public function index(Request $request): Response
    {
        $examenes = ExamenProfesional::query()
            ->with([
                'proyecto:id_proyecto,titulo',
                'proyecto.alumnos',
                'proyecto.jurados' => function ($query): void {
                    $query
                        ->with([
                            'dictamen',
                            'docente.user:id,email',
                            'user:id,name,email',
                        ])
                        ->orderBy('id_jurado_proyecto');
                },
            ])
            ->orderByDesc('fecha_examen')
            ->orderByDesc('id_examen')
            ->get();

        $todos = $examenes
            ->map(fn (ExamenProfesional $examen): array => $this->transformarExamen($examen))
            ->values();

        $stats = [
            'total' => $todos->count(),
            'aprobados' => $todos->where('estado_key', 'aprobado')->count(),
            'observaciones' => $todos->where('estado_key', 'observaciones')->count(),
            'rechazados' => $todos->where('estado_key', 'rechazado')->count(),
            'por_resolver' => $todos
                ->whereIn('estado_key', ['pendiente', 'revision'])
                ->count(),
        ];

        $estado = (string) $request->input('estado', 'todos');
        $estadosValidos = ['todos', 'aprobado', 'observaciones', 'rechazado', 'revision', 'pendiente'];

        if (! in_array($estado, $estadosValidos, true)) {
            $estado = 'todos';
        }

        $busqueda = trim((string) $request->input('search', ''));
        $busquedaNormalizada = mb_strtolower(Str::ascii($busqueda));

        $filtrados = $todos
            ->when($busquedaNormalizada !== '', function (Collection $items) use ($busquedaNormalizada): Collection {
                return $items
                    ->filter(function (array $item) use ($busquedaNormalizada): bool {
                        $texto = mb_strtolower(Str::ascii(implode(' ', [
                            $item['estudiante']['nombre_completo'],
                            $item['estudiante']['matricula'],
                            $item['titulo'],
                        ])));

                        return str_contains($texto, $busquedaNormalizada);
                    })
                    ->values();
            })
            ->when($estado !== 'todos', function (Collection $items) use ($estado): Collection {
                return $items
                    ->where('estado_key', $estado)
                    ->values();
            })
            ->values();

        $porPagina = 10;
        $pagina = max(1, $request->integer('page', 1));
        $ultimaPagina = max(1, (int) ceil($filtrados->count() / $porPagina));
        $pagina = min($pagina, $ultimaPagina);

        $veredictos = new LengthAwarePaginator(
            $filtrados->forPage($pagina, $porPagina)->values()->all(),
            $filtrados->count(),
            $porPagina,
            $pagina,
            [
                'path' => route('admin.veredictos.index'),
                'query' => $request->query(),
            ],
        );

        return Inertia::render('admin/veredictos/index', [
            'veredictos' => $veredictos,
            'stats' => $stats,
            'filters' => [
                'search' => $busqueda === '' ? null : $busqueda,
                'estado' => $estado,
            ],
        ]);
    }

    /**
     * Construye la representación de un examen para la página de veredictos.
     *
     * @return array<string, mixed>
     */
    private function transformarExamen(ExamenProfesional $examen): array
    {
        $proyecto = $examen->proyecto;
        $alumno = $proyecto?->alumnos->first();
        $jurados = $proyecto?->jurados
            ?->sortBy(fn (JuradoProyecto $miembro): int => $this->posicionCargo($miembro->cargo))
            ->values()
            ?? collect();

        $titulares = $jurados
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->esTitular())
            ->values();

        $favor = $titulares
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->dictamen?->voto === Dictamen::VOTO_A_FAVOR)
            ->count();
        $contra = $titulares
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->dictamen?->voto === Dictamen::VOTO_EN_CONTRA)
            ->count();
        $abstencion = $titulares
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->dictamen?->voto === Dictamen::VOTO_ABSTENCION)
            ->count();

        $emitidos = $titulares
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->dictamen !== null)
            ->count();

        $estado = $this->calcularEstado(
            $examen->resultado_final,
            $favor,
            $contra,
            $abstencion,
            $emitidos,
        );

        $votoResumen = $emitidos === 0
            ? 'Pendiente'
            : "{$favor} — {$contra}";

        $estudiante = [
            'id_usuario' => $alumno?->id_usuario ?? 0,
            'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
            'matricula' => $alumno?->matricula ?? 'Sin matrícula',
            'iniciales' => $alumno?->iniciales ?? 'NA',
        ];

        return [
            'id_examen' => $examen->id_examen,
            'id_proyecto' => $examen->id_proyecto,
            'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
            'estudiante' => $estudiante,
            'fecha' => CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y'),
            'fecha_iso' => CarbonImmutable::parse($examen->fecha_examen)->toDateString(),
            'hora' => substr((string) $examen->hora_examen, 0, 5),
            'sede' => $examen->sede,
            'estado' => $estado,
            'estado_key' => $this->claveEstado($estado),
            'estado_examen' => $examen->estado_examen,
            'resultado_final' => $examen->resultado_final,
            'votos' => [
                'favor' => $favor,
                'contra' => $contra,
                'abstencion' => $abstencion,
                'emitidos' => $emitidos,
                'titulares' => $titulares->count(),
            ],
            'voto_resumen' => $votoResumen,
            'jurados' => $this->transformarJurados($jurados),
        ];
    }

    /**
     * Representa a todos los integrantes del jurado y su voto.
     *
     * @param  Collection<int, JuradoProyecto>  $jurados
     * @return array<int, array<string, mixed>>
     */
    private function transformarJurados(Collection $jurados): array
    {
        return $jurados
            ->map(function (JuradoProyecto $miembro): array {
                $docente = $miembro->docente;

                return [
                    'id_jurado_proyecto' => $miembro->id_jurado_proyecto,
                    'cargo' => $miembro->cargo,
                    'es_titular' => $miembro->esTitular(),
                    'estado_aceptacion' => $miembro->estado_aceptacion,
                    'voto' => $miembro->dictamen?->voto,
                    'observaciones' => $miembro->dictamen?->observaciones,
                    'docente' => [
                        'id_usuario' => $miembro->id_usuario,
                        'nombre_completo' => $docente?->nombre_completo
                            ?? $miembro->user?->name
                            ?? 'Docente no disponible',
                        'iniciales' => $docente?->iniciales ?? 'NA',
                        'email' => $docente?->user?->email ?? $miembro->user?->email,
                    ],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Determina el estado mostrado del veredicto.
     */
    private function calcularEstado(
        ?string $resultadoFinal,
        int $favor,
        int $contra,
        int $abstencion,
        int $emitidos,
    ): string {
        if ($resultadoFinal !== null && trim($resultadoFinal) !== '') {
            $normalizado = mb_strtolower(Str::ascii(trim($resultadoFinal)));

            return match (true) {
                str_contains($normalizado, 'observ') => 'Con observaciones',
                str_contains($normalizado, 'rechaz') => 'Rechazado',
                str_contains($normalizado, 'revision') => 'En revisión',
                str_contains($normalizado, 'aprob') => 'Aprobado',
                default => $resultadoFinal,
            };
        }

        if ($emitidos === 0) {
            return 'Pendiente';
        }

        if ($emitidos < count(JuradoProyecto::CARGOS_TITULARES)) {
            return 'En revisión';
        }

        if ($favor > $contra) {
            return $contra === 0 && $abstencion === 0
                ? 'Aprobado'
                : 'Con observaciones';
        }

        if ($contra > $favor) {
            return 'Rechazado';
        }

        return 'En revisión';
    }

    /**
     * Clave estable para filtros y estilos de estado.
     */
    private function claveEstado(string $estado): string
    {
        return match ($estado) {
            'Aprobado' => 'aprobado',
            'Con observaciones' => 'observaciones',
            'Rechazado' => 'rechazado',
            'En revisión' => 'revision',
            default => 'pendiente',
        };
    }

    /**
     * Posición del cargo dentro de la estructura del jurado.
     */
    private function posicionCargo(string $cargo): int
    {
        $posicion = array_search($cargo, JuradoProyecto::CARGOS, true);

        return $posicion === false ? count(JuradoProyecto::CARGOS) : $posicion;
    }
}
