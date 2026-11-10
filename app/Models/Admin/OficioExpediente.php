<?php

namespace App\Models\Admin;

use App\Models\User;
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
        'id_requisito',
        'tipo_oficio',
        'url_archivo',
        'estado_validacion',
        'observaciones',
        'id_validador',
        'fecha_validacion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_validacion' => 'datetime',
        ];
    }

    /**
     * Alumno titular de este oficio / documento de expediente.
     */
    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Requisito del catálogo al que responde este documento.
     */
    public function requisito(): BelongsTo
    {
        return $this->belongsTo(RequisitoDocumento::class, 'id_requisito', 'id_requisito');
    }

    /**
     * Usuario administrativo que validó o rechazó el documento.
     */
    public function validador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_validador');
    }
}
