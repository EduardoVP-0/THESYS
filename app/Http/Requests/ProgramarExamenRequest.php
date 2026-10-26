<?php

namespace App\Http\Requests;

use App\Models\Admin\ExamenProfesional;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use App\Models\Admin\Sede;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * VALIDACIÓN PARA PROGRAMAR EL EXAMEN PROFESIONAL DE UN PROYECTO
 */
class ProgramarExamenRequest extends FormRequest
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
            'id_proyecto' => ['required', 'integer', 'exists:tblproyectos,id_proyecto'],
            'fecha_examen' => ['required', 'date_format:Y-m-d'],
            'hora_examen' => ['required', 'date_format:H:i'],
            'id_sede' => ['required', 'integer', 'exists:tblsedes,id_sede'],
        ];
    }

    /**
     * Reglas de negocio que dependen del proyecto, la sede y el calendario.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $campos = ['id_proyecto', 'fecha_examen', 'hora_examen', 'id_sede'];

                if ($validator->errors()->hasAny($campos)) {
                    return;
                }

                $proyecto = Proyecto::query()
                    ->with([
                        'jurados:id_usuario,id_proyecto,cargo',
                        'examen:id_examen,id_proyecto',
                    ])
                    ->find($this->integer('id_proyecto'));

                if (! $proyecto) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'El proyecto seleccionado no existe.',
                    );

                    return;
                }

                if ($proyecto->examen) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'Este proyecto ya tiene un examen profesional programado.',
                    );

                    return;
                }

                $cargosRegistrados = $proyecto->jurados
                    ->pluck('cargo')
                    ->unique()
                    ->all();
                $docentesDistintos = $proyecto->jurados
                    ->pluck('id_usuario')
                    ->unique()
                    ->count();

                if (
                    count(array_intersect(JuradoProyecto::CARGOS, $cargosRegistrados)) !== count(JuradoProyecto::CARGOS)
                    || $docentesDistintos < count(JuradoProyecto::CARGOS)
                ) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'RN-04: completa los cinco puestos titulares y suplentes del jurado antes de programar el examen.',
                    );

                    return;
                }

                $sedeActiva = Sede::query()
                    ->whereKey($this->integer('id_sede'))
                    ->where('estado', true)
                    ->exists();

                if (! $sedeActiva) {
                    $validator->errors()->add(
                        'id_sede',
                        'La sede seleccionada no está activa.',
                    );
                }

                $fecha = CarbonImmutable::parse($this->string('fecha_examen')->toString());

                if ($fecha->lt(CarbonImmutable::today())) {
                    $validator->errors()->add(
                        'fecha_examen',
                        'La fecha del examen no puede ser anterior a hoy.',
                    );

                    return;
                }

                if ($motivo = ExamenProfesional::motivoDiaInhabil($fecha->toDateString())) {
                    $validator->errors()->add(
                        'fecha_examen',
                        "La fecha seleccionada no está disponible: {$motivo}.",
                    );

                    return;
                }

                if (ExamenProfesional::fechaOcupada($fecha->toDateString())) {
                    $validator->errors()->add(
                        'fecha_examen',
                        'La fecha seleccionada ya está ocupada por otro examen profesional.',
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
            'id_proyecto.required' => 'Selecciona un proyecto de tesis.',
            'id_proyecto.exists' => 'El proyecto seleccionado no existe.',
            'fecha_examen.required' => 'Selecciona la fecha del examen desde el calendario.',
            'fecha_examen.date_format' => 'La fecha seleccionada no tiene un formato válido.',
            'hora_examen.required' => 'Selecciona la hora del examen.',
            'hora_examen.date_format' => 'La hora seleccionada no tiene un formato válido.',
            'id_sede.required' => 'Selecciona la sede del examen.',
            'id_sede.exists' => 'La sede seleccionada no existe.',
        ];
    }
}
