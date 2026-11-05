import type { LucideIcon } from 'lucide-react';
import { BookOpen, ClipboardCheck, Scale } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { RolDashboard, RolDisponible } from './types';

const ICONOS_ROL: Record<RolDashboard, LucideIcon> = {
    asesor: BookOpen,
    revisor: ClipboardCheck,
    jurado: Scale,
};

interface RoleSelectorProps {
    roles: RolDisponible[];
    value: RolDashboard;
    onChange: (rol: RolDashboard) => void;
}

export function RoleSelector({ roles, value, onChange }: RoleSelectorProps) {
    const rolActual =
        roles.find((rol) => rol.clave === value) ?? roles[0] ?? null;
    const IconoActual = rolActual ? ICONOS_ROL[rolActual.clave] : BookOpen;

    if (roles.length === 0) {
        return null;
    }

    if (roles.length === 1 && rolActual) {
        return (
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs">
                <IconoActual className="size-4 text-muted-foreground" />
                Vista de {rolActual.etiqueta}
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:items-end">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                ¿Qué deseas ver?
            </span>
            <Select
                value={value}
                onValueChange={(nextValue) =>
                    onChange(nextValue as RolDashboard)
                }
            >
                <SelectTrigger className="h-10 w-full min-w-52 rounded-lg border-border bg-card font-medium shadow-xs sm:w-60">
                    <div className="flex items-center gap-2">
                        <IconoActual className="size-4 text-muted-foreground" />
                        <SelectValue />
                    </div>
                </SelectTrigger>
                <SelectContent align="end">
                    {roles.map((rol) => {
                        const Icono = ICONOS_ROL[rol.clave];

                        return (
                            <SelectItem key={rol.clave} value={rol.clave}>
                                <span className="flex items-center gap-2">
                                    <Icono className="size-4 text-muted-foreground" />
                                    {rol.etiqueta}
                                </span>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}
