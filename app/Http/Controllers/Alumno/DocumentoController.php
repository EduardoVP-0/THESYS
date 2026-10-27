<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Concerns\TransmiteDocumentos;
use App\Models\Admin\OficioExpediente;
use App\Models\Admin\Proyecto;
use App\Models\Admin\VersionTesis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * ENTREGA SEGURA DE DOCUMENTOS AL SUSTENTANTE
 */
class DocumentoController extends AlumnoPortalController
{
    use TransmiteDocumentos;

    /**
     * Descarga el anteproyecto propio.
     */
    public function anteproyecto(Request $request, Proyecto $proyecto): SymfonyResponse
    {
        abort_unless(
            $this->esPropietario($request, $proyecto->id_proyecto),
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
     * Descarga una versión de tesis propia.
     */
    public function version(Request $request, VersionTesis $version): SymfonyResponse
    {
        $proyecto = $version->proyecto;

        abort_unless($proyecto !== null, 404, 'La versión no tiene un proyecto asociado.');

        abort_unless(
            $this->esPropietario($request, $proyecto->id_proyecto),
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
     * Descarga un oficio de expediente propio.
     */
    public function oficio(Request $request, OficioExpediente $oficio): SymfonyResponse
    {
        abort_unless(
            (int) $oficio->id_usuario === (int) $request->user()?->id,
            403,
            'No tienes acceso a este documento de expediente.',
        );

        abort_unless(
            filled($oficio->url_archivo),
            404,
            'El documento no tiene un archivo almacenado.',
        );

        return $this->streamDocumento((string) $oficio->url_archivo, 'oficios');
    }

    /**
     * Comprueba que el alumno autenticado esté vinculado al proyecto.
     */
    private function esPropietario(Request $request, int $idProyecto): bool
    {
        return DB::table('tblalumnos_proyectos')
            ->where('id_proyecto', $idProyecto)
            ->where('id_alumno', (int) $request->user()?->id)
            ->exists();
    }
}
