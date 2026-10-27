<?php

namespace App\Http\Controllers\Alumno;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CALENDARIO ACADÉMICO DEL SUSTENTANTE
 */
class CalendarioController extends AlumnoPortalController
{
    /**
     * Muestra el calendario con las fechas registradas en el expediente.
     */
    public function index(Request $request): Response
    {
        $alumno = $this->alumno($request);

        if ($alumno) {
            $alumno->loadMissing(['pagos', 'oficiosExpediente']);
        }

        $proyecto = $alumno
            ? $this->proyecto($alumno, ['examen', 'versiones'])
            : null;

        $eventos = collect();

        if ($proyecto) {
            if ($proyecto->fecha_envio) {
                $eventos->push([
                    'id' => 'anteproyecto-'.$proyecto->id_proyecto,
                    'titulo' => 'Envío de anteproyecto',
                    'descripcion' => $proyecto->titulo,
                    'fecha' => $proyecto->fecha_envio->toDateString(),
                    'hora' => $proyecto->fecha_envio->format('H:i'),
                    'lugar' => 'Plataforma THESYS',
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
                    'lugar' => 'Plataforma THESYS',
                    'tipo' => 'entrega',
                ]);
            }

            if ($proyecto->examen) {
                $examen = $proyecto->examen;

                $eventos->push([
                    'id' => 'examen-'.$examen->id_examen,
                    'titulo' => 'Examen profesional',
                    'descripcion' => $proyecto->titulo,
                    'fecha' => CarbonImmutable::parse($examen->fecha_examen)->toDateString(),
                    'hora' => substr((string) $examen->hora_examen, 0, 5),
                    'lugar' => $examen->sede,
                    'tipo' => 'examen',
                ]);
            }
        }

        foreach ($alumno?->oficiosExpediente ?? collect() as $oficio) {
            $eventos->push([
                'id' => 'oficio-'.$oficio->id_oficio,
                'titulo' => $oficio->tipo_oficio,
                'descripcion' => 'Documento agregado a tu expediente digital.',
                'fecha' => $oficio->created_at?->toDateString(),
                'hora' => $oficio->created_at?->format('H:i'),
                'lugar' => 'Expediente digital',
                'tipo' => 'administrativo',
            ]);
        }

        foreach ($alumno?->pagos ?? collect() as $pago) {
            $eventos->push([
                'id' => 'pago-'.$pago->id_pago,
                'titulo' => 'Registro de pago',
                'descripcion' => $pago->concepto.' · '.$pago->estado_validacion,
                'fecha' => $pago->created_at?->toDateString(),
                'hora' => $pago->created_at?->format('H:i'),
                'lugar' => 'Control escolar',
                'tipo' => 'administrativo',
            ]);
        }

        $eventos = $eventos
            ->filter(fn (array $evento): bool => ! empty($evento['fecha']))
            ->sortBy(fn (array $evento): string => $evento['fecha'].' '.($evento['hora'] ?? ''))
            ->values();

        return Inertia::render('alumno/calendario/index', [
            'alumno' => $alumno ? [
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera,
            ] : null,
            'perfil_incompleto' => ! $alumno,
            'eventos' => $eventos->all(),
            'stats' => [
                'total' => $eventos->count(),
                'examenes' => $eventos->where('tipo', 'examen')->count(),
                'entregas' => $eventos->where('tipo', 'entrega')->count(),
                'anteproyectos' => $eventos->where('tipo', 'anteproyecto')->count(),
                'administrativos' => $eventos->where('tipo', 'administrativo')->count(),
            ],
            'nota' => 'El calendario muestra las fechas registradas en tu expediente. Las fechas límite administrativas y las reuniones de asesoría aún no cuentan con un módulo de agenda.',
        ]);
    }
}
