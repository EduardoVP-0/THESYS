import {
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    GraduationCap,
    Scale,
    Upload,
    UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { CategoriaEvento, RolCalendario } from './types';

interface RolInfo {
    etiqueta: string;
    punto: string;
    chip: string;
    icono: LucideIcon;
}

export const ROLES_CALENDARIO: Record<RolCalendario, RolInfo> = {
    asesor: {
        etiqueta: 'Asesor',
        punto: 'bg-emerald-500',
        chip: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        icono: BookOpen,
    },
    revisor: {
        etiqueta: 'Revisor',
        punto: 'bg-sky-500',
        chip: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
        icono: ClipboardCheck,
    },
    jurado: {
        etiqueta: 'Jurado',
        punto: 'bg-amber-500',
        chip: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        icono: Scale,
    },
};

export const ORDEN_ROLES: RolCalendario[] = ['asesor', 'revisor', 'jurado'];

export const CATEGORIAS_CALENDARIO: Record<
    CategoriaEvento,
    { etiqueta: string; icono: LucideIcon }
> = {
    asignaciones: {
        etiqueta: 'Asignaciones',
        icono: UserCheck,
    },
    entregas: {
        etiqueta: 'Entregas',
        icono: Upload,
    },
    revisiones: {
        etiqueta: 'Revisiones',
        icono: CheckCircle2,
    },
    examenes: {
        etiqueta: 'Exámenes',
        icono: GraduationCap,
    },
};

export const ORDEN_CATEGORIAS: CategoriaEvento[] = [
    'asignaciones',
    'entregas',
    'revisiones',
    'examenes',
];

export function RoleBadge({ rol }: { rol: RolCalendario }) {
    const info = ROLES_CALENDARIO[rol];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${info.chip}`}
        >
            <span className={`size-1.5 rounded-full ${info.punto}`} />
            {info.etiqueta}
        </span>
    );
}
