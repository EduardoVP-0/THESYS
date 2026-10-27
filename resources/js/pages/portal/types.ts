export type NotificacionTipo = 'info' | 'success' | 'warning' | 'danger';

export type NotificacionPortal = {
    id: string;
    tipo: NotificacionTipo;
    titulo: string;
    mensaje: string;
    fecha: string | null;
    fecha_legible: string | null;
    url: string | null;
};

export type EventoPortal = {
    id: string;
    titulo: string;
    descripcion?: string | null;
    fecha: string;
    hora?: string | null;
    lugar?: string | null;
    tipo: 'examen' | 'entrega' | 'anteproyecto' | 'administrativo';
    meta?: {
        estudiante?: string | null;
        cargo?: string | null;
    } | null;
};
