<?php

namespace App\Http\Controllers\Alumno;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROL DE VERSIONES DE TESIS DEL SUSTENTANTE
 */
class TesisController extends AlumnoPortalController
{
    /**
     * Muestra el historial de versiones y la retroalimentación recibida.
     */
    public function index(Request $request): Response
    {
        $alumno = $this->alumno($request);
        $proyecto = $alumno
            ? $this->proyecto($alumno, [
                'asesores.user',
                'examen',
                'versiones.revisiones.asignacionAsesor.docente',
            ])
            : null;

        $asesores = $proyecto?->asesores ?? collect();
        $asesoresActivos = $asesores
            ->filter(fn ($asesor): bool => $asesor->pivot?->estado_asignacion === AsignacionAsesor::ESTADO_ACTIVO);
        $puedeSubir = $proyecto !== null
            && $proyecto->estaAprobado()
            && $asesoresActivos->isNotEmpty();
        $estadoLiberacion = $this->estadoLiberacion($proyecto);
        $ultimaVersion = $proyecto?->versiones->first();

        $motivoNoSubir = match (true) {
            $proyecto === null => 'Primero debes registrar y obtener la aprobación de tu anteproyecto.',
            ! $proyecto?->estaAprobado() => 'Tu anteproyecto aún no está aprobado por la coordinación.',
            $asesoresActivos->isEmpty() => 'La coordinación debe asignarte un asesor activo antes de subir versiones.',
            default => null,
        };

        return Inertia::render('alumno/tesis/index', [
            'alumno' => $alumno ? [
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera,
            ] : null,
            'perfil_incompleto' => ! $alumno,
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'estado' => $proyecto->estado,
                'estado_liberacion' => $estadoLiberacion,
                'asesores' => $asesores
                    ->map(fn ($asesor): array => [
                        'nombre_completo' => $asesor->nombre_completo,
                        'grado_academico' => $asesor->grado_academico,
                        'especialidad' => $asesor->especialidad,
                        'estado_asignacion' => $asesor->pivot?->estado_asignacion,
                        'email' => $asesor->user?->email,
                    ])
                    ->values()
                    ->all(),
                'ultima_version' => $ultimaVersion?->numero_version,
                'ultima_entrega' => $ultimaVersion?->created_at?->format('d/m/Y H:i'),
            ] : null,
            'versiones' => $proyecto
                ? $proyecto->versiones
                    ->map(fn (VersionTesis $version): array => [
                        'id_version' => $version->id_version,
                        'numero_version' => $version->numero_version,
                        'comentario_alumno' => $version->comentario_alumno,
                        'fecha' => $version->created_at?->format('d/m/Y H:i'),
                        'url_documento' => route('alumno.documentos.version', $version->id_version),
                        'revisiones' => $version->revisiones
                            ->map(fn (RevisionAsesor $revision): array => [
                                'id_revision' => $revision->id_revision,
                                'asesor' => $revision->asignacionAsesor?->docente?->nombre_completo,
                                'grado_academico' => $revision->asignacionAsesor?->docente?->grado_academico,
                                'estado' => $revision->estado_revision,
                                'observaciones' => $revision->observaciones,
                                'fecha' => $revision->updated_at?->format('d/m/Y H:i'),
                            ])
                            ->values()
                            ->all(),
                    ])
                    ->values()
                    ->all()
                : [],
            'puede_subir' => $puedeSubir,
            'motivo_no_subir' => $motivoNoSubir,
            'estado_liberacion' => $estadoLiberacion,
        ]);
    }

    /**
     * Registra una nueva versión de tesis y abre las revisiones de los asesores.
     */
    public function store(Request $request): RedirectResponse
    {
        $alumno = $this->alumno($request);

        abort_unless(
            $alumno !== null,
            403,
            'Tu usuario no tiene un expediente de alumno vinculado. Contacta a la coordinación.',
        );

        $proyecto = $this->proyecto($alumno);

        if (! $proyecto) {
            return redirect()
                ->route('alumno.tesis.index')
                ->with('error', 'Primero debes registrar tu anteproyecto.');
        }

        if (! $proyecto->estaAprobado()) {
            return redirect()
                ->route('alumno.tesis.index')
                ->with('error', 'Tu anteproyecto aún no está aprobado. No puedes subir versiones de tesis.');
        }

        $asesoresActivos = AsignacionAsesor::query()
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
            ->get();

        if ($asesoresActivos->isEmpty()) {
            return redirect()
                ->route('alumno.tesis.index')
                ->with('error', 'La coordinación debe asignarte un asesor antes de subir versiones de tesis.');
        }

        $validated = $request->validate([
            'archivo' => ['required', 'file', 'mimes:pdf', 'max:20480'],
            'comentario' => ['nullable', 'string', 'max:2000'],
        ], [
            'archivo.required' => 'Adjunta el archivo PDF de tu versión de tesis.',
            'archivo.file' => 'El archivo seleccionado no es válido.',
            'archivo.mimes' => 'La versión de tesis debe ser un archivo PDF.',
            'archivo.max' => 'El archivo no debe superar los 20 MB.',
            'comentario.max' => 'El comentario no debe exceder los 2000 caracteres.',
        ]);

        $rutaArchivo = $request->file('archivo')?->store('tesis', 's3');

        if (! $rutaArchivo) {
            return redirect()
                ->route('alumno.tesis.index')
                ->with('error', 'No fue posible almacenar el archivo. Intenta nuevamente.');
        }

        DB::transaction(function () use ($proyecto, $asesoresActivos, $validated, $rutaArchivo): void {
            $numeroVersion = $proyecto->versiones()->count() + 1;

            $version = VersionTesis::query()->create([
                'id_proyecto' => $proyecto->id_proyecto,
                'numero_version' => 'v'.$numeroVersion,
                'comentario_alumno' => filled($validated['comentario'] ?? null)
                    ? trim((string) $validated['comentario'])
                    : null,
                'ruta_archivo' => $rutaArchivo,
            ]);

            foreach ($asesoresActivos as $asignacion) {
                RevisionAsesor::query()->create([
                    'id_version' => $version->id_version,
                    'id_asesor_proyecto' => $asignacion->id_asesor_proyecto,
                    'estado_revision' => RevisionAsesor::ESTADO_PENDIENTE,
                    'observaciones' => null,
                ]);
            }

            $proyecto->touch();
        });

        return redirect()
            ->route('alumno.tesis.index')
            ->with('success', 'Tu versión de tesis se registró y fue enviada a revisión por tu asesor.');
    }
}
