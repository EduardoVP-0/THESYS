import { RotateCcw, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { RolCalendario, RolDisponible } from './types';
import { ROLES_CALENDARIO } from './visuals';

interface Props {
    roles: RolDisponible[];
    seleccionados: RolCalendario[];
    onToggle: (rol: RolCalendario) => void;
    onMostrarTodos: () => void;
}

export function FiltersMenu({
    roles,
    seleccionados,
    onToggle,
    onMostrarTodos,
}: Props) {
    const filtrado = seleccionados.length < roles.length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="relative h-9 rounded-lg border-border bg-card px-3.5 text-xs font-semibold shadow-xs"
                >
                    <SlidersHorizontal className="size-3.5" />
                    Filtros
                    {filtrado && (
                        <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[#10B981] ring-2 ring-card" />
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Funciones
                </DropdownMenuLabel>

                {roles.map((rol) => {
                    const info = ROLES_CALENDARIO[rol.clave];
                    const activo = seleccionados.includes(rol.clave);
                    const Icono = info.icono;

                    return (
                        <DropdownMenuCheckboxItem
                            key={rol.clave}
                            checked={activo}
                            disabled={activo && seleccionados.length === 1}
                            onCheckedChange={() => onToggle(rol.clave)}
                            onSelect={(event) => event.preventDefault()}
                        >
                            <Icono className="size-3.5 text-muted-foreground" />
                            {rol.etiqueta}
                        </DropdownMenuCheckboxItem>
                    );
                })}

                {filtrado && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={onMostrarTodos}>
                            <RotateCcw className="size-3.5" />
                            Mostrar todas
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
