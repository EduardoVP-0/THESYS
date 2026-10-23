<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credenciales de Acceso - THESYS UNACH</title>
    <style>
        /* Estilos en línea para compatibilidad universal con Gmail, Outlook y móviles */
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f6f8;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #333333;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
        }
        .header {
            background-color: #0F172A; /* Azul marino institucional oscuro */
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            font-size: 22px;
            margin: 0;
            letter-spacing: 1px;
            font-weight: 700;
        }
        .header p {
            color: #10B981; /* Verde esmeralda distintivo */
            font-size: 13px;
            margin: 5px 0 0 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 35px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 15px;
        }
        .text {
            font-size: 14px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 25px;
        }
        .credentials-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #10B981;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .credentials-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #10B981;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .credential-row {
            margin-bottom: 10px;
            font-size: 14px;
        }
        .credential-row:last-child {
            margin-bottom: 0;
        }
        .credential-label {
            font-weight: 600;
            color: #64748b;
            display: inline-block;
            width: 140px;
        }
        .credential-value {
            font-weight: 700;
            color: #0f172a;
        }
        .password-box {
            font-family: 'Courier New', Courier, monospace;
            background-color: #ffffff;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            letter-spacing: 1px;
        }
        .btn-container {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            background-color: #10B981;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
        }
        .notice {
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 6px;
            padding: 12px;
            font-size: 12px;
            color: #92400e;
            line-height: 1.5;
            margin-bottom: 25px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- ENCABEZADO INSTITUCIONAL -->
        <div class="header">
            <h1>UNIVERSIDAD AUTÓNOMA DE CHIAPAS</h1>
            <p>Sistema THESYS — Escuela de Tecnologías Digitales Aplicadas</p>
        </div>

        <!-- CUERPO DEL MENSAJE -->
        <div class="content">
            <div class="greeting">
                ¡Hola, {{ $alumno->nombre }}!
            </div>

            <p class="text">
                Te damos la bienvenida al sistema <strong>THESYS</strong>. Se ha creado tu expediente digital para dar seguimiento a tus trámites de titulación y asignación de temas académicos para el programa de <strong>{{ $alumno->carrera->nombre_carrera ?? 'tu carrera' }}</strong>.
            </p>

            <!-- TARJETA CON CREDENCIALES -->
            <div class="credentials-card">
                <div class="credentials-title">Tus Credenciales de Acceso</div>

                <div class="credential-row">
                    <span class="credential-label">Matrícula:</span>
                    <span class="credential-value">{{ $alumno->matricula }}</span>
                </div>

                <div class="credential-row">
                    <span class="credential-label">Usuario / Correo:</span>
                    <span class="credential-value">{{ $alumno->user->email }}</span>
                </div>

                <div class="credential-row">
                    <span class="credential-label">Clave Temporal:</span>
                    <span class="credential-value password-box">{{ $plainPassword }}</span>
                </div>
            </div>

            <!-- AVISO DE SEGURIDAD -->
            <div class="notice">
                <strong>Importante:</strong> Esta contraseña fue generada de manera automática y segura por el sistema. Te recomendamos ingresar al portal y cambiarla en la sección de tu perfil por una contraseña de tu preferencia.
            </div>

            <!-- BOTÓN DE INGRESO -->
            <div class="btn-container">
                <a href="{{ url('/login') }}" class="btn">
                    Ingresar al Sistema THESYS
                </a>
            </div>

            <p class="text" style="font-size: 12px; color: #6b7280; text-align: center;">
                Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:<br>
                <a href="{{ url('/login') }}" style="color: #10B981; word-break: break-all;">{{ url('/login') }}</a>
            </p>
        </div>

        <!-- PIE DE PÁGINA -->
        <div class="footer">
            <p style="margin: 0 0 5px 0;">Este es un mensaje institucional generado automáticamente por THESYS UNACH.</p>
            <p style="margin: 0;">Por favor, no respondas a este correo electrónico.</p>
        </div>
    </div>
</body>
</html>
