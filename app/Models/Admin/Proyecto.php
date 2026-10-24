<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * MODELO DE PROYECTO / ANTEPROYECTO
 * Representa la tabla `tblproyectos` en la base de datos
 */
class Proyecto extends Model
{
    use HasFactory;

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
