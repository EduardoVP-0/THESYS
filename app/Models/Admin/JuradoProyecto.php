<?php

namespace App\Models\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MODELO DE JURADO POR PROYECTO
 * Representa la tabla `tbljurados_proyectos`.
 */
class JuradoProyecto extends Model
{
    public const CARGO_PRESIDENTE = 'Presidente';

    public const CARGO_SECRETARIO = 'Secretario';

    public const CARGO_VOCAL = 'Vocal';

    public const CARGO_SUPLENTE_1 = 'Suplente 1';

    public const CARGO_SUPLENTE_2 = 'Suplente 2';

    /**
     * Cargos que componen la estructura oficial del jurado.
     *
     * @var array<int, string>
     */
    public const CARGOS = [
        self::CARGO_PRESIDENTE,
        self::CARGO_SECRETARIO,
        self::CARGO_VOCAL,
        self::CARGO_SUPLENTE_1,
        self::CARGO_SUPLENTE_2,
    ];

    /**
     * Relación entre los campos del formulario y el cargo almacenado.
     *
     * @var array<string, string>
     */
    public const CAMPOS_CARGOS = [
        'presidente' => self::CARGO_PRESIDENTE,
        'secretario' => self::CARGO_SECRETARIO,
        'vocal' => self::CARGO_VOCAL,
        'suplente_1' => self::CARGO_SUPLENTE_1,
        'suplente_2' => self::CARGO_SUPLENTE_2,
    ];

    public const ESTADO_PENDIENTE = 'Pendiente';

    public const ESTADO_ACEPTADO = 'Aceptado';

    public const ESTADO_RECHAZADO = 'Rechazado';

    protected $table = 'tbljurados_proyectos';

    protected $primaryKey = 'id_jurado_proyecto';

    protected $fillable = [
        'id_usuario',
        'id_proyecto',
        'cargo',
        'estado_aceptacion',
    ];

    /**
     * Docente que integra el jurado.
     */
    public function docente(): BelongsTo
    {
        return $this->belongsTo(Docente::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Cuenta de usuario del docente que integra el jurado.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id');
    }

    /**
     * Proyecto al que pertenece la integración del jurado.
     */
    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }
}
