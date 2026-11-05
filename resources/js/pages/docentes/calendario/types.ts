export type RolCalendario = 'asesor' | 'revisor' | 'jurado';

export type CategoriaEvento =
    | 'asignaciones'
    | 'entregas'
    | 'revisiones'
    | 'examenes';

export type TonoCalendario =
    | 'success'
    | 'info'
    | 'warning'
    | 'danger'
    | 'neutral'
    | 'gold';

export interface RolDisponible {
    clave: RolCalendario;
    etiqueta: string;
    descripcion: string;
}

export interface EventoCalendario {
    id: string;
    fecha: string;
    hora: string | null;
    roles: RolCalendario[];
    categoria: CategoriaEvento;
    tipo: string;
    tono: TonoCalendario;
    etiqueta: string;
    titulo: string;
    proyecto: string;
    sustentante: string | null;
    descripcion: string | null;
    lugar: string | null;
    url: string | null;
}

export interface CalendarioDocenteProps {
    roles_disponibles: RolDisponible[];
    eventos: EventoCalendario[];
    hoy: string;
}
