<?php

namespace App\Http\Requests;

use App\Models\Admin\AsignacionAsesor;
use App\Models\Admin\Docente;
use App\Models\Admin\Proyecto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

/**
 * VALIDACIÓN PARA ASIGNAR UN ASESOR A UN ANTEPROYECTO
 */
class AsignarAsesorRequest extends FormRequest
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
            'id_alumno' => ['required', 'integer', 'exists:tblalumnos,id_usuario'],
            'id_proyecto' => ['required', 'integer', 'exists:tblproyectos,id_proyecto'],
            'id_asesor' => ['required', 'integer', 'exists:tbldocentes,id_usuario'],
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
                if ($validator->errors()->hasAny(['id_alumno', 'id_proyecto', 'id_asesor'])) {
                    return;
                }

                $idAlumno = $this->integer('id_alumno');
                $idProyecto = $this->integer('id_proyecto');
                $idAsesor = $this->integer('id_asesor');

                $proyecto = Proyecto::query()->find($idProyecto);

                if (! $proyecto || ! $proyecto->estaAprobado()) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'El anteproyecto debe estar aprobado para asignarle un asesor.',
                    );

                    return;
                }

                $perteneceAlAlumno = DB::table('tblalumnos_proyectos')
                    ->where('id_alumno', $idAlumno)
                    ->where('id_proyecto', $idProyecto)
                    ->exists();

                if (! $perteneceAlAlumno) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'El anteproyecto no pertenece al sustentante seleccionado.',
                    );

                    return;
                }

                $tieneAsesorActivo = AsignacionAsesor::query()
                    ->where('id_proyecto', $idProyecto)
                    ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                    ->exists();

                if ($tieneAsesorActivo) {
                    $validator->errors()->add(
                        'id_proyecto',
                        'Este anteproyecto ya cuenta con un asesor asignado.',
                    );

                    return;
                }

                $docente = Docente::query()
                    ->with('user:id,estado')
                    ->find($idAsesor);

                if (! $docente || ! $docente->estado || ! $docente->user?->estado) {
                    $validator->errors()->add(
                        'id_asesor',
                        'El asesor seleccionado no está activo en el sistema.',
                    );

                    return;
                }

                $cargaActual = AsignacionAsesor::query()
                    ->where('id_usuario', $docente->id_usuario)
                    ->where('estado_asignacion', AsignacionAsesor::ESTADO_ACTIVO)
                    ->count();

                if ($cargaActual >= AsignacionAsesor::MAX_PROYECTOS_ACTIVOS_POR_ASESOR) {
                    $validator->errors()->add(
                        'id_asesor',
                        'El asesor seleccionado alcanzó su carga académica máxima.',
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
            'id_alumno.required' => 'Selecciona un sustentante.',
            'id_alumno.exists' => 'El sustentante seleccionado no existe.',
            'id_proyecto.required' => 'Selecciona un anteproyecto.',
            'id_proyecto.exists' => 'El anteproyecto seleccionado no existe.',
            'id_asesor.required' => 'Selecciona un asesor.',
            'id_asesor.exists' => 'El asesor seleccionado no existe.',
        ];
    }
}
