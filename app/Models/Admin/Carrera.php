<?php

namespace App\Models\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/* MODELO DE CARRERAS
Representa los programas de la escuela de tecnologias
Gestiona la tabla tblcarreras
*/
class Carrera extends Model
{
    use HasFactory;

    // Se define la tabla al no segur la convencion plural estandar de laravel
    protected $table = 'tblcarreras';

    // Clave personalizada de la tabla
    protected $primaryKey = 'id_carrera';

    // Atributos asignados en masa, pueden ser llenados de forma segura mediante create y update
    protected $fillable = [
        'nombre_carrera',
        'descripcion',
        'duracion_semestres',
        'estado',
        'id_usuario_registro',
    ];

    // Conversión de tipos de datos
    protected $casts = [
        'duracion_semestres' => 'integer',
        'estado' => 'boolean',
    ];

    // Atributos calculados que se van a incluir automaticamente en el JSON/Inertia
    protected $appends = ['clave'];

    /*Accesor para generar la clave visual de carrera (CAR-00001)
    No existe en la base de datos se calcula en la misma interfaz*/

    public function getClaveAttribute(): string
    {
        return 'CAR-'.str_pad((string) $this
            ->id_carrera, 5, '0', STR_PAD_LEFT);
    }

    // Relacion de usuario de administracion que registro la carrera
    public function usuarioRegistro(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario_registro');
    }

    // Relacion de alumnos inscritos a esta carrera
    public function alumnos(): HasMany
    {
        return $this->hasMany(Alumno::class, 'id_carrera', 'id_carrera');
    }
}
