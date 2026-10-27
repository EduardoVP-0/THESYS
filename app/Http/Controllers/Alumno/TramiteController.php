<?php

namespace App\Http\Controllers\Alumno;

use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Pago;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * TRÁMITES, PAGOS Y DOCUMENTOS DEL EXPEDIENTE
 */
class TramiteController extends AlumnoPortalController
{
    /**
     * Muestra el estado de los pagos, oficios y requisitos del expediente.
     */
    public function index(Request $request): Response
    {
        $alumno = $this->alumno($request);

        if ($alumno) {
            $alumno->loadMissing(['pagos', 'oficiosExpediente']);
        }

        $proyecto = $alumno
            ? $this->proyecto($alumno, ['asesores', 'jurados', 'examen', 'versiones'])
            : null;

        $pagos = $alumno?->pagos ?? collect();
        $oficios = $alumno?->oficiosExpediente ?? collect();
        $asesorActivo = $proyecto?->asesores
            ?->contains(fn ($asesor): bool => $asesor->pivot?->estado_asignacion === 'Activo') ?? false;
        $jurados = $proyecto?->jurados ?? collect();
        $pagosValidados = $pagos->where('estado_validacion', 'Validado')->count();
        $pagosPendientes = $pagos->where('estado_validacion', 'Pendiente')->count();

        $requisitos = [
            [
                'titulo' => 'Anteproyecto aprobado',
                'completado' => (bool) $proyecto?->estaAprobado(),
                'detalle' => $proyecto ? 'Estado: '.$proyecto->estado : 'Sin anteproyecto registrado.',
            ],
            [
                'titulo' => 'Asesor asignado',
                'completado' => $asesorActivo,
                'detalle' => $asesorActivo ? 'Asesor activo confirmado.' : 'Pendiente de asignación por coordinación.',
            ],
            [
                'titulo' => 'Versión de tesis entregada',
                'completado' => ($proyecto?->versiones->count() ?? 0) > 0,
                'detalle' => ($proyecto?->versiones->count() ?? 0).' versión(es) registrada(s).',
            ],
            [
                'titulo' => 'Jurado completo',
                'completado' => $jurados->count() >= count(JuradoProyecto::CARGOS),
                'detalle' => $jurados->count().' de '.count(JuradoProyecto::CARGOS).' integrantes registrados.',
            ],
            [
                'titulo' => 'Examen programado',
                'completado' => $proyecto?->examen !== null,
                'detalle' => $proyecto?->examen
                    ? 'Examen: '.$proyecto->examen->estado_examen
                    : 'Sin fecha programada.',
            ],
            [
                'titulo' => 'Pagos de derechos validados',
                'completado' => $pagos->isNotEmpty() && $pagos->every(
                    fn (Pago $pago): bool => $pago->estado_validacion === 'Validado',
                ),
                'detalle' => $pagosValidados.' de '.$pagos->count().' pagos validados.',
            ],
            [
                'titulo' => 'Documentos de expediente',
                'completado' => $oficios->isNotEmpty(),
                'detalle' => $oficios->count().' documento(s) disponibles.',
            ],
        ];

        $completados = collect($requisitos)->where('completado', true)->count();

        $tramites = collect()
            ->merge($pagos->map(fn (Pago $pago): array => [
                'id' => 'pago-'.$pago->id_pago,
                'tipo' => 'pago',
                'titulo' => $pago->concepto,
                'detalle' => $pago->referencia_bancaria
                    ? 'Referencia: '.$pago->referencia_bancaria
                    : 'Sin referencia bancaria',
                'estado' => $pago->estado_validacion,
                'monto' => (float) $pago->monto,
                'fecha' => $pago->created_at?->format('d/m/Y H:i'),
                'url_documento' => null,
            ]))
            ->merge($oficios->map(fn ($oficio): array => [
                'id' => 'oficio-'.$oficio->id_oficio,
                'tipo' => 'oficio',
                'titulo' => $oficio->tipo_oficio,
                'detalle' => basename((string) $oficio->url_archivo),
                'estado' => 'Disponible',
                'monto' => null,
                'fecha' => $oficio->created_at?->format('d/m/Y H:i'),
                'url_documento' => route('alumno.documentos.oficio', $oficio->id_oficio),
            ]))
            ->sortByDesc('fecha')
            ->values()
            ->all();

        return Inertia::render('alumno/tramites/index', [
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
            'tramites' => $tramites,
            'requisitos' => $requisitos,
            'stats' => [
                'total_tramites' => count($tramites),
                'pagos' => $pagos->count(),
                'pagos_validados' => $pagosValidados,
                'pagos_pendientes' => $pagosPendientes,
                'monto_validado' => (float) $pagos
                    ->where('estado_validacion', 'Validado')
                    ->sum('monto'),
                'oficios' => $oficios->count(),
                'requisitos_completados' => $completados,
                'requisitos_total' => count($requisitos),
                'porcentaje' => (int) round(($completados / count($requisitos)) * 100),
            ],
            'nota' => 'La lista de requisitos se calcula con los registros reales del expediente. Los pagos y oficios son administrados por la coordinación.',
        ]);
    }
}
