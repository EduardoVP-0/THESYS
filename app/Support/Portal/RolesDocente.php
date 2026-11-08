<?php

namespace App\Support\Portal;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\JuradoProyecto;
use Illuminate\Support\Facades\DB;

/**
 * FUNCIONES ACTIVAS DEL DOCENTE
 *
 * Centraliza la detección de las funciones que el docente tiene asignadas
 * en el proceso de titulación. Se comparte entre el dashboard y el
 * calendario para que ambos módulos presenten exactamente los mismos roles.
 */
class RolesDocente
{
    /**
     * Obtiene las funciones activas del docente autenticado.
     *
     * @return array<int, array{clave: string, etiqueta: string, descripcion: string}>
     */
    public static function disponibles(int $userId): array
    {
        $roles = [];

        if (AsignacionAsesor::query()
            ->where('id_usuario', $userId)
            ->whereIn('estado_asignacion', AsignacionAsesor::ESTADOS_VISIBLES_DOCENTE)
            ->exists()) {
            $roles[] = [
                'clave' => 'asesor',
                'etiqueta' => 'Asesor',
                'descripcion' => 'Proyectos donde funges como Director de Tesis.',
            ];
        }

        if (DB::table('tblrevisores_proyectos')
            ->where('id_usuario', $userId)
            ->whereIn('estado_asignacion', ['Activo', 'Finalizado'])
            ->exists()) {
            $roles[] = [
                'clave' => 'revisor',
                'etiqueta' => 'Revisor',
                'descripcion' => 'Documentos que evalúas como parte del comité revisor.',
            ];
        }

        if (JuradoProyecto::query()->where('id_usuario', $userId)->exists()) {
            $roles[] = [
                'clave' => 'jurado',
                'etiqueta' => 'Jurado',
                'descripcion' => 'Designaciones y exámenes profesionales que tienes asignados.',
            ];
        }

        return $roles;
    }
}
