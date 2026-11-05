import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RolDashboard, GraficaActividad } from '../types';

const COLORES_BARRA: Record<RolDashboard, string> = {
    asesor: 'bg-[#10B981]',
    revisor: 'bg-sky-500',
    jurado: 'bg-amber-500',
};

interface ActivityChartProps {
    rol: RolDashboard;
    grafica: GraficaActividad;
}

export function ActivityChart({ rol, grafica }: ActivityChartProps) {
    const maximo = Math.max(1, ...grafica.datos.map((item) => item.total));

    return (
        <Card className="h-full gap-0 rounded-xl border-border bg-card py-0 shadow-xs lg:col-span-2">
            <CardContent className="flex h-full flex-col p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-foreground">
                            {grafica.titulo}
                        </h2>
                        <p className="text-[11px] text-muted-foreground">
                            {grafica.detalle}
                        </p>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                        {grafica.total}{' '}
                        {grafica.total === 1 ? 'registro' : 'registros'}
                    </span>
                </div>

                <div
                    className="mt-5 flex h-48 items-end gap-1.5 sm:gap-2.5"
                    role="img"
                    aria-label={`${grafica.titulo}: ${grafica.total} registros en los últimos 12 meses`}
                >
                    {grafica.datos.map((item) => {
                        const altura =
                            item.total === 0
                                ? 4
                                : Math.max((item.total / maximo) * 100, 10);

                        return (
                            <div
                                key={item.clave}
                                className="flex min-w-0 flex-1 flex-col items-center gap-2"
                            >
                                <span className="h-3 text-[9px] font-semibold text-muted-foreground">
                                    {item.total > 0 ? item.total : ''}
                                </span>
                                <div
                                    className="flex h-36 w-full items-end overflow-hidden rounded-t-md bg-muted/50"
                                    title={`${item.etiqueta}: ${item.total} ${
                                        item.total === 1
                                            ? 'registro'
                                            : 'registros'
                                    }`}
                                >
                                    <div
                                        className={cn(
                                            'w-full rounded-t-md transition-all',
                                            item.total === 0
                                                ? 'bg-muted-foreground/15'
                                                : COLORES_BARRA[rol],
                                        )}
                                        style={{ height: `${altura}%` }}
                                    />
                                </div>
                                <span className="w-full truncate text-center text-[8px] font-medium text-muted-foreground sm:text-[9px]">
                                    {item.etiqueta}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {grafica.total === 0 && (
                    <p className="mt-3 text-center text-[10px] text-muted-foreground">
                        Todavía no hay movimientos registrados en este periodo.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
