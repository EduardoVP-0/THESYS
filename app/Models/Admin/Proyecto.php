<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * MODELO DE PROYECTO / ANTEPROYECTO
 * Representa la tabla `tblproyectos` en la base de datos
 */
class Proyecto extends Model
{
    use HasFactory;

    public const ESTADO_BORRADOR = 'Borrador';

    public const ESTADO_EN_REVISION = 'En revisión';

    public const ESTADO_CON_CAMBIOS = 'Con cambios';

    public const ESTADO_APROBADO = 'Aprobado';

    public const ESTADO_APROBADA = 'Aprobada';

    /**
     * Estados en los que el sustentante todavía puede editar su anteproyecto.
     *
     * @var array<int, string>
     */
    public const ESTADOS_EDITABLES = [
        self::ESTADO_BORRADOR,
        self::ESTADO_CON_CAMBIOS,
    ];

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
        'fecha_envio',
        'ruta_documento',
        'observaciones_coordinacion',
    ];

    protected $casts = [
        'fecha_envio' => 'datetime',
    ];

    protected $appends = [
        'sustentante',
        'asesor_asignado',
    ];

    /**
     * Alumnos vinculados al proyecto (Relación N:M mediante tblalumnos_proyectos)
     */
    public function alumnos(): BelongsToMany
    {
        return $this->belongsToMany(
            Alumno::class,
            'tblalumnos_proyectos',
            'id_proyecto',
            'id_alumno',
            'id_proyecto',
            'id_usuario'
        )->withTimestamps();
    }

    /**
     * Asesores vinculados al proyecto (Relación N:M mediante tblasesores_proyectos)
     */
    public function asesores(): BelongsToMany
    {
        return $this->belongsToMany(
            Docente::class,
            'tblasesores_proyectos',
            'id_proyecto',
            'id_usuario',
            'id_proyecto',
            'id_usuario'
        )->withPivot('estado_asignacion')->withTimestamps();
    }

    /**
     * Docentes que participan como asesores del proyecto.
     */
    public function docentesAsesores(): BelongsToMany
    {
        return $this->asesores();
    }

    /**
     * Integrantes del jurado asignados al proyecto.
     */
    public function jurados(): HasMany
    {
        return $this->hasMany(JuradoProyecto::class, 'id_proyecto', 'id_proyecto');
    }

    /**
     * Examen profesional programado para el proyecto.
     */
    public function examen(): HasOne
    {
        return $this->hasOne(ExamenProfesional::class, 'id_proyecto', 'id_proyecto');
    }

    /**
     * Indica si el proyecto cuenta con un anteproyecto aprobado.
     */
    public function estaAprobado(): bool
    {
        return in_array($this->estado, self::ESTADOS_APROBADOS, true);
    }

    /**
     * Revisores asignados al proyecto (Relación N:M mediante tblrevisores_proyectos)
     */
    public function revisores(): BelongsToMany
    {
        return $this->belongsToMany(
            Docente::class,
            'tblrevisores_proyectos',
            'id_proyecto',
            'id_usuario',
            'id_proyecto',
            'id_usuario'
        )->withPivot('estado_asignacion')->withTimestamps();
    }

    /**
     * Versiones de tesis entregadas por el alumno para este proyecto
     */
    public function versiones(): HasMany
    {
        return $this->hasMany(VersionTesis::class, 'id_proyecto', 'id_proyecto')->latest();
    }

    /**
     * Accesor para obtener el sustentante principal
     */
    public function getSustentanteAttribute(): ?Alumno
    {
        return $this->alumnos->first();
    }

    /**
     * Accesor para obtener el asesor activo asignado
     */
    public function getAsesorAsignadoAttribute(): ?Docente
    {
        return $this->asesores->first();
    }
}
