export type EstadoVeredictoKey =
    | 'aprobado'
    | 'observaciones'
    | 'rechazado'
    | 'revision'
    | 'pendiente';

export interface EstudianteVeredicto {
    id_usuario: number;
    nombre_completo: string;
    matricula: string;
    iniciales: string;
}

export interface DocenteVeredicto {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
    email: string | null;
}

export interface JuradoVeredicto {
    id_jurado_proyecto: number;
    cargo: string;
    es_titular: boolean;
    estado_aceptacion: string;
    voto: string | null;
    observaciones: string | null;
    docente: DocenteVeredicto;
}

export interface VotosVeredicto {
    favor: number;
    contra: number;
    abstencion: number;
    emitidos: number;
    titulares: number;
}

export interface Veredicto {
    id_examen: number;
    id_proyecto: number;
    titulo: string;
    estudiante: EstudianteVeredicto;
    fecha: string;
    fecha_iso: string;
    hora: string;
    sede: string | null;
    estado: string;
    estado_key: EstadoVeredictoKey;
    estado_examen: string;
    resultado_final: string | null;
    votos: VotosVeredicto;
    voto_resumen: string;
    jurados: JuradoVeredicto[];
    puede_registrar: boolean;
}

export interface VeredictoStats {
    total: number;
    aprobados: number;
    observaciones: number;
    rechazados: number;
    por_resolver: number;
}

export interface VeredictoFilters {
    search: string | null;
    estado: string;
}

export interface PaginatedVeredictos {
    data: Veredicto[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface VeredictosIndexProps {
    veredictos: PaginatedVeredictos;
    proyectos: Veredicto[];
    stats: VeredictoStats;
    filters: VeredictoFilters;
    votos: string[];
}
