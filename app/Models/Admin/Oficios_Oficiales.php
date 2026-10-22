<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Oficios_Oficiales extends Model
{
    /** @use HasFactory<\Database\Factories\Admin\OficiosOficialesFactory> */
    use HasFactory;

    protected $table = 'tbloficios_oficiales';

    protected $primaryKey = 'id_oficio_oficial';
    
}
