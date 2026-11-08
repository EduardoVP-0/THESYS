<?php

namespace App\Support\Portal;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * CALENDARIO DEL DOCENTE
 *
 * Reúne en una sola agenda los registros que involucran al docente según
 * las funciones que tenga asignadas:
 *
 * - Asesor: asignaciones, entregas del flujo del director, dictámenes y
 *   exámenes de sus asesorados.
 * - Revisor: asignaciones, entregas para revisión y dictámenes registrados.
 * - Jurado: designaciones y exámenes programados.
 *
 * Es una vista de solo lectura: no crea ni modifica registros académicos.
 */
class EventosCalendarioDocente
{
    /**
     * Orden visual de las secciones usadas en el modal del día.
     *
     * @var array<string, int>
     */
    private const PRIORIDAD_CATEGORIA = [
        'asignaciones' => 1,
        'entregas' => 2,
        'revisiones' => 3,
        'examenes' => 4,
    ];

    /**
     * Construye la agenda completa del docente.
     *
     * @param  array<int, array{clave: string, etiqueta: string, descripcion: string}>  $rolesDisponibles
     * @return array<int, array<string, mixed>>
     */
    public static function paraDocente(int $userId, array $rolesDisponibles): array
    {
        $claves = array_column($rolesDisponibles, 'clave');
        $eventos = [];
        $proyectosComoAsesor = [];
        $proyectosComoJurado = [];

        if (in_array('asesor', $claves, true)) {
            $eventos = [
                ...$eventos,
                ...self::eventosAsesor($userId, $proyectosComoAsesor),
            ];
        }

        if (in_array('revisor', $claves, true)) {
            $eventos = [...$eventos, ...self::eventosRevisor($userId)];
        }

        if (in_array('jurado', $claves, true)) {
            $eventos = [
                ...$eventos,
                ...self::eventosJurado($userId, $proyectosComoJurado),
            ];
        }

        $proyectosConExamen = array_values(array_unique([
            ...$proyectosComoAsesor,
            ...$proyectosComoJurado,
        ]));

        if ($proyectosConExamen !== []) {
            $eventos = [
                ...$eventos,
                ...self::eventosExamenes(
                    $proyectosConExamen,
                    $proyectosComoAsesor,
                    $proyectosComoJurado,
                ),
            ];
        }

        usort($eventos, fn (array $a, array $b): int => [
            $a['fecha'],
            $a['hora'] ?? '',
            self::PRIORIDAD_CATEGORIA[$a['categoria']] ?? 99,
            $a['titulo'],
        ] <=> [
            $b['fecha'],
            $b['hora'] ?? '',
            self::PRIORIDAD_CATEGORIA[$b['categoria']] ?? 99,
            $b['titulo'],
        ]);

        return $eventos;
    }

    /**
     * Eventos del docente como Director de Tesis.
     *
     * @param  array<int, int>  $proyectos  Se completa con los proyectos asesorados.
     * @return array<int, array<string, mixed>>
     */
    private static function eventosAsesor(int $userId, array &$proyectos): array
    {
        $asignaciones = AsignacionAsesor::query()
            ->where('id_usuario', $userId)
            ->whereIn('estado_asignacion', AsignacionAsesor::ESTADOS_VISIBLES_DOCENTE)
            ->with(['proyecto.alumnos'])
            ->get();

        $proyectosAsesorados = $asignaciones
            ->map(fn (AsignacionAsesor $asignacion): ?Proyecto => $asignacion->proyecto)
            ->filter(fn (?Proyecto $proyecto): bool => $proyecto instanceof Proyecto)
            ->keyBy('id_proyecto');

        $proyectos = $proyectosAsesorados
            ->keys()
            ->map(fn (int|string $id): int => (int) $id)
            ->values()
            ->all();

        $eventos = [];

        foreach ($asignaciones as $asignacion) {
            $proyecto = $asignacion->proyecto;

            if (! $proyecto instanceof Proyecto || ! $asignacion->created_at) {
                continue;
            }

            $eventos[] = self::evento(
                id: 'asesor-asignacion-'.$asignacion->id_asesor_proyecto,
                fecha: $asignacion->created_at,
                roles: ['asesor'],
                categoria: 'asignaciones',
                tipo: 'asesor',
                tono: 'success',
                etiqueta: 'Asignación',
                titulo: 'Asignación como Director de Tesis',
                proyecto: $proyecto,
                descripcion: 'Fuiste asignado para dirigir esta tesis.',
                url: route('docente.asesorados.index'),
            );
        }

        if ($proyectos === []) {
            return $eventos;
        }

        $versiones = VersionTesis::query()
            ->whereIn('id_proyecto', $proyectos)
            ->where('ruta_archivo', 'not like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
            ->with(['proyecto.alumnos'])
            ->get();

        foreach ($versiones as $version) {
            $proyecto = $version->proyecto;

            if (! $proyecto instanceof Proyecto || ! $version->created_at) {
                continue;
            }

            $eventos[] = self::evento(
                id: 'asesor-version-'.$version->id_version,
                fecha: $version->created_at,
                roles: ['asesor'],
                categoria: 'entregas',
                tipo: 'version',
                tono: 'info',
                etiqueta: 'Entrega',
                titulo: 'Entrega de '.$version->numero_version,
                proyecto: $proyecto,
                descripcion: $version->comentario_alumno
                    ? Str::limit($version->comentario_alumno, 140)
                    : null,
                url: route('docente.asesorados.index'),
            );
        }

        $revisiones = RevisionAsesor::query()
            ->whereHas('asignacionAsesor', function ($query) use ($userId): void {
                $query->where('id_usuario', $userId)
                    ->whereIn('estado_asignacion', AsignacionAsesor::ESTADOS_VISIBLES_DOCENTE);
            })
            ->whereIn('estado_revision', RevisionAsesor::ESTADOS_FINALES)
            ->with(['version.proyecto.alumnos'])
            ->get();

        foreach ($revisiones as $revision) {
            $version = $revision->version;
            $proyecto = $version?->proyecto;

            if (! $version instanceof VersionTesis || ! $proyecto instanceof Proyecto || ! $revision->updated_at) {
                continue;
            }

            [$tono, $titulo] = match ($revision->estado_revision) {
                RevisionAsesor::ESTADO_APROBADA => ['success', 'Versión aprobada como asesor'],
                RevisionAsesor::ESTADO_CON_CAMBIOS => ['warning', 'Solicitaste cambios como asesor'],
                RevisionAsesor::ESTADO_RECHAZADA => ['danger', 'Versión rechazada como asesor'],
                default => ['neutral', 'Dictamen de asesoría registrado'],
            };

            $eventos[] = self::evento(
                id: 'asesor-revision-'.$revision->id_revision,
                fecha: $revision->updated_at,
                roles: ['asesor'],
                categoria: 'revisiones',
                tipo: 'director',
                tono: $tono,
                etiqueta: 'Dictamen',
                titulo: $titulo,
                proyecto: $proyecto,
                descripcion: $revision->observaciones
                    ? Str::limit($revision->observaciones, 140)
                    : $version->numero_version,
                url: route('docente.revisiones.index', ['rol' => 'Asesor']),
            );
        }

        return $eventos;
    }

    /**
     * Eventos del docente como Revisor.
     *
     * @return array<int, array<string, mixed>>
     */
    private static function eventosRevisor(int $userId): array
    {
        $asignaciones = DB::table('tblrevisores_proyectos')
            ->where('id_usuario', $userId)
            ->whereIn('estado_asignacion', ['Activo', 'Finalizado'])
            ->orderBy('id_revisor_proyecto')
            ->get();

        $proyectos = Proyecto::query()
            ->whereIn('id_proyecto', $asignaciones->pluck('id_proyecto')->all())
            ->with(['alumnos'])
            ->get()
            ->keyBy('id_proyecto');

        $eventos = [];

        foreach ($asignaciones as $asignacion) {
            $proyecto = $proyectos->get((int) $asignacion->id_proyecto);

            if (! $proyecto instanceof Proyecto || ! $asignacion->created_at) {
                continue;
            }

            $eventos[] = self::evento(
                id: 'revisor-asignacion-'.$asignacion->id_revisor_proyecto,
                fecha: $asignacion->created_at,
                roles: ['revisor'],
                categoria: 'asignaciones',
                tipo: 'revisor_asignado',
                tono: 'info',
                etiqueta: 'Asignación',
                titulo: 'Asignación como revisor de tesis',
                proyecto: $proyecto,
                descripcion: 'Fuiste asignado para revisar esta tesis.',
                url: route('docente.revisiones.index', ['rol' => 'Revisor']),
            );

            if ($asignacion->estado_revision === RevisionesRevisor::ESTADO_PENDIENTE) {
                continue;
            }

            $fechaDictamen = self::fecha(
                $asignacion->fecha_revision ?? $asignacion->updated_at,
            );

            if (! $fechaDictamen) {
                continue;
            }

            [$tono, $titulo] = match ($asignacion->estado_revision) {
                RevisionesRevisor::ESTADO_APROBADO => ['success', 'Revisión aprobada como revisor'],
                RevisionesRevisor::ESTADO_CON_CAMBIOS => ['warning', 'Solicitaste cambios como revisor'],
                default => ['neutral', 'Dictamen de revisión registrado'],
            };

            $eventos[] = self::evento(
                id: 'revisor-dictamen-'.$asignacion->id_revisor_proyecto,
                fecha: $fechaDictamen,
                roles: ['revisor'],
                categoria: 'revisiones',
                tipo: 'revisor',
                tono: $tono,
                etiqueta: 'Dictamen',
                titulo: $titulo,
                proyecto: $proyecto,
                descripcion: $asignacion->comentarios_revision
                    ? Str::limit($asignacion->comentarios_revision, 140)
                    : null,
                url: route('docente.revisiones.index', ['rol' => 'Revisor']),
            );
        }

        if ($proyectos->isEmpty()) {
            return $eventos;
        }

        $versiones = VersionTesis::query()
            ->whereIn('id_proyecto', $proyectos->keys()->all())
            ->where('ruta_archivo', 'like', '%'.FlujoRevisionTesis::CARPETA_REVISORES.'%')
            ->with(['proyecto.alumnos'])
            ->get();

        foreach ($versiones as $version) {
            $proyecto = $version->proyecto;

            if (! $proyecto instanceof Proyecto || ! $version->created_at) {
                continue;
            }

            $eventos[] = self::evento(
                id: 'revisor-version-'.$version->id_version,
                fecha: $version->created_at,
                roles: ['revisor'],
                categoria: 'entregas',
                tipo: 'version',
                tono: 'info',
                etiqueta: 'Entrega',
                titulo: 'Entrega para revisión · '.$version->numero_version,
                proyecto: $proyecto,
                descripcion: $version->comentario_alumno
                    ? Str::limit($version->comentario_alumno, 140)
                    : null,
                url: route('docente.revisiones.index', ['rol' => 'Revisor']),
            );
        }

        return $eventos;
    }

    /**
     * Eventos del docente como integrante del Jurado.
     *
     * @param  array<int, int>  $proyectos  Se completa con los proyectos asignados al jurado.
     * @return array<int, array<string, mixed>>
     */
    private static function eventosJurado(int $userId, array &$proyectos): array
    {
        $asignaciones = JuradoProyecto::query()
            ->where('id_usuario', $userId)
            ->with(['proyecto.alumnos'])
            ->get();

        $proyectos = $asignaciones
            ->map(fn (JuradoProyecto $asignacion): ?Proyecto => $asignacion->proyecto)
            ->filter(fn (?Proyecto $proyecto): bool => $proyecto instanceof Proyecto)
            ->pluck('id_proyecto')
            ->map(fn (int|string $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();

        $eventos = [];

        foreach ($asignaciones as $asignacion) {
            $proyecto = $asignacion->proyecto;

            if (! $proyecto instanceof Proyecto || ! $asignacion->created_at) {
                continue;
            }

            $eventos[] = self::evento(
                id: 'jurado-asignacion-'.$asignacion->id_jurado_proyecto,
                fecha: $asignacion->created_at,
                roles: ['jurado'],
                categoria: 'asignaciones',
                tipo: 'jurado',
                tono: 'neutral',
                etiqueta: 'Designación',
                titulo: 'Designación como '.$asignacion->cargo,
                proyecto: $proyecto,
                descripcion: 'Estado de la designación: '.$asignacion->estado_aceptacion.'.',
                url: route('docente.jurado.proyectos-asignados'),
            );
        }

        return $eventos;
    }

    /**
     * Eventos de examen profesional, combinando los roles del docente cuando
     * participa en el mismo proyecto como Asesor y como Jurado.
     *
     * @param  array<int, int>  $proyectos
     * @param  array<int, int>  $proyectosComoAsesor
     * @param  array<int, int>  $proyectosComoJurado
     * @return array<int, array<string, mixed>>
     */
    private static function eventosExamenes(
        array $proyectos,
        array $proyectosComoAsesor,
        array $proyectosComoJurado,
    ): array {
        $examenes = ExamenProfesional::query()
            ->whereIn('id_proyecto', $proyectos)
            ->with(['proyecto.alumnos', 'sedeRelacionada'])
            ->get();

        $eventos = [];

        foreach ($examenes as $examen) {
            $proyecto = $examen->proyecto;

            if (! $proyecto instanceof Proyecto) {
                continue;
            }

            $roles = [];

            if (in_array((int) $examen->id_proyecto, $proyectosComoAsesor, true)) {
                $roles[] = 'asesor';
            }

            if (in_array((int) $examen->id_proyecto, $proyectosComoJurado, true)) {
                $roles[] = 'jurado';
            }

            if ($roles === []) {
                continue;
            }

            $eventos[] = self::evento(
                id: 'examen-'.$examen->id_examen,
                fecha: $examen->fecha_examen,
                roles: $roles,
                categoria: 'examenes',
                tipo: 'examen',
                tono: 'danger',
                etiqueta: 'Examen',
                titulo: 'Examen profesional',
                proyecto: $proyecto,
                descripcion: 'Estado del examen: '.$examen->estado_examen.'.',
                lugar: $examen->sedeRelacionada?->nombre_sede ?? $examen->sede,
                hora: $examen->hora_examen
                    ? PresentacionExamen::hora((string) $examen->hora_examen)
                    : null,
                url: in_array('jurado', $roles, true)
                    ? route('docente.jurado.proyectos-asignados')
                    : route('docente.asesorados.index'),
            );
        }

        return $eventos;
    }

    /**
     * Normaliza los datos de un evento para el calendario.
     *
     * @param  array<int, string>  $roles
     * @return array<string, mixed>
     */
    private static function evento(
        string $id,
        DateTimeInterface|string $fecha,
        array $roles,
        string $categoria,
        string $tipo,
        string $tono,
        string $etiqueta,
        string $titulo,
        Proyecto $proyecto,
        ?string $descripcion = null,
        ?string $lugar = null,
        ?string $hora = null,
        ?string $url = null,
    ): array {
        $dia = self::fecha($fecha);
        $horaCalculada = $hora ?? $dia?->format('H:i');

        return [
            'id' => $id,
            'fecha' => $dia?->toDateString(),
            'hora' => $horaCalculada === '00:00' ? null : $horaCalculada,
            'roles' => array_values(array_unique($roles)),
            'categoria' => $categoria,
            'tipo' => $tipo,
            'tono' => $tono,
            'etiqueta' => $etiqueta,
            'titulo' => $titulo,
            'proyecto' => (string) $proyecto->titulo,
            'sustentante' => $proyecto->sustentante?->nombre_completo,
            'descripcion' => $descripcion,
            'lugar' => $lugar,
            'url' => $url,
        ];
    }

    /**
     * Convierte una fecha de Eloquent o de la base de datos a CarbonImmutable.
     */
    private static function fecha(DateTimeInterface|string|null $fecha): ?CarbonImmutable
    {
        if ($fecha === null || $fecha === '') {
            return null;
        }

        return $fecha instanceof DateTimeInterface
            ? CarbonImmutable::instance($fecha)
            : CarbonImmutable::parse($fecha);
    }
}
