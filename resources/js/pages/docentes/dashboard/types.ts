export type RolDashboard = 'asesor' | 'revisor' | 'jurado';

export type Tono = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export interface RolDisponible {
    clave: RolDashboard;
    etiqueta: string;
    descripcion: string;
}

export interface DashboardStat {
    clave: string;
    etiqueta: string;
    valor: number;
    detalle: string;
    tono: Tono;
}

export interface ActividadMes {
    clave: string;
    etiqueta: string;
    total: number;
}

export interface GraficaActividad {
    titulo: string;
    detalle: string;
    total: number;
    datos: ActividadMes[];
}

export interface ActividadDocente {
    id: string;
    titulo: string;
    descripcion: string;
    fecha: string | null;
    fecha_iso: string | null;
    etiqueta: string;
    tono: Tono;
    url: string | null;
}

export interface ListaActividad {
    titulo: string;
    detalle: string;
    items: ActividadDocente[];
}

export interface AccionDashboard {
    etiqueta: string;
    url: string;
}

export interface DashboardRol {
    clave: RolDashboard;
    etiqueta: string;
    descripcion: string;
    stats: DashboardStat[];
    grafica: GraficaActividad;
    lista: ListaActividad;
    accion: AccionDashboard | null;
}

export interface DashboardDocenteProps {
    nombre: string;
    saludo: string;
    fecha_larga: string;
    roles_disponibles: RolDisponible[];
    vista_inicial: RolDashboard | null;
    dashboards: Partial<Record<RolDashboard, DashboardRol>>;
}
