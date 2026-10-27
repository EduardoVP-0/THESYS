<?php

namespace App\Http\Requests;

use App\Models\Admin\Dictamen;
use App\Models\Admin\JuradoProyecto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * VALIDACIÓN DEL VOTO EMITIDO POR UN INTEGRANTE DEL JURADO
 */
class StoreVotoJuradoRequest extends FormRequest
{
    /**
     * Solo los docentes pueden emitir votos.
     */
    public function authorize(): bool
    {
        return (int) $this->user()?->id_rol === 4;
    }

    /**
     * Reglas básicas del formulario.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_jurado_proyecto' => [
                'required',
                'integer',
                Rule::exists('tbljurados_proyectos', 'id_jurado_proyecto')
                    ->where(fn ($query) => $query->where('id_usuario', $this->user()->id)),
            ],
            'voto' => ['required', 'string', Rule::in(Dictamen::VOTOS)],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Reglas que dependen del proyecto y del examen programado.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['id_jurado_proyecto', 'voto'])) {
                    return;
                }

                $jurado = JuradoProyecto::query()
                    ->with(['proyecto.examen:id_examen,id_proyecto,estado_examen'])
                    ->find($this->integer('id_jurado_proyecto'));

                if (! $jurado) {
                    return;
                }

                if (! $jurado->esTitular()) {
                    $validator->errors()->add(
                        'id_jurado_proyecto',
                        'Solo los integrantes titulares del jurado pueden emitir el voto.',
                    );

                    return;
                }

                $examen = $jurado->proyecto?->examen;

                if (! $examen) {
                    $validator->errors()->add(
                        'id_jurado_proyecto',
                        'El proyecto aún no tiene un examen profesional programado.',
                    );

                    return;
                }

                if (in_array($examen->estado_examen, ['Cancelado', 'Cancelada'], true)) {
                    $validator->errors()->add(
                        'id_jurado_proyecto',
                        'No se puede registrar un voto para un examen cancelado.',
                    );
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_jurado_proyecto.required' => 'Selecciona el proyecto por el que vas a votar.',
            'id_jurado_proyecto.exists' => 'La asignación de jurado seleccionada no te pertenece.',
            'voto.required' => 'Selecciona el sentido de tu voto.',
            'voto.in' => 'El sentido del voto seleccionado no es válido.',
            'observaciones.max' => 'Las observaciones no deben exceder los 2000 caracteres.',
        ];
    }
}
