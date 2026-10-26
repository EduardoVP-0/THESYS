import { cn } from '@/lib/utils';
import type { EstadoVeredictoKey } from './types';

const ESTILOS: Record<EstadoVeredictoKey, string> = {
    aprobado:
        'border-[#10B981]/20 bg-[#10B981]/10 text-[#0F9F6E] dark:text-[#34D399]',
    observaciones:
        'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    rechazado:
        'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
    revision:
        'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    pendiente: 'border-border bg-muted/50 text-muted-foreground',
};

const PUNTOS: Record<EstadoVeredictoKey, string> = {
    aprobado: 'bg-[#10B981]',
    observaciones: 'bg-amber-500',
    rechazado: 'bg-red-500',
    revision: 'bg-blue-500',
    pendiente: 'bg-muted-foreground/60',
};

interface VeredictoBadgeProps {
    estado: string;
    estadoKey: EstadoVeredictoKey;
    className?: string;
}

export function VeredictoBadge({
    estado,
    estadoKey,
    className,
}: VeredictoBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
                ESTILOS[estadoKey] ?? ESTILOS.pendiente,
                className,
            )}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full',
                    PUNTOS[estadoKey] ?? PUNTOS.pendiente,
                )}
            />
            {estado}
        </span>
    );
}
