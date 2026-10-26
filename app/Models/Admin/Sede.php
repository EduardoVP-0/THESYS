<?php

namespace App\Models\Admin;

use Database\Factories\Admin\SedeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * MODELO DE SEDE
 *
 * Representa los espacios físicos disponibles para programar exámenes
 * profesionales. Las sedes se desactivan lógicamente sin borrar su historial.
 */
class Sede extends Model
{
    /** @use HasFactory<SedeFactory> */
    use HasFactory;

    protected $table = 'tblsedes';

    protected $primaryKey = 'id_sede';

    protected $fillable = [
        'nombre_sede',
        'direccion',
        'estado',
        'id_usuario_registro',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    protected $appends = [
        'clave',
    ];

    /**
     * Exámenes programados en esta sede.
     */
    public function examenes(): HasMany
    {
        return $this->hasMany(ExamenProfesional::class, 'id_sede', 'id_sede');
    }

    /**
     * Clave visual de la sede (SED-00001).
     */
    public function getClaveAttribute(): string
    {
        return 'SED-'.str_pad((string) $this->id_sede, 5, '0', STR_PAD_LEFT);
    }
}
