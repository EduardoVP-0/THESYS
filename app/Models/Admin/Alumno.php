<?php

namespace App\Models\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MODELO DE ALUMNO (SUSTENTANTE DE TITULACIÓN)
 * Representa la tabla `tblalumnos` en la base de datos
 *
 * Cada registro en `tblalumnos` comparte llave primaria con la tabla `users` (id_usuario)
 * permitiendo almacenar el expediente académico y datos personales del estudiante
 * mientras que las credenciales de autenticación se gestionan en `users`
 */
class Alumno extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos
     * Sigue la convención del proyecto `tbl...`.
     */
    protected $table = 'tblalumnos';

    /**
     * Llave primaria de la tabla
     * Coincide exactamente con el `id` del usuario en la tabla `users`
     */
    protected $primaryKey = 'id_usuario';

    /**
     * Indica que la llave primaria no es auto-incremental, ya que
     * se asigna manualmente a partir del `id` generado en la tabla `users`
     */
    public $incrementing = false;

    /**
     * Tipo de dato de la llave primaria
     */
    protected $keyType = 'int';

    /**
     * Atributos asignables en masa
     */
    protected $fillable = [
        'id_usuario',
        'id_usuario_registro',
        'id_carrera',
        'nombre',
        'apellido_p',
        'apellido_m',
        'fecha_nacimiento',
        'sexo',
        'curp',
        'telefono',
        'matricula',
        'calle',
        'colonia',
        'codigo_postal',
        'turno',
        'fecha_ingreso',
        'generacion',
        'estado_academico',
    ];

    /**
     * Conversión de tipos de atributos
     */
    protected $casts = [
        'fecha_nacimiento' => 'date:Y-m-d',
        'fecha_ingreso' => 'date:Y-m-d',
    ];

    /**
     * Atributos calculados agregados automáticamente a las respuestas JSON/Inertia
     */
    protected $appends = [
        'nombre_completo',
        'iniciales',
    ];

    /**
     * Accessor para obtener el nombre completo formateado
     * Ejemplo: "Eduardo Velazquez Perez"
     */
    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombre} {$this->apellido_p} {$this->apellido_m}");
    }

    /**
     * Accessor para generar las iniciales del alumno (utilizado en el Avatar del diseño).
     * Ejemplo: "EV"
     */
    public function getInicialesAttribute(): string
    {
        $primera = mb_substr($this->nombre ?? '', 0, 1);
        $segunda = mb_substr($this->apellido_p ?? '', 0, 1);

        return strtoupper("{$primera}{$segunda}");
    }

    /**
     * Relación con la cuenta de usuario en `users` (credenciales y autenticación).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id');
    }

    /**
     * Relación con el programa educativo / carrera (`tblcarreras`).
     */
    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'id_carrera', 'id_carrera');
    }

    /**
     * Relación de auditoría con el usuario administrador que dio de alta al alumno.
     */
    public function usuarioRegistro(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario_registro', 'id');
    }
}
