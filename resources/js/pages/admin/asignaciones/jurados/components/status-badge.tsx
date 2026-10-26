import { cn } from '@/lib/utils';
import { esEstadoAceptado, esEstadoRechazado } from '../jury-utils';

interface StatusBadgeProps {
    estado: string;
    dot?: boolean;
    className?: string;
}

export function StatusBadge({
    estado,
    dot = false,
    className,
}: StatusBadgeProps) {
    const tone = esEstadoAceptado(estado)
        ? 'border-[#10B981]/20 bg-[#10B981]/10 text-[#0F9F6E] dark:text-[#34D399]'
        : esEstadoRechazado(estado)
          ? 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
          : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400';

    const dotTone = esEstadoAceptado(estado)
        ? 'bg-[#10B981]'
        : esEstadoRechazado(estado)
          ? 'bg-red-500'
          : 'bg-amber-500';

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap',
                tone,
                className,
            )}
        >
            {dot && <span className={cn('size-1.5 rounded-full', dotTone)} />}
            {estado}
        </span>
    );
}
