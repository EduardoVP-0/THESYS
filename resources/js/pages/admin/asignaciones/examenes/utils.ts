import type { MiembroJuradoExamen } from './types';

export const JURY_CARGOS = [
    'Presidente',
    'Secretario',
    'Vocal',
    'Suplente 1',
    'Suplente 2',
] as const;

export function formatearFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');

    if (!anio || !mes || !dia) {
        return '';
    }

    return `${dia}/${mes}/${anio}`;
}

export function estadoProyectoClasses(estado: string): string {
    const normalizado = estado.trim().toLowerCase();

    if (normalizado.startsWith('aprob')) {
        return 'border-[#10B981]/20 bg-[#10B981]/10 text-[#0F9F6E] dark:text-[#34D399]';
    }

    if (normalizado.startsWith('rechaz')) {
        return 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400';
    }

    if (normalizado.startsWith('en ')) {
        return 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400';
    }

    return 'border-border bg-muted/50 text-muted-foreground';
}

export function estadoAceptacionClasses(estado: string): string {
    const normalizado = estado.trim().toLowerCase();

    if (normalizado.startsWith('acept')) {
        return 'border-[#10B981]/20 bg-[#10B981]/10 text-[#0F9F6E] dark:text-[#34D399]';
    }

    if (normalizado.startsWith('rechaz')) {
        return 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400';
    }

    return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400';
}

export function obtenerMiembroPorCargo(
    jurado: MiembroJuradoExamen[],
    cargo: string,
): MiembroJuradoExamen | undefined {
    return jurado.find((miembro) => miembro.cargo === cargo);
}
