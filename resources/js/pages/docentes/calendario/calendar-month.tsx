import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { ESTILOS_TONO } from '@/lib/eventos';
import { cn } from '@/lib/utils';

import {
    DIAS_CORTOS,
    etiquetaMes,
    isoDelDia,
    MESES,
} from './date-utils';
import type { EventoCalendario } from './types';

interface Props {
    mes: Date;
    seleccionada: string;
    hoy: string;
    eventosPorFecha: Record<string, EventoCalendario[]>;
    onMesAnterior: () => void;
    onMesSiguiente: () => void;
    onIrHoy: () => void;
    onSeleccionar: (fecha: string) => void;
}

export function CalendarMonth({
    mes,
    seleccionada,
    hoy,
    eventosPorFecha,
    onMesAnterior,
    onMesSiguiente,
    onIrHoy,
    onSeleccionar,
}: Props) {
    const anio = mes.getFullYear();
    const mesIndex = mes.getMonth();
    const primerDiaSemana = (new Date(anio, mesIndex, 1).getDay() + 6) % 7;
    const diasEnMes = new Date(anio, mesIndex + 1, 0).getDate();

    const celdas: Array<number | null> = [
        ...Array.from({ length: primerDiaSemana }, () => null),
        ...Array.from({ length: diasEnMes }, (_, indice) => indice + 1),
    ];

    return (
        <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={onMesAnterior}
                        aria-label="Mes anterior"
                        className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ChevronLeft className="size-4" />
                    </button>

                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-foreground">
                            {etiquetaMes(mes)}
                        </h2>
                        <button
                            type="button"
                            onClick={onIrHoy}
                            className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Hoy
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onMesSiguiente}
                        aria-label="Mes siguiente"
                        className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1">
                    {DIAS_CORTOS.map((dia) => (
                        <div
                            key={dia}
                            className="py-1 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                        >
                            {dia}
                        </div>
                    ))}

                    {celdas.map((dia, indice) => {
                        if (dia === null) {
                            return (
                                <div
                                    key={`vacio-${indice}`}
                                    aria-hidden="true"
                                />
                            );
                        }

                        const iso = isoDelDia(anio, mesIndex, dia);
                        const esHoy = iso === hoy;
                        const esSeleccionado = iso === seleccionada;
                        const eventosDia = eventosPorFecha[iso] ?? [];
                        const tonos = [
                            ...new Set(
                                eventosDia.map((evento) => evento.tono),
                            ),
                        ].slice(0, 3);

                        return (
                            <button
                                key={iso}
                                type="button"
                                onClick={() => onSeleccionar(iso)}
                                aria-label={`Seleccionar ${dia} de ${MESES[mesIndex]} de ${anio}. ${eventosDia.length} ${
                                    eventosDia.length === 1
                                        ? 'evento'
                                        : 'eventos'
                                }.`}
                                aria-pressed={esSeleccionado}
                                className={cn(
                                    'relative flex h-10 w-full items-center justify-center rounded-lg text-xs transition-colors sm:h-11',
                                    esSeleccionado
                                        ? 'bg-[#B8D4E3]/60 font-bold text-slate-900 dark:bg-[#B8D4E3]/25 dark:text-slate-100'
                                        : esHoy
                                          ? 'font-semibold text-foreground ring-1 ring-[#10B981]/40 hover:bg-muted'
                                          : 'text-foreground hover:bg-muted',
                                )}
                            >
                                {dia}

                                {esHoy && (
                                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[#10B981]" />
                                )}

                                {tonos.length > 0 && (
                                    <span className="absolute bottom-1 flex items-center gap-0.5">
                                        {tonos.map((tono) => (
                                            <span
                                                key={tono}
                                                className={cn(
                                                    'size-1 rounded-full',
                                                    ESTILOS_TONO[tono]
                                                        ?.punto ??
                                                        'bg-slate-400',
                                                )}
                                            />
                                        ))}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[10px] text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Haz clic en una fecha para consultar sus registros.
                </div>
            </CardContent>
        </Card>
    );
}
