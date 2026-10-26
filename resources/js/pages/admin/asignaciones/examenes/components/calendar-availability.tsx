import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface CalendarAvailabilityProps {
    selectedDate: string;
    fechaMinima: string;
    diasInhabiles: Record<string, string>;
    fechasOcupadas: Record<string, string>;
    onSelectDate: (fecha: string) => void;
    disabled?: boolean;
    disabledMessage?: string;
}

function fechaClave(anio: number, mes: number, dia: number): string {
    return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function parseFecha(fecha: string): Date | null {
    const [anio, mes, dia] = fecha.split('-').map(Number);

    if (!anio || !mes || !dia) {
        return null;
    }

    return new Date(anio, mes - 1, dia);
}

export function CalendarAvailability({
    selectedDate,
    fechaMinima,
    diasInhabiles,
    fechasOcupadas,
    onSelectDate,
    disabled = false,
    disabledMessage,
}: CalendarAvailabilityProps) {
    const fechaBase = parseFecha(selectedDate) ?? parseFecha(fechaMinima);
    const [mes, setMes] = useState<Date>(() => {
        const base = fechaBase ?? new Date();

        return new Date(base.getFullYear(), base.getMonth(), 1);
    });

    useEffect(() => {
        const fechaSeleccionada = parseFecha(selectedDate);

        if (fechaSeleccionada) {
            setMes(
                new Date(
                    fechaSeleccionada.getFullYear(),
                    fechaSeleccionada.getMonth(),
                    1,
                ),
            );
        }
    }, [selectedDate]);

    const fechasNoDisponibles = useMemo(
        () => ({ ...diasInhabiles, ...fechasOcupadas }),
        [diasInhabiles, fechasOcupadas],
    );

    const anio = mes.getFullYear();
    const indiceMes = mes.getMonth();
    const primerDia = new Date(anio, indiceMes, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const diasEnMes = new Date(anio, indiceMes + 1, 0).getDate();
    const celdas: Array<number | null> = [
        ...Array.from({ length: desplazamiento }, () => null),
        ...Array.from({ length: diasEnMes }, (_, indice) => indice + 1),
    ];

    while (celdas.length % 7 !== 0) {
        celdas.push(null);
    }

    const cambiarMes = (delta: number) => {
        setMes(new Date(anio, indiceMes + delta, 1));
    };

    const irAHoy = () => {
        const hoy = parseFecha(fechaMinima) ?? new Date();
        setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground capitalize">
                    {mes.toLocaleDateString('es-MX', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </p>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7 rounded-md border-border bg-background"
                        onClick={() => cambiarMes(-1)}
                        aria-label="Mes anterior"
                    >
                        <ChevronLeft className="size-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={irAHoy}
                    >
                        Hoy
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7 rounded-md border-border bg-background"
                        onClick={() => cambiarMes(1)}
                        aria-label="Mes siguiente"
                    >
                        <ChevronRight className="size-3.5" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {DIAS_SEMANA.map((dia) => (
                    <span
                        key={dia}
                        className="py-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                        {dia}
                    </span>
                ))}

                {celdas.map((dia, indice) => {
                    if (dia === null) {
                        return (
                            <span key={`vacio-${indice}`} aria-hidden="true" />
                        );
                    }

                    const fecha = new Date(anio, indiceMes, dia);
                    const clave = fechaClave(anio, indiceMes, dia);
                    const motivoCalendario = fechasNoDisponibles[clave];
                    const fechaPasada = clave < fechaMinima;
                    const finDeSemana =
                        fecha.getDay() === 0 || fecha.getDay() === 6;
                    const motivo = fechaPasada
                        ? 'La fecha ya pasó'
                        : (motivoCalendario ??
                          (finDeSemana
                              ? fecha.getDay() === 6
                                  ? 'Sábado'
                                  : 'Domingo'
                              : null));
                    const noDisponible = Boolean(motivo) || disabled;
                    const seleccionada = selectedDate === clave;
                    const esHoy = clave === fechaMinima;

                    return (
                        <button
                            key={clave}
                            type="button"
                            onClick={() => onSelectDate(clave)}
                            disabled={noDisponible}
                            aria-pressed={seleccionada}
                            aria-label={`${dia} de ${mes.toLocaleDateString(
                                'es-MX',
                                { month: 'long' },
                            )}${motivo ? `, no disponible: ${motivo}` : ''}`}
                            title={
                                motivo
                                    ? `No disponible: ${motivo}`
                                    : 'Seleccionar fecha'
                            }
                            className={cn(
                                'relative flex h-9 flex-col items-center justify-center rounded-md text-xs transition-colors',
                                seleccionada
                                    ? 'bg-[#10B981] font-bold text-white shadow-xs'
                                    : noDisponible
                                      ? 'cursor-not-allowed text-muted-foreground/35'
                                      : 'text-foreground hover:bg-accent/40',
                                esHoy &&
                                    !seleccionada &&
                                    !noDisponible &&
                                    'ring-1 ring-[#10B981]/60',
                            )}
                        >
                            {dia}
                            {motivoCalendario && !seleccionada && (
                                <span className="absolute bottom-1 size-1 rounded-full bg-amber-500/70" />
                            )}
                        </button>
                    );
                })}
            </div>

            {disabled && disabledMessage && (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 px-2.5 py-2 text-[11px] text-muted-foreground">
                    {disabledMessage}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-[#10B981]" />
                    Seleccionada
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm border border-border bg-background" />
                    Disponible
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-muted" />
                    No disponible
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-amber-500/70" />
                    Inhábil u ocupada
                </span>
            </div>
        </div>
    );
}
