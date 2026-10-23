export interface Carrera {
    id_carrera: number;
    clave?: string;
    nombre_carrera: string;
    descripcion: string | null;
    duracion_semestres: number;
    estado: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CarreraStats {
    total: number;
    activas: number;
    inactivas: number;
    alumnos_vigentes: number;
}

export interface CarreraFilters {
    search?: string;
    estado?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedCarreras {
    data: Carrera[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}
