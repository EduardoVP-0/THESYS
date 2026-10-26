<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CONTROLADOR DEL PANEL DE CONTROL ADMINISTRATIVO
 *
 * Concentra las métricas generales del proceso de titulación. Las consultas
 * son de solo lectura y usan el query builder porque el dashboard trabaja con
 * agregados y cruces de varias tablas, no con la hidratación de un modelo.
 */
class DashboardController extends Controller
{
    /**
     * Estados canónicos que se muestran en el gráfico de estado de tesis.
     *
     * @var array<int, array{estado: string, color: string}>
     */
    private const ESTADOS_TESIS = [
        ['estado' => 'Planteamiento', 'color' => '#94A3B8'],
        ['estado' => 'En desarrollo', 'color' => '#3B82F6'],
        ['estado' => 'En revisión', 'color' => '#F59E0B'],
        ['estado' => 'Aprobada', 'color' => '#10B981'],
    ];

    /**
     * Muestra el dashboard con métricas, gráficos y próximas defensas.
     */
    public function index(): Response
    {
        $estadoTesis = $this->estadoTesis();
        $totalTesis = array_sum(array_column($estadoTesis, 'total'));
        $tesisAprobadas = $this->totalPorEstado($estadoTesis, 'Aprobada');

        // Los estados de rechazo/cancelación no forman parte del proceso activo.
        $tesisCerradas = DB::table('tblproyectos')
            ->whereIn('estado', ['Rechazada', 'Rechazado', 'Cancelada', 'Cancelado'])
            ->count();

        $inicioMesActual = now()->startOfMonth();
        $inicioMesAnterior = now()->subMonthNoOverflow()->startOfMonth();
        $finMesAnterior = now()->subMonthNoOverflow()->endOfMonth();

        // El histórico disponible es created_at/updated_at; se usa como
        // aproximación para comparar la actividad del mes actual con el anterior.
        $nuevasMesActual = DB::table('tblproyectos')
            ->whereBetween('created_at', [$inicioMesActual, now()])
            ->count();

        $nuevasMesAnterior = DB::table('tblproyectos')
            ->whereBetween('created_at', [$inicioMesAnterior, $finMesAnterior])
            ->count();

        $aprobadasMesActual = DB::table('tblproyectos')
            ->whereIn('estado', ['Aprobada', 'Aprobado'])
            ->whereBetween('updated_at', [$inicioMesActual, now()])
            ->count();

        $aprobadasMesAnterior = DB::table('tblproyectos')
            ->whereIn('estado', ['Aprobada', 'Aprobado'])
            ->whereBetween('updated_at', [$inicioMesAnterior, $finMesAnterior])
            ->count();

        $proximasDefensas = DB::table('tblexamenes_profesionales')
            ->whereBetween('fecha_examen', [
                now()->toDateString(),
                now()->addDays(30)->toDateString(),
            ])
            ->whereNotIn('estado_examen', ['Cancelado', 'Cancelada', 'Realizado', 'Concluido'])
            ->count();

        $todasTesis = $this->tesisRecientes(50);

        return Inertia::render('admin/dashboard/index', [
            'stats' => [
                'tesis_en_proceso' => max($totalTesis - $tesisAprobadas - $tesisCerradas, 0),
                'tesis_en_proceso_tendencia' => $this->tendencia($nuevasMesActual, $nuevasMesAnterior),
                'tesis_aprobadas' => $tesisAprobadas,
                'tesis_aprobadas_tendencia' => $this->tendencia($aprobadasMesActual, $aprobadasMesAnterior),
                'estudiantes_activos' => DB::table('tblalumnos')
                    ->join('users', 'users.id', '=', 'tblalumnos.id_usuario')
                    ->where('users.estado', true)
                    ->count(),
                'proximas_defensas' => $proximasDefensas,
            ],
            'estadoTesis' => $estadoTesis,
            'totalTesis' => $totalTesis,
            'tesisPorCarrera' => $this->tesisPorCarrera(),
            'ultimasTesis' => $todasTesis->take(5)->values(),
            'todasTesis' => $todasTesis,
            'defensasCalendario' => $this->defensasCalendario(),
            'fechaActual' => now()->format('d/m/Y'),
        ]);
    }

    /**
     * Genera el reporte general de tesis en CSV o en una vista imprimible PDF.
     */
    public function report(Request $request): StreamedResponse|HttpResponse
    {
        $formato = strtolower($request->string('format')->toString());
        $tesis = $this->tesisParaReporte();

        if ($formato === 'csv') {
            return $this->reporteCsv($tesis);
        }

        return $this->reportePdf($tesis);
    }

    /**
     * Agrupa los proyectos por estado y normaliza las variantes históricas.
     *
     * @return array<int, array{estado: string, total: int, color: string}>
     */
    private function estadoTesis(): array
    {
        $conteos = DB::table('tblproyectos')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $normalizados = [];

        foreach (self::ESTADOS_TESIS as $item) {
            $normalizados[$item['estado']] = 0;
        }

        foreach ($conteos as $estado => $total) {
            $clave = $this->normalizarEstado((string) $estado);
            $normalizados[$clave] = ($normalizados[$clave] ?? 0) + (int) $total;
        }

        $resultado = [];

        foreach (self::ESTADOS_TESIS as $item) {
            $resultado[] = [
                'estado' => $item['estado'],
                'total' => $normalizados[$item['estado']] ?? 0,
                'color' => $item['color'],
            ];
        }

        if (($normalizados['Otros'] ?? 0) > 0) {
            $resultado[] = [
                'estado' => 'Otros',
                'total' => $normalizados['Otros'],
                'color' => '#64748B',
            ];
        }

        return $resultado;
    }

    /**
     * Convierte los estados almacenados a las cuatro categorías del gráfico.
     */
    private function normalizarEstado(string $estado): string
    {
        return match (mb_strtolower(trim($estado))) {
            'planteamiento', 'propuesta' => 'Planteamiento',
            'en desarrollo', 'desarrollo', 'en proceso', 'en progreso' => 'En desarrollo',
            'en revisión', 'en revision', 'revisión', 'revision' => 'En revisión',
            'aprobada', 'aprobado' => 'Aprobada',
            default => 'Otros',
        };
    }

    /**
     * @param  array<int, array{estado: string, total: int, color: string}>  $estadoTesis
     */
    private function totalPorEstado(array $estadoTesis, string $estado): int
    {
        foreach ($estadoTesis as $item) {
            if ($item['estado'] === $estado) {
                return $item['total'];
            }
        }

        return 0;
    }

    /**
     * Calcula la variación porcentual entre dos periodos.
     */
    private function tendencia(int $actual, int $anterior): ?float
    {
        if ($anterior === 0) {
            return $actual > 0 ? 100.0 : null;
        }

        return round((($actual - $anterior) / $anterior) * 100, 1);
    }

    /**
     * Cuenta las tesis registradas por carrera para el gráfico de barras.
     *
     * @return Collection<int, array{carrera: string, total: int}>
     */
    private function tesisPorCarrera(): Collection
    {
        return DB::table('tblcarreras')
            ->leftJoin('tblalumnos', 'tblalumnos.id_carrera', '=', 'tblcarreras.id_carrera')
            ->leftJoin('tblalumnos_proyectos', 'tblalumnos_proyectos.id_alumno', '=', 'tblalumnos.id_usuario')
            ->leftJoin('tblproyectos', 'tblproyectos.id_proyecto', '=', 'tblalumnos_proyectos.id_proyecto')
            ->select(
                'tblcarreras.nombre_carrera',
                DB::raw('COUNT(DISTINCT tblproyectos.id_proyecto) as total')
            )
            ->groupBy('tblcarreras.id_carrera', 'tblcarreras.nombre_carrera')
            ->orderByDesc('total')
            ->orderBy('tblcarreras.nombre_carrera')
            ->limit(5)
            ->get()
            ->map(fn (object $carrera): array => [
                'carrera' => (string) $carrera->nombre_carrera,
                'total' => (int) $carrera->total,
            ])
            ->filter(fn (array $carrera): bool => $carrera['total'] > 0)
            ->values();
    }

    /**
     * Obtiene las tesis más recientes con el nombre del estudiante.
     *
     * @return Collection<int, array{id_proyecto: int, titulo: string, estudiante: string, estado: string, fecha: string}>
     */
    private function tesisRecientes(int $limite): Collection
    {
        $tesis = DB::table('tblproyectos')
            ->select('id_proyecto', 'titulo', 'estado', 'created_at')
            ->latest('created_at')
            ->limit($limite)
            ->get();

        $estudiantes = $this->estudiantesPorProyecto($tesis->pluck('id_proyecto')->all());

        return $tesis->map(fn (object $item): array => [
            'id_proyecto' => (int) $item->id_proyecto,
            'titulo' => (string) $item->titulo,
            'estudiante' => $estudiantes[(int) $item->id_proyecto] ?? 'Sin estudiante asignado',
            'estado' => (string) $item->estado,
            'fecha' => Carbon::parse($item->created_at)->format('d/m/Y'),
        ])->values();
    }

    /**
     * Devuelve el nombre de los estudiantes agrupado por proyecto.
     *
     * @param  array<int, int|string>  $idsProyecto
     * @return array<int, string>
     */
    private function estudiantesPorProyecto(array $idsProyecto): array
    {
        if ($idsProyecto === []) {
            return [];
        }

        return DB::table('tblalumnos_proyectos')
            ->join('tblalumnos', 'tblalumnos.id_usuario', '=', 'tblalumnos_proyectos.id_alumno')
            ->join('users', 'users.id', '=', 'tblalumnos.id_usuario')
            ->whereIn('tblalumnos_proyectos.id_proyecto', $idsProyecto)
            ->select('tblalumnos_proyectos.id_proyecto', 'users.name')
            ->get()
            ->groupBy('id_proyecto')
            ->map(fn (Collection $estudiantes): string => $estudiantes->pluck('name')->unique()->implode(' / '))
            ->all();
    }

    /**
     * Devuelve las defensas del mes anterior y de los próximos tres meses.
     *
     * @return Collection<int, array{id_examen: int, id_proyecto: int, titulo: string, estudiante: string, fecha: string, hora: string, sede: string, estado: string}>
     */
    private function defensasCalendario(): Collection
    {
        $examenes = DB::table('tblexamenes_profesionales')
            ->join('tblproyectos', 'tblproyectos.id_proyecto', '=', 'tblexamenes_profesionales.id_proyecto')
            ->select(
                'tblexamenes_profesionales.id_examen',
                'tblexamenes_profesionales.id_proyecto',
                'tblexamenes_profesionales.fecha_examen',
                'tblexamenes_profesionales.hora_examen',
                'tblexamenes_profesionales.sede',
                'tblexamenes_profesionales.estado_examen',
                'tblproyectos.titulo'
            )
            ->whereBetween('tblexamenes_profesionales.fecha_examen', [
                now()->subMonthNoOverflow()->startOfMonth()->toDateString(),
                now()->addMonthsNoOverflow(3)->endOfMonth()->toDateString(),
            ])
            ->whereNotIn('tblexamenes_profesionales.estado_examen', ['Cancelado', 'Cancelada'])
            ->orderBy('tblexamenes_profesionales.fecha_examen')
            ->orderBy('tblexamenes_profesionales.hora_examen')
            ->get();

        $estudiantes = $this->estudiantesPorProyecto($examenes->pluck('id_proyecto')->unique()->all());

        return $examenes->map(fn (object $examen): array => [
            'id_examen' => (int) $examen->id_examen,
            'id_proyecto' => (int) $examen->id_proyecto,
            'titulo' => (string) $examen->titulo,
            'estudiante' => $estudiantes[(int) $examen->id_proyecto] ?? 'Sin estudiante asignado',
            'fecha' => Carbon::parse($examen->fecha_examen)->format('Y-m-d'),
            'hora' => substr((string) $examen->hora_examen, 0, 5),
            'sede' => (string) $examen->sede,
            'estado' => (string) $examen->estado_examen,
        ])->values();
    }

    /**
     * Prepara todas las tesis para el reporte descargable.
     *
     * @return Collection<int, array{titulo: string, estudiante: string, carrera: string, estado: string, fecha: string}>
     */
    private function tesisParaReporte(): Collection
    {
        $tesis = DB::table('tblproyectos')
            ->select('id_proyecto', 'titulo', 'estado', 'created_at')
            ->latest('created_at')
            ->get();

        $idsProyecto = $tesis->pluck('id_proyecto')->all();
        $estudiantes = $this->estudiantesPorProyecto($idsProyecto);
        $carreras = $this->carrerasPorProyecto($idsProyecto);

        return $tesis->map(fn (object $item): array => [
            'titulo' => (string) $item->titulo,
            'estudiante' => $estudiantes[(int) $item->id_proyecto] ?? 'Sin estudiante asignado',
            'carrera' => $carreras[(int) $item->id_proyecto] ?? 'Sin carrera asignada',
            'estado' => (string) $item->estado,
            'fecha' => Carbon::parse($item->created_at)->format('d/m/Y'),
        ])->values();
    }

    /**
     * Devuelve las carreras asociadas a cada proyecto.
     *
     * @param  array<int, int|string>  $idsProyecto
     * @return array<int, string>
     */
    private function carrerasPorProyecto(array $idsProyecto): array
    {
        if ($idsProyecto === []) {
            return [];
        }

        return DB::table('tblalumnos_proyectos')
            ->join('tblalumnos', 'tblalumnos.id_usuario', '=', 'tblalumnos_proyectos.id_alumno')
            ->join('tblcarreras', 'tblcarreras.id_carrera', '=', 'tblalumnos.id_carrera')
            ->whereIn('tblalumnos_proyectos.id_proyecto', $idsProyecto)
            ->select('tblalumnos_proyectos.id_proyecto', 'tblcarreras.nombre_carrera')
            ->get()
            ->groupBy('id_proyecto')
            ->map(fn (Collection $carreras): string => $carreras->pluck('nombre_carrera')->unique()->implode(' / '))
            ->all();
    }

    /**
     * @param  Collection<int, array{titulo: string, estudiante: string, carrera: string, estado: string, fecha: string}>  $tesis
     */
    private function reporteCsv(Collection $tesis): StreamedResponse
    {
        $filename = 'reporte_tesis_'.now()->format('Y-m-d_His').'.csv';

        return response()->streamDownload(function () use ($tesis): void {
            $file = fopen('php://output', 'w');

            if ($file === false) {
                return;
            }

            // BOM UTF-8 para que Excel reconozca acentos y caracteres especiales.
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($file, ['Título', 'Estudiante', 'Carrera', 'Estado', 'Fecha de registro']);

            foreach ($tesis as $item) {
                fputcsv($file, [
                    $item['titulo'],
                    $item['estudiante'],
                    $item['carrera'],
                    $item['estado'],
                    $item['fecha'],
                ]);
            }

            fclose($file);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * @param  Collection<int, array{titulo: string, estudiante: string, carrera: string, estado: string, fecha: string}>  $tesis
     */
    private function reportePdf(Collection $tesis): HttpResponse
    {
        $generado = now()->format('d/m/Y H:i');
        $total = $tesis->count();

        $filas = $tesis->map(fn (array $item): string => '<tr>'
            .'<td>'.e($item['titulo']).'</td>'
            .'<td>'.e($item['estudiante']).'</td>'
            .'<td>'.e($item['carrera']).'</td>'
            .'<td>'.e($item['estado']).'</td>'
            .'<td>'.e($item['fecha']).'</td>'
            .'</tr>')->implode('');

        if ($filas === '') {
            $filas = '<tr><td colspan="5" class="empty">Sin tesis registradas.</td></tr>';
        }

        $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte general de tesis - THESYS</title>
    <style>
        @page { size: letter portrait; margin: 12mm 10mm 15mm 10mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 15px; color: #2D2D2D; background: #FFFFFF; }
        .action-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px 15px; margin-bottom: 15px; font-size: 11px; color: #4B5563; }
        .btn-print { background: #10B981; color: #FFFFFF; border: none; padding: 7px 14px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer; }
        .header-container { border-bottom: 2px solid #10B981; padding-bottom: 10px; margin-bottom: 14px; text-align: center; }
        .institution-title { font-size: 14px; font-weight: bold; color: #065F46; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 0.5px; }
        .document-title { font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 4px; }
        .subtitle { font-size: 11px; color: #4B5563; margin: 0; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5px; }
        th { background: #10B981; color: #FFFFFF; padding: 8px 6px; font-weight: bold; font-size: 10px; text-transform: uppercase; border: 1px solid #059669; }
        td { padding: 6px 7px; border: 1px solid #D1D5DB; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.35; }
        tr:nth-child(even) td { background: #F9FAFB; }
        .empty { text-align: center; color: #6B7280; padding: 18px; }
        .footer { text-align: center; font-size: 9px; color: #9CA3AF; margin-top: 15px; border-top: 1px solid #E5E7EB; padding-top: 8px; }
        @media print { body { padding: 0; } .action-bar { display: none !important; } tr { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="action-bar">
        <span>Reporte generado el {$generado}</span>
        <button class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
    </div>
    <div class="header-container">
        <h1 class="institution-title">Universidad Autónoma de Chiapas</h1>
        <h2 class="document-title">Reporte general de tesis</h2>
        <p class="subtitle">Sistema THESYS · {$total} tesis registradas</p>
    </div>
    <table>
        <thead>
            <tr>
                <th style="width: 30%;">Título</th>
                <th style="width: 22%;">Estudiante</th>
                <th style="width: 22%;">Carrera</th>
                <th style="width: 13%;">Estado</th>
                <th style="width: 13%;">Fecha</th>
            </tr>
        </thead>
        <tbody>{$filas}</tbody>
    </table>
    <div class="footer">Documento generado automáticamente por THESYS.</div>
    <script>window.addEventListener('load', function () { window.print(); });</script>
</body>
</html>
HTML;

        return response($html)->header('Content-Type', 'text/html; charset=UTF-8');
    }
}
