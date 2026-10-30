<?php

namespace App\Support\Portal;

use App\Models\Admin\Docente;
use App\Models\Admin\Proyecto;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Support\Str;

/**
 * LÍNEA DE TIEMPO DEL PROCESO DE TITULACIÓN
 *
 * Reúne los hitos históricos de un proyecto: envío del anteproyecto,
 * asignación de director, revisores y jurado, versiones de tesis subidas,
 * dictámenes, programación y realización del examen, aprobación de la tesis
 * y culminación del proceso.
 *
 * La usan el calendario académico y el dashboard del sustentante para que
 * ambos módulos presenten exactamente el mismo historial.
 */
class EventosCalendario
{
    /**
     * Construye la línea de tiempo del proyecto ordenada por fecha.
     *
     * @return array<int, array<string, string|null>>
     */
    public static function paraProyecto(Proyecto $proyecto): array
    {
        $proyecto->loadMissing([
            'asesores',
            'jurados.docente',
            'examen.sedeRelacionada',
        ]);

        $eventos = [];

        if ($proyecto->fecha_envio) {
            $eventos[] = self::evento(
                'anteproyecto-envio',
                $proyecto->fecha_envio,
                'anteproyecto',
                'info',
                'Anteproyecto',
                'Anteproyecto enviado a revisión',
                'Tu anteproyecto fue enviado para revisión académica.',
            );
        }

        foreach ($proyecto->asesores as $docente) {
            if (! $docente->pivot->created_at) {
                continue;
            }

            $eventos[] = self::evento(
                'asesor-'.$docente->id_usuario.'-'.$docente->pivot->created_at->timestamp,
                $docente->pivot->created_at,
                'asesor',
                'success',
                'Director de tesis',
                'Director de tesis asignado',
                self::nombreDocente($docente).' fue asignado como director de tesis.',
            );
        }

        $revisores = $proyecto->revisores()
            ->withPivot('estado_revision', 'comentarios_revision', 'fecha_revision')
            ->get();

        foreach ($revisores as $docente) {
            $pivot = $docente->pivot;

            if ($pivot->created_at) {
                $eventos[] = self::evento(
                    'revisor-asignado-'.$docente->id_usuario.'-'.$pivot->created_at->timestamp,
                    $pivot->created_at,
                    'revisor_asignado',
                    'info',
                    'Revisor',
                    'Revisor de tesis asignado',
                    self::nombreDocente($docente).' fue asignado como revisor de tesis.',
                );
            }

            if (! in_array($pivot->estado_revision, ['Con cambios', 'Aprobado'], true)) {
                continue;
            }

            $fechaDecision = $pivot->fecha_revision ?? $pivot->updated_at;

            if (! $fechaDecision) {
                continue;
            }

            $aprobado = $pivot->estado_revision === 'Aprobado';
            $descripcion = ($aprobado ? 'Aprobación' : 'Solicitud de cambios')
                .' de '.self::nombreDocente($docente).'.';

            if ($pivot->comentarios_revision) {
                $descripcion .= ' “'.$pivot->comentarios_revision.'”';
            }

            $eventos[] = self::evento(
                'revisor-'.$docente->id_usuario.'-'.CarbonImmutable::parse($fechaDecision)->timestamp,
                $fechaDecision,
                'revisor',
                $aprobado ? 'success' : 'warning',
                'Revisión de tesis',
                $aprobado ? 'Revisor aprobó tu tesis' : 'Revisor solicitó cambios',
                $descripcion,
            );
        }

        foreach ($proyecto->jurados as $miembro) {
            if (! $miembro->created_at) {
                continue;
            }

            $eventos[] = self::evento(
                'jurado-'.$miembro->id_jurado_proyecto,
                $miembro->created_at,
                'jurado',
                'neutral',
                'Jurado',
                'Jurado asignado · '.$miembro->cargo,
                self::nombreDocente($miembro->docente).' fue asignado como '
                    .$miembro->cargo.' del jurado.',
            );
        }

        $versiones = VersionTesis::with('revisiones')
            ->where('id_proyecto', $proyecto->id_proyecto)
            ->orderBy('id_version')
            ->get();

        foreach ($versiones as $version) {
            $esRevisores = str_contains((string) $version->ruta_archivo, FlujoRevisionTesis::CARPETA_REVISORES);

            $descripcion = trim(
                (string) $version->numero_version
                .($version->comentario_alumno ? ' · '.$version->comentario_alumno : ''),
            );

            $eventos[] = self::evento(
                'version-'.$version->id_version,
                $version->created_at,
                'version',
                'info',
                'Versión de tesis',
                $esRevisores
                    ? 'Subiste una versión a revisores'
                    : 'Subiste una versión a tu director',
                $descripcion,
            );

            if ($esRevisores) {
                continue;
            }

            foreach ($version->revisiones as $revision) {
                if ($revision->estado_revision === RevisionAsesor::ESTADO_PENDIENTE) {
                    continue;
                }

                if (! $revision->updated_at) {
                    continue;
                }

                [$tono, $titulo] = match ($revision->estado_revision) {
                    RevisionAsesor::ESTADO_APROBADA, 'Aprobado' => ['success', 'Director aprobó tu tesis'],
                    RevisionAsesor::ESTADO_CON_CAMBIOS => ['warning', 'Director solicitó cambios'],
                    RevisionAsesor::ESTADO_RECHAZADA => ['danger', 'Director rechazó tu versión'],
                    default => ['neutral', 'Revisión del director'],
                };

                $descripcionRevision = (string) $version->numero_version.'.';

                if ($revision->observaciones) {
                    $descripcionRevision .= ' “'.$revision->observaciones.'”';
                }

                $eventos[] = self::evento(
                    'director-'.$revision->id_revision,
                    $revision->updated_at,
                    'director',
                    $tono,
                    'Director de tesis',
                    $titulo,
                    $descripcionRevision,
                );
            }
        }

        $examen = $proyecto->examen;

        if ($examen) {
            $fechaLarga = PresentacionExamen::fechaLarga($examen->fecha_examen);
            $hora = PresentacionExamen::horaLarga((string) $examen->hora_examen);
            $sede = $examen->sedeRelacionada?->nombre_sede ?? $examen->sede;

            if ($examen->created_at) {
                $eventos[] = self::evento(
                    'examen-programado-'.$examen->id_examen,
                    $examen->created_at,
                    'examen_programado',
                    'info',
                    'Examen',
                    'Examen profesional programado',
                    "Tu examen quedó programado para el {$fechaLarga} a las {$hora} en {$sede}.",
                );
            }

            $descripcionExamen = "A las {$hora} en {$sede}.";

            if ($examen->resultado_final) {
                $descripcionExamen .= " Resultado: {$examen->resultado_final}.";
            }

            $eventos[] = self::evento(
                'examen-dia-'.$examen->id_examen,
                $examen->fecha_examen,
                'examen',
                'danger',
                'Día del examen',
                'Día de tu examen profesional',
                $descripcionExamen,
            );

            $claveResultado = PresentacionExamen::claveResultado($examen->resultado_final);

            if ($claveResultado !== null) {
                $tonoResultado = match ($claveResultado) {
                    'rechazado' => 'danger',
                    'observaciones' => 'warning',
                    'aprobado' => 'success',
                    default => 'neutral',
                };

                $eventos[] = self::evento(
                    'resultado-'.$examen->id_examen,
                    $examen->fecha_examen,
                    'resultado',
                    $tonoResultado,
                    'Resultado',
                    'Resultado del examen: '.$examen->resultado_final,
                    'El jurado registró el resultado de tu examen profesional.',
                );
            }
        }

        $estadoAsesor = FlujoRevisionTesis::estadoAsesor($proyecto->id_proyecto);
        $estadoRevisores = FlujoRevisionTesis::estadoRevisores($proyecto->id_proyecto);

        $directorAprobo = in_array(
            $estadoAsesor['estado'],
            [RevisionAsesor::ESTADO_APROBADA, 'Aprobado'],
            true,
        );
        $revisoresAprobaron = $estadoRevisores['global'] === 'Aprobado';

        if ($directorAprobo && $revisoresAprobaron && $estadoAsesor['fecha_decision']) {
            $fechas = [$estadoAsesor['fecha_decision']];

            foreach ($revisores as $docente) {
                $fechaRevisor = $docente->pivot->fecha_revision ?? $docente->pivot->updated_at;

                if ($fechaRevisor) {
                    $fechas[] = CarbonImmutable::parse($fechaRevisor);
                }
            }

            $eventos[] = self::evento(
                'aprobacion-tesis',
                collect($fechas)->sortDesc()->first(),
                'aprobacion',
                'success',
                'Aprobación',
                'Tesis aprobada por todos',
                'Tu director y tus revisores aprobaron la tesis.',
            );
        }

        if ($examen && in_array(PresentacionExamen::claveResultado($examen->resultado_final), ['aprobado', 'observaciones'], true)) {
            $eventos[] = self::evento(
                'culminacion-'.$examen->id_examen,
                $examen->fecha_examen,
                'culminacion',
                'gold',
                'Culminación',
                '¡Todos los procesos aprobados!',
                'Tu examen profesional fue aprobado. ¡Felicidades!',
            );
        }

        $prioridad = [
            'anteproyecto' => 1,
            'asesor' => 2,
            'revisor_asignado' => 3,
            'jurado' => 4,
            'version' => 5,
            'director' => 6,
            'revisor' => 7,
            'examen_programado' => 8,
            'examen' => 9,
            'resultado' => 10,
            'aprobacion' => 11,
            'culminacion' => 12,
        ];

        usort($eventos, fn (array $a, array $b): int => [
            $a['fecha'],
            $prioridad[$a['tipo']] ?? 99,
            $a['titulo'],
        ] <=> [
            $b['fecha'],
            $prioridad[$b['tipo']] ?? 99,
            $b['titulo'],
        ]);

        return $eventos;
    }

    /**
     * Crea un evento del calendario con fecha normalizada.
     *
     * @return array<string, string|null>
     */
    private static function evento(
        string $id,
        DateTimeInterface|string $fecha,
        string $tipo,
        string $tono,
        string $etiqueta,
        string $titulo,
        ?string $descripcion = null,
    ): array {
        $dia = $fecha instanceof DateTimeInterface
            ? CarbonImmutable::instance($fecha)
            : CarbonImmutable::parse($fecha);

        return [
            'id' => $id,
            'fecha' => $dia->toDateString(),
            'tipo' => $tipo,
            'tono' => $tono,
            'etiqueta' => $etiqueta,
            'titulo' => $titulo,
            'descripcion' => $descripcion,
        ];
    }

    /**
     * Nombre del docente con su abreviatura de grado.
     */
    public static function nombreDocente(?Docente $docente): string
    {
        if (! $docente) {
            return 'Docente no disponible';
        }

        $nombre = $docente->abreviatura_grado
            ? $docente->abreviatura_grado.' '.$docente->nombre_completo
            : $docente->nombre_completo;

        return Str::squish($nombre);
    }
}
