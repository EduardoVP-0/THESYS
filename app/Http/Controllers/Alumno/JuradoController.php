<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\JuradoProyecto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE MI JURADO (PORTAL DEL SUSTENTANTE)
 * Permite al alumno consultar la conformacion de su comite para examen de defensa de tesis.
 */
class JuradoController extends Controller
{
    /**
     * Muestra el comite de jurado asignado al proyecto de tesis del sustentante.
     */
    public function index(Request $request): Response
    {
        $alumno = Alumno::with('carrera')->find($request->user()->id);

        $proyecto = $alumno
            ? $alumno->proyectos()
                ->with([
                    'asesores.user',
                    'jurados.docente.user',
                    'jurados.user',
                ])
                ->latest('tblproyectos.id_proyecto')
                ->first()
            : null;

        $proyectoData = null;

        if ($proyecto) {
            $jurados = $proyecto->jurados
                ->sortBy(function (JuradoProyecto $miembro): int {
                    $posicion = array_search($miembro->cargo, JuradoProyecto::CARGOS, true);

                    return $posicion === false ? count(JuradoProyecto::CARGOS) : $posicion;
                })
                ->map(function (JuradoProyecto $miembro): array {
                    $docente = $miembro->docente;

                    return [
                        'id_jurado_proyecto' => $miembro->id_jurado_proyecto,
                        'id_usuario' => $miembro->id_usuario,
                        'cargo' => $miembro->cargo,
                        'es_titular' => $miembro->esTitular(),
                        'estado_aceptacion' => $miembro->estado_aceptacion,
                        'fecha_asignacion' => $miembro->created_at?->format('d/m/Y'),
                        'docente' => [
                            'nombre_completo' => $docente?->nombre_completo
                                ?? $miembro->user?->name
                                ?? 'Docente asignado',
                            'iniciales' => $docente?->iniciales ?? 'SN',
                            'grado_academico' => $docente?->grado_academico ?? 'Académico',
                            'abreviatura_grado' => $docente?->abreviatura_grado ?? '',
                            'especialidad' => $docente?->especialidad ?? 'Sin especialidad registrada',
                            'email' => $docente?->user?->email ?? $miembro->user?->email,
                        ],
                    ];
                })
                ->values()
                ->all();

            $asesor = $proyecto->asesor_asignado;

            $proyectoData = [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'estado' => $proyecto->estado,
                'tiene_jurado' => $jurados !== [],
                'jurados' => $jurados,
                'asesor' => $asesor ? [
                    'nombre_completo' => $asesor->nombre_completo,
                    'iniciales' => $asesor->iniciales,
                    'grado_academico' => $asesor->grado_academico,
                    'abreviatura_grado' => $asesor->abreviatura_grado,
                    'especialidad' => $asesor->especialidad,
                    'email' => $asesor->user?->email,
                ] : null,
            ];
        }

        return Inertia::render('Alumno/jurado/index', [
            'proyecto' => $proyectoData,
            'alumno' => $alumno ? [
                'id_usuario' => $alumno->id_usuario,
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera ?? 'Sin carrera asignada',
            ] : null,
        ]);
    }
}

