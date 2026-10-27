<?php

namespace App\Http\Controllers\Alumno;

use App\Models\Admin\JuradoProyecto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * JURADO ASIGNADO AL PROYECTO DEL SUSTENTANTE
 */
class JuradoController extends AlumnoPortalController
{
    /**
     * Muestra los integrantes del jurado y su estado de aceptación.
     */
    public function index(Request $request): Response
    {
        $alumno = $this->alumno($request);
        $proyecto = $alumno
            ? $this->proyecto($alumno, [
                'jurados.docente',
                'jurados.user',
                'asesores.user',
                'examen',
            ])
            : null;

        $jurados = $proyecto?->jurados ?? collect();
        $ordenados = $jurados
            ->sortBy(fn (JuradoProyecto $jurado): int => $this->posicionCargo($jurado->cargo))
            ->values();

        return Inertia::render('alumno/jurado/index', [
            'alumno' => $alumno ? [
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera,
            ] : null,
            'perfil_incompleto' => ! $alumno,
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'estado' => $proyecto->estado,
                'asesor' => $proyecto->asesores->first() ? [
                    'nombre_completo' => $proyecto->asesores->first()->nombre_completo,
                    'grado_academico' => $proyecto->asesores->first()->grado_academico,
                ] : null,
            ] : null,
            'jurados' => $ordenados
                ->map(fn (JuradoProyecto $jurado): array => [
                    'id_jurado_proyecto' => $jurado->id_jurado_proyecto,
                    'cargo' => $jurado->cargo,
                    'es_titular' => $jurado->esTitular(),
                    'nombre_completo' => $jurado->docente?->nombre_completo ?? $jurado->user?->name ?? 'Integrante por definir',
                    'grado_academico' => $jurado->docente?->grado_academico,
                    'especialidad' => $jurado->docente?->especialidad,
                    'email' => $jurado->user?->email,
                    'estado_aceptacion' => $jurado->estado_aceptacion,
                    'fecha_asignacion' => $jurado->created_at?->format('d/m/Y'),
                ])
                ->all(),
            'stats' => [
                'total' => $ordenados->count(),
                'titulares' => $ordenados->filter(fn (JuradoProyecto $jurado): bool => $jurado->esTitular())->count(),
                'aceptados' => $ordenados->where('estado_aceptacion', JuradoProyecto::ESTADO_ACEPTADO)->count(),
                'pendientes' => $ordenados->where('estado_aceptacion', JuradoProyecto::ESTADO_PENDIENTE)->count(),
                'completo' => $ordenados->count() >= count(JuradoProyecto::CARGOS),
            ],
        ]);
    }

    /**
     * Posición del cargo dentro de la estructura del jurado.
     */
    private function posicionCargo(string $cargo): int
    {
        $posicion = array_search($cargo, JuradoProyecto::CARGOS, true);

        return $posicion === false ? count(JuradoProyecto::CARGOS) : $posicion;
    }
}
