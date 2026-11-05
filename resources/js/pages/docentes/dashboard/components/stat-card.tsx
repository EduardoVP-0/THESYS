import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardStat, Tono } from '../types';

const ESTILOS_ICONO: Record<Tono, string> = {
    success: 'bg-[#10B981]/15 text-[#10B981]',
    info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
    neutral: 'bg-accent/30 text-foreground',
};

interface StatCardProps {
    stat: DashboardStat;
    icon: LucideIcon;
}

export function StatCard({ stat, icon: Icon }: StatCardProps) {
    return (
        <Card className="h-full gap-0 rounded-xl border-border bg-card py-0 shadow-xs">
            <CardContent className="flex h-full items-center gap-3 p-4">
                <div
                    className={cn(
                        'shrink-0 rounded-full p-2.5',
                        ESTILOS_ICONO[stat.tono] ?? ESTILOS_ICONO.neutral,
                    )}
                >
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                        {stat.etiqueta}
                    </p>
                    <h3 className="text-2xl font-bold text-foreground">
                        {stat.valor}
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                        {stat.detalle}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
