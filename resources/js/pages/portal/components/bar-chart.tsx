import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BarraDato = {
    etiqueta: string;
    total: number;
    tono?: 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';
};

const colores = {
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-400',
};

export function BarChart({
    data,
    emptyText = 'Aún no hay datos para graficar.',
    className,
}: {
    data: BarraDato[];
    emptyText?: string;
    className?: string;
}) {
    const totalGeneral = data.reduce((total, item) => total + item.total, 0);

    if (data.length === 0 || totalGeneral === 0) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 px-6 py-10 text-center',
                    className,
                )}
            >
                <BarChart3 className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{emptyText}</p>
            </div>
        );
    }

    const maximo = Math.max(...data.map((item) => item.total), 1);

    return (
        <div className={cn('space-y-4', className)}>
            {data.map((item, index) => {
                const porcentaje = Math.max((item.total / maximo) * 100, item.total > 0 ? 4 : 0);
                const paleta = ['emerald', 'sky', 'amber', 'rose', 'slate'] as const;
                const tono = item.tono ?? paleta[index % paleta.length];

                return (
                    <div key={item.etiqueta} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">{item.etiqueta}</span>
                            <span className="font-semibold text-foreground">{item.total}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn('h-full rounded-full transition-all', colores[tono])}
                                style={{ width: `${porcentaje}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
