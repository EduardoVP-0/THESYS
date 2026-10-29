<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\OficioExpediente;
use App\Models\Admin\VersionTesis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * CONTROLADOR DE MI EXPEDIENTE DIGITAL (PORTAL DEL SUSTENTANTE)
 * Muestra exclusivamente el expediente digital del alumno autenticado con sus carpetas
 * de anteproyecto, versiones de tesis, oficios oficiales, comite academico y pagos.
 */
class ExpedienteController extends Controller
{
    /**
     * Muestra la vista del Expediente Digital propio del sustentante autenticado.
     */
    public function index(Request $request): Response
    {
        $alumno = Alumno::with([
            'user',
            'carrera',
            'proyectos' => function ($q) {
                $q->with([
                    'asesores.user',
                    'revisores.user',
                    'versiones',
                ])->latest('tblproyectos.id_proyecto');
            },
            'oficiosExpediente',
            'pagos',
        ])->findOrFail($request->user()->id);

        $proyecto = $alumno->proyectos->first();

        // Carpetas documentales
        $anteproyectoDoc = null;
        if ($proyecto && $proyecto->ruta_documento) {
            $anteproyectoDoc = [
                'id_proyecto' => $proyecto->id_proyecto,
                'nombre_archivo' => basename($proyecto->ruta_documento),
                'ruta' => $proyecto->ruta_documento,
                'fecha_envio' => $proyecto->fecha_envio?->format('d/m/Y H:i')
                    ?? $proyecto->created_at?->format('d/m/Y')
                    ?? 'Sin fecha',
                'url_visor' => route('alumno.expediente.anteproyecto.documento'),
                'estado' => $proyecto->estado,
            ];
        }

        $versionesDocs = $proyecto ? $proyecto->versiones->map(function ($v) {
            return [
                'id_version' => $v->id_version,
                'numero_version' => $v->numero_version,
                'comentario' => $v->comentario_alumno,
                'nombre_archivo' => basename($v->ruta_archivo),
                'ruta' => $v->ruta_archivo,
                'fecha' => $v->created_at?->format('d/m/Y H:i') ?? 'Sin fecha',
                'url_visor' => route('alumno.expediente.version.documento', $v->id_version),
            ];
        }) : collect();

        $oficiosDocs = $alumno->oficiosExpediente->map(function ($o) {
            return [
                'id_oficio' => $o->id_oficio,
                'tipo_oficio' => $o->tipo_oficio,
                'nombre_archivo' => basename($o->url_archivo),
                'ruta' => $o->url_archivo,
                'fecha' => $o->created_at?->format('d/m/Y H:i') ?? 'Sin fecha',
                'url_visor' => route('alumno.expediente.oficio.documento', $o->id_oficio),
            ];
        });

        $pagosDocs = $alumno->pagos->map(function ($p) {
            return [
                'id_pago' => $p->id_pago,
                'concepto' => $p->concepto,
                'monto' => $p->monto,
                'referencia_bancaria' => $p->referencia_bancaria,
                'estado_validacion' => $p->estado_validacion,
                'fecha' => $p->created_at?->format('d/m/Y H:i') ?? 'Sin fecha',
            ];
        });

        // Conteo total de archivos fisicos disponibles
        $totalArchivos = ($anteproyectoDoc ? 1 : 0) + $versionesDocs->count() + $oficiosDocs->count();

        return Inertia::render('Alumno/expediente/index', [
            'alumno' => [
                'id_usuario' => $alumno->id_usuario,
                'matricula' => $alumno->matricula,
                'nombre_completo' => $alumno->nombre_completo,
                'iniciales' => $alumno->iniciales,
                'curp' => $alumno->curp,
                'email' => $alumno->user?->email,
                'telefono' => $alumno->telefono,
                'carrera' => $alumno->carrera?->nombre_carrera ?? 'Sin carrera',
                'turno' => $alumno->turno,
                'generacion' => $alumno->generacion,
                'estado_academico' => $alumno->estado_academico,
                'fecha_ingreso' => $alumno->fecha_ingreso?->format('d/m/Y'),
            ],
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'resumen' => $proyecto->resumen,
                'estado' => $proyecto->estado,
                'observaciones_coordinacion' => $proyecto->observaciones_coordinacion,
                'asesor' => $proyecto->asesor_asignado ? [
                    'id_usuario' => $proyecto->asesor_asignado->id_usuario,
                    'nombre_completo' => $proyecto->asesor_asignado->nombre_completo,
                    'grado_academico' => $proyecto->asesor_asignado->grado_academico,
                    'especialidad' => $proyecto->asesor_asignado->especialidad,
                    'email' => $proyecto->asesor_asignado->user?->email,
                ] : null,
                'revisores' => $proyecto->revisores->map(function ($r) {
                    return [
                        'id_usuario' => $r->id_usuario,
                        'nombre_completo' => $r->nombre_completo,
                        'grado_academico' => $r->grado_academico,
                        'especialidad' => $r->especialidad,
                        'email' => $r->user?->email,
                    ];
                }),
            ] : null,
            'carpetas' => [
                'anteproyecto' => $anteproyectoDoc,
                'versiones_tesis' => $versionesDocs,
                'oficios' => $oficiosDocs,
                'pagos' => $pagosDocs,
            ],
            'resumen' => [
                'total_archivos' => $totalArchivos,
                'tiene_anteproyecto' => (bool) $anteproyectoDoc,
                'tiene_asesor' => (bool) $proyecto?->asesor_asignado,
                'tiene_revisores' => $proyecto ? $proyecto->revisores->count() >= 2 : false,
                'tiene_versiones' => $versionesDocs->isNotEmpty(),
                'tiene_oficios' => $oficiosDocs->isNotEmpty(),
            ],
        ]);
    }

    /**
     * Transmite el archivo PDF del anteproyecto propio del alumno autenticado desde Supabase Storage.
     */
    public function verAnteproyectoDocumento(Request $request): SymfonyResponse
    {
        $alumno = Alumno::findOrFail($request->user()->id);
        $proyecto = $alumno->proyectos()->latest('tblproyectos.id_proyecto')->first();

        abort_unless(
            $proyecto && $proyecto->ruta_documento && trim($proyecto->ruta_documento) !== '',
            404,
            'Tu expediente aún no cuenta con un documento PDF de anteproyecto adjunto.'
        );

        return $this->streamFromStorage($proyecto->ruta_documento, 'anteproyectos');
    }

    /**
     * Transmite el archivo PDF de una version de tesis del alumno autenticado desde Supabase Storage.
     */
    public function verVersionDocumento(Request $request, VersionTesis $version): SymfonyResponse
    {
        $alumno = Alumno::findOrFail($request->user()->id);
        $perteneceAlAlumno = $alumno->proyectos()
            ->where('tblproyectos.id_proyecto', $version->id_proyecto)
            ->exists();

        abort_unless($perteneceAlAlumno, 403, 'No tienes permiso para consultar este documento.');

        abort_unless(
            $version->ruta_archivo && trim($version->ruta_archivo) !== '',
            404,
            'Esta versión de tesis no cuenta con un archivo físico adjunto.'
        );

        return $this->streamFromStorage($version->ruta_archivo, 'versiones_tesis');
    }

    /**
     * Transmite el archivo PDF de un oficio del expediente del alumno autenticado desde Supabase Storage.
     */
    public function verOficioDocumento(Request $request, OficioExpediente $oficio): SymfonyResponse
    {
        abort_unless(
            (int) $oficio->id_alumno === (int) $request->user()->id,
            403,
            'No tienes permiso para consultar este oficio.'
        );

        abort_unless(
            $oficio->url_archivo && trim($oficio->url_archivo) !== '',
            404,
            'Este oficio no cuenta con un archivo adjunto.'
        );

        return $this->streamFromStorage($oficio->url_archivo, 'oficios');
    }

    /**
     * Helper para resolver rutas y transmitir archivos PDF desde Supabase (disco S3).
     */
    protected function streamFromStorage(string $rawPath, string $defaultFolder): SymfonyResponse
    {
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
            "oficios/{$filename}",
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
            "El archivo físico \"{$filename}\" no fue encontrado en el almacenamiento en la nube (carpeta esperada: {$defaultFolder}/)."
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

