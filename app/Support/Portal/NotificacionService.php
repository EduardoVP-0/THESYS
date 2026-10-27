<?php

namespace App\Support\Portal;

use App\Models\Admin\Alumno;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Docente;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\RevisionAsesor;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * GENERADOR DE NOTIFICACIONES DERIVADAS
 *
 * El esquema actual no cuenta con una tabla de notificaciones. Este servicio
 * construye avisos de solo lectura a partir de la actividad real registrada en
 * proyectos, versiones, revisiones, jurados, exámenes, pagos y oficios.
 */
class NotificacionService
{
    /**
     * Notificaciones del portal del docente (asesor / jurado).
     *
     * @return array<int, array<string, mixed>>
     */
    public function paraDocente(?Docente $docente): array
    {
        if (! $docente) {
            return [];
        }

        $notificaciones = collect();
        $hoy = CarbonImmutable::today();
        $limite = $hoy->addDays(30);

        $asignaciones = AsignacionAsesor::query()
            ->where('id_usuario', $docente->id_usuario)
            ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
            ->get();

        $revisiones = RevisionAsesor::query()
            ->whereIn('id_asesor_proyecto', $asignaciones->pluck('id_asesor_proyecto'))
            ->where('estado_revision', RevisionAsesor::ESTADO_PENDIENTE)
            ->with(['version.proyecto.alumnos'])
            ->latest('updated_at')
            ->get();

        foreach ($revisiones as $revision) {
            $version = $revision->version;
            $proyecto = $version?->proyecto;
            $alumno = $proyecto?->alumnos->first();

            $notificaciones->push([
                'id' => 'revision-'.$revision->id_revision,
                'tipo' => 'warning',
                'titulo' => 'Revisión pendiente',
                'mensaje' => sprintf(
                    'La versión %s de %s está pendiente de tu revisión.',
                    $version?->numero_version ?? 'de tesis',
                    $alumno?->nombre_completo ?? 'un sustentante',
                ),
                'fecha' => $revision->updated_at?->toIso8601String(),
                'fecha_legible' => $revision->updated_at?->format('d/m/Y H:i'),
                'url' => $proyecto
                    ? route('asesor.revisiones.index', ['proyecto' => $proyecto->id_proyecto])
                    : route('asesor.revisiones.index'),
            ]);
        }

        $invitaciones = JuradoProyecto::query()
            ->where('id_usuario', $docente->id_usuario)
            ->where('estado_aceptacion', JuradoProyecto::ESTADO_PENDIENTE)
            ->with(['proyecto.alumnos'])
            ->latest('created_at')
            ->get();

        foreach ($invitaciones as $jurado) {
            $alumno = $jurado->proyecto?->alumnos->first();

            $notificaciones->push([
                'id' => 'jurado-'.$jurado->id_jurado_proyecto,
                'tipo' => 'info',
                'titulo' => 'Invitación al jurado',
                'mensaje' => sprintf(
                    'Fuiste designado como %s para el proyecto de %s. Confirma tu participación.',
                    $jurado->cargo,
                    $alumno?->nombre_completo ?? 'un sustentante',
                ),
                'fecha' => $jurado->created_at?->toIso8601String(),
                'fecha_legible' => $jurado->created_at?->format('d/m/Y H:i'),
                'url' => route('asesor.jurado.proyectos.index'),
            ]);
        }

        $examenes = JuradoProyecto::query()
            ->where('id_usuario', $docente->id_usuario)
            ->whereHas('proyecto.examen', function ($query) use ($hoy, $limite): void {
                $query
                    ->whereDate('fecha_examen', '>=', $hoy->toDateString())
                    ->whereDate('fecha_examen', '<=', $limite->toDateString());
            })
            ->with(['proyecto.alumnos', 'proyecto.examen'])
            ->get();

        foreach ($examenes as $jurado) {
            $proyecto = $jurado->proyecto;
            $examen = $proyecto?->examen;
            $alumno = $proyecto?->alumnos->first();

            if (! $examen) {
                continue;
            }

            $fechaExamen = CarbonImmutable::parse($examen->fecha_examen);

            $notificaciones->push([
                'id' => 'examen-'.$jurado->id_jurado_proyecto,
                'tipo' => 'info',
                'titulo' => 'Examen profesional próximo',
                'mensaje' => sprintf(
                    '%s presentará su examen el %s a las %s en %s.',
                    $alumno?->nombre_completo ?? 'Un sustentante',
                    $fechaExamen->format('d/m/Y'),
                    substr((string) $examen->hora_examen, 0, 5),
                    $examen->sede,
                ),
                'fecha' => $examen->created_at?->toIso8601String(),
                'fecha_legible' => $examen->created_at?->format('d/m/Y H:i'),
                'url' => route('asesor.calendario.index'),
            ]);
        }

        return $this->ordenar($notificaciones);
    }

    /**
     * Notificaciones del portal del sustentante.
     *
     * @return array<int, array<string, mixed>>
     */
    public function paraAlumno(?Alumno $alumno): array
    {
        if (! $alumno) {
            return [];
        }

        $notificaciones = collect();
        $alumno->loadMissing(['pagos', 'oficiosExpediente']);
        $proyecto = $alumno->proyectos()
            ->with([
                'versiones.revisiones.asignacionAsesor.docente',
                'jurados',
                'examen',
            ])
            ->latest('tblproyectos.created_at')
            ->first();

        if (! $proyecto) {
            return [[
                'id' => 'sin-anteproyecto',
                'tipo' => 'info',
                'titulo' => 'Registra tu anteproyecto',
                'mensaje' => 'Aún no tienes un anteproyecto registrado. Inicia tu proceso desde el módulo Mi Anteproyecto.',
                'fecha' => null,
                'fecha_legible' => null,
                'url' => route('alumno.anteproyecto.index'),
            ]];
        }

        $observaciones = trim((string) $proyecto->observaciones_coordinacion);

        if ($proyecto->estado === 'Con cambios' && $observaciones !== '') {
            $notificaciones->push([
                'id' => 'cambios-coordinacion',
                'tipo' => 'warning',
                'titulo' => 'La coordinación solicitó cambios',
                'mensaje' => $observaciones,
                'fecha' => $proyecto->updated_at?->toIso8601String(),
                'fecha_legible' => $proyecto->updated_at?->format('d/m/Y H:i'),
                'url' => route('alumno.anteproyecto.index'),
            ]);
        } elseif ($proyecto->estaAprobado()) {
            $notificaciones->push([
                'id' => 'anteproyecto-aprobado',
                'tipo' => 'success',
                'titulo' => 'Anteproyecto aprobado',
                'mensaje' => 'Tu propuesta fue aprobada. Continúa con las versiones de tesis y el seguimiento de tu asesor.',
                'fecha' => $proyecto->updated_at?->toIso8601String(),
                'fecha_legible' => $proyecto->updated_at?->format('d/m/Y H:i'),
                'url' => route('alumno.tesis.index'),
            ]);
        } elseif ($proyecto->estado === 'En revisión') {
            $notificaciones->push([
                'id' => 'anteproyecto-revision',
                'tipo' => 'info',
                'titulo' => 'Anteproyecto en revisión',
                'mensaje' => 'La coordinación está revisando tu propuesta. Te avisaremos cuando exista un dictamen.',
                'fecha' => $proyecto->fecha_envio?->toIso8601String(),
                'fecha_legible' => $proyecto->fecha_envio?->format('d/m/Y H:i'),
                'url' => route('alumno.anteproyecto.index'),
            ]);
        }

        $versiones = $proyecto->versiones->sortByDesc('created_at');

        foreach ($versiones as $version) {
            foreach ($version->revisiones as $revision) {
                $texto = trim((string) $revision->observaciones);

                if ($texto === '') {
                    continue;
                }

                $asesor = $revision->asignacionAsesor?->docente;
                $tipo = $revision->estado_revision === RevisionAsesor::ESTADO_RECHAZADA
                    ? 'danger'
                    : ($revision->estado_revision === RevisionAsesor::ESTADO_APROBADA ? 'success' : 'warning');

                $notificaciones->push([
                    'id' => 'revision-'.$revision->id_revision,
                    'tipo' => $tipo,
                    'titulo' => 'Retroalimentación de '.($asesor?->nombre_completo ?? 'tu asesor'),
                    'mensaje' => sprintf('%s: %s', $version->numero_version, $texto),
                    'fecha' => $revision->updated_at?->toIso8601String(),
                    'fecha_legible' => $revision->updated_at?->format('d/m/Y H:i'),
                    'url' => route('alumno.tesis.index'),
                ]);
            }
        }

        if ($proyecto->jurados->isNotEmpty()) {
            $fechaJurado = $proyecto->jurados->max('updated_at');

            $notificaciones->push([
                'id' => 'jurado-asignado',
                'tipo' => 'info',
                'titulo' => 'Jurado asignado',
                'mensaje' => 'Se ha conformado el jurado de tu examen profesional. Consulta a sus integrantes y su estado de aceptación.',
                'fecha' => $fechaJurado?->toIso8601String(),
                'fecha_legible' => $fechaJurado?->format('d/m/Y H:i'),
                'url' => route('alumno.jurado.index'),
            ]);
        }

        if ($proyecto->examen) {
            $examen = $proyecto->examen;
            $fechaExamen = CarbonImmutable::parse($examen->fecha_examen);

            $notificaciones->push([
                'id' => 'examen-'.$examen->id_examen,
                'tipo' => 'info',
                'titulo' => 'Examen profesional programado',
                'mensaje' => sprintf(
                    'Tu examen está programado para el %s a las %s en %s.',
                    $fechaExamen->format('d/m/Y'),
                    substr((string) $examen->hora_examen, 0, 5),
                    $examen->sede,
                ),
                'fecha' => $examen->created_at?->toIso8601String(),
                'fecha_legible' => $examen->created_at?->format('d/m/Y H:i'),
                'url' => route('alumno.examen.index'),
            ]);
        }

        foreach ($alumno->pagos as $pago) {
            if ($pago->estado_validacion === 'Validado') {
                continue;
            }

            $notificaciones->push([
                'id' => 'pago-'.$pago->id_pago,
                'tipo' => $pago->estado_validacion === 'Rechazado' ? 'danger' : 'warning',
                'titulo' => 'Pago '.mb_strtolower($pago->estado_validacion),
                'mensaje' => sprintf(
                    '%s por $%s. Referencia: %s.',
                    $pago->concepto,
                    number_format((float) $pago->monto, 2),
                    $pago->referencia_bancaria ?? 'sin referencia',
                ),
                'fecha' => $pago->updated_at?->toIso8601String(),
                'fecha_legible' => $pago->updated_at?->format('d/m/Y H:i'),
                'url' => route('alumno.tramites.index'),
            ]);
        }

        if ($alumno->oficiosExpediente->isNotEmpty()) {
            $ultimoOficio = $alumno->oficiosExpediente->first();

            $notificaciones->push([
                'id' => 'oficio-'.$ultimoOficio?->id_oficio,
                'tipo' => 'info',
                'titulo' => 'Documento disponible en tu expediente',
                'mensaje' => sprintf(
                    'Se agregó el documento "%s" a tu expediente digital.',
                    $ultimoOficio?->tipo_oficio ?? 'oficio',
                ),
                'fecha' => $ultimoOficio?->created_at?->toIso8601String(),
                'fecha_legible' => $ultimoOficio?->created_at?->format('d/m/Y H:i'),
                'url' => route('alumno.tramites.index'),
            ]);
        }

        return $this->ordenar($notificaciones);
    }

    /**
     * Ordena las notificaciones de la más reciente a la más antigua.
     *
     * @param  Collection<int, array<string, mixed>>  $notificaciones
     * @return array<int, array<string, mixed>>
     */
    private function ordenar(Collection $notificaciones): array
    {
        return $notificaciones
            ->unique('id')
            ->sortByDesc(fn (array $notificacion): string => (string) ($notificacion['fecha'] ?? ''))
            ->values()
            ->all();
    }
}
