<?php

namespace App\Models\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MODELO DE PRÓRROGA / MINICHAT DE EXPEDIENTE
 * Representa la tabla `tblprorrogas_expediente`
 */
class ProrrogaExpediente extends Model
{
    use HasFactory;

    protected $table = 'tblprorrogas_expediente';

    protected $primaryKey = 'id_prorroga';

    protected $fillable = [
        'id_usuario',
        'etapa',
        'emisor',
        'mensaje',
        'estado',
        'dias_otorgados',
        'id_administrador',
        'fecha_resolucion',
    ];

    protected function casts(): array
    {
        return [
            'etapa' => 'integer',
            'dias_otorgados' => 'integer',
            'fecha_resolucion' => 'datetime',
        ];
    }

    /**
     * Alumno titular de la solicitud o mensaje de prórroga.
     */
    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Usuario administrador que respondió o resolvió la prórroga.
     */
    public function administrador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_administrador');
    }
}
