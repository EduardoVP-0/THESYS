<?php

namespace App\Http\Controllers\Asesor;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\JuradoProyecto;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CALENDARIO ACADÉMICO DEL DOCENTE
 *
 * Deriva los eventos de las fechas registradas en proyectos, versiones y
 * exámenes en los que participa el docente. No inventa fechas límite ni
 * reuniones que no existan en la base de datos.
 */
class CalendarioController extends AsesorPortalController
{
    /**
     * Muestra el calendario mensual y el resumen de eventos.
     */
    public function index(Request $request): Response
    {
        $docente = $this->docente($request);
        $eventos = collect();

        if ($docente) {
            $asignaciones = AsignacionAsesor::query()
                ->where('id_usuario', $docente->id_usuario)
                ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                ->with([
                    'proyecto.alumnos',
                    'proyecto.versiones',
                ])
                ->get();

            foreach ($asignaciones as $asignacion) {
                $proyecto = $asignacion->proyecto;

                if (! $proyecto) {
                    continue;
                }

                $alumno = $proyecto->alumnos->first();

                if ($proyecto->fecha_envio) {
                    $eventos->push([
                        'id' => 'anteproyecto-'.$proyecto->id_proyecto,
                        'titulo' => 'Envío de anteproyecto',
                        'descripcion' => $proyecto->titulo,
                        'fecha' => $proyecto->fecha_envio->toDateString(),
                        'hora' => $proyecto->fecha_envio->format('H:i'),
                        'lugar' => $alumno?->nombre_completo,
                        'tipo' => 'anteproyecto',
                    ]);
                }

                foreach ($proyecto->versiones as $version) {
                    $eventos->push([
                        'id' => 'version-'.$version->id_version,
                        'titulo' => 'Entrega de '.$version->numero_version,
                        'descripcion' => $proyecto->titulo,
                        'fecha' => $version->created_at?->toDateString(),
                        'hora' => $version->created_at?->format('H:i'),
                        'lugar' => $alumno?->nombre_completo,
                        'tipo' => 'entrega',
                    ]);
                }
            }

            $jurados = JuradoProyecto::query()
                ->where('id_usuario', $docente->id_usuario)
                ->whereHas('proyecto.examen')
                ->with(['proyecto.alumnos', 'proyecto.examen'])
                ->get();

            foreach ($jurados as $jurado) {
                $proyecto = $jurado->proyecto;
                $examen = $proyecto?->examen;
                $alumno = $proyecto?->alumnos->first();

                if (! $examen) {
                    continue;
                }

                $eventos->push([
                    'id' => 'examen-'.$examen->id_examen,
                    'titulo' => 'Examen profesional',
                    'descripcion' => $proyecto?->titulo,
                    'fecha' => CarbonImmutable::parse($examen->fecha_examen)->toDateString(),
                    'hora' => substr((string) $examen->hora_examen, 0, 5),
                    'lugar' => $examen->sede,
                    'tipo' => 'examen',
                    'meta' => [
                        'estudiante' => $alumno?->nombre_completo,
                        'cargo' => $jurado->cargo,
                    ],
                ]);
            }
        }

        $eventos = $eventos
            ->filter(fn (array $evento): bool => ! empty($evento['fecha']))
            ->sortBy(fn (array $evento): string => $evento['fecha'].' '.($evento['hora'] ?? ''))
            ->values();

        return Inertia::render('asesor/calendario/index', [
            'docente' => $docente ? [
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
            ] : null,
            'perfil_incompleto' => ! $docente,
            'eventos' => $eventos->all(),
            'stats' => [
                'total' => $eventos->count(),
                'examenes' => $eventos->where('tipo', 'examen')->count(),
                'entregas' => $eventos->where('tipo', 'entrega')->count(),
                'anteproyectos' => $eventos->where('tipo', 'anteproyecto')->count(),
            ],
            'nota' => 'El calendario muestra únicamente actividades registradas en el sistema. Las reuniones de asesoría y las fechas límite administrativas requieren un módulo de agenda que aún no existe.',
        ]);
    }
}
