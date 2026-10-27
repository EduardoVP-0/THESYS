<?php

namespace App\Support\Portal;

use App\Models\Admin\Dictamen;
use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use Illuminate\Support\Facades\DB;

/**
 * REGISTRO DEL VOTO INDIVIDUAL DEL JURADO
 *
 * Centraliza la escritura del dictamen y el recálculo del resultado final del
 * examen cuando los tres integrantes titulares ya emitieron su voto.
 */
class RegistrarVotoJurado
{
    /**
     * Registra o actualiza el voto de un integrante titular del jurado.
     */
    public function registrar(JuradoProyecto $jurado, string $voto, ?string $observaciones): void
    {
        DB::transaction(function () use ($jurado, $voto, $observaciones): void {
            $juradoBloqueado = JuradoProyecto::query()
                ->with('proyecto.examen')
                ->lockForUpdate()
                ->findOrFail($jurado->id_jurado_proyecto);

            Dictamen::query()->updateOrCreate(
                ['id_jurado_proyecto' => $juradoBloqueado->id_jurado_proyecto],
                [
                    'voto' => $voto,
                    'observaciones' => $observaciones,
                ],
            );

            $examen = $juradoBloqueado->proyecto?->examen;

            if ($examen) {
                $this->actualizarResultadoExamen($examen);
            }
        });
    }

    /**
     * Recalcula el resultado final cuando los tres titulares ya votaron.
     */
    private function actualizarResultadoExamen(ExamenProfesional $examen): void
    {
        $jurados = JuradoProyecto::query()
            ->where('id_proyecto', $examen->id_proyecto)
            ->whereIn('cargo', JuradoProyecto::CARGOS_TITULARES)
            ->with('dictamen')
            ->get();

        if (
            $jurados->count() < count(JuradoProyecto::CARGOS_TITULARES)
            || $jurados->contains(fn (JuradoProyecto $jurado): bool => $jurado->dictamen === null)
        ) {
            return;
        }

        $favor = $jurados
            ->filter(fn (JuradoProyecto $jurado): bool => $jurado->dictamen?->voto === Dictamen::VOTO_A_FAVOR)
            ->count();
        $contra = $jurados
            ->filter(fn (JuradoProyecto $jurado): bool => $jurado->dictamen?->voto === Dictamen::VOTO_EN_CONTRA)
            ->count();

        $resultado = match (true) {
            $favor > $contra => $favor === $jurados->count()
                ? ExamenProfesional::RESULTADO_APROBADO
                : ExamenProfesional::RESULTADO_CON_OBSERVACIONES,
            $contra > $favor => ExamenProfesional::RESULTADO_RECHAZADO,
            default => null,
        };

        $examen->update([
            'resultado_final' => $resultado,
            'estado_examen' => ExamenProfesional::ESTADO_REALIZADO,
        ]);
    }
}
