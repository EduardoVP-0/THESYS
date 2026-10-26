export interface DashboardStats {
    tesis_en_proceso: number;
    tesis_en_proceso_tendencia: number | null;
    tesis_aprobadas: number;
    tesis_aprobadas_tendencia: number | null;
    estudiantes_activos: number;
    proximas_defensas: number;
}

export interface EstadoTesisItem {
    estado: string;
    total: number;
    color: string;
}

export interface TesisCarreraItem {
    carrera: string;
    total: number;
}

export interface TesisReciente {
    id_proyecto: number;
    titulo: string;
    estudiante: string;
    estado: string;
    fecha: string;
}

export interface DefensaCalendario {
    id_examen: number;
    id_proyecto: number;
    titulo: string;
    estudiante: string;
    fecha: string;
    hora: string;
    sede: string;
    estado: string;
}

export interface DashboardProps {
    stats: DashboardStats;
    estadoTesis: EstadoTesisItem[];
    totalTesis: number;
    tesisPorCarrera: TesisCarreraItem[];
    ultimasTesis: TesisReciente[];
    todasTesis: TesisReciente[];
    defensasCalendario: DefensaCalendario[];
    fechaActual: string;
}
