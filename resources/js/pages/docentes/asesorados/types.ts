export interface SustentanteAsesorado {
    id_usuario?: number | null;
    nombre_completo: string;
    iniciales: string;
    matricula: string;
    email: string;
    telefono?: string | null;
    carrera: string;
    turno?: string | null;
    generacion?: string | null;
}

export interface VersionAsesoradoItem {
    id_version: number;
    numero_version: string;
    comentario_alumno?: string | null;
    nombre_archivo?: string | null;
    url_archivo?: string | null;
    fecha_envio: string;
    fecha_envio_corta: string;
    estado_revision: 'En revisión' | 'Con cambios' | 'Aprobado' | string;
    observaciones_asesor?: string | null;
    fecha_revision?: string | null;
}

export interface AnteproyectoArchivoInfo {
    nombre_archivo: string;
    url_archivo: string;
    fecha_envio: string;
}

export interface AsesoradoItem {
    id_asesor_proyecto: number;
    id_proyecto: number;
    titulo: string;
    resumen: string;
    estado_anteproyecto: string;
    estado_tesis: 'Sin entregas' | 'En revisión' | 'Con cambios' | 'Aprobado' | string;
    fecha_asignacion: string;
    id_carrera?: number | null;
    sustentante: SustentanteAsesorado;
    anteproyecto_archivo?: AnteproyectoArchivoInfo | null;
    ultima_version?: VersionAsesoradoItem | null;
    total_versiones: number;
    versiones: VersionAsesoradoItem[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedAsesorados {
    data: AsesoradoItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface AsesoradosStats {
    total: number;
    en_revision: number;
    con_cambios: number;
    aprobados: number;
    sin_entregas: number;
}

export interface CarreraOption {
    id_carrera: number;
    nombre_carrera: string;
}

export interface AsesoradosFilters {
    search?: string;
    estado?: string;
    carrera?: string;
}

