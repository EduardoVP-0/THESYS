<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MODELO DE OFICIO DE EXPEDIENTE DEL ALUMNO
 * Representa la tabla `tbloficios_expedientes`
 */
class OficioExpediente extends Model
{
    use HasFactory;

    protected $table = 'tbloficios_expedientes';

    protected $primaryKey = 'id_oficio';

    protected $fillable = [
        'id_usuario',
        'tipo_oficio',
        'url_archivo',
    ];

    /**
     * Alumno titular de este oficio / documento de expediente.
     */
    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class, 'id_usuario', 'id_usuario');
    }
}
