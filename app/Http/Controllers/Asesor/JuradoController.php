<?php

namespace App\Http\Controllers\Asesor;

use App\Http\Requests\StoreVotoJuradoRequest;
use App\Models\Admin\Dictamen;
use App\Models\Admin\JuradoProyecto;
use App\Support\Portal\RegistrarVotoJurado;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * MÓDULO DE JURADO DEL PORTAL DOCENTE
 */
class JuradoController extends AsesorPortalController
{
    /**
     * Proyectos en los que el docente fue designado como jurado.
     */
    public function proyectos(Request $request): Response
    {
        $docente = $this->docente($request);

        $jurados = $docente
            ? JuradoProyecto::query()
                ->where('id_usuario', $docente->id_usuario)
                ->with([
                    'proyecto.alumnos.carrera',
                    'proyecto.asesores.user',
                    'proyecto.versiones',
                    'proyecto.examen',
                ])
                ->get()
                ->sortBy(fn (JuradoProyecto $jurado): int => $this->posicionCargo($jurado->cargo))
                ->values()
            : collect();

        $proyectos = $jurados
            ->map(fn (JuradoProyecto $jurado): array => $this->transformarJuradoProyecto($jurado))
            ->all();

        return Inertia::render('asesor/jurado/proyectos', [
            'docente' => $docente ? [
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
            ] : null,
            'perfil_incompleto' => ! $docente,
            'proyectos' => $proyectos,
            'stats' => [
                'total' => count($proyectos),
                'pendientes' => collect($proyectos)->where('estado_aceptacion', JuradoProyecto::ESTADO_PENDIENTE)->count(),
                'aceptados' => collect($proyectos)->where('estado_aceptacion', JuradoProyecto::ESTADO_ACEPTADO)->count(),
                'con_examen' => collect($proyectos)->where('examen.programado', true)->count(),
            ],
            'cargos' => JuradoProyecto::CARGOS,
        ]);
    }

    /**
     * Acepta o rechaza una invitación para integrar el jurado.
     */
    public function actualizarAceptacion(Request $request, JuradoProyecto $jurado): RedirectResponse
    {
        abort_unless(
            (int) $jurado->id_usuario === (int) $request->user()?->id,
            403,
            'No tienes permiso para modificar esta invitación.',
        );

        $validated = $request->validate([
            'estado_aceptacion' => [
                'required',
                'string',
                Rule::in([JuradoProyecto::ESTADO_ACEPTADO, JuradoProyecto::ESTADO_RECHAZADO]),
            ],
        ]);

        if ($jurado->estado_aceptacion !== JuradoProyecto::ESTADO_PENDIENTE) {
            return redirect()
                ->route('asesor.jurado.proyectos.index')
                ->with('error', 'Esta invitación ya fue respondida.');
        }

        $jurado->update(['estado_aceptacion' => $validated['estado_aceptacion']]);

        $mensaje = $validated['estado_aceptacion'] === JuradoProyecto::ESTADO_ACEPTADO
            ? 'Has aceptado la invitación al jurado.'
            : 'Has rechazado la invitación al jurado.';

        return redirect()->route('asesor.jurado.proyectos.index')->with('success', $mensaje);
    }

    /**
     * Muestra los proyectos y exámenes en los que el docente puede votar.
     */
    public function emitir(Request $request): Response
    {
        $docente = $this->docente($request);

        $jurados = $docente
            ? JuradoProyecto::query()
                ->where('id_usuario', $docente->id_usuario)
                ->with([
                    'proyecto.alumnos.carrera',
                    'proyecto.versiones',
                    'proyecto.examen',
                    'dictamen',
                ])
                ->get()
                ->sortBy(fn (JuradoProyecto $jurado): int => $this->posicionCargo($jurado->cargo))
                ->values()
            : collect();

        $asignaciones = $jurados
            ->map(fn (JuradoProyecto $jurado): array => $this->transformarVoto($jurado))
            ->all();

        $elegibles = collect($asignaciones)->where('puede_votar', true);

        return Inertia::render('asesor/votos/emitir', [
            'docente' => $docente ? [
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
            ] : null,
            'perfil_incompleto' => ! $docente,
            'asignaciones' => $asignaciones,
            'stats' => [
                'elegibles' => $elegibles->count(),
                'pendientes' => $elegibles->where('voto', null)->count(),
                'emitidos' => $elegibles->whereNotNull('voto')->count(),
                'sin_examen' => collect($asignaciones)->where('examen.programado', false)->count(),
            ],
            'votos' => Dictamen::VOTOS,
            'filtro_jurado' => $request->integer('jurado') ?: null,
        ]);
    }

    /**
     * Registra el voto del integrante del jurado autenticado.
     */
    public function store(
        StoreVotoJuradoRequest $request,
        RegistrarVotoJurado $registrarVoto,
    ): RedirectResponse {
        $jurado = JuradoProyecto::query()
            ->with('proyecto.examen')
            ->findOrFail($request->integer('id_jurado_proyecto'));

        abort_unless(
            (int) $jurado->id_usuario === (int) $request->user()?->id,
            403,
            'No puedes emitir el voto de otro integrante del jurado.',
        );

        $registrarVoto->registrar(
            $jurado,
            (string) $request->string('voto'),
            $request->filled('observaciones') ? (string) $request->string('observaciones') : null,
        );

        return redirect()
            ->route('asesor.votos.index')
            ->with('success', 'Tu voto se registró correctamente.');
    }

    /**
     * Historial de votos emitidos por el docente.
     */
    public function historial(Request $request): Response
    {
        $docente = $this->docente($request);

        $dictamenes = $docente
            ? Dictamen::query()
                ->whereHas('juradoProyecto', fn ($query) => $query->where('id_usuario', $docente->id_usuario))
                ->with([
                    'juradoProyecto.proyecto.alumnos',
                    'juradoProyecto.proyecto.examen',
                ])
                ->latest('updated_at')
                ->get()
            : collect();

        $votos = $dictamenes
            ->map(fn (Dictamen $dictamen): array => $this->transformarHistorial($dictamen))
            ->all();

        $pendientes = $docente
            ? JuradoProyecto::query()
                ->where('id_usuario', $docente->id_usuario)
                ->whereIn('cargo', JuradoProyecto::CARGOS_TITULARES)
                ->whereHas('proyecto.examen')
                ->whereDoesntHave('dictamen')
                ->count()
            : 0;

        return Inertia::render('asesor/votos/index', [
            'docente' => $docente ? [
                'nombre_completo' => $docente->nombre_completo,
                'grado_academico' => $docente->grado_academico,
            ] : null,
            'perfil_incompleto' => ! $docente,
            'votos' => $votos,
            'stats' => [
                'total' => count($votos),
                'a_favor' => collect($votos)->where('voto', Dictamen::VOTO_A_FAVOR)->count(),
                'en_contra' => collect($votos)->where('voto', Dictamen::VOTO_EN_CONTRA)->count(),
                'abstenciones' => collect($votos)->where('voto', Dictamen::VOTO_ABSTENCION)->count(),
                'pendientes' => $pendientes,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformarJuradoProyecto(JuradoProyecto $jurado): array
    {
        $proyecto = $jurado->proyecto;
        $alumno = $proyecto?->alumnos->first();
        $ultimaVersion = $proyecto?->versiones->first();
        $examen = $proyecto?->examen;

        return [
            'id_jurado_proyecto' => $jurado->id_jurado_proyecto,
            'cargo' => $jurado->cargo,
            'es_titular' => $jurado->esTitular(),
            'estado_aceptacion' => $jurado->estado_aceptacion,
            'fecha_asignacion' => $jurado->created_at?->format('d/m/Y'),
            'proyecto' => [
                'id_proyecto' => $proyecto?->id_proyecto,
                'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
                'resumen' => $proyecto?->resumen,
                'estado' => $proyecto?->estado ?? 'Sin proyecto',
                'estudiante' => [
                    'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                    'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                    'iniciales' => $alumno?->iniciales ?? 'NA',
                    'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera',
                ],
                'asesor' => $proyecto?->asesor_asignado ? [
                    'nombre_completo' => $proyecto->asesor_asignado->nombre_completo,
                    'grado_academico' => $proyecto->asesor_asignado->grado_academico,
                ] : null,
            ],
            'ultima_version' => $ultimaVersion?->numero_version,
            'fecha_ultima_version' => $ultimaVersion?->created_at?->format('d/m/Y'),
            'examen' => [
                'programado' => $examen !== null,
                'fecha' => $examen?->fecha_examen
                    ? CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y')
                    : null,
                'fecha_iso' => $examen?->fecha_examen
                    ? CarbonImmutable::parse($examen->fecha_examen)->toDateString()
                    : null,
                'hora' => substr((string) $examen?->hora_examen, 0, 5),
                'sede' => $examen?->sede,
                'estado' => $examen?->estado_examen,
                'resultado' => $examen?->resultado_final,
            ],
            'url_anteproyecto' => $proyecto
                ? route('asesor.documentos.anteproyecto', $proyecto->id_proyecto)
                : null,
            'url_ultima_version' => $ultimaVersion
                ? route('asesor.documentos.version', $ultimaVersion->id_version)
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformarVoto(JuradoProyecto $jurado): array
    {
        $proyecto = $jurado->proyecto;
        $alumno = $proyecto?->alumnos->first();
        $examen = $proyecto?->examen;

        $puedeVotar = $jurado->esTitular()
            && $jurado->estado_aceptacion !== JuradoProyecto::ESTADO_RECHAZADO
            && $examen !== null
            && ! in_array($examen->estado_examen, ['Cancelado', 'Cancelada'], true);

        return [
            'id_jurado_proyecto' => $jurado->id_jurado_proyecto,
            'cargo' => $jurado->cargo,
            'es_titular' => $jurado->esTitular(),
            'estado_aceptacion' => $jurado->estado_aceptacion,
            'voto' => $jurado->dictamen?->voto,
            'observaciones' => $jurado->dictamen?->observaciones,
            'fecha_voto' => $jurado->dictamen?->updated_at?->format('d/m/Y H:i'),
            'puede_votar' => $puedeVotar,
            'motivo_no_votar' => match (true) {
                ! $jurado->esTitular() => 'Los suplentes no emiten voto en el veredicto.',
                $jurado->estado_aceptacion === JuradoProyecto::ESTADO_RECHAZADO => 'Rechazaste esta invitación al jurado.',
                $examen === null => 'El examen profesional aún no está programado.',
                $examen && in_array($examen->estado_examen, ['Cancelado', 'Cancelada'], true) => 'El examen fue cancelado.',
                default => null,
            },
            'proyecto' => [
                'id_proyecto' => $proyecto?->id_proyecto,
                'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
                'estudiante' => [
                    'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                    'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                    'iniciales' => $alumno?->iniciales ?? 'NA',
                    'carrera' => $alumno?->carrera?->nombre_carrera ?? 'Sin carrera',
                ],
            ],
            'examen' => [
                'programado' => $examen !== null,
                'fecha' => $examen?->fecha_examen
                    ? CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y')
                    : null,
                'hora' => substr((string) $examen?->hora_examen, 0, 5),
                'sede' => $examen?->sede,
                'estado' => $examen?->estado_examen,
                'resultado' => $examen?->resultado_final,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformarHistorial(Dictamen $dictamen): array
    {
        $jurado = $dictamen->juradoProyecto;
        $proyecto = $jurado?->proyecto;
        $alumno = $proyecto?->alumnos->first();
        $examen = $proyecto?->examen;

        return [
            'id_dictamen' => $dictamen->id_dictamen,
            'voto' => $dictamen->voto,
            'observaciones' => $dictamen->observaciones,
            'fecha' => $dictamen->updated_at?->format('d/m/Y H:i'),
            'fecha_orden' => $dictamen->updated_at?->toIso8601String(),
            'cargo' => $jurado?->cargo,
            'titulo' => $proyecto?->titulo ?? 'Proyecto sin título',
            'estudiante' => [
                'nombre_completo' => $alumno?->nombre_completo ?? 'Sustentante no disponible',
                'matricula' => $alumno?->matricula ?? 'Sin matrícula',
                'iniciales' => $alumno?->iniciales ?? 'NA',
            ],
            'examen' => [
                'fecha' => $examen?->fecha_examen
                    ? CarbonImmutable::parse($examen->fecha_examen)->format('d/m/Y')
                    : null,
                'hora' => substr((string) $examen?->hora_examen, 0, 5),
                'sede' => $examen?->sede,
                'estado' => $examen?->estado_examen,
                'resultado' => $examen?->resultado_final,
            ],
        ];
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
