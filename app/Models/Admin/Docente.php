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
        'abreviatura_grado',
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

    public function getAbreviaturaGradoAttribute(): string
    {
        $grado = mb_strtolower(trim($this->grado_academico ?? ''));
        if (str_contains($grado, 'doc') || str_starts_with($grado, 'dr')) {
            return 'Dr.';
        }
        if (str_contains($grado, 'mae') || str_contains($grado, 'mtr') || str_starts_with($grado, 'mt')) {
            return 'Mtro.';
        }
        if (str_contains($grado, 'lic')) {
            return 'Lic.';
        }
        if (str_contains($grado, 'esp')) {
            return 'Especialista';
        }

        return $this->grado_academico ?? '';
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

    /**
     * Proyectos donde el docente participa como asesor
     */
    public function proyectos(): BelongsToMany
    {
        return $this->belongsToMany(
            Proyecto::class,
            'tblasesores_proyectos',
            'id_usuario',
            'id_proyecto',
            'id_usuario',
            'id_proyecto'
        )->withPivot('estado_asignacion')->withTimestamps();
    }

    /**
     * Proyectos donde el docente participa como revisor
     */
    public function proyectosComoRevisor(): BelongsToMany
    {
        return $this->belongsToMany(
            Proyecto::class,
            'tblrevisores_proyectos',
            'id_usuario',
            'id_proyecto',
            'id_usuario',
            'id_proyecto'
        )->withPivot('estado_asignacion')->withTimestamps();
    }
}
