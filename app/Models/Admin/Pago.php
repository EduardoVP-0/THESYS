<?php

namespace App\Models\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Pago extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'tblpagos';

    // Llave primaria de la tabla
    protected $primaryKey = 'id_pago';

    // Campos que se pueden guardar en la base de datos
    protected $fillable = [
        'id_usuario',
        'id_concepto',
        'monto',
        'concepto',
        'referencia_bancaria',
        'metodo_pago',
        'estado_validacion',
        'comentarios',
        'fecha_pago',
    ];

    // Conversión de tipos para que el monto se pueda trabajar como número decimal
    protected function casts(): array
    {
        return [
            'monto' => 'float',
            'fecha_pago' => 'datetime',
        ];
    }

    // Relación entre tablas con usuario que hizo el pago (alumno)
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    // Relación con los datos del alumno (nombre, matricula en tblalumnos)
    public function alumno(): HasOneThrough
    {
        return $this->hasOneThrough(
            Alumno::class,
            User::class,
            // Llave foranea de users
            'id',
            // Llave foranea de alumnos
            'id_usuario',
            // Llave primaria de users
            'id_usuario',
            // Llave primaria de alumnos
            'id'
        );
    }

    // Relación con el concepto original del catálogo
    public function conceptoPago(): BelongsTo
    {
        return $this->belongsTo(ConceptoPago::class, 'id_concepto', 'id_concepto');
    }
}
