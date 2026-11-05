import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
    AccionDashboard,
    ActividadDocente,
    ListaActividad,
    Tono,
} from '../types';

const MESES_CORTOS = [
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
];

const ESTILOS_ETIQUETA: Record<Tono, string> = {
    success:
        'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    info: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
    warning:
        'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    danger: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400',
    neutral:
        'border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

function descomponerFecha(iso: string): { dia: string; mes: string } {
    const [, mes, dia] = iso.split('-').map(Number);

    return {
        dia: String(dia).padStart(2, '0'),
        mes: MESES_CORTOS[mes - 1] ?? '',
    };
}

interface ActivityListProps {
    lista: ListaActividad;
    accion: AccionDashboard | null;
}

function ContenidoActividad({ item }: { item: ActividadDocente }) {
    const fecha = item.fecha_iso ? descomponerFecha(item.fecha_iso) : null;

    return (
        <>
            <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[#B8D4E3]/30 text-slate-700 dark:bg-[#B8D4E3]/10 dark:text-slate-200">
                {fecha ? (
                    <>
                        <span className="text-base leading-none font-bold">
                            {fecha.dia}
                        </span>
                        <span className="mt-0.5 text-[9px] font-semibold tracking-wider uppercase">
                            {fecha.mes}
                        </span>
                    </>
                ) : (
                    <CalendarClock className="size-5" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">
                    {item.titulo}
                </p>
                <p className="line-clamp-2 text-[10px] text-muted-foreground">
                    {item.descripcion}
                </p>
                {item.fecha && (
                    <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                        {item.fecha}
                    </p>
                )}
            </div>

            <span
                className={cn(
                    'mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold',
                    ESTILOS_ETIQUETA[item.tono] ?? ESTILOS_ETIQUETA.neutral,
                )}
            >
                {item.etiqueta}
            </span>
        </>
    );
}

export function ActivityList({ lista, accion }: ActivityListProps) {
    return (
        <Card className="h-full gap-0 rounded-xl border-border bg-card py-0 shadow-xs">
            <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-foreground">
                            {lista.titulo}
                        </h2>
                        <p className="text-[11px] text-muted-foreground">
                            {lista.detalle}
                        </p>
                    </div>

                    {accion && (
                        <Link
                            href={accion.url}
                            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {accion.etiqueta}
                            <ArrowRight className="size-3" />
                        </Link>
                    )}
                </div>

                {lista.items.length > 0 ? (
                    <div className="mt-4 space-y-1">
                        {lista.items.map((item) => {
                            const clases =
                                'flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50';

                            return item.url ? (
                                <Link
                                    key={item.id}
                                    href={item.url}
                                    className={clases}
                                >
                                    <ContenidoActividad item={item} />
                                </Link>
                            ) : (
                                <div key={item.id} className={clases}>
                                    <ContenidoActividad item={item} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
                        <div className="rounded-full bg-muted p-3 text-muted-foreground">
                            <CalendarClock className="size-5" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            Sin actividades pendientes
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            Los movimientos de tus proyectos aparecerán aquí.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
