import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <Card className={className}>
            <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <span className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <Icon className="size-6" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                {action}
            </CardContent>
        </Card>
    );
}
