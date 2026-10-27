<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MODELO DE REVISIÓN DEL ASESOR
 *
 * Representa la revisión que cada asesor realiza sobre una versión de tesis.
 * Se alimenta de la tabla `tblrevisiones_asesor` y permite construir la
 * bandeja de trabajo, la retroalimentación y el historial académico.
 */
class RevisionAsesor extends Model
{
    use HasFactory;

    public const ESTADO_PENDIENTE = 'Pendiente';

    public const ESTADO_APROBADA = 'Aprobada';

    public const ESTADO_CON_CAMBIOS = 'Con cambios';

    public const ESTADO_RECHAZADA = 'Rechazada';

    /**
     * Estados que puede registrar un asesor al dictaminar una versión.
     *
     * @var array<int, string>
     */
    public const ESTADOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_APROBADA,
        self::ESTADO_CON_CAMBIOS,
        self::ESTADO_RECHAZADA,
    ];

    /**
     * Estados finales que ya no se consideran pendientes de atención.
     *
     * @var array<int, string>
     */
    public const ESTADOS_FINALES = [
        self::ESTADO_APROBADA,
        self::ESTADO_CON_CAMBIOS,
        self::ESTADO_RECHAZADA,
    ];

    protected $table = 'tblrevisiones_asesor';

    protected $primaryKey = 'id_revision';

    protected $fillable = [
        'id_version',
        'id_asesor_proyecto',
        'estado_revision',
        'observaciones',
    ];

    /**
     * Versión de tesis revisada.
     */
    public function version(): BelongsTo
    {
        return $this->belongsTo(VersionTesis::class, 'id_version', 'id_version');
    }

    /**
     * Asignación de asesoría que realizó la revisión.
     */
    public function asignacionAsesor(): BelongsTo
    {
        return $this->belongsTo(
            AsignacionAsesor::class,
            'id_asesor_proyecto',
            'id_asesor_proyecto',
        );
    }
}
