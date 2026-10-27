import { cn } from '@/lib/utils';

const tonos = {
    emerald:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
    slate: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300',
};

type Tono = keyof typeof tonos;

function normalizar(estado?: string | null): string {
    return (estado ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function resolverTono(estado?: string | null): Tono {
    const valor = normalizar(estado);

    if (
        [
            'aprobado',
            'aprobada',
            'validado',
            'aceptado',
            'liberada',
            'realizado',
            'a favor',
            'disponible',
            'completado',
            'activo',
        ].includes(valor)
    ) {
        return 'emerald';
    }

    if (
        [
            'rechazado',
            'rechazada',
            'en contra',
            'cancelado',
            'cancelada',
            'inactivo',
            'vencido',
        ].includes(valor)
    ) {
        return 'rose';
    }

    if (
        [
            'pendiente',
            'en revision',
            'programado',
            'en proceso',
            'con observaciones',
            'con cambios',
            'abstencion',
            'sin revision',
            'sin version',
            'sin programar',
        ].includes(valor)
    ) {
        return 'amber';
    }

    if (['enviado', 'registrado', 'disponible'].includes(valor)) {
        return 'sky';
    }

    return 'slate';
}

export function StatusBadge({
    estado,
    className,
}: {
    estado?: string | null;
    className?: string;
}) {
    const texto = estado?.trim() || 'Sin estado';
    const tono = resolverTono(estado);

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                tonos[tono],
                className,
            )}
        >
            {texto}
        </span>
    );
}
