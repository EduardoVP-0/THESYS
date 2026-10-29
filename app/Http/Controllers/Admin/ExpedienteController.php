<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Carrera;
use App\Models\Admin\OficioExpediente;
use App\Models\Admin\Proyecto;
use App\Models\Admin\VersionTesis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * CONTROLADOR DE EXPEDIENTES DIGITALES
 * Centraliza las consultas, documentos y el estado integral del proceso de titulacion
 * de cada sustentante registrado en el sistema.
 */
class ExpedienteController extends Controller
{
    /**
     * Muestra el repositorio general de expedientes con metricas institucionales,
     * buscador multifactorial, filtros por carrera / estatus y paginacion.
     */
    public function index(Request $request): Response
    {
        $carreras = Carrera::where('estado', true)->orderBy('nombre_carrera')->get();

        $query = Alumno::query()
            ->with([
                'user',
                'carrera',
                'proyectos' => function ($q) {
                    $q->with(['asesores', 'revisores', 'versiones']);
                },
                'oficiosExpediente',
                'pagos',
            ]);

        // Buscador por nombre, apellidos, matricula, correo o titulo de tesis
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'ilike', "%{$search}%")
                    ->orWhere('apellido_p', 'ilike', "%{$search}%")
                    ->orWhere('apellido_m', 'ilike', "%{$search}%")
                    ->orWhere('matricula', 'ilike', "%{$search}%")
                    ->orWhereRaw("CONCAT(COALESCE(nombre, ''), ' ', COALESCE(apellido_p, ''), ' ', COALESCE(apellido_m, '')) ILIKE ?", ["%{$search}%"])
                    ->orWhereHas('user', function ($qu) use ($search) {
                        $qu->where('email', 'ilike', "%{$search}%");
                    })
                    ->orWhereHas('proyectos', function ($qp) use ($search) {
                        $qp->where('titulo', 'ilike', "%{$search}%");
                    });
            });
        }

        // Filtro por Carrera
        if ($request->filled('carrera') && $request->input('carrera') !== 'todas') {
            $query->where('id_carrera', $request->input('carrera'));
        }

        // Filtro por Estado del Anteproyecto
        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $estado = $request->input('estado');
            if ($estado === 'sin_anteproyecto') {
                $query->doesntHave('proyectos');
            } else {
                $query->whereHas('proyectos', function ($q) use ($estado) {
                    $q->where('estado', $estado);
                });
            }
        }

        $perPage = (int) $request->input('per_page', 5);
        if ($perPage <= 0 || $perPage > 50) {
            $perPage = 5;
        }

        $alumnos = $query->latest('id_usuario')->paginate($perPage)->withQueryString();

        // Calculo de metricas institucionales globales
        $totalAlumnos = Alumno::count();
        $conProyecto = Alumno::has('proyectos')->count();
        $enRevision = Alumno::whereHas('proyectos', fn($q) => $q->where('estado', 'En revisión'))->count();
        $aprobados = Alumno::whereHas('proyectos', fn($q) => $q->where('estado', 'Aprobado'))->count();
        $conCambios = Alumno::whereHas('proyectos', fn($q) => $q->where('estado', 'Con cambios'))->count();

        // Transformacion para la tabla de expedientes
        $alumnos->getCollection()->transform(function ($alumno) {
            $proyecto = $alumno->proyectos->first();
            $totalOficios = $alumno->oficiosExpediente->count();
            $totalVersiones = $proyecto ? $proyecto->versiones->count() : 0;
            $tieneAnteproyectoDoc = (bool) ($proyecto && $proyecto->ruta_documento);

            // Documentos totales registrados en el expediente
            $totalDocumentos = ($tieneAnteproyectoDoc ? 1 : 0) + $totalVersiones + $totalOficios;

            return [
                'id_usuario' => $alumno->id_usuario,
                'matricula' => $alumno->matricula,
                'nombre_completo' => $alumno->nombre_completo,
                'iniciales' => $alumno->iniciales,
                'email' => $alumno->user?->email,
                'carrera' => $alumno->carrera?->nombre_carrera ?? 'Sin carrera',
                'estado_academico' => $alumno->estado_academico,
                'proyecto' => $proyecto ? [
                    'id_proyecto' => $proyecto->id_proyecto,
                    'titulo' => $proyecto->titulo,
                    'estado' => $proyecto->estado,
                    'tiene_documento' => $tieneAnteproyectoDoc,
                    'asesor' => $proyecto->asesor_asignado ? [
                        'nombre_completo' => $proyecto->asesor_asignado->nombre_completo,
                        'grado_academico' => $proyecto->asesor_asignado->grado_academico,
                    ] : null,
                    'revisores_count' => $proyecto->revisores->count(),
                    'versiones_count' => $totalVersiones,
                ] : null,
                'total_documentos' => $totalDocumentos,
                'total_oficios' => $totalOficios,
                'ultimo_movimiento' => $proyecto?->updated_at?->format('d/m/Y') ?? $alumno->updated_at->format('d/m/Y'),
            ];
        });

        return Inertia::render('admin/expedientes/index', [
            'expedientes' => $alumnos,
            'carreras' => $carreras,
            'stats' => [
                'total' => $totalAlumnos,
                'con_proyecto' => $conProyecto,
                'en_revision' => $enRevision,
                'aprobados' => $aprobados,
                'con_cambios' => $conCambios,
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'carrera' => $request->input('carrera', 'todas'),
                'estado' => $request->input('estado', 'todos'),
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Muestra la vista detallada del Expediente Digital del sustentante con
     * sus secciones/carpetas acordeon de documentos.
     */
    public function show(Alumno $alumno): Response
    {
        $alumno->load([
            'user',
            'carrera',
            'proyectos' => function ($q) {
                $q->with([
                    'asesores.user',
                    'revisores.user',
                    'versiones',
                ]);
            },
            'oficiosExpediente',
            'pagos',
        ]);

        $proyecto = $alumno->proyectos->first();

        // Carpetas documentales
        $anteproyectoDoc = null;
        if ($proyecto && $proyecto->ruta_documento) {
            $anteproyectoDoc = [
                'id_proyecto' => $proyecto->id_proyecto,
                'nombre_archivo' => basename($proyecto->ruta_documento),
                'ruta' => $proyecto->ruta_documento,
                'fecha_envio' => $proyecto->fecha_envio?->format('d/m/Y H:i') ?? $proyecto->created_at->format('d/m/Y'),
                'url_visor' => route('admin.expedientes.anteproyecto.documento', $proyecto->id_proyecto),
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
                'fecha' => $v->created_at->format('d/m/Y H:i'),
                'url_visor' => route('admin.expedientes.version.documento', $v->id_version),
            ];
        }) : collect();

        $oficiosDocs = $alumno->oficiosExpediente->map(function ($o) {
            return [
                'id_oficio' => $o->id_oficio,
                'tipo_oficio' => $o->tipo_oficio,
                'nombre_archivo' => basename($o->url_archivo),
                'ruta' => $o->url_archivo,
                'fecha' => $o->created_at->format('d/m/Y H:i'),
                'url_visor' => route('admin.expedientes.oficio.documento', $o->id_oficio),
            ];
        });

        $pagosDocs = $alumno->pagos->map(function ($p) {
            return [
                'id_pago' => $p->id_pago,
                'concepto' => $p->concepto,
                'monto' => $p->monto,
                'referencia_bancaria' => $p->referencia_bancaria,
                'estado_validacion' => $p->estado_validacion,
                'fecha' => $p->created_at->format('d/m/Y H:i'),
            ];
        });

        // Conteo total de archivos fisicos disponibles
        $totalArchivos = ($anteproyectoDoc ? 1 : 0) + $versionesDocs->count() + $oficiosDocs->count();

        return Inertia::render('admin/expedientes/show', [
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
     * Transmite el archivo PDF de un anteproyecto desde Supabase Storage.
     */
    public function verAnteproyectoDocumento(Proyecto $proyecto): SymfonyResponse
    {
        abort_unless(
            $proyecto->ruta_documento && trim($proyecto->ruta_documento) !== '',
            404,
            'Este anteproyecto no cuenta con un documento PDF adjunto.'
        );

        return $this->streamFromStorage($proyecto->ruta_documento, 'anteproyectos');
    }

    /**
     * Transmite el archivo PDF de una version de tesis desde Supabase Storage.
     */
    public function verVersionDocumento(VersionTesis $version): SymfonyResponse
    {
        abort_unless(
            $version->ruta_archivo && trim($version->ruta_archivo) !== '',
            404,
            'Esta versión de tesis no cuenta con un archivo físico adjunto.'
        );

        return $this->streamFromStorage($version->ruta_archivo, 'versiones_tesis');
    }

    /**
     * Transmite el archivo PDF de un oficio de expediente desde Supabase Storage.
     */
    public function verOficioDocumento(OficioExpediente $oficio): SymfonyResponse
    {
        abort_unless(
            $oficio->url_archivo && trim($oficio->url_archivo) !== '',
            404,
            'Este oficio no cuenta con un archivo adjunto.'
        );

        return $this->streamFromStorage($oficio->url_archivo, 'oficios');
    }

    /**
     * Helper para resolver rutas y transmitir archivos PDF desde Supabase (disco S3).
     * Soporta rutas relativas directas, prefijadas por carpeta o URLs completas.
     */
    protected function streamFromStorage(string $rawPath, string $defaultFolder): SymfonyResponse
    {
        $s3 = Storage::disk('s3');
        $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');

        // Extraer la ruta limpia si viene como URL completa
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

        // Rutas candidatas para localizar el archivo en el bucket
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
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
            ]
        );
    }
}
