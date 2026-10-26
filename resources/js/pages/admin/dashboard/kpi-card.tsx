import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    hint?: string;
    trend?: number | null;
    showTrend?: boolean;
    iconClassName?: string;
}

export function KpiCard({
    title,
    value,
    icon: Icon,
    hint,
    trend,
    showTrend = false,
    iconClassName,
}: KpiCardProps) {
    const hasTrend = trend !== null && trend !== undefined;
    const safeTrend = trend ?? 0;
    const TrendIcon =
        !hasTrend || safeTrend === 0
            ? Minus
            : safeTrend > 0
              ? ArrowUpRight
              : ArrowDownRight;

    const trendLabel = !hasTrend
        ? 'Sin comparativo'
        : safeTrend > 0
          ? `+${safeTrend}% vs. mes anterior`
          : safeTrend < 0
            ? `${safeTrend}% vs. mes anterior`
            : 'Sin cambios';

    const trendClass =
        !hasTrend || safeTrend === 0
            ? 'text-muted-foreground'
            : safeTrend > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400';

    return (
        <Card className="rounded-xl border-border bg-card shadow-xs">
            <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'shrink-0 rounded-full p-2.5',
                            iconClassName ?? 'bg-accent/30 text-foreground',
                        )}
                    >
                        <Icon className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">
                            {title}
                        </p>
                        <h3 className="text-2xl font-bold text-foreground">
                            {value}
                        </h3>
                        {showTrend ? (
                            <p
                                className={cn(
                                    'mt-1 flex items-center gap-1 text-[11px] leading-tight font-medium',
                                    trendClass,
                                )}
                            >
                                <TrendIcon className="size-3 shrink-0" />
                                <span>{trendLabel}</span>
                            </p>
                        ) : (
                            hint && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    {hint}
                                </p>
                            )
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
