import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    CalendarX2,
    MapPin,
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ESTILOS_TONO, ICONOS_EVENTO } from '@/lib/eventos';
import { cn } from '@/lib/utils';

import { fechaLarga } from './date-utils';
import type { EventoCalendario } from './types';
import {
    CATEGORIAS_CALENDARIO,
    ORDEN_CATEGORIAS,
    RoleBadge,
} from './visuals';

interface Props {
    abierto: boolean;
    fecha: string;
    eventos: EventoCalendario[];
    onOpenChange: (abierto: boolean) => void;
}

function EventoDetalle({ evento }: { evento: EventoCalendario }) {
    const estilos = ESTILOS_TONO[evento.tono] ?? ESTILOS_TONO.info;
    const Icono = ICONOS_EVENTO[evento.tipo] ?? CalendarDays;

    return (
        <article className={cn('rounded-xl border p-3', estilos.card)}>
            <div className="flex items-start gap-2.5">
                <div
                    className={cn(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                        estilos.icono,
                    )}
                >
                    <Icono className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <span
                            className={cn(
                                'block text-[9px] font-bold tracking-wider uppercase',
                                estilos.etiqueta,
                            )}
                        >
                            {evento.etiqueta}
                        </span>

                        {evento.hora && (
                            <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                                {evento.hora} hrs
                            </span>
                        )}
                    </div>

                    <p className="mt-0.5 text-xs font-bold text-foreground">
                        {evento.titulo}
                    </p>

                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {evento.proyecto}
                    </p>

                    {evento.sustentante && (
                        <p className="text-[11px] text-muted-foreground">
                            {evento.sustentante}
                        </p>
                    )}

                    {evento.lugar && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="size-3" />
                            {evento.lugar}
                        </p>
                    )}

                    {evento.descripcion && (
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {evento.descripcion}
                        </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {evento.roles.map((rol) => (
                            <RoleBadge key={rol} rol={rol} />
                        ))}

                        {evento.url && (
                            <Link
                                href={evento.url}
                                className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-foreground transition-opacity hover:opacity-70"
                            >
                                Abrir módulo
                                <ArrowUpRight className="size-3" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

export function DayEventsDialog({
    abierto,
    fecha,
    eventos,
    onOpenChange,
}: Props) {
    const grupos = ORDEN_CATEGORIAS.map((categoria) => ({
        categoria,
        ...CATEGORIAS_CALENDARIO[categoria],
        eventos: eventos.filter(
            (evento) => evento.categoria === categoria,
        ),
    })).filter((grupo) => grupo.eventos.length > 0);

    const mostrarSecciones = eventos.length > 1;
    const descripcion =
        eventos.length === 0
            ? 'Sin eventos registrados para este día.'
            : `${eventos.length} ${
                  eventos.length === 1
                      ? 'evento registrado'
                      : 'eventos registrados'
              } para este día.`;

    return (
        <Dialog open={abierto} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] overflow-y-auto border-border bg-background p-5 sm:max-w-[620px]">
                <DialogHeader className="border-b border-border pr-6 pb-4 text-left">
                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Detalle del día
                    </p>
                    <DialogTitle className="text-lg font-bold text-foreground">
                        {fechaLarga(fecha)}
                    </DialogTitle>
                    <DialogDescription className="text-[11px]">
                        {descripcion}
                    </DialogDescription>
                </DialogHeader>

                {eventos.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <CalendarX2 className="size-8 text-muted-foreground/60" />
                        <p className="text-sm font-bold text-foreground">
                            Sin eventos este día
                        </p>
                        <p className="max-w-[260px] text-xs text-muted-foreground">
                            Selecciona otra fecha del calendario para consultar
                            tus registros.
                        </p>
                    </div>
                ) : mostrarSecciones ? (
                    <div className="flex flex-col gap-5">
                        {grupos.map((grupo) => {
                            const Icono = grupo.icono;

                            return (
                                <section key={grupo.categoria}>
                                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Icono className="size-3.5 text-muted-foreground" />
                                            <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                {grupo.etiqueta}
                                            </h3>
                                        </div>
                                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                                            {grupo.eventos.length}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex flex-col gap-2">
                                        {grupo.eventos.map((evento) => (
                                            <EventoDetalle
                                                key={evento.id}
                                                evento={evento}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <EventoDetalle evento={eventos[0]} />
                )}
            </DialogContent>
        </Dialog>
    );
}
