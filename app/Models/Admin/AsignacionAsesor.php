<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * MODELO DE ASIGNACIÓN DE ASESOR
 * Representa la tabla pivote `tblasesores_proyectos`.
 */
class AsignacionAsesor extends Model
{
    public const ESTADO_ACTIVO = 'Activo';

    public const MAX_PROYECTOS_ACTIVOS_POR_ASESOR = 5;

    protected $table = 'tblasesores_proyectos';

    protected $primaryKey = 'id_asesor_proyecto';

    protected $fillable = [
        'id_usuario',
        'id_proyecto',
        'estado_asignacion',
    ];

    /**
     * Docente que funge como asesor.
     */
    public function docente(): BelongsTo
    {
        return $this->belongsTo(Docente::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Proyecto que recibe la asesoría.
     */
    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }

    /**
     * Revisiones realizadas dentro de esta asignación de asesoría.
     */
    public function revisiones(): HasMany
    {
        return $this->hasMany(RevisionAsesor::class, 'id_asesor_proyecto', 'id_asesor_proyecto');
    }
}
