<?php

namespace App\Http\Controllers\Asesor;

use App\Http\Controllers\Concerns\TransmiteDocumentos;
use App\Models\Admin\Proyecto;
use App\Models\Admin\VersionTesis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * ENTREGA SEGURA DE DOCUMENTOS AL DOCENTE
 */
class DocumentoController extends AsesorPortalController
{
    use TransmiteDocumentos;

    /**
     * Descarga el anteproyecto de un proyecto en el que participa el docente.
     */
    public function anteproyecto(Request $request, Proyecto $proyecto): SymfonyResponse
    {
        abort_unless(
            $this->tieneAcceso($request, $proyecto->id_proyecto),
            403,
            'No tienes acceso al anteproyecto de este proyecto.',
        );

        abort_unless(
            filled($proyecto->ruta_documento),
            404,
            'El proyecto no tiene un anteproyecto almacenado.',
        );

        return $this->streamDocumento((string) $proyecto->ruta_documento, 'anteproyectos');
    }

    /**
     * Descarga una versión de tesis de un proyecto en el que participa el docente.
     */
    public function version(Request $request, VersionTesis $version): SymfonyResponse
    {
        $proyecto = $version->proyecto;

        abort_unless($proyecto !== null, 404, 'La versión no tiene un proyecto asociado.');

        abort_unless(
            $this->tieneAcceso($request, $proyecto->id_proyecto),
            403,
            'No tienes acceso a esta versión de tesis.',
        );

        abort_unless(
            filled($version->ruta_archivo),
            404,
            'La versión no tiene un archivo almacenado.',
        );

        return $this->streamDocumento((string) $version->ruta_archivo, 'tesis');
    }

    /**
     * Comprueba si el docente es asesor, revisor o jurado activo del proyecto.
     */
    private function tieneAcceso(Request $request, int $idProyecto): bool
    {
        $idUsuario = (int) $request->user()?->id;

        $esAsesor = DB::table('tblasesores_proyectos')
            ->where('id_proyecto', $idProyecto)
            ->where('id_usuario', $idUsuario)
            ->where('estado_asignacion', 'Activo')
            ->exists();

        $esRevisor = DB::table('tblrevisores_proyectos')
            ->where('id_proyecto', $idProyecto)
            ->where('id_usuario', $idUsuario)
            ->where('estado_asignacion', 'Activo')
            ->exists();

        $esJurado = DB::table('tbljurados_proyectos')
            ->where('id_proyecto', $idProyecto)
            ->where('id_usuario', $idUsuario)
            ->exists();

        return $esAsesor || $esRevisor || $esJurado;
    }
}
