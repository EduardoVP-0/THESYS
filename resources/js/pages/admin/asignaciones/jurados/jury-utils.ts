import type {
    EstadoGeneralJurado,
    MiembroJurado,
    ProyectoJurado,
} from './types';

export function esEstadoAceptado(estado: string): boolean {
    return estado.trim().toLowerCase().startsWith('acept');
}

export function esEstadoRechazado(estado: string): boolean {
    return estado.trim().toLowerCase().startsWith('rechaz');
}

export function obtenerMiembroPorCargo(
    proyecto: ProyectoJurado,
    cargo: string,
): MiembroJurado | undefined {
    return proyecto.jurado.find((miembro) => miembro.cargo === cargo);
}

export function obtenerEstadoGeneral(
    proyecto: ProyectoJurado,
): EstadoGeneralJurado {
    const estados = proyecto.jurado.map((miembro) => miembro.estado_aceptacion);

    if (estados.some(esEstadoRechazado)) {
        return 'Rechazado';
    }

    if (
        estados.length >= 5 &&
        estados.every((estado) => esEstadoAceptado(estado))
    ) {
        return 'Aceptado';
    }

    return 'Pendiente';
}

export function contarMiembrosAceptados(proyecto: ProyectoJurado): number {
    return proyecto.jurado.filter((miembro) =>
        esEstadoAceptado(miembro.estado_aceptacion),
    ).length;
}

export function contarMiembrosPendientes(proyecto: ProyectoJurado): number {
    return proyecto.jurado.filter(
        (miembro) =>
            !esEstadoAceptado(miembro.estado_aceptacion) &&
            !esEstadoRechazado(miembro.estado_aceptacion),
    ).length;
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
