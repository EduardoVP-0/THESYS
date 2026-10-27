<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Proyecto;
use App\Models\Admin\RevisionAsesor;
use Illuminate\Http\Request;

/**
 * Utilidades compartidas por los controladores del portal del sustentante.
 */
abstract class AlumnoPortalController extends Controller
{
    /**
     * Devuelve el expediente del alumno autenticado.
     */
    protected function alumno(Request $request): ?Alumno
    {
        return Alumno::query()
            ->with(['user', 'carrera'])
            ->find($request->user()?->id);
    }

    /**
     * Devuelve el proyecto activo del alumno con las relaciones solicitadas.
     *
     * @param  array<int, string>  $relaciones
     */
    protected function proyecto(Alumno $alumno, array $relaciones = []): ?Proyecto
    {
        return $alumno->proyectos()
            ->with($relaciones)
            ->latest('tblproyectos.created_at')
            ->first();
    }

    /**
     * Calcula el estado de liberación de la tesis a partir de la última versión.
     */
    protected function estadoLiberacion(?Proyecto $proyecto): string
    {
        if (! $proyecto) {
            return 'Sin anteproyecto';
        }

        $ultimaVersion = $proyecto->versiones->first();

        if (! $ultimaVersion) {
            return 'Sin versión';
        }

        $revisiones = $ultimaVersion->revisiones;

        if ($revisiones->isEmpty()) {
            return 'Sin revisión';
        }

        if ($revisiones->contains(
            fn ($revision): bool => $revision->estado_revision === RevisionAsesor::ESTADO_RECHAZADA,
        )) {
            return 'Rechazada';
        }

        if ($revisiones->contains(
            fn ($revision): bool => $revision->estado_revision === RevisionAsesor::ESTADO_CON_CAMBIOS,
        )) {
            return 'Con cambios';
        }

        if ($revisiones->every(
            fn ($revision): bool => $revision->estado_revision === RevisionAsesor::ESTADO_APROBADA,
        )) {
            return 'Liberada';
        }

        return 'En revisión';
    }
}
