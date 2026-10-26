<?php

namespace App\Models\Admin;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\Admin\ExamenProfesionalFactory;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MODELO DE EXAMEN PROFESIONAL
 *
 * Representa la programación del examen de titulación. Además de la
 * persistencia, concentra las reglas del calendario de disponibilidad.
 */
class ExamenProfesional extends Model
{
    /** @use HasFactory<ExamenProfesionalFactory> */
    use HasFactory;

    public const ESTADO_PROGRAMADO = 'Programado';

    public const ESTADO_REALIZADO = 'Realizado';

    public const RESULTADO_APROBADO = 'Aprobado';

    public const RESULTADO_CON_OBSERVACIONES = 'Aprobado con observaciones';

    public const RESULTADO_RECHAZADO = 'Rechazado';

    protected $table = 'tblexamenes_profesionales';

    protected $primaryKey = 'id_examen';

    protected $fillable = [
        'id_proyecto',
        'id_sede',
        'fecha_examen',
        'hora_examen',
        'sede',
        'estado_examen',
        'resultado_final',
    ];

    protected $casts = [
        'fecha_examen' => 'date:Y-m-d',
    ];

    /**
     * Proyecto de tesis al que pertenece el examen.
     */
    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }

    /**
     * Sede física donde se realizará el examen.
     */
    public function sedeRelacionada(): BelongsTo
    {
        return $this->belongsTo(Sede::class, 'id_sede', 'id_sede');
    }

    /**
     * Devuelve los días festivos oficiales de un año.
     *
     * @return array<string, string>
     */
    public static function diasFestivos(int $anio): array
    {
        return [
            "{$anio}-01-01" => 'Año Nuevo',
            self::primerLunes($anio, 2)->format('Y-m-d') => 'Día de la Constitución',
            self::tercerLunes($anio, 3)->format('Y-m-d') => 'Natalicio de Benito Juárez',
            "{$anio}-05-01" => 'Día del Trabajo',
            "{$anio}-09-16" => 'Día de la Independencia',
            self::tercerLunes($anio, 11)->format('Y-m-d') => 'Revolución Mexicana',
            "{$anio}-12-25" => 'Navidad',
        ];
    }

    /**
     * Devuelve los días festivos entre dos años, indexados por fecha.
     *
     * @return array<string, string>
     */
    public static function diasFestivosEntre(int $anioInicial, int $anioFinal): array
    {
        $dias = [];

        for ($anio = $anioInicial; $anio <= $anioFinal; $anio++) {
            $dias += self::diasFestivos($anio);
        }

        ksort($dias);

        return $dias;
    }

    /**
     * Indica si una fecha es fin de semana o día festivo.
     */
    public static function motivoDiaInhabil(string $fecha): ?string
    {
        $dia = CarbonImmutable::parse($fecha)->startOfDay();

        if ($dia->isSaturday()) {
            return 'Sábado';
        }

        if ($dia->isSunday()) {
            return 'Domingo';
        }

        return self::diasFestivos((int) $dia->format('Y'))[$dia->format('Y-m-d')] ?? null;
    }

    /**
     * Devuelve las fechas que ya tienen un examen programado.
     *
     * @return array<string, string>
     */
    public static function fechasOcupadasEntre(
        int $anioInicial,
        int $anioFinal,
        ?int $exceptoProyecto = null,
    ): array {
        $fechas = self::query()
            ->whereBetween('fecha_examen', [
                "{$anioInicial}-01-01",
                "{$anioFinal}-12-31",
            ])
            ->when(
                $exceptoProyecto !== null,
                fn ($query) => $query->where('id_proyecto', '!=', $exceptoProyecto),
            )
            ->pluck('fecha_examen')
            ->map(fn (mixed $fecha): string => $fecha instanceof DateTimeInterface
                ? CarbonImmutable::instance($fecha)->format('Y-m-d')
                : CarbonImmutable::parse((string) $fecha)->format('Y-m-d'))
            ->unique()
            ->sort()
            ->values();

        return $fechas
            ->mapWithKeys(fn (string $fecha): array => [
                $fecha => 'Fecha ocupada por otro examen',
            ])
            ->all();
    }

    /**
     * Indica si una fecha ya está ocupada por otro examen.
     */
    public static function fechaOcupada(string $fecha, ?int $exceptoProyecto = null): bool
    {
        return self::query()
            ->whereDate('fecha_examen', $fecha)
            ->when(
                $exceptoProyecto !== null,
                fn ($query) => $query->where('id_proyecto', '!=', $exceptoProyecto),
            )
            ->exists();
    }

    /**
     * Primer lunes del mes indicado.
     */
    private static function primerLunes(int $anio, int $mes): CarbonImmutable
    {
        $fecha = CarbonImmutable::create($anio, $mes, 1)->startOfDay();

        while ($fecha->dayOfWeek !== CarbonInterface::MONDAY) {
            $fecha = $fecha->addDay();
        }

        return $fecha;
    }

    /**
     * Tercer lunes del mes indicado.
     */
    private static function tercerLunes(int $anio, int $mes): CarbonImmutable
    {
        return self::primerLunes($anio, $mes)->addWeeks(2);
    }
}
