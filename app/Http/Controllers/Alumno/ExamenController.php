<?php

namespace App\Http\Controllers\Alumno;

use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\RevisionAsesor;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * INFORMACIÓN DEL EXAMEN PROFESIONAL DEL SUSTENTANTE
 */
class ExamenController extends AlumnoPortalController
{
    /**
     * Muestra la programación del examen y la lista de requisitos.
     */
    public function index(Request $request): Response
    {
        $alumno = $this->alumno($request);
        $proyecto = $alumno
            ? $this->proyecto($alumno, [
                'asesores.user',
                'jurados.docente',
                'jurados.user',
                'examen.sedeRelacionada',
                'versiones.revisiones',
            ])
            : null;

        $examen = $proyecto?->examen;
        $jurados = $proyecto?->jurados ?? collect();
        $asesorActivo = $proyecto?->asesores
            ?->contains(fn ($asesor): bool => $asesor->pivot?->estado_asignacion === 'Activo') ?? false;
        $ultimaVersion = $proyecto?->versiones->first();
        $revisionesUltimaVersion = $ultimaVersion?->revisiones ?? collect();
        $juradosAceptados = $jurados
            ->where('estado_aceptacion', JuradoProyecto::ESTADO_ACEPTADO)
            ->count();
        $juradosTitulares = $jurados
            ->filter(fn (JuradoProyecto $jurado): bool => $jurado->esTitular())
            ->count();

        $requisitos = [
            [
                'titulo' => 'Anteproyecto aprobado',
                'completado' => (bool) $proyecto?->estaAprobado(),
                'detalle' => $proyecto
                    ? 'Estado actual: '.$proyecto->estado
                    : 'Aún no has registrado un anteproyecto.',
            ],
            [
                'titulo' => 'Asesor de tesis asignado',
                'completado' => $asesorActivo,
                'detalle' => $asesorActivo
                    ? 'La coordinación confirmó a tu asesor.'
                    : 'La coordinación debe asignar un asesor activo.',
            ],
            [
                'titulo' => 'Versión de tesis entregada',
                'completado' => $ultimaVersion !== null,
                'detalle' => $ultimaVersion
                    ? 'Última versión: '.$ultimaVersion->numero_version
                    : 'Aún no has subido una versión de tesis.',
            ],
            [
                'titulo' => 'Revisión de tesis sin pendientes',
                'completado' => $revisionesUltimaVersion->isNotEmpty()
                    && ! $revisionesUltimaVersion->contains(
                        fn (RevisionAsesor $revision): bool => $revision->estado_revision === RevisionAsesor::ESTADO_PENDIENTE,
                    ),
                'detalle' => $revisionesUltimaVersion->isEmpty()
                    ? 'No hay revisiones registradas para la última versión.'
                    : 'Revisiones registradas: '.$revisionesUltimaVersion->count(),
            ],
            [
                'titulo' => 'Jurado completo',
                'completado' => $juradosTitulares >= count(JuradoProyecto::CARGOS_TITULARES)
                    && $jurados->count() >= count(JuradoProyecto::CARGOS),
                'detalle' => $jurados->count().' de '.count(JuradoProyecto::CARGOS).' integrantes registrados; '
                    .$juradosAceptados.' aceptaron su participación.',
            ],
            [
                'titulo' => 'Examen programado',
                'completado' => $examen !== null,
                'detalle' => $examen
                    ? 'Fecha: '.CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y')
                    : 'La coordinación aún no programa la fecha del examen.',
            ],
        ];

        $completados = collect($requisitos)->where('completado', true)->count();

        return Inertia::render('alumno/examen/index', [
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
            ] : null,
            'examen' => $examen ? [
                'id_examen' => $examen->id_examen,
                'fecha' => CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y'),
                'fecha_iso' => CarbonImmutable::parse($examen->fecha_examen)->toDateString(),
                'hora' => substr((string) $examen->hora_examen, 0, 5),
                'sede' => $examen->sedeRelacionada?->nombre_sede ?? $examen->sede,
                'direccion' => $examen->sedeRelacionada?->direccion,
                'estado' => $examen->estado_examen,
                'resultado' => $examen->resultado_final,
            ] : null,
            'jurados' => $jurados
                ->sortBy(fn (JuradoProyecto $jurado): int => $this->posicionCargo($jurado->cargo))
                ->map(fn (JuradoProyecto $jurado): array => [
                    'cargo' => $jurado->cargo,
                    'nombre_completo' => $jurado->docente?->nombre_completo ?? $jurado->user?->name ?? 'Integrante por definir',
                    'grado_academico' => $jurado->docente?->grado_academico,
                    'estado_aceptacion' => $jurado->estado_aceptacion,
                    'es_titular' => $jurado->esTitular(),
                ])
                ->values()
                ->all(),
            'requisitos' => $requisitos,
            'stats' => [
                'requisitos_completados' => $completados,
                'requisitos_total' => count($requisitos),
                'porcentaje' => (int) round(($completados / count($requisitos)) * 100),
                'estado_examen' => $examen?->estado_examen ?? 'Sin programar',
                'resultado' => $examen?->resultado_final,
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
