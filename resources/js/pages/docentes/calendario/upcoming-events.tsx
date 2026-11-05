import { CalendarX2, ChevronRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { MESES_CORTOS, parseIso } from './date-utils';
import type { EventoCalendario } from './types';
import { RoleBadge } from './visuals';

interface Props {
    titulo: string;
    detalle: string;
    eventos: EventoCalendario[];
    onEventoClick: (evento: EventoCalendario) => void;
}

export function UpcomingEvents({
    titulo,
    detalle,
    eventos,
    onEventoClick,
}: Props) {
    return (
        <Card className="h-full rounded-2xl border-border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
                <div className="border-b border-border pb-3">
                    <h2 className="text-sm font-bold text-foreground">
                        {titulo}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {detalle}
                    </p>
                </div>

                {eventos.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-center">
                        <CalendarX2 className="size-8 text-muted-foreground/60" />
                        <p className="text-xs font-semibold text-foreground">
                            No hay eventos para mostrar
                        </p>
                        <p className="max-w-[230px] text-[11px] text-muted-foreground">
                            Cambia los filtros o revisa otro mes del calendario.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-border/60">
                        {eventos.map((evento, indice) => {
                            const fecha = parseIso(evento.fecha);

                            return (
                                <button
                                    key={evento.id}
                                    type="button"
                                    onClick={() => onEventoClick(evento)}
                                    className={cn(
                                        'group flex w-full items-start gap-3 py-3 text-left transition-colors hover:opacity-80',
                                        indice === 0 && 'pt-1',
                                    )}
                                >
                                    <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-muted/50 leading-none">
                                        <span className="text-[9px] font-bold tracking-wider text-muted-foreground">
                                            {MESES_CORTOS[fecha.getMonth()]}
                                        </span>
                                        <span className="mt-1 text-base font-bold text-foreground">
                                            {fecha.getDate()}
                                        </span>
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-bold text-foreground">
                                            {evento.titulo}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                                            {evento.proyecto}
                                        </span>
                                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
                                            {evento.sustentante && (
                                                <span className="truncate">
                                                    {evento.sustentante}
                                                </span>
                                            )}
                                            {evento.hora && (
                                                <>
                                                    {evento.sustentante && (
                                                        <span>·</span>
                                                    )}
                                                    <span>
                                                        {evento.hora} hrs
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                        <span className="mt-1.5 flex flex-wrap gap-1">
                                            {evento.roles.map((rol) => (
                                                <RoleBadge key={rol} rol={rol} />
                                            ))}
                                        </span>
                                    </span>

                                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
