<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConceptoPago extends Model
{
    use HasFactory;

    protected $table = 'tblconceptos_pagos';

    protected $primaryKey = 'id_concepto';

    protected $fillable = [
        'clave',
        'nombre',
        'descripcion',
        'monto',
        'orden',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'float',
            'orden' => 'integer',
            'activo' => 'boolean',
        ];
    }

    /**
     * Relación con los pagos generados a los alumnos
     */
    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'id_concepto', 'id_concepto');
    }
}
