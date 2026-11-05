export interface RevisionSustentante {
    nombre_completo: string;
    iniciales: string;
    matricula: string;
    email: string;
    carrera: string;
}

export interface VersionRevisionItem {
    id_version: number;
    numero_version: string;
    es_actual: boolean;
    comentario_alumno: string | null;
    nombre_archivo: string | null;
    url_archivo: string | null;
    fecha_envio: string;
    fecha_envio_corta: string;
    estado_revision: 'En revisión' | 'Aprobado' | 'Con cambios' | 'Entrega anterior';
    observaciones: string | null;
    fecha_revision: string | null;
}

export interface RevisionItem {
    identificador: string;
    id_proyecto: number;
    rol_docente: 'Asesor' | 'Revisor';
    rol_etiqueta: 'Director de Tesis' | 'Revisor';
    rol_detalle: string;
    titulo: string;
    resumen: string;
    estado: 'En revisión' | 'Aprobado' | 'Con cambios' | 'Sin entregas';
    puede_dictaminar: boolean;
    aviso_flujo: string | null;
    observaciones_actuales: string | null;
    fecha_dictamen_actual: string | null;
    url_aprobar: string;
    url_solicitar_cambios: string;
    sustentante: RevisionSustentante;
    ultima_version: VersionRevisionItem | null;
    total_versiones: number;
    versiones: VersionRevisionItem[];
}

export interface RevisionStats {
    total: number;
    en_revision: number;
    aprobados: number;
    con_cambios: number;
}

export interface RevisionFilters {
    search?: string;
    rol?: string;
    estado?: string;
}

export interface PaginatedRevisiones {
    data: RevisionItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

