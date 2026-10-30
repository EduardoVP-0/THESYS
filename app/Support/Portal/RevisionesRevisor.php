<?php

namespace App\Support\Portal;

/**
 * DICTAMEN DE LOS 2 REVISORES DEL PROYECTO
 *
 * El dictamen individual de cada revisor se guarda en la tabla pivote
 * `tblrevisores_proyectos` en las columnas `estado_revision`
 * ("Pendiente", "Con cambios", "Aprobado"), `comentarios_revision`
 * (comentarios cuando es con cambios) y `fecha_revision`
 * (momento del dictamen). Esta clase concentra las constantes y las reglas
 * de derivación del estado global de ambos revisores.
 */
class RevisionesRevisor
{
    public const ESTADO_PENDIENTE = 'Pendiente';

    public const ESTADO_CON_CAMBIOS = 'Con cambios';

    public const ESTADO_APROBADO = 'Aprobado';

    /**
     * Estados que un revisor puede registrar sobre la versión actual.
     *
     * @var array<int, string>
     */
    public const ESTADOS_VALIDOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_CON_CAMBIOS,
        self::ESTADO_APROBADO,
    ];

    /**
     * Valores de dictamen limpio para reiniciar la revisión de ambos
     * revisores cuando el sustentante sube una nueva versión.
     *
     * @return array{estado_revision: string, comentarios_revision: null, fecha_revision: null}
     */
    public static function valoresPendientes(): array
    {
        return [
            'estado_revision' => self::ESTADO_PENDIENTE,
            'comentarios_revision' => null,
            'fecha_revision' => null,
        ];
    }

    /**
     * Estado global del dictamen con los estados individuales de los
     * revisores:
     * - "Aprobado" solo cuando todos (2) aprobaron.
     * - "Con cambios" en cuanto algún revisor devuelve el documento.
     * - "En revisión" mientras exista una revisión pendiente de dictamen.
     *
     * @param  array<int, string>  $estados
     */
    public static function estadoGlobal(array $estados): string
    {
        if ($estados === []) {
            return 'En revisión';
        }

        $aprobadoPorTodos = collect($estados)->every(
            fn (string $estado): bool => in_array($estado, [self::ESTADO_APROBADO], true),
        );

        if ($aprobadoPorTodos) {
            return 'Aprobado';
        }

        $algunoConCambios = collect($estados)->contains(
            fn (string $estado): bool => $estado === self::ESTADO_CON_CAMBIOS,
        );

        return $algunoConCambios ? 'Con cambios' : 'En revisión';
    }

    /**
     * Etiqueta visual de un estado crudo de revisión (estados no reconocidos
     * se muestran como "En revisión" por seguridad).
     */
    public static function etiqueta(string $estado): string
    {
        return match ($estado) {
            self::ESTADO_APROBADO => 'Aprobado',
            self::ESTADO_CON_CAMBIOS => 'Con cambios',
            default => 'En revisión',
        };
    }

    /**
     * Indica si el texto corresponde a un estado válido guardable.
     */
    public static function esEstadoValido(?string $estado): bool
    {
        return $estado !== null && in_array($estado, self::ESTADOS_VALIDOS, true);
    }
}
