<?php

namespace App\Http\Controllers\Alumno;

use App\Models\Admin\Proyecto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GESTIÓN DEL ANTEPROYECTO POR PARTE DEL SUSTENTANTE
 */
class AnteproyectoController extends AlumnoPortalController
{
    /**
     * Muestra el anteproyecto registrado y el formulario de edición.
     */
    public function index(Request $request): Response
    {
        $alumno = $this->alumno($request);
        $proyecto = $alumno
            ? $this->proyecto($alumno, ['asesores.user', 'revisores.user'])
            : null;

        $puedeEditar = ! $proyecto
            || in_array($proyecto->estado, Proyecto::ESTADOS_EDITABLES, true);

        return Inertia::render('alumno/anteproyecto/index', [
            'alumno' => $alumno ? [
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera,
            ] : null,
            'perfil_incompleto' => ! $alumno,
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'resumen' => $proyecto->resumen,
                'estado' => $proyecto->estado,
                'fecha_envio' => $proyecto->fecha_envio?->format('d/m/Y H:i'),
                'observaciones_coordinacion' => $proyecto->observaciones_coordinacion,
                'archivo_nombre' => $proyecto->ruta_documento
                    ? basename((string) $proyecto->ruta_documento)
                    : null,
                'url_documento' => $proyecto->ruta_documento
                    ? route('alumno.documentos.anteproyecto', $proyecto->id_proyecto)
                    : null,
                'asesor' => $proyecto->asesores->first() ? [
                    'nombre_completo' => $proyecto->asesores->first()->nombre_completo,
                    'grado_academico' => $proyecto->asesores->first()->grado_academico,
                    'email' => $proyecto->asesores->first()->user?->email,
                ] : null,
                'revisores' => $proyecto->revisores
                    ->map(fn ($revisor): array => [
                        'nombre_completo' => $revisor->nombre_completo,
                        'grado_academico' => $revisor->grado_academico,
                        'estado_asignacion' => $revisor->pivot?->estado_asignacion,
                    ])
                    ->values()
                    ->all(),
            ] : null,
            'puede_editar' => $puedeEditar,
            'estados_edicion' => Proyecto::ESTADOS_EDITABLES,
        ]);
    }

    /**
     * Registra o actualiza el anteproyecto y lo envía a revisión.
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

        if (
            $proyecto
            && ! in_array($proyecto->estado, Proyecto::ESTADOS_EDITABLES, true)
        ) {
            return redirect()
                ->route('alumno.anteproyecto.index')
                ->with('error', 'El anteproyecto ya fue enviado y no puede modificarse mientras está en revisión o aprobado.');
        }

        $reglas = [
            'titulo' => ['required', 'string', 'max:255'],
            'resumen' => ['nullable', 'string', 'max:5000'],
            'archivo' => [
                $proyecto?->ruta_documento ? 'nullable' : 'required',
                'file',
                'mimes:pdf',
                'max:20480',
            ],
        ];

        $validated = $request->validate($reglas, [
            'titulo.required' => 'Escribe el título de tu anteproyecto.',
            'titulo.max' => 'El título no debe exceder los 255 caracteres.',
            'resumen.max' => 'El resumen no debe exceder los 5000 caracteres.',
            'archivo.required' => 'Adjunta el archivo PDF de tu anteproyecto.',
            'archivo.file' => 'El archivo seleccionado no es válido.',
            'archivo.mimes' => 'El anteproyecto debe ser un archivo PDF.',
            'archivo.max' => 'El archivo no debe superar los 20 MB.',
        ]);

        $rutaDocumento = $proyecto?->ruta_documento;

        if ($request->hasFile('archivo')) {
            $rutaDocumento = $request->file('archivo')?->store('anteproyectos', 's3');
        }

        DB::transaction(function () use ($alumno, $proyecto, $validated, $rutaDocumento): void {
            $datos = [
                'titulo' => trim($validated['titulo']),
                'resumen' => filled($validated['resumen'] ?? null)
                    ? trim((string) $validated['resumen'])
                    : null,
                'estado' => Proyecto::ESTADO_EN_REVISION,
                'fecha_envio' => now(),
                'ruta_documento' => $rutaDocumento,
            ];

            if ($proyecto) {
                $proyecto->update($datos);

                return;
            }

            $nuevoProyecto = Proyecto::query()->create($datos);
            $alumno->proyectos()->attach($nuevoProyecto->id_proyecto);
        });

        return redirect()
            ->route('alumno.anteproyecto.index')
            ->with('success', 'Tu anteproyecto se envió correctamente. La coordinación revisará la propuesta.');
    }
}
