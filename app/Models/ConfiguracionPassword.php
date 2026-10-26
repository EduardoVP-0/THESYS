<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo de Configuración de Políticas de Contraseña
 * Representa la tabla `tblconfiguracion_password`.
 */
class ConfiguracionPassword extends Model
{
    use HasFactory;

    protected $table = 'tblconfiguracion_password';

    protected $primaryKey = 'id_config';

    protected $fillable = [
        'longitud_minima',
        'requiere_mayuscula',
        'requiere_minuscula',
        'requiere_numero',
        'requiere_especiales',
        'caracteres_especiales',
    ];

    protected $casts = [
        'longitud_minima' => 'integer',
        'requiere_mayuscula' => 'boolean',
        'requiere_minuscula' => 'boolean',
        'requiere_numero' => 'boolean',
        'requiere_especiales' => 'boolean',
    ];

    /**
     * Obtiene la configuración activa del sistema o crea la configuración inicial predeterminada.
     */
    public static function getActive(): self
    {
        return static::firstOrCreate([], [
            'longitud_minima' => 8,
            'requiere_mayuscula' => true,
            'requiere_minuscula' => true,
            'requiere_numero' => true,
            'requiere_especiales' => true,
            'caracteres_especiales' => '!@#$%^&*()_+-=[]{}|;:,.<>?',
        ]);
    }
}
