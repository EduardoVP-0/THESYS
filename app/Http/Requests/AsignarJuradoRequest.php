<?php

namespace App\Http\Requests;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Docente;
use App\Models\Admin\JuradoProyecto;
use App\Models\Admin\Proyecto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * VALIDACIÓN PARA ASIGNAR EL JURADO DE UN PROYECTO DE TESIS
 */
class AsignarJuradoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_proyecto' => ['required', 'integer', 'exists:tblproyectos,id_proyecto'],
            'presidente' => ['required', 'integer', 'exists:tbldocentes,id_usuario'],
            'secretario' => ['required', 'integer', 'exists:tbldocentes,id_usuario'],
            'vocal' => ['required', 'integer', 'exists:tbldocentes,id_usuario'],
            'suplente_1' => ['required', 'integer', 'exists:tbldocentes,id_usuario'],
            'suplente_2' => ['required', 'integer', 'exists:tbldocentes,id_usuario'],
        ];
    }

    /**
     * Valida las reglas de negocio que dependen de los registros relacionados.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $campos = array_keys(JuradoProyecto::CAMPOS_CARGOS);

                if ($validator->errors()->hasAny(array_merge(['id_proyecto'], $campos))) {
                    return;
                }

                $idProyecto = $this->integer('id_proyecto');

                $proyecto = Proyecto::query()
                    ->with([
                        'alumnos:id_usuario',
                        'docentesAsesores' => function ($query): void {
                            $query->where(
                                'tblasesores_proyectos.estado_asignacion',
                                AsignacionAsesor::ESTADO_ACTIVO,
                            );
                        },
                    ])
                    ->find($idProyecto);

                if (! $proyecto) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'El proyecto seleccionado no existe.',
                    );

                    return;
                }

                if ($proyecto->docentesAsesores->isEmpty()) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'El proyecto debe tener un asesor activo antes de asignar el jurado.',
                    );

                    return;
                }

                if (JuradoProyecto::query()->where('id_proyecto', $idProyecto)->exists()) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'Este proyecto ya tiene un jurado asignado.',
                    );

                    return;
                }

                $idsSeleccionados = collect($campos)
                    ->map(fn (string $campo): int => $this->integer($campo))
                    ->all();

                $idsDuplicados = array_keys(array_filter(
                    array_count_values($idsSeleccionados),
                    fn (int $total): bool => $total > 1,
                ));

                if ($idsDuplicados !== []) {
                    foreach ($campos as $campo) {
                        if (in_array($this->integer($campo), $idsDuplicados, true)) {
                            $validator->errors()->add(
                                $campo,
                                'Cada puesto del jurado debe ocuparlo una persona distinta.',
                            );
                        }
                    }
                }

                $docentes = Docente::query()
                    ->with('user:id,estado')
                    ->whereIn('id_usuario', $idsSeleccionados)
                    ->get()
                    ->keyBy('id_usuario');

                foreach ($campos as $campo) {
                    $docente = $docentes->get($this->integer($campo));

                    if (! $docente || ! $docente->estado || ! $docente->user?->estado) {
                        $validator->errors()->add(
                            $campo,
                            'El docente seleccionado no está activo en el sistema.',
                        );
                    }
                }

                $sustentantes = $proyecto->alumnos->pluck('id_usuario');
                $asesores = $proyecto->docentesAsesores->pluck('id_usuario');

                foreach ($campos as $campo) {
                    if ($sustentantes->contains($this->integer($campo))) {
                        $validator->errors()->add(
                            $campo,
                            'El sustentante no puede integrar el jurado.',
                        );
                    }
                }

                if ($asesores->contains($this->integer('presidente'))) {
                    $validator->errors()->add(
                        'presidente',
                        'El asesor asignado no puede ocupar la presidencia del jurado.',
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
            'presidente.required' => 'Selecciona al presidente del jurado.',
            'presidente.exists' => 'El presidente seleccionado no existe.',
            'secretario.required' => 'Selecciona al secretario del jurado.',
            'secretario.exists' => 'El secretario seleccionado no existe.',
            'vocal.required' => 'Selecciona al vocal del jurado.',
            'vocal.exists' => 'El vocal seleccionado no existe.',
            'suplente_1.required' => 'Selecciona al primer suplente del jurado.',
            'suplente_1.exists' => 'El primer suplente seleccionado no existe.',
            'suplente_2.required' => 'Selecciona al segundo suplente del jurado.',
            'suplente_2.exists' => 'El segundo suplente seleccionado no existe.',
        ];
    }
}
