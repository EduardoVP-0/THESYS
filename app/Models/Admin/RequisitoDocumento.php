<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * MODELO DE REQUISITO DOCUMENTAL
 * Representa la tabla catálogo `tblrequisitos_documentos`
 */
class RequisitoDocumento extends Model
{
    use HasFactory;

    protected $table = 'tblrequisitos_documentos';

    protected $primaryKey = 'id_requisito';

    protected $fillable = [
        'clave',
        'nombre',
        'descripcion',
        'etapa',
        'es_sistema',
        'es_vinculo_anteproyecto',
        'obligatorio',
        'orden',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'etapa' => 'integer',
            'es_sistema' => 'boolean',
            'es_vinculo_anteproyecto' => 'boolean',
            'obligatorio' => 'boolean',
            'orden' => 'integer',
            'activo' => 'boolean',
        ];
    }

    /**
     * Documentos de expediente asociados a este requisito.
     */
    public function oficiosExpediente(): HasMany
    {
        return $this->hasMany(OficioExpediente::class, 'id_requisito', 'id_requisito');
    }
}
