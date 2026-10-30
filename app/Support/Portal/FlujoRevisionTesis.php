<?php

namespace App\Support\Portal;

use App\Models\Admin\RevisionAsesor;
use App\Models\Admin\VersionTesis;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * REGLAS DE BLOQUEO Y DESBLOQUEO ENTRE LOS DOS FLUJOS DE TESIS
 *
 * Flujo del director de tesis (asesor): versiones guardadas fuera de la
 * carpeta `versiones_revisores` y su dictamen en `tblrevisiones_asesor`.
 *
 * Flujo de revisores: versiones en la carpeta `versiones_revisores` y el
 * dictamen individual de cada revisor en `tblrevisores_proyectos`
 * (`estado_revision`, `comentarios_revision`, `fecha_revision`).
 *
 * Ciclo de trabajo:
 *  1. El director aprueba la versión -> se habilita enviarla a revisores.
 *  2. Si al menos un revisor marca "Con cambios" -> se bloquea el envío a
 *     revisores y se re-activa la carga de una versión corregida para el
 *     director.
 *  3. El director aprueba la corrección -> se habilita reenviarla a
 *     revisores; al subirla, el dictamen de ambos revisores vuelve a
 *     "Pendiente" (lo hace el store del flujo de revisores).
 *
 * La comparación se hace con fechas: la decisión más reciente del director
 * (`tblrevisiones_asesor.updated_at`) contra el último "Con cambios" de los
 * revisores (`fecha_revision` de la pivote, con `updated_at` como respaldo).
 */
class FlujoRevisionTesis
{
    /**
     * Carpeta de Supabase Storage del flujo de revisores.
     */
    public const CARPETA_REVISORES = 'versiones_revisores';

    /**
     * Estados de la revisión del director que representan una decisión final
     * (y por lo tanto una fecha de decisión válida).
     *
     * @var array<int, string>
     */
    private const ESTADOS_DECISION_ASESOR = [
        RevisionAsesor::ESTADO_APROBADA,
        'Aprobado',
        RevisionAsesor::ESTADO_CON_CAMBIOS,
        RevisionAsesor::ESTADO_RECHAZADA,
    ];

    /**
     * Estado del flujo del director sobre la versión más reciente.
     *
     * @return array{version: VersionTesis|null, estado: string|null, fecha_decision: Carbon|null}
     */
    public static function estadoAsesor(int $idProyecto): array
    {
        $version = VersionTesis::query()
            ->where('id_proyecto', $idProyecto)
            ->where('ruta_archivo', 'not like', '%'.self::CARPETA_REVISORES.'%')
            ->orderByDesc('id_version')
            ->first();

        if (! $version) {
            return ['version' => null, 'estado' => null, 'fecha_decision' => null];
        }

        $revision = RevisionAsesor::query()
            ->where('id_version', $version->id_version)
            ->orderByDesc('id_revision')
            ->first();

        $estado = $revision?->estado_revision;

        $fechaDecision = $revision
            && $revision->updated_at
            && in_array($estado, self::ESTADOS_DECISION_ASESOR, true)
                ? Carbon::parse($revision->updated_at)
                : null;

        return [
            'version' => $version,
            'estado' => $estado,
            'fecha_decision' => $fechaDecision,
        ];
    }

    /**
     * Estado del flujo de revisores sobre la versión más reciente.
     *
     * @return array{version: VersionTesis|null, estados: array<int, string>, global: string, fecha_con_cambios: Carbon|null}
     */
    public static function estadoRevisores(int $idProyecto): array
    {
        $version = VersionTesis::query()
            ->where('id_proyecto', $idProyecto)
            ->where('ruta_archivo', 'like', '%'.self::CARPETA_REVISORES.'%')
            ->orderByDesc('id_version')
            ->first();

        $filas = DB::table('tblrevisores_proyectos')
            ->where('id_proyecto', $idProyecto)
            ->where('estado_asignacion', 'Activo')
            ->get(['estado_revision', 'fecha_revision', 'updated_at']);

        $estados = $filas->pluck('estado_revision')->all();

        $fechaConCambios = $filas
            ->filter(fn (object $fila): bool => $fila->estado_revision === RevisionesRevisor::ESTADO_CON_CAMBIOS)
            ->map(fn (object $fila): ?string => $fila->fecha_revision ?? $fila->updated_at)
            ->filter()
            ->map(fn (string $fecha): Carbon => Carbon::parse($fecha))
            ->sortDesc()
            ->first();

        return [
            'version' => $version,
            'estados' => $estados,
            'global' => RevisionesRevisor::estadoGlobal($estados),
            'fecha_con_cambios' => $fechaConCambios,
        ];
    }

    /**
     * Indica si el alumno puede enviar (o reenviar) su tesis al dictamen de
     * los revisores: el director ya aprobó la versión más reciente y esa
     * aprobación es posterior al último "Con cambios" registrado por los
     * revisores (o nunca hubo cambios).
     */
    public static function revisoresDesbloqueadosPorAsesor(int $idProyecto): bool
    {
        $asesor = self::estadoAsesor($idProyecto);

        $aprobadaPorDirector = in_array(
            $asesor['estado'],
            [RevisionAsesor::ESTADO_APROBADA, 'Aprobado'],
            true,
        );

        if (! $aprobadaPorDirector) {
            return false;
        }

        $revisores = self::estadoRevisores($idProyecto);

        if ($revisores['fecha_con_cambios'] === null) {
            return true;
        }

        return $asesor['fecha_decision'] !== null
            && $asesor['fecha_decision']->greaterThan($revisores['fecha_con_cambios']);
    }

    /**
     * Indica si la carga de una nueva versión para el director debe
     * re-activarse porque los revisores devolvieron el documento "Con
     * cambios" después de la última decisión del director.
     */
    public static function asesorDesbloqueadoPorRevisores(int $idProyecto): bool
    {
        $revisores = self::estadoRevisores($idProyecto);

        if ($revisores['fecha_con_cambios'] === null) {
            return false;
        }

        $asesor = self::estadoAsesor($idProyecto);

        $aprobadaPorDirector = in_array(
            $asesor['estado'],
            [RevisionAsesor::ESTADO_APROBADA, 'Aprobado'],
            true,
        );

        if (! $aprobadaPorDirector) {
            return false;
        }

        return $asesor['fecha_decision'] === null
            || $revisores['fecha_con_cambios']->greaterThan($asesor['fecha_decision']);
    }
}
