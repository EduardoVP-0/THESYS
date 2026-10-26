<?php

namespace App\Models\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * MODELO DE PROYECTO / ANTEPROYECTO
 * Representa la tabla `tblproyectos`.
 */
class Proyecto extends Model
{
    public const ESTADO_APROBADO = 'Aprobado';

    public const ESTADO_APROBADA = 'Aprobada';

    /**
     * Estados que indican que el anteproyecto ya fue aprobado.
     *
     * @var array<int, string>
     */
    public const ESTADOS_APROBADOS = [
        self::ESTADO_APROBADO,
        self::ESTADO_APROBADA,
    ];

    protected $table = 'tblproyectos';

    protected $primaryKey = 'id_proyecto';

    protected $fillable = [
        'titulo',
        'resumen',
        'estado',
    ];

    /**
     * Alumnos/sustentantes vinculados al proyecto.
     */
    public function alumnos(): BelongsToMany
    {
        return $this->belongsToMany(
            Alumno::class,
            'tblalumnos_proyectos',
            'id_proyecto',
            'id_alumno',
        )->withTimestamps();
    }

    /**
     * Asesores asignados al proyecto.
     */
    public function asesores(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'tblasesores_proyectos',
            'id_proyecto',
            'id_usuario',
        )
            ->withPivot('estado_asignacion')
            ->withTimestamps();
    }

    /**
     * Docentes que participan como asesores del proyecto.
     */
    public function docentesAsesores(): BelongsToMany
    {
        return $this->belongsToMany(
            Docente::class,
            'tblasesores_proyectos',
            'id_proyecto',
            'id_usuario',
            'id_proyecto',
            'id_usuario',
        )
            ->withPivot('estado_asignacion')
            ->withTimestamps();
    }

    /**
     * Integrantes del jurado asignados al proyecto.
     */
    public function jurados(): HasMany
    {
        return $this->hasMany(JuradoProyecto::class, 'id_proyecto', 'id_proyecto');
    }

    /**
     * Indica si el proyecto cuenta con un anteproyecto aprobado.
     */
    public function estaAprobado(): bool
    {
        return in_array($this->estado, self::ESTADOS_APROBADOS, true);
    }
}
