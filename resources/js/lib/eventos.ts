import {
    Award,
    BadgeCheck,
    CalendarPlus,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    GraduationCap,
    PartyPopper,
    Scale,
    Upload,
    UserCheck,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * ESTILOS VISUALES DE LOS EVENTOS ACADÉMICOS
 *
 * Se comparten entre el calendario académico y el dashboard del sustentante
 * para que un mismo hito conserve su color e icono en ambos módulos.
 */
export const ESTILOS_TONO: Record<
    string,
    { card: string; icono: string; etiqueta: string; punto: string }
> = {
    info: {
        card: 'border-sky-500/25 bg-sky-500/10',
        icono: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
        etiqueta: 'text-sky-700 dark:text-sky-400',
        punto: 'bg-sky-500',
    },
    success: {
        card: 'border-emerald-500/25 bg-emerald-500/10',
        icono: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        etiqueta: 'text-emerald-700 dark:text-emerald-400',
        punto: 'bg-emerald-500',
    },
    warning: {
        card: 'border-amber-500/25 bg-amber-500/10',
        icono: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        etiqueta: 'text-amber-700 dark:text-amber-400',
        punto: 'bg-amber-500',
    },
    danger: {
        card: 'border-red-500/25 bg-red-500/10',
        icono: 'bg-red-500/15 text-red-700 dark:text-red-400',
        etiqueta: 'text-red-700 dark:text-red-400',
        punto: 'bg-red-500',
    },
    neutral: {
        card: 'border-slate-500/25 bg-slate-500/10',
        icono: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
        etiqueta: 'text-slate-700 dark:text-slate-300',
        punto: 'bg-slate-400',
    },
    gold: {
        card: 'border-yellow-500/30 bg-yellow-500/10',
        icono: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
        etiqueta: 'text-yellow-700 dark:text-yellow-400',
        punto: 'bg-yellow-500',
    },
};

export const ICONOS_EVENTO: Record<string, LucideIcon> = {
    anteproyecto: FileText,
    asesor: UserCheck,
    revisor_asignado: Users,
    jurado: Scale,
    version: Upload,
    director: ClipboardCheck,
    revisor: CheckCircle2,
    examen_programado: CalendarPlus,
    examen: GraduationCap,
    resultado: Award,
    aprobacion: BadgeCheck,
    culminacion: PartyPopper,
};
