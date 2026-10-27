import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    eyebrow?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    actions,
    eyebrow,
}: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
                {Icon ? (
                    <span className="mt-0.5 rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <Icon className="size-5" />
                    </span>
                ) : null}
                <div>
                    {eyebrow ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                            {eyebrow}
                        </p>
                    ) : null}
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
        </header>
    );
}
