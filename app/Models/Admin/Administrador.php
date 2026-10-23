<?php

namespace App\Models\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MODELO DE ADMINISTRADOR
 * Representa la tabla `tbladministradores` en la base de datos.
 * Comparte llave primaria con `users` (id_usuario).
 */
class Administrador extends Model
{
    use HasFactory;

    protected $table = 'tbladministradores';

    protected $primaryKey = 'id_usuario';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'id_usuario',
        'id_usuario_registro',
        'nombre',
        'apellido_p',
        'apellido_m',
        'telefono',
        'area',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    protected $appends = [
        'nombre_completo',
        'iniciales',
    ];

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombre} {$this->apellido_p} {$this->apellido_m}");
    }

    public function getInicialesAttribute(): string
    {
        $primera = mb_substr($this->nombre ?? '', 0, 1);
        $segunda = mb_substr($this->apellido_p ?? '', 0, 1);

        return strtoupper("{$primera}{$segunda}");
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id');
    }

    public function usuarioRegistro(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario_registro', 'id');
    }
}
