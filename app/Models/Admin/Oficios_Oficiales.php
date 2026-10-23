<?php

namespace App\Models\Admin;

use App\Models\User;
use Database\Factories\Admin\OficiosOficialesFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Oficios_Oficiales extends Model
{
    /** @use HasFactory<OficiosOficialesFactory> */
    use HasFactory;

    protected $table = 'tbloficios_oficiales';

    protected $primaryKey = 'id_oficio_oficial';

    protected $fillable = [
        'id_usuario_registro',
        'nombre_oficio',
        'estado',
        'tipo',
        'url_archivo',
    ];

    /**
     * Relación con el usuario administrador que subió/registró este oficio.
     * (Cuando el modelo de administración/usuarios esté 100% completo,
     * se puede hacer ->with('usuario_registro') en el controlador).
     */
    public function usuario_registro()
    {
        return $this->belongsTo(User::class, 'id_usuario_registro');
    }
}
