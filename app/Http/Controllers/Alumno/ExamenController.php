<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Dictamen;
use App\Models\Admin\Docente;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\RevisionAsesor;
use App\Support\Portal\FlujoRevisionTesis;
use App\Support\Portal\PresentacionExamen;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE MIS EXÁMENES (PORTAL DEL SUSTENTANTE)
 *
 * Muestra la programación del examen profesional asignada por la
 * coordinación: fecha con día de la semana, hora, sede, estado, resultado
 * y jurado evaluador. Cuando el examen aún no está programado, presenta el
 * avance de los requisitos previos.
 */
class ExamenController extends Controller
{
    /**
     * Muestra la programación del examen profesional del sustentante.
     */
    public function index(Request $request): Response
    {
        $alumno = Alumno::with('carrera')->find($request->user()->id);

        $proyecto = $alumno
            ? $alumno->proyectos()
                ->with([
                    'alumnos',
                    'docentesAsesores' => function ($query): void {
                        $query
                            ->where(
                                'tblasesores_proyectos.estado_asignacion',
                                AsignacionAsesor::ESTADO_ACTIVO,
                            )
                            ->with('user:id,email');
                    },
                    'jurados' => function ($query): void {
                        $query
                            ->with([
                                'dictamen',
                                'docente.user:id,email',
                                'user:id,name,email',
                            ])
                            ->orderBy('id_jurado_proyecto');
                    },
                    'examen.sedeRelacionada',
                ])
                ->latest('tblproyectos.id_proyecto')
                ->first()
            : null;

        $jurados = $proyecto
            ? $this->ordenarJurado($proyecto->jurados)
            : collect();

        $juradoData = $jurados
            ->map(fn (JuradoProyecto $miembro): array => $this->transformarJurado($miembro))
            ->values()
            ->all();

        $votos = $this->resumenVotos($jurados);

        return Inertia::render('Alumno/examen/index', [
            'alumno' => $alumno ? [
                'id_usuario' => $alumno->id_usuario,
                'nombre_completo' => $alumno->nombre_completo,
                'iniciales' => $alumno->iniciales,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera ?? 'Sin carrera asignada',
            ] : null,
            'proyecto' => $proyecto ? [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'resumen' => $proyecto->resumen,
                'estado' => $proyecto->estado,
                'sustentantes' => $proyecto->alumnos
                    ->map(fn (Alumno $sustentante): array => [
                        'id_usuario' => $sustentante->id_usuario,
                        'nombre_completo' => $sustentante->nombre_completo,
                        'iniciales' => $sustentante->iniciales,
                        'matricula' => $sustentante->matricula,
                    ])
                    ->values()
                    ->all(),
                'asesores' => $proyecto->docentesAsesores
                    ->map(fn (Docente $docente): array => [
                        'nombre_completo' => $docente->nombre_completo,
                        'iniciales' => $docente->iniciales,
                        'grado_academico' => $docente->grado_academico,
                        'abreviatura_grado' => $docente->abreviatura_grado,
                        'email' => $docente->user?->email,
                    ])
                    ->values()
                    ->all(),
            ] : null,
            'examen' => $proyecto?->examen
                ? $this->transformarExamen($proyecto->examen, $votos)
                : null,
            'jurado' => $juradoData,
            'requisitos' => $proyecto ? $this->requisitos($proyecto->id_proyecto, $jurados) : null,
        ]);
    }

    /**
     * Representa la programación del examen con fecha, hora, sede y votos.
     *
     * @param  array<string, int|string>  $votos
     * @return array<string, mixed>
     */
    private function transformarExamen(
        ExamenProfesional $examen,
        array $votos,
    ): array {
        $fecha = CarbonImmutable::parse($examen->fecha_examen);

        return [
            'id_examen' => $examen->id_examen,
            'fecha' => $fecha->format('d/m/Y'),
            'fecha_iso' => $fecha->toDateString(),
            'fecha_larga' => PresentacionExamen::fechaLarga($fecha),
            'hora' => PresentacionExamen::hora((string) $examen->hora_examen),
            'hora_larga' => PresentacionExamen::horaLarga((string) $examen->hora_examen),
            'sede' => $examen->sedeRelacionada?->nombre_sede ?? $examen->sede,
            'sede_direccion' => $examen->sedeRelacionada?->direccion,
            'estado_examen' => $examen->estado_examen,
            'estado_key' => PresentacionExamen::claveEstado($examen->estado_examen),
            'resultado_final' => $examen->resultado_final,
            'resultado_key' => PresentacionExamen::claveResultado($examen->resultado_final),
            'dias_restantes' => PresentacionExamen::diasRestantes($fecha),
            'votos' => $votos,
        ];
    }

    /**
     * Requisitos previos que la coordinación revisa antes de programar el
     * examen: aprobación del director, de los revisores y jurado completo.
     *
     * @param  Collection<int, JuradoProyecto>  $jurados
     * @return array<string, bool|int>
     */
    private function requisitos(int $idProyecto, Collection $jurados): array
    {
        $estadoAsesor = FlujoRevisionTesis::estadoAsesor($idProyecto);
        $estadoRevisores = FlujoRevisionTesis::estadoRevisores($idProyecto);

        $directorAprobo = in_array(
            $estadoAsesor['estado'],
            [RevisionAsesor::ESTADO_APROBADA, 'Aprobado'],
            true,
        );
        $revisoresAprobaron = $estadoRevisores['global'] === 'Aprobado';
        $juradoCompleto = $this->juradoCompleto($jurados);

        return [
            'director_aprobo' => $directorAprobo,
            'revisores_aprobaron' => $revisoresAprobaron,
            'jurado_completo' => $juradoCompleto,
            'jurado_asignados' => $jurados->count(),
            'revisores_asignados' => count($estadoRevisores['estados']),
            'listo' => $directorAprobo && $revisoresAprobaron && $juradoCompleto,
        ];
    }

    /**
     * Ordena a los integrantes del jurado conforme al orden oficial.
     *
     * @param  Collection<int, JuradoProyecto>  $jurados
     * @return Collection<int, JuradoProyecto>
     */
    private function ordenarJurado(Collection $jurados): Collection
    {
        return $jurados
            ->sortBy(function (JuradoProyecto $miembro): int {
                $posicion = array_search($miembro->cargo, JuradoProyecto::CARGOS, true);

                return $posicion === false ? count(JuradoProyecto::CARGOS) : $posicion;
            })
            ->values();
    }

    /**
     * Representa a un integrante del jurado con su dictamen (si existe).
     *
     * @return array<string, mixed>
     */
    private function transformarJurado(JuradoProyecto $miembro): array
    {
        $docente = $miembro->docente;

        return [
            'id_jurado_proyecto' => $miembro->id_jurado_proyecto,
            'cargo' => $miembro->cargo,
            'es_titular' => $miembro->esTitular(),
            'estado_aceptacion' => $miembro->estado_aceptacion,
            'voto' => $miembro->dictamen?->voto,
            'observaciones' => $miembro->dictamen?->observaciones,
            'docente' => [
                'id_usuario' => $miembro->id_usuario,
                'nombre_completo' => $docente?->nombre_completo
                    ?? $miembro->user?->name
                    ?? 'Docente no disponible',
                'iniciales' => $docente?->iniciales ?? 'NA',
                'grado_academico' => $docente?->grado_academico ?? 'Académico',
                'abreviatura_grado' => $docente?->abreviatura_grado ?? '',
                'especialidad' => $docente?->especialidad ?? 'Sin especialidad registrada',
                'email' => $docente?->user?->email ?? $miembro->user?->email,
            ],
        ];
    }

    /**
     * Resumen de votos emitidos por los miembros titulares del jurado.
     *
     * @param  Collection<int, JuradoProyecto>  $jurados
     * @return array<string, int|string>
     */
    private function resumenVotos(Collection $jurados): array
    {
        $titulares = $jurados
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->esTitular())
            ->values();

        $favor = $titulares
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->dictamen?->voto === Dictamen::VOTO_A_FAVOR)
            ->count();
        $contra = $titulares
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->dictamen?->voto === Dictamen::VOTO_EN_CONTRA)
            ->count();
        $abstencion = $titulares
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->dictamen?->voto === Dictamen::VOTO_ABSTENCION)
            ->count();
        $emitidos = $titulares
            ->filter(fn (JuradoProyecto $miembro): bool => $miembro->dictamen !== null)
            ->count();

        return [
            'favor' => $favor,
            'contra' => $contra,
            'abstencion' => $abstencion,
            'emitidos' => $emitidos,
            'titulares' => $titulares->count(),
            'resumen' => $emitidos === 0
                ? 'Pendiente'
                : "{$favor} a favor, {$contra} en contra y {$abstencion} en abstención",
        ];
    }

    /**
     * Verifica que los cinco cargos del jurado estén cubiertos por docentes
     * distintos.
     *
     * @param  Collection<int, JuradoProyecto>  $jurados
     */
    private function juradoCompleto(Collection $jurados): bool
    {
        $cargos = $jurados->pluck('cargo')->unique();
        $docentes = $jurados->pluck('id_usuario')->unique();

        return $docentes->count() === count(JuradoProyecto::CARGOS)
            && $cargos->count() === count(JuradoProyecto::CARGOS)
            && collect(JuradoProyecto::CARGOS)->every(
                fn (string $cargo): bool => $cargos->contains($cargo),
            );
    }
}
