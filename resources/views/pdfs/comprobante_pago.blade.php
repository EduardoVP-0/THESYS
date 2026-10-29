<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante de Pago - {{ $referenciaBancaria }}</title>
    <style>
        /* Configuración estricta para una sola página tamaño carta */
        @page {
            size: letter portrait;
            margin: 15mm 15mm 15mm 15mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1f2937;
            font-size: 9.5px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        
        /* ENCABEZADO: Con espacio superior perfecto para que no se pegue al borde */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #10B981;
            padding-bottom: 12px;
            margin-top: 10px;
            margin-bottom: 16px;
            border-collapse: collapse;
        }
        .header-left h1 {
            font-size: 13px;
            color: #18181b;
            margin: 0 0 3px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header-left p {
            font-size: 8.5px;
            color: #6b7280;
            margin: 0;
        }
        .header-right {
            text-align: right;
            vertical-align: top;
        }
        .folio-badge {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            color: #065f46;
            padding: 5px 8px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 10px;
            display: inline-block;
        }

        /* Secciones en Tarjetas */
        .section-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 8.5px;
            text-transform: uppercase;
            color: #10B981;
            font-weight: bold;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 4px;
        }

        /* Datos del Alumno en bloques fluidos */
        .data-row {
            margin-bottom: 6px;
            width: 100%;
        }
        .data-row:after {
            content: "";
            display: table;
            clear: both;
        }
        .data-group {
            float: left;
            width: 50%;
        }
        .data-group-full {
            width: 100%;
        }
        .label {
            font-size: 8.5px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: bold;
            display: block;
            margin-bottom: 2px;
        }
        .value {
            font-size: 9.5px;
            color: #111827;
            word-wrap: break-word;
        }

        /* TÍTULO DE CONCEPTOS: Con margen superior para que respire */
        .concepts-heading {
            margin-top: 16px;
            margin-bottom: 6px;
            font-size: 8.5px;
            text-transform: uppercase;
            color: #10B981;
            font-weight: bold;
            letter-spacing: 0.8px;
        }

        /* BLOQUES DE CONCEPTOS */
        .item-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            padding: 10px 12px;
            margin-bottom: 8px;
            page-break-inside: avoid;
        }
        .item-table {
            width: 100%;
            border-collapse: collapse;
        }
        .item-table td {
            padding: 2px 0;
            vertical-align: top;
        }
        .item-desc {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px dashed #e5e7eb;
            font-size: 9.5px;
            color: #1f2937;
            word-wrap: break-word;
        }
        .text-right {
            text-align: right;
        }

        /* Totales */
        .totals-container {
            width: 100%;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        .totals-table {
            width: 40%;
            float: right;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 4px 6px;
            font-size: 10px;
        }
        .totals-table tr.total-row {
            background-color: #ecfdf5;
            font-weight: bold;
            color: #065f46;
            border-top: 1px solid #a7f3d0;
            border-bottom: 1px solid #a7f3d0;
        }

        /* Observaciones y Sellos */
        .clear {
            clear: both;
        }
        .obs-text {
            font-size: 8.5px;
            color: #4b5563;
            background: #f9fafb;
            border-left: 3px solid #10B981;
            padding: 8px 10px;
            margin-bottom: 10px;
            word-wrap: break-word;
            page-break-inside: avoid;
        }
        .crypto-box {
            font-family: monospace;
            font-size: 6.5px;
            color: #6b7280;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            padding: 6px;
            border-radius: 4px;
            word-break: break-all;
            margin-bottom: 6px;
        }
        
        /* Pie de página */
        .footer {
            text-align: center;
            font-size: 7.5px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            margin-top: 10px;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>

    <!-- 1. ENCABEZADO -->
    <table class="header-table">
        <tr>
            <td class="header-left">
                <h1>THESYS / Universidad Autónoma de Chiapas</h1>
                <p>Sistema Integral de Gestión Académica y Pagos</p>
                <p>Blvd. Belisario Domínguez Km. 1081 | R.F.C.: UAC750417LE8</p>
            </td>
            <td class="header-right">
                <div class="folio-badge">
                    FOLIO: {{ $serieFolio }}
                </div>
            </td>
        </tr>
    </table>

    <!-- 2. SECCIÓN: DATOS DEL ALUMNO Y REFERENCIA -->
    <div class="section-box">
        <div class="section-title">Información del Alumno y Referencia</div>
        
        <div class="data-row">
            <div class="data-group">
                <span class="label">Alumno:</span>
                <span class="value"><b>{{ $nombreAlumno }}</b></span>
            </div>
            <div class="data-group">
                <span class="label">Fecha de Emisión:</span>
                <span class="value">{{ $fecha }}</span>
            </div>
        </div>

        <div class="data-row">
            <div class="data-group">
                <span class="label">Matrícula:</span>
                <span class="value">{{ $matricula }}</span>
            </div>
            <div class="data-group">
                <span class="label">Ciclo / Semestre:</span>
                <span class="value">{{ $ciclo }} / Semestre {{ $semestre ?? '9' }}</span>
            </div>
        </div>

        <div class="data-row">
            <div class="data-group-full">
                <span class="label">Carrera:</span>
                <span class="value">{{ $carrera }}</span>
            </div>
        </div>

        <div class="data-row" style="margin-top: 4px;">
            <div class="data-group-full">
                <span class="label">Referencia Bancaria:</span>
                <span class="value" style="color: #10B981; font-family: monospace; font-weight: bold; font-size: 10.5px;">{{ $referenciaBancaria }}</span>
            </div>
        </div>
    </div>

    <!-- 3. SECCIÓN: CONCEPTOS DE PAGO -->
    <div class="concepts-heading">
        Conceptos de Pago
    </div>

    @foreach($conceptos as $item)
    <div class="item-card">
        <table class="item-table">
            <tr>
                <td style="width: 35%;">
                    <span class="label">Clave:</span>
                    <span class="value" style="font-weight: bold; color: #18181b;">{{ $item['clave'] }}</span>
                </td>
                <td style="width: 15%;">
                    <span class="label">Cant:</span>
                    <span class="value">{{ $item['cantidad'] }}</span>
                </td>
                <td style="width: 25%;" class="text-right">
                    <span class="label">P. Unitario:</span>
                    <span class="value">${{ number_format($item['p_unitario'], 2) }}</span>
                </td>
                <td style="width: 25%;" class="text-right">
                    <span class="label">Importe:</span>
                    <span class="value" style="font-weight: bold; color: #111827;">${{ number_format($item['importe'], 2) }}</span>
                </td>
            </tr>
        </table>
        <div class="item-desc">
            <span class="label" style="display: inline; margin-right: 4px;">Descripción:</span>
            <span class="value">{{ $item['descripcion'] }}</span>
        </div>
    </div>
    @endforeach

    <!-- 4. SECCIÓN: TOTALES -->
    <div class="totals-container">
        <table class="totals-table">
            <tr>
                <td>Subtotal:</td>
                <td class="text-right">${{ number_format($subtotal, 2) }}</td>
            </tr>
            <tr>
                <td>IVA (0%):</td>
                <td class="text-right">$0.00</td>
            </tr>
            <tr class="total-row">
                <td>Total a Pagar:</td>
                <td class="text-right">${{ number_format($total, 2) }}</td>
            </tr>
        </table>
        <div class="clear"></div>
    </div>

    <!-- 5. OBSERVACIONES -->
    <div class="obs-text">
        <b>Observaciones:</b> {{ $observaciones }}
    </div>

    <!-- 6. SECCIÓN: CADENA ORIGINAL Y SELLO DIGITAL -->
    <div class="section-box" style="background-color: #ffffff; margin-bottom: 8px;">
        <div class="section-title">Validación Criptográfica y Sellos</div>
        
        <div style="font-size: 7.5px; font-weight: bold; color: #374151; margin-bottom: 2px;">CADENA ORIGINAL:</div>
        <div class="crypto-box">{{ $cadenaOriginal }}</div>

        <div style="font-size: 7.5px; font-weight: bold; color: #374151; margin-bottom: 2px;">SELLO DIGITAL:</div>
        <div class="crypto-box">{{ $selloDigital }}</div>
    </div>

    <!-- 7. PIE LEGAL -->
    <div class="footer">
        LA REPRODUCCIÓN NO AUTORIZADA DE ESTE COMPROBANTE CONSTITUYE UN DELITO. DOCUMENTO OFICIAL INTERNO DE THESYS SIN VALOR FISCAL, GENERADO AUTOMÁTICAMENTE.
    </div>

</body>
</html>

