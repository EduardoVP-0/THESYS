<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * MODELO DE VERSION DE TESIS
 * Representa la tabla `tblversiones_tesis`
 */
class VersionTesis extends Model
{
    use HasFactory;

    protected $table = 'tblversiones_tesis';

    protected $primaryKey = 'id_version';

    protected $fillable = [
        'id_proyecto',
        'numero_version',
        'comentario_alumno',
        'ruta_archivo',
    ];

    /**
     * Proyecto / Anteproyecto al que pertenece esta version de tesis.
     */
    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }

    /**
     * Revisiones efectuadas por el asesor a esta versióo.
     */
    public function revisiones(): HasMany
    {
        return $this->hasMany(RevisionAsesor::class, 'id_version', 'id_version');
    }
}
