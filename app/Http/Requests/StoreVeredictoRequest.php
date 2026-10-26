<?php

namespace App\Http\Requests;

use App\Models\Admin\Dictamen;
use App\Models\Admin\JuradoProyecto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * VALIDACIÓN PARA REGISTRAR O ACTUALIZAR UN VEREDICTO
 */
class StoreVeredictoRequest extends FormRequest
{
    /**
     * Determina si el usuario autenticado puede ejecutar la acción.
     */
    public function authorize(): bool
    {
        return true;
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
                'exists:tbljurados_proyectos,id_jurado_proyecto',
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
                    $validator->errors()->add(
                        'id_jurado_proyecto',
                        'El integrante del jurado seleccionado no existe.',
                    );

                    return;
                }

                if (! $jurado->esTitular()) {
                    $validator->errors()->add(
                        'id_jurado_proyecto',
                        'Solo los integrantes titulares del jurado pueden emitir el veredicto.',
                    );

                    return;
                }

                $examen = $jurado->proyecto?->examen;

                if (! $examen) {
                    $validator->errors()->add(
                        'id_jurado_proyecto',
                        'El proyecto asociado aún no tiene un examen profesional programado.',
                    );

                    return;
                }

                if (in_array($examen->estado_examen, ['Cancelado', 'Cancelada'], true)) {
                    $validator->errors()->add(
                        'id_jurado_proyecto',
                        'No se puede registrar un veredicto para un examen cancelado.',
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
            'id_jurado_proyecto.required' => 'Selecciona al integrante del jurado que emite el voto.',
            'id_jurado_proyecto.exists' => 'El integrante del jurado seleccionado no existe.',
            'voto.required' => 'Selecciona el sentido del voto.',
            'voto.in' => 'El sentido del voto seleccionado no es válido.',
            'observaciones.max' => 'Las observaciones no deben exceder los 2000 caracteres.',
        ];
    }
}
