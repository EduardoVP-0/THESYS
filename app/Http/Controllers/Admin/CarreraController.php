<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCarreraRequest;
use App\Http\Requests\UpdateCarreraRequest;
use App\Models\Admin\Alumno;
use App\Models\Admin\Carrera;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

// Controlador de Gestion de carreras (modulo administrativo)
class CarreraController extends Controller
{
    // Muestra la pantalla principal con la tabla de carreras, buscador y estadísticas.
    public function index(Request $request): Response
    {
        $query = Carrera::withCount([
            'alumnos' => fn ($q) => $q->where('estado_academico', 'Activo'),
        ]);
        // Filtro por buscador (nombre, descripción o duración)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre_carrera', 'ilike', "%{$search}%")
                    ->orWhere('descripcion', 'ilike', "%{$search}%")
                    ->orWhere('duracion_semestres', 'ilike', "%{$search}%");
            });
        }
        // Filtro por estado (activas, inactivas o todas)
        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $query->where('estado', $request->input('estado') === 'activa');
        }
        // Filtro por duración en semestres
        if ($request->filled('duracion') && $request->input('duracion') !== 'todos') {
            $query->where('duracion_semestres', (int) $request->input('duracion'));
        }

        // Obtenemos las carreras paginadas (6 por página para visualización limpia)
        $carreras = $query->latest('id_carrera')->paginate(6)->withQueryString();

        // Métricas calculadas para las 4 Cards superiores del diseño
        $stats = [
            'total' => Carrera::count(),
            'activas' => Carrera::where('estado', true)->count(),
            'inactivas' => Carrera::where('estado', false)->count(),
            'alumnos_vigentes' => Alumno::where('estado_academico', 'Activo')
                ->whereHas('carrera', fn ($query) => $query->where('estado', true))
                ->count(),
        ];

        // Enviamos los datos a la vista de React mediante Inertia
        return Inertia::render('admin/carreras/index', [
            'carreras' => $carreras,
            'stats' => $stats,
            'filters' => $request->only(['search', 'estado', 'duracion']),
        ]);
    }

    // Muestra la vista con el formulario para registrar una nueva carrera
    public function create(): Response
    {
        return Inertia::render('admin/carreras/create');
    }

    // Guarda la nueva carrera en la base de datos
    public function store(StoreCarreraRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Asignamos el ID del administrador que está realizando el registro (Auditoría)
        $validated['id_usuario_registro'] = Auth::id();
        $validated['estado'] = $request->boolean('estado', true);
        Carrera::create($validated);

        return redirect()->route('admin.carreras.index')
            ->with('success', 'Carrera registrada exitosamente.');
    }

    // Muestra la vista de edición con los datos de la carrera seleccionada.
    public function edit(Carrera $carrera): Response
    {
        return Inertia::render('admin/carreras/edit', [
            'carrera' => $carrera,
        ]);
    }

    // Actualiza la información de la carrera en la base de datos.
    public function update(UpdateCarreraRequest $request, Carrera $carrera): RedirectResponse
    {
        $validated = $request->validated();
        $validated['estado'] = $request->boolean('estado', true);
        $carrera->update($validated);

        return redirect()->route('admin.carreras.index')
            ->with('success', 'Carrera actualizada correctamente.');
    }

    /*Alterna el estado de la carrera (Activar / Desactivar - Baja lógica)
    No elimina el registro para preservar la integridad de datos
     */
    public function toggleStatus(Carrera $carrera): RedirectResponse
    {
        // Si la carrera esta activa y se intenta dar de baja, validamos que no tenga alumnos activos
        if ($carrera->estado) {
            $alumnosActivos = $carrera->alumnos()
                ->where('estado_academico', 'Activo')
                ->count();

            if ($alumnosActivos > 0) {
                return redirect()->route('admin.carreras.index')
                    ->with('error', "No se puede dar de baja \"{$carrera->nombre_carrera}\" porque tiene {$alumnosActivos} alumno(s) vigente(s).");
            }
        }
        $carrera->update([
            'estado' => ! $carrera->estado,
        ]);
        $mensaje = $carrera->estado
            ? 'Carrera activada exitosamente.'
            : 'Carrera dada de baja exitosamente.';

        return redirect()->route('admin.carreras.index')
            ->with('success', $mensaje);
    }

    // Exporta el catálogo completo de carreras a formato CSV con codificación UTF-8.
    public function exportCsv()
    {
        $carreras = Carrera::all();
        $filename = 'carreras_unach_'.date('Y-m-d_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($carreras) {
            $file = fopen('php://output', 'w');
            // BOM UTF-8 para compatibilidad de acentos con Excel
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($file, ['Clave', 'Nombre de la Carrera', 'Descripcion', 'Duracion_Semestres', 'Estado']);

            foreach ($carreras as $carrera) {
                fputcsv($file, [
                    $carrera->clave,
                    $carrera->nombre_carrera,
                    $carrera->descripcion,
                    $carrera->duracion_semestres,
                    $carrera->estado ? 'Vigente' : 'Inactivo',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Exporta la tabla de carreras como documento PDF (HTML imprimible).
     * Genera un diseño institucional UNACH optimizado para impresión/guardado en PDF sin desbordamientos.
     */
    public function exportPdf()
    {
        $carreras = Carrera::all();
        $fecha = date('d/m/Y H:i');
        $totalCarreras = $carreras->count();

        $html = '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo de Carreras - UNACH</title>
    <style>
        @page {
            size: letter portrait;
            margin: 12mm 10mm 15mm 10mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 15px;
            color: #2D2D2D;
            background-color: #FFFFFF;
        }
        .header-container {
            border-bottom: 2px solid #10B981;
            padding-bottom: 10px;
            margin-bottom: 12px;
            text-align: center;
        }
        .institution-title {
            font-size: 14px;
            font-weight: bold;
            color: #065F46;
            margin: 0 0 2px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .document-title {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
            margin: 0 0 4px 0;
        }
        .subtitle {
            font-size: 11px;
            color: #4B5563;
            margin: 0;
        }
        .meta-bar {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #6B7280;
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px dashed #E5E7EB;
        }
        .table-container {
            width: 100%;
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10.5px;
        }
        th {
            background-color: #10B981;
            color: #FFFFFF;
            padding: 8px 6px;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border: 1px solid #059669;
        }
        td {
            padding: 6px 7px;
            border: 1px solid #D1D5DB;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            line-height: 1.35;
        }
        tr:nth-child(even) td {
            background-color: #F9FAFB;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: bold;
            text-align: center;
        }
        .badge-vigente {
            background-color: #D1FAE5;
            color: #065F46;
            border: 1px solid #A7F3D0;
        }
        .badge-inactivo {
            background-color: #FEE2E2;
            color: #991B1B;
            border: 1px solid #FECACA;
        }
        .footer {
            text-align: center;
            font-size: 9px;
            color: #9CA3AF;
            margin-top: 15px;
            border-top: 1px solid #E5E7EB;
            padding-top: 8px;
        }
        .action-bar {
            background: #F3F4F6;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 10px 15px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .btn-print {
            background-color: #10B981;
            color: white;
            border: none;
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
        }
        .btn-print:hover {
            background-color: #059669;
        }
        .btn-close {
            background-color: #FFFFFF;
            color: #374151;
            border: 1px solid #D1D5DB;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
        }
        @media print {
            body {
                padding: 0;
            }
            .action-bar {
                display: none !important;
            }
            tr {
                page-break-inside: avoid;
            }
            thead {
                display: table-header-group;
            }
        }
    </style>
</head>
<body>
    <div class="action-bar no-print">
        <span style="font-size: 12px; color: #374151;">Vista previa del PDF de la tabla de Carreras</span>
        <div style="display: flex; gap: 8px;">
            <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
            <button class="btn-close" onclick="window.close()">Cerrar</button>
        </div>
    </div>

    <div class="header-container">
        <div class="institution-title">Universidad Autónoma de Chiapas</div>
        <div class="document-title">CATÁLOGO DE PROGRAMAS EDUCATIVOS (CARRERAS)</div>
        <div class="subtitle">Escuela de Tecnologías Digitales Aplicadas — THESYS</div>
        <div class="meta-bar">
            <span><strong>Fecha de expedición:</strong> '.$fecha.'</span>
            <span><strong>Total de registros:</strong> '.$totalCarreras.'</span>
        </div>
    </div>

    <div class="table-container">
        <table>
            <colgroup>
                <col style="width: 14%;">
                <col style="width: 27%;">
                <col style="width: 37%;">
                <col style="width: 11%;">
                <col style="width: 11%;">
            </colgroup>
            <thead>
                <tr>
                    <th style="text-align: center;">Clave</th>
                    <th style="text-align: left;">Nombre de la Carrera</th>
                    <th style="text-align: left;">Descripción</th>
                    <th style="text-align: center;">Semestres</th>
                    <th style="text-align: center;">Estado</th>
                </tr>
            </thead>
            <tbody>';

        foreach ($carreras as $carrera) {
            $estadoBadge = $carrera->estado
                ? '<span class="badge badge-vigente">Vigente</span>'
                : '<span class="badge badge-inactivo">Inactivo</span>';
            $descripcion = e($carrera->descripcion ?: 'Sin descripción registrada');

            $html .= '<tr>
                <td style="text-align: center; font-weight: bold; color: #111827;">'.e($carrera->clave).'</td>
                <td style="font-weight: 500; color: #1F2937;">'.e($carrera->nombre_carrera).'</td>
                <td style="color: #4B5563;">'.$descripcion.'</td>
                <td style="text-align: center; font-weight: 500;">'.$carrera->duracion_semestres.'</td>
                <td style="text-align: center;">'.$estadoBadge.'</td>
            </tr>';
        }

        $html .= '</tbody>
        </table>
    </div>

    <div class="footer">
        Documento oficial generado automáticamente por el Sistema THESYS — Universidad Autónoma de Chiapas
    </div>

    <script>
        window.addEventListener("DOMContentLoaded", function() {
            window.print();
        });
    </script>
</body>
</html>';

        return response($html)->header('Content-Type', 'text/html; charset=UTF-8');
    }

    /**
     * Exporta la tabla de carreras como documento Word (.doc).
     * Genera un HTML con marcado y estilos Word/MSO para evitar desbordamientos y ajustar al ancho de página Carta.
     */
    public function exportWord()
    {
        $carreras = Carrera::all();
        $fecha = date('d/m/Y H:i');
        $totalCarreras = $carreras->count();
        $filename = 'carreras_unach_'.date('Y-m-d_His').'.doc';

        $html = '<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <title>Catálogo de Carreras - UNACH</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page {
            size: 612.0pt 792.0pt;
            margin: 45.0pt 45.0pt 45.0pt 45.0pt;
            mso-page-orientation: portrait;
        }
        @page Section1 {
            size: 612.0pt 792.0pt;
            margin: 45.0pt 45.0pt 45.0pt 45.0pt;
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
            mso-paper-source: 0;
        }
        div.Section1 {
            page: Section1;
        }
        body {
            font-family: Calibri, Arial, sans-serif;
            font-size: 10pt;
            color: #2D2D2D;
            margin: 0;
            padding: 0;
        }
        .header-box {
            text-align: center;
            border-bottom: 2pt solid #10B981;
            padding-bottom: 8pt;
            margin-bottom: 12pt;
        }
        .inst-title {
            font-size: 11pt;
            font-weight: bold;
            color: #065F46;
            margin-bottom: 2pt;
            text-transform: uppercase;
        }
        .doc-title {
            font-size: 14pt;
            font-weight: bold;
            color: #111827;
            margin-bottom: 3pt;
        }
        .sub-title {
            font-size: 9.5pt;
            color: #4B5563;
        }
        .meta-info {
            font-size: 8.5pt;
            color: #6B7280;
            margin-top: 6pt;
        }
        table.carreras-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            mso-table-layout-alt: fixed;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        th {
            background-color: #10B981;
            color: #FFFFFF;
            font-family: Calibri, Arial, sans-serif;
            font-size: 9.5pt;
            font-weight: bold;
            padding: 6pt 6pt;
            border: 1.0pt solid #059669;
            text-transform: uppercase;
        }
        td {
            font-family: Calibri, Arial, sans-serif;
            font-size: 9pt;
            padding: 5pt 6pt;
            border: 1.0pt solid #D1D5DB;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        tr.even td {
            background-color: #F9FAFB;
        }
        .footer {
            text-align: center;
            font-size: 8pt;
            color: #9CA3AF;
            margin-top: 15pt;
            border-top: 1.0pt solid #E5E7EB;
            padding-top: 6pt;
        }
    </style>
</head>
<body>
<div class="Section1">
    <div class="header-box">
        <div class="inst-title">Universidad Autónoma de Chiapas</div>
        <div class="doc-title">CATÁLOGO DE PROGRAMAS EDUCATIVOS (CARRERAS)</div>
        <div class="sub-title">Escuela de Tecnologías Digitales Aplicadas — THESYS</div>
        <div class="meta-info">Fecha de expedición: '.$fecha.' | Total de registros: '.$totalCarreras.'</div>
    </div>

    <table class="carreras-table" border="1" cellspacing="0" cellpadding="5" width="100%" style="width: 100%; border-collapse: collapse; table-layout: fixed;">
        <colgroup>
            <col width="14%" style="width: 14%;">
            <col width="27%" style="width: 27%;">
            <col width="37%" style="width: 37%;">
            <col width="11%" style="width: 11%;">
            <col width="11%" style="width: 11%;">
        </colgroup>
        <thead>
            <tr style="background-color: #10B981;">
                <th width="14%" style="width: 14%; text-align: center;">Clave</th>
                <th width="27%" style="width: 27%; text-align: left;">Nombre de la Carrera</th>
                <th width="37%" style="width: 37%; text-align: left;">Descripción</th>
                <th width="11%" style="width: 11%; text-align: center;">Semestres</th>
                <th width="11%" style="width: 11%; text-align: center;">Estado</th>
            </tr>
        </thead>
        <tbody>';

        $index = 0;
        foreach ($carreras as $carrera) {
            $rowClass = ($index % 2 === 1) ? ' class="even"' : '';
            $estadoText = $carrera->estado ? 'Vigente' : 'Inactivo';
            $estadoColor = $carrera->estado ? '#065F46' : '#991B1B';
            $descripcion = e($carrera->descripcion ?: 'Sin descripción registrada');

            $html .= '<tr'.$rowClass.' style="page-break-inside: avoid; mso-line-break-inside: avoid;">
                <td width="14%" style="width: 14%; text-align: center; font-weight: bold;">'.e($carrera->clave).'</td>
                <td width="27%" style="width: 27%; font-weight: bold;">'.e($carrera->nombre_carrera).'</td>
                <td width="37%" style="width: 37%; color: #4B5563;">'.$descripcion.'</td>
                <td width="11%" style="width: 11%; text-align: center;">'.$carrera->duracion_semestres.'</td>
                <td width="11%" style="width: 11%; text-align: center; font-weight: bold; color: '.$estadoColor.';">'.$estadoText.'</td>
            </tr>';
            $index++;
        }

        $html .= '</tbody>
    </table>

    <div class="footer">
        Documento oficial generado automáticamente por el Sistema THESYS — Universidad Autónoma de Chiapas
    </div>
</div>
</body>
</html>';

        return response($html)
            ->header('Content-Type', 'application/msword; charset=UTF-8')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }
}
