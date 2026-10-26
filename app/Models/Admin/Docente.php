<?php

namespace App\Models\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * MODELO DE DOCENTE
 * Representa la tabla `tbldocentes` en la base de datos.
 * Comparte llave primaria con `users` (id_usuario).
 */
class Docente extends Model
{
    use HasFactory;

    protected $table = 'tbldocentes';

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
        'cedula_profesional',
        'curp',
        'especialidad',
        'grado_academico',
        'tipo_contrato',
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

    /**
     * Proyectos en los que el docente participa como asesor.
     */
    public function proyectosAsesorados(): BelongsToMany
    {
        return $this->belongsToMany(
            Proyecto::class,
            'tblasesores_proyectos',
            'id_usuario',
            'id_proyecto',
        )
            ->withPivot('estado_asignacion')
            ->withTimestamps();
    }

    public function usuarioRegistro(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario_registro', 'id');
    }
}
