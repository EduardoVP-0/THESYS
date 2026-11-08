<?php

namespace App\Http\Controllers\Docente;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Dictamen;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\Admin\VersionTesis;
use Carbon\CarbonImmutable;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * CONTROLADOR DE JURADO (MÓDULO DOCENTE)
 *
 * Gestiona las dos pantallas del docente cuando participa como sinodal/jurado:
 * 1) Proyectos Asignados (aceptar o rechazar cargo, con rechazo automático al vencer la fecha del examen).
 * 2) Emitir Voto (registrar su dictamen deliberativo A favor o En contra en tbldictamenes).
 */
class JuradoDocenteController extends Controller
{
    /**
     * Pantalla 1: Bandeja de Proyectos Asignados como Jurado.
     */
    public function proyectosAsignados(Request $request): Response
    {
        $userId = (int) Auth::id();
        $hoyIso = CarbonImmutable::today()->toDateString();

        // 1. Auto-rechazar en base de datos las asignaciones Pendientes cuyo examen ya llegó o pasó
        $this->sincronizarRechazosPorExpiracion($userId, $hoyIso);

        // 2. Calcular métricas globales del docente en una sola consulta agregada rápida
        $statsRow = JuradoProyecto::query()
            ->where('tbljurados_proyectos.id_usuario', $userId)
            ->leftJoin('tblexamenes_profesionales as ep', 'tbljurados_proyectos.id_proyecto', '=', 'ep.id_proyecto')
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN estado_aceptacion = ? THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado_aceptacion = ? THEN 1 ELSE 0 END) as aceptados,
                SUM(CASE WHEN estado_aceptacion = ? THEN 1 ELSE 0 END) as rechazados,
                SUM(CASE WHEN ep.id_examen IS NOT NULL THEN 1 ELSE 0 END) as con_fecha
            ', [
                JuradoProyecto::ESTADO_PENDIENTE,
                JuradoProyecto::ESTADO_ACEPTADO,
                JuradoProyecto::ESTADO_RECHAZADO,
            ])
            ->first();

        $stats = [
            'total' => (int) ($statsRow->total ?? 0),
            'pendientes' => (int) ($statsRow->pendientes ?? 0),
            'aceptados' => (int) ($statsRow->aceptados ?? 0),
            'rechazados' => (int) ($statsRow->rechazados ?? 0),
            'con_fecha' => (int) ($statsRow->con_fecha ?? 0),
        ];

        // 3. Consulta paginada con Eager Loading para evitar problema N+1
        $search = trim((string) $request->input('search', ''));
        $estado = (string) $request->input('estado', 'todos');

        $query = JuradoProyecto::query()
            ->where('id_usuario', $userId)
            ->with([
                'proyecto.alumnos.user:id,email',
                'proyecto.alumnos.carrera:id_carrera,nombre_carrera',
                'proyecto.asesores',
                'proyecto.examen',
                'proyecto.versiones',
                'dictamen',
            ]);

        if ($estado !== 'todos' && in_array($estado, [
            JuradoProyecto::ESTADO_PENDIENTE,
            JuradoProyecto::ESTADO_ACEPTADO,
            JuradoProyecto::ESTADO_RECHAZADO,
        ], true)) {
            $query->where('estado_aceptacion', $estado);
        }

        if ($search !== '') {
            $like = '%'.mb_strtolower($search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw('LOWER(cargo) LIKE ?', [$like])
                    ->orWhereHas('proyecto', function ($qp) use ($like): void {
                        $qp->whereRaw('LOWER(titulo) LIKE ?', [$like])
                            ->orWhereHas('alumnos', function ($qa) use ($like): void {
                                $qa->whereRaw('LOWER(nombre) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(apellido_p) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(apellido_m) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(matricula) LIKE ?', [$like]);
                            });
                    });
            });
        }

        $paginados = $query
            ->orderByDesc('id_jurado_proyecto')
            ->paginate(6)
            ->withQueryString();

        $paginados->getCollection()->transform(
            fn (JuradoProyecto $jurado): array => $this->transformarProyectoJurado($jurado, $hoyIso)
        );

        return Inertia::render('docentes/jurado/proyectos-asignados', [
            'proyectos' => $paginados,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'estado' => $estado,
            ],
        ]);
    }

    /**
     * Actualizar estado de aceptación (Aceptar Cargo o Rechazar) desde el panel del docente.
     */
    public function actualizarAceptacion(Request $request, JuradoProyecto $jurado): RedirectResponse
    {
        $userId = (int) Auth::id();

        abort_unless((int) $jurado->id_usuario === $userId, 403, 'No tienes permiso para modificar esta designación.');

        $validated = $request->validate([
            'estado_aceptacion' => [
                'required',
                'string',
                Rule::in([JuradoProyecto::ESTADO_ACEPTADO, JuradoProyecto::ESTADO_RECHAZADO]),
            ],
        ]);

        $jurado->loadMissing(['proyecto.examen', 'dictamen']);
        $hoyIso = CarbonImmutable::today()->toDateString();
        $fechaExamenIso = $jurado->proyecto?->examen?->fecha_examen
            ? CarbonImmutable::parse($jurado->proyecto->examen->fecha_examen)->toDateString()
            : null;
        $yaLlegoExamen = $fechaExamenIso !== null && $fechaExamenIso <= $hoyIso;

        if ($jurado->dictamen !== null) {
            return back()->with(
                'error',
                'Ya emitiste tu voto deliberativo en este proyecto y no es posible modificar la aceptación del cargo.'
            );
        }

        if ($jurado->proyecto?->examen?->estado_examen === ExamenProfesional::ESTADO_REALIZADO) {
            return back()->with(
                'error',
                'El examen profesional ya fue realizado y las designaciones están cerradas.'
            );
        }

        // Regla 1: Si ya llegó la fecha del examen y estaba Pendiente -> Rechazo automático
        if ($yaLlegoExamen && $jurado->estado_aceptacion === JuradoProyecto::ESTADO_PENDIENTE) {
            $jurado->update(['estado_aceptacion' => JuradoProyecto::ESTADO_RECHAZADO]);

            return back()->with(
                'error',
                'Por motivos de que no respondiste antes de la fecha del examen, el sistema rechazó automáticamente tu participación.'
            );
        }

        // Regla 2: Si ya estaba Rechazado -> Bloqueado definitivamente
        if ($jurado->estado_aceptacion === JuradoProyecto::ESTADO_RECHAZADO) {
            return back()->with(
                'error',
                'Esta designación ya fue rechazada anteriormente y no puede modificarse.'
            );
        }

        // Regla 3: Si ya llegó la fecha del examen y estaba Aceptado -> Ya no puede cambiar ni rechazar
        if ($yaLlegoExamen && $jurado->estado_aceptacion === JuradoProyecto::ESTADO_ACEPTADO) {
            return back()->with(
                'error',
                'El examen profesional ya alcanzó su fecha oficial. No es posible declinar el cargo en este momento.'
            );
        }

        $nuevoEstado = (string) $validated['estado_aceptacion'];
        $jurado->update([
            'estado_aceptacion' => $nuevoEstado,
        ]);

        $mensaje = $nuevoEstado === JuradoProyecto::ESTADO_ACEPTADO
            ? 'Has aceptado formalmente el cargo como integrante del jurado.'
            : 'Has rechazado la designación como jurado para este proyecto.';

        return back()->with('success', $mensaje);
    }

    /**
     * Pantalla 2: Emisión de Voto (Dictamen de Jurado).
     */
    public function emitirVotoIndex(Request $request): Response
    {
        $userId = (int) Auth::id();
        $hoyIso = CarbonImmutable::today()->toDateString();

        // Sincronizar expiraciones antes de listar
        $this->sincronizarRechazosPorExpiracion($userId, $hoyIso);

        $search = trim((string) $request->input('search', ''));
        $votoFiltro = (string) $request->input('voto', 'Todos');

        // Mostramos los proyectos donde el docente fue asignado como jurado y no rechazó el cargo
        $query = JuradoProyecto::query()
            ->where('id_usuario', $userId)
            ->where('estado_aceptacion', '<>', JuradoProyecto::ESTADO_RECHAZADO)
            ->with([
                'proyecto.alumnos.user:id,email',
                'proyecto.alumnos.carrera:id_carrera,nombre_carrera',
                'proyecto.examen',
                'proyecto.versiones',
                'dictamen',
            ]);

        if ($votoFiltro === 'Pendiente') {
            $query->doesntHave('dictamen');
        } elseif (in_array($votoFiltro, [Dictamen::VOTO_A_FAVOR, Dictamen::VOTO_EN_CONTRA], true)) {
            $query->whereHas('dictamen', function ($qd) use ($votoFiltro): void {
                $qd->where('voto', $votoFiltro);
            });
        }

        if ($search !== '') {
            $like = '%'.mb_strtolower($search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw('LOWER(cargo) LIKE ?', [$like])
                    ->orWhereHas('proyecto', function ($qp) use ($like): void {
                        $qp->whereRaw('LOWER(titulo) LIKE ?', [$like])
                            ->orWhereHas('alumnos', function ($qa) use ($like): void {
                                $qa->whereRaw('LOWER(nombre) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(apellido_p) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(apellido_m) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(matricula) LIKE ?', [$like]);
                            });
                    });
            });
        }

        $paginados = $query
            ->orderByDesc('id_jurado_proyecto')
            ->paginate(6)
            ->withQueryString();

        $paginados->getCollection()->transform(
            fn (JuradoProyecto $jurado): array => $this->transformarDictamenJurado($jurado)
        );

        return Inertia::render('docentes/jurado/emitir-voto', [
            'dictamenes' => $paginados,
            'filters' => [
                'search' => $search,
                'voto' => $votoFiltro,
            ],
        ]);
    }

    /**
     * Guardar el voto definitivo (A favor o En contra) en `tbldictamenes`.
     */
    public function guardarVoto(Request $request, JuradoProyecto $jurado): RedirectResponse
    {
        $userId = (int) Auth::id();

        abort_unless((int) $jurado->id_usuario === $userId, 403, 'No tienes permiso para votar en este proyecto.');

        if (! $jurado->esTitular()) {
            return back()->with('error', 'Solo los integrantes titulares del jurado (Presidente, Secretario y Vocal) pueden emitir voto deliberativo.');
        }

        if ($jurado->estado_aceptacion === JuradoProyecto::ESTADO_RECHAZADO) {
            return back()->with('error', 'No puedes emitir voto en un proyecto cuya designación fue rechazada.');
        }

        $jurado->loadMissing('proyecto.examen');
        $examen = $jurado->proyecto?->examen;

        if (! $examen) {
            return back()->with('error', 'No se puede emitir voto hasta que el examen profesional tenga fecha y sede programadas.');
        }

        if ($examen->estado_examen === ExamenProfesional::ESTADO_REALIZADO) {
            return back()->with('error', 'El examen profesional ya fue cerrado y no admite modificaciones en el acta.');
        }

        if ($jurado->dictamen()->exists()) {
            return back()->with('error', 'Ya emitiste tu voto definitivo para este examen profesional.');
        }

        $obsLimpia = preg_replace('/\s+/u', ' ', trim((string) $request->input('observaciones', '')));
        $request->merge([
            'observaciones' => $obsLimpia !== '' ? $obsLimpia : null,
        ]);

        $esEnContra = $request->input('voto') === Dictamen::VOTO_EN_CONTRA;

        $validated = $request->validate([
            'voto' => [
                'required',
                'string',
                Rule::in([Dictamen::VOTO_A_FAVOR, Dictamen::VOTO_EN_CONTRA]),
            ],
            'observaciones' => array_values(array_filter([
                $esEnContra ? 'required' : 'nullable',
                'string',
                $esEnContra ? 'min:10' : null,
                'max:2000',
                'regex:/^(?=.*[\pL])[\pL\pN\s.,;:()"\'¿?¡!\-\/]+$/su',
            ])),
        ], [
            'observaciones.required' => 'Por favor, redacta en observaciones el motivo del voto en contra.',
            'observaciones.min' => 'Fundamenta el motivo del voto en contra con al menos 10 caracteres.',
            'observaciones.max' => 'Las observaciones no pueden exceder los 2,000 caracteres.',
            'observaciones.regex' => 'Las observaciones deben contener texto válido con letras (no solo números o símbolos).',
        ]);

        // Asegurar que la secuencia de PostgreSQL para id_dictamen esté sincronizada
        // en caso de que registros previos hayan sido insertados manualmente en la BD
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "SELECT setval(pg_get_serial_sequence('tbldictamenes', 'id_dictamen'), COALESCE((SELECT MAX(id_dictamen) FROM tbldictamenes), 0) + 1, false)"
            );
        }

        Dictamen::create([
            'id_jurado_proyecto' => $jurado->id_jurado_proyecto,
            'voto' => $validated['voto'],
            'observaciones' => isset($validated['observaciones']) && trim((string) $validated['observaciones']) !== ''
                ? trim((string) $validated['observaciones'])
                : null,
        ]);

        // Si el docente seguía en estado Pendiente al momento de votar, se marca como Aceptado
        if ($jurado->estado_aceptacion === JuradoProyecto::ESTADO_PENDIENTE) {
            $jurado->update(['estado_aceptacion' => JuradoProyecto::ESTADO_ACEPTADO]);
        }

        // Verificar si los 3 titulares ya emitieron su voto para cerrar el examen y el flujo
        $titulares = JuradoProyecto::query()
            ->where('id_proyecto', $jurado->id_proyecto)
            ->whereIn('cargo', JuradoProyecto::CARGOS_TITULARES)
            ->where('estado_aceptacion', '<>', JuradoProyecto::ESTADO_RECHAZADO)
            ->with('dictamen')
            ->get();

        if (
            $titulares->count() === count(JuradoProyecto::CARGOS_TITULARES)
            && $titulares->every(fn (JuradoProyecto $m): bool => $m->dictamen !== null)
        ) {
            $favor = $titulares
                ->filter(fn (JuradoProyecto $m): bool => $m->dictamen?->voto === Dictamen::VOTO_A_FAVOR)
                ->count();
            $contra = $titulares
                ->filter(fn (JuradoProyecto $m): bool => $m->dictamen?->voto === Dictamen::VOTO_EN_CONTRA)
                ->count();

            $resultadoFinal = match (true) {
                $favor === 3 => ExamenProfesional::RESULTADO_APROBADO,
                $favor > $contra => ExamenProfesional::RESULTADO_CON_OBSERVACIONES,
                default => ExamenProfesional::RESULTADO_RECHAZADO,
            };

            $examen->update([
                'estado_examen' => ExamenProfesional::ESTADO_REALIZADO,
                'resultado_final' => $resultadoFinal,
            ]);

            if ($favor > $contra) {
                Alumno::query()
                    ->whereHas('proyectos', fn ($q) => $q->where('tblproyectos.id_proyecto', $jurado->id_proyecto))
                    ->where('estado_academico', 'Activo')
                    ->update(['estado_academico' => 'Egresado']);

                DB::table('tblasesores_proyectos')
                    ->where('id_proyecto', $jurado->id_proyecto)
                    ->where('estado_asignacion', 'Activo')
                    ->update([
                        'estado_asignacion' => 'Finalizado',
                        'updated_at' => now(),
                    ]);

                DB::table('tblrevisores_proyectos')
                    ->where('id_proyecto', $jurado->id_proyecto)
                    ->where('estado_asignacion', 'Activo')
                    ->update([
                        'estado_asignacion' => 'Finalizado',
                        'updated_at' => now(),
                    ]);
            }
        }

        return back()->with('success', "Tu voto \"{$validated['voto']}\" ha sido registrado exitosamente en el acta.");
    }

    /**
     * Visualizar el documento PDF del proyecto (última versión de tesis o documento de anteproyecto).
     */
    public function verDocumento(JuradoProyecto $jurado): SymfonyResponse
    {
        $userId = (int) Auth::id();
        abort_unless((int) $jurado->id_usuario === $userId, 403, 'Acceso denegado a este documento.');

        $jurado->loadMissing(['proyecto.versiones']);
        $proyecto = $jurado->proyecto;

        abort_unless($proyecto !== null, 404, 'Proyecto no encontrado.');

        /** @var VersionTesis|null $ultimaVersion */
        $ultimaVersion = $proyecto->versiones->first();
        $rawPath = $ultimaVersion?->ruta_archivo ?: $proyecto->ruta_documento;
        $defaultFolder = $ultimaVersion?->ruta_archivo ? 'versiones_tesis' : 'anteproyectos';

        abort_unless(
            $rawPath && trim($rawPath) !== '',
            404,
            'Este proyecto aún no cuenta con un archivo PDF cargado.'
        );

        return $this->streamFromStorage($rawPath, $defaultFolder);
    }

    /**
     * Rechaza automáticamente en la BD las asignaciones Pendientes cuya fecha de examen ya se cumplió.
     */
    protected function sincronizarRechazosPorExpiracion(int $userId, string $hoyIso): void
    {
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
    }

    /**
     * Transforma un registro de JuradoProyecto para la vista de Proyectos Asignados.
     *
     * @return array<string, mixed>
     */
    protected function transformarProyectoJurado(JuradoProyecto $jurado, string $hoyIso): array
    {
        /** @var Proyecto|null $proyecto */
        $proyecto = $jurado->proyecto;
        $alumno = $proyecto?->alumnos->first();
        $asesor = $proyecto?->asesores
            ->first(fn ($docente): bool => in_array($docente->pivot?->estado_asignacion, ['Activo', 'Finalizado'], true))
            ?? $proyecto?->asesores->first();
        $examen = $proyecto?->examen;
        /** @var VersionTesis|null $ultimaVersion */
        $ultimaVersion = $proyecto?->versiones->first();

        $fechaExamenRaw = $examen?->fecha_examen
            ? CarbonImmutable::parse($examen->fecha_examen)->toDateString()
            : null;
        $horaExamen = $examen?->hora_examen
            ? substr((string) $examen->hora_examen, 0, 5).' hrs'
            : null;

        $yaLlegoExamen = $fechaExamenRaw !== null && $fechaExamenRaw <= $hoyIso;
        $expiradoPorFecha = $yaLlegoExamen && $jurado->estado_aceptacion === JuradoProyecto::ESTADO_RECHAZADO;
        $tieneVoto = $jurado->dictamen !== null;
        $examenRealizado = $examen?->estado_examen === ExamenProfesional::ESTADO_REALIZADO;

        $documentoRuta = $ultimaVersion?->ruta_archivo ?: $proyecto?->ruta_documento;
        $documentoNombre = $documentoRuta ? basename($documentoRuta) : null;

        $asesorNombre = $asesor
            ? trim("{$asesor->abreviatura_grado} {$asesor->nombre_completo}")
            : 'Pendiente de asignar';

        return [
            'id_jurado_proyecto' => $jurado->id_jurado_proyecto,
            'id_proyecto' => $jurado->id_proyecto,
            'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
            'resumen' => $proyecto?->resumen ?: 'Sin resumen registrado por el sustentante.',
            'sustentante' => $alumno?->nombre_completo ?? 'Sustentante no asignado',
            'iniciales' => $alumno?->iniciales ?? 'NA',
            'matricula' => $alumno?->matricula ?? 'S/M',
            'email' => $alumno?->user?->email ?? 'Sin correo registrado',
            'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Licenciatura no especificada',
            'asesor' => $asesorNombre,
            'cargo' => $jurado->cargo,
            'estado_aceptacion' => $jurado->estado_aceptacion,
            'fecha_asignacion' => $jurado->created_at
                ? CarbonImmutable::parse($jurado->created_at)->toDateString()
                : $hoyIso,
            'fecha_examen' => $fechaExamenRaw
                ? CarbonImmutable::parse($fechaExamenRaw)->format('d/m/Y').($horaExamen ? " · {$horaExamen}" : '')
                : null,
            'fecha_examen_raw' => $fechaExamenRaw,
            'sede_examen' => $examen?->sede,
            'documento_pdf' => $documentoNombre,
            'url_documento' => $documentoNombre
                ? route('docente.jurado.documento', ['jurado' => $jurado->id_jurado_proyecto])
                : null,
            'expirado_por_fecha' => $expiradoPorFecha,
            'ya_llego_examen' => $yaLlegoExamen,
            'tiene_voto' => $tieneVoto,
            'examen_realizado' => $examenRealizado,
        ];
    }

    /**
     * Transforma un registro de JuradoProyecto para la vista de Emitir Voto.
     *
     * @return array<string, mixed>
     */
    protected function transformarDictamenJurado(JuradoProyecto $jurado): array
    {
        /** @var Proyecto|null $proyecto */
        $proyecto = $jurado->proyecto;
        $alumno = $proyecto?->alumnos->first();
        $examen = $proyecto?->examen;
        $dictamen = $jurado->dictamen;
        /** @var VersionTesis|null $ultimaVersion */
        $ultimaVersion = $proyecto?->versiones->first();

        $fechaExamenRaw = $examen?->fecha_examen
            ? CarbonImmutable::parse($examen->fecha_examen)->toDateString()
            : null;
        $horaExamen = $examen?->hora_examen
            ? substr((string) $examen->hora_examen, 0, 5).' hrs'
            : 'Por definir';

        $documentoRuta = $ultimaVersion?->ruta_archivo ?: $proyecto?->ruta_documento;
        $documentoNombre = $documentoRuta ? basename($documentoRuta) : null;

        return [
            'id_jurado_proyecto' => $jurado->id_jurado_proyecto,
            'id_dictamen' => $dictamen?->id_dictamen,
            'sustentante' => $alumno?->nombre_completo ?? 'Sustentante no asignado',
            'iniciales' => $alumno?->iniciales ?? 'NA',
            'matricula' => $alumno?->matricula ?? 'S/M',
            'email' => $alumno?->user?->email ?? 'Sin correo registrado',
            'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Licenciatura no especificada',
            'titulo_proyecto' => $proyecto?->titulo ?? 'Proyecto sin título',
            'cargo' => $jurado->cargo,
            'es_titular' => $jurado->esTitular(),
            'estado_aceptacion' => $jurado->estado_aceptacion,
            'fecha_examen' => $fechaExamenRaw,
            'hora_examen' => $horaExamen,
            'sede_examen' => $examen?->sede ?? 'Sede por programar',
            'tiene_examen' => $examen !== null,
            'examen_realizado' => $examen?->estado_examen === ExamenProfesional::ESTADO_REALIZADO,
            'voto' => $dictamen?->voto ?? 'Pendiente',
            'observaciones' => $dictamen?->observaciones,
            'fecha_emision' => $dictamen?->created_at
                ? CarbonImmutable::parse($dictamen->created_at)->toDateString()
                : null,
            'documento_tesis' => $documentoNombre,
            'url_documento' => $documentoNombre
                ? route('docente.jurado.documento', ['jurado' => $jurado->id_jurado_proyecto])
                : null,
        ];
    }

    /**
     * Transmite el archivo PDF desde Supabase Storage (disco S3).
     */
    protected function streamFromStorage(string $rawPath, string $defaultFolder): SymfonyResponse
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
            "El archivo físico \"{$filename}\" no fue encontrado en el almacenamiento."
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
