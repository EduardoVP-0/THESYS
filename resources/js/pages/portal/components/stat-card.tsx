import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tono = 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';

const tonos: Record<Tono, { icon: string; value: string }> = {
    emerald: {
        icon: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
        value: 'text-foreground',
    },
    blue: {
        icon: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
        value: 'text-foreground',
    },
    amber: {
        icon: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
        value: 'text-foreground',
    },
    rose: {
        icon: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
        value: 'text-foreground',
    },
    slate: {
        icon: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
        value: 'text-foreground',
    },
};

interface StatCardProps {
    title: string;
    value: string | number;
    hint?: string;
    icon: LucideIcon;
    tone?: Tono;
    className?: string;
}

export function StatCard({
    title,
    value,
    hint,
    icon: Icon,
    tone = 'emerald',
    className,
}: StatCardProps) {
    return (
        <Card className={cn('border-border/70 shadow-sm', className)}>
            <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {title}
                    </p>
                    <p className={cn('mt-2 truncate text-2xl font-semibold', tonos[tone].value)}>
                        {value}
                    </p>
                    {hint ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {hint}
                        </p>
                    ) : null}
                </div>
                <span className={cn('shrink-0 rounded-xl p-2.5', tonos[tone].icon)}>
                    <Icon className="size-5" />
                </span>
            </CardContent>
        </Card>
    );
}
