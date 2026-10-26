<?php

namespace App\Models\Admin;

use Database\Factories\Admin\DictamenFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MODELO DE DICTAMEN
 *
 * Representa el voto individual emitido por un integrante del jurado.
 * La página de veredictos agrega estos votos por proyecto.
 */
class Dictamen extends Model
{
    /** @use HasFactory<DictamenFactory> */
    use HasFactory;

    public const VOTO_A_FAVOR = 'A favor';

    public const VOTO_EN_CONTRA = 'En contra';

    public const VOTO_ABSTENCION = 'Abstención';

    /**
     * Votos que puede emitir un integrante del jurado.
     *
     * @var array<int, string>
     */
    public const VOTOS = [
        self::VOTO_A_FAVOR,
        self::VOTO_EN_CONTRA,
        self::VOTO_ABSTENCION,
    ];

    protected $table = 'tbldictamenes';

    protected $primaryKey = 'id_dictamen';

    protected $fillable = [
        'id_jurado_proyecto',
        'voto',
        'observaciones',
    ];

    /**
     * Integrante del jurado que emitió el dictamen.
     */
    public function juradoProyecto(): BelongsTo
    {
        return $this->belongsTo(JuradoProyecto::class, 'id_jurado_proyecto', 'id_jurado_proyecto');
    }
}
