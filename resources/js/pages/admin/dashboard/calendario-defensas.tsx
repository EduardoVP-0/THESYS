import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DefensaCalendario } from './types';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function fechaClave(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function prefijoMes(year: number, month: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

interface CalendarioDefensasProps {
    defensas: DefensaCalendario[];
}

export function CalendarioDefensas({ defensas }: CalendarioDefensasProps) {
    const hoy = new Date();
    const [mes, setMes] = useState(
        () => new Date(hoy.getFullYear(), hoy.getMonth(), 1),
    );
    const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(() =>
        fechaClave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()),
    );

    const eventosPorFecha = useMemo(() => {
        return defensas.reduce<Record<string, DefensaCalendario[]>>(
            (acumulado, defensa) => {
                (acumulado[defensa.fecha] ??= []).push(defensa);

                return acumulado;
            },
            {},
        );
    }, [defensas]);

    const year = mes.getFullYear();
    const month = mes.getMonth();
    const primerDia = new Date(year, month, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const celdas: Array<number | null> = [
        ...Array.from({ length: desplazamiento }, () => null),
        ...Array.from({ length: diasEnMes }, (_, index) => index + 1),
    ];

    while (celdas.length % 7 !== 0) {
        celdas.push(null);
    }

    const mesActual = prefijoMes(year, month);
    const eventosDelMes = defensas.filter((defensa) =>
        defensa.fecha.startsWith(mesActual),
    );
    const eventosDelDia = diaSeleccionado
        ? (eventosPorFecha[diaSeleccionado] ?? [])
        : [];

    const cambiarMes = (delta: number) => {
        const nuevoMes = new Date(year, month + delta, 1);
        setMes(nuevoMes);

        const nuevoPrefijo = prefijoMes(
            nuevoMes.getFullYear(),
            nuevoMes.getMonth(),
        );
        const primerEvento = defensas.find((defensa) =>
            defensa.fecha.startsWith(nuevoPrefijo),
        );
        setDiaSeleccionado(primerEvento?.fecha ?? null);
    };

    const irAHoy = () => {
        const actual = new Date();
        setMes(new Date(actual.getFullYear(), actual.getMonth(), 1));
        setDiaSeleccionado(
            fechaClave(
                actual.getFullYear(),
                actual.getMonth(),
                actual.getDate(),
            ),
        );
    };

    return (
        <div className="space-y-3">
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
                        className="py-1 text-[10px] font-semibold text-muted-foreground uppercase"
                    >
                        {dia}
                    </span>
                ))}

                {celdas.map((dia, index) => {
                    if (dia === null) {
                        return (
                            <span key={`vacio-${index}`} aria-hidden="true" />
                        );
                    }

                    const clave = fechaClave(year, month, dia);
                    const eventos = eventosPorFecha[clave] ?? [];
                    const seleccionado = diaSeleccionado === clave;
                    const esHoy =
                        clave ===
                        fechaClave(
                            hoy.getFullYear(),
                            hoy.getMonth(),
                            hoy.getDate(),
                        );

                    return (
                        <button
                            key={clave}
                            type="button"
                            onClick={() => setDiaSeleccionado(clave)}
                            aria-pressed={seleccionado}
                            aria-label={`${dia} de ${mes.toLocaleDateString(
                                'es-MX',
                                { month: 'long' },
                            )}${eventos.length > 0 ? `, ${eventos.length} defensa(s)` : ''}`}
                            className={cn(
                                'relative flex h-8 flex-col items-center justify-center rounded-md text-xs transition-colors',
                                seleccionado
                                    ? 'bg-[#10B981] font-bold text-white'
                                    : 'text-foreground hover:bg-accent/40',
                                esHoy &&
                                    !seleccionado &&
                                    'ring-1 ring-[#10B981]/60',
                            )}
                        >
                            {dia}
                            {eventos.length > 0 && (
                                <span
                                    className={cn(
                                        'absolute bottom-0.5 size-1 rounded-full',
                                        seleccionado
                                            ? 'bg-white'
                                            : 'bg-[#10B981]',
                                    )}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="min-h-[76px] space-y-2 border-t border-border pt-3">
                {eventosDelDia.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                        {eventosDelMes.length === 0
                            ? 'Sin defensas programadas este mes.'
                            : 'Selecciona un día con defensas.'}
                    </p>
                ) : (
                    eventosDelDia.slice(0, 3).map((evento) => (
                        <div
                            key={evento.id_examen}
                            className="space-y-1 rounded-lg border border-border bg-muted/30 p-2.5"
                        >
                            <p
                                className="truncate text-xs font-semibold text-foreground"
                                title={evento.titulo}
                            >
                                {evento.titulo}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                                {evento.estudiante}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {evento.hora}
                                </span>
                                <span className="flex min-w-0 items-center gap-1">
                                    <MapPin className="size-3 shrink-0" />
                                    <span className="truncate">
                                        {evento.sede}
                                    </span>
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {eventosDelDia.length > 3 && (
                    <p className="text-center text-[11px] text-muted-foreground">
                        +{eventosDelDia.length - 3} defensas más
                    </p>
                )}
            </div>
        </div>
    );
}
