import { cn } from '@/lib/utils';

const ESTADOS: Record<string, string> = {
    aprobada:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    aprobado:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    'en revisión':
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'en revision':
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'en desarrollo':
        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'en proceso':
        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'en progreso':
        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    planteamiento:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    propuesta:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    rechazada: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    rechazado: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    cancelada: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

interface EstadoBadgeProps {
    estado: string;
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
    const estilo =
        ESTADOS[estado.trim().toLowerCase()] ??
        'bg-muted text-muted-foreground';

    return (
        <span
            className={cn(
                'badge badge-soft px-2.5 py-1 text-xs font-semibold',
                estilo,
            )}
        >
            {estado}
        </span>
    );
}
