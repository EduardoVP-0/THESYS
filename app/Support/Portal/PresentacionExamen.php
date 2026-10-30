<?php

namespace App\Support\Portal;

use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Support\Str;

/**
 * PRESENTACIÓN DE LA PROGRAMACIÓN DEL EXAMEN PROFESIONAL
 *
 * Convierte los datos almacenados del examen (fecha, hora, estado y
 * resultado) en textos listos para el portal del sustentante: fecha con
 * día de la semana en español, hora corta, cuenta regresiva y claves de
 * color para los badges.
 */
class PresentacionExamen
{
    /**
     * Días de la semana indexados por `dayOfWeek` de Carbon (0 = domingo).
     *
     * @var array<int, string>
     */
    private const DIAS = [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
    ];

    /**
     * Meses del año en español.
     *
     * @var array<int, string>
     */
    private const MESES = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
    ];

    /**
     * Fecha larga con día de la semana: "Viernes 13 de noviembre de 2026".
     */
    public static function fechaLarga(DateTimeInterface|string $fecha): string
    {
        $dia = self::aCarbon($fecha);

        return self::DIAS[$dia->dayOfWeek]
            .' '.$dia->day
            .' de '.self::MESES[$dia->month - 1]
            .' de '.$dia->year;
    }

    /**
     * Fecha sin día de la semana: "13 de noviembre de 2026".
     */
    public static function fechaSinDia(DateTimeInterface|string $fecha): string
    {
        $dia = self::aCarbon($fecha);

        return $dia->day
            .' de '.self::MESES[$dia->month - 1]
            .' de '.$dia->year;
    }

    /**
     * Hora en formato de 24 horas sin segundos: "09:30".
     */
    public static function hora(string $hora): string
    {
        return substr(trim($hora), 0, 5);
    }

    /**
     * Hora lista para mostrar: "09:30 hrs".
     */
    public static function horaLarga(string $hora): string
    {
        return self::hora($hora).' hrs';
    }

    /**
     * Días que faltan para el examen (negativo si la fecha ya pasó).
     */
    public static function diasRestantes(DateTimeInterface|string $fecha): int
    {
        $dia = self::aCarbon($fecha)->startOfDay();

        return (int) CarbonImmutable::today()->startOfDay()->diffInDays($dia, false);
    }

    /**
     * Clave de color del resultado final del examen.
     */
    public static function claveResultado(?string $resultado): ?string
    {
        if ($resultado === null || trim($resultado) === '') {
            return null;
        }

        $normalizado = Str::lower(Str::ascii(trim($resultado)));

        return match (true) {
            str_contains($normalizado, 'observ') => 'observaciones',
            str_contains($normalizado, 'rechaz') => 'rechazado',
            str_contains($normalizado, 'aprob') => 'aprobado',
            default => 'otro',
        };
    }

    /**
     * Clave de color del estado del examen.
     */
    public static function claveEstado(?string $estado): string
    {
        $normalizado = Str::lower(Str::ascii(trim((string) $estado)));

        return match (true) {
            str_contains($normalizado, 'realiz') => 'realizado',
            str_contains($normalizado, 'cancel') => 'cancelado',
            default => 'programado',
        };
    }

    private static function aCarbon(DateTimeInterface|string $fecha): CarbonImmutable
    {
        return $fecha instanceof DateTimeInterface
            ? CarbonImmutable::instance($fecha)
            : CarbonImmutable::parse($fecha);
    }
}
