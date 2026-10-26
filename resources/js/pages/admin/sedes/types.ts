export interface Sede {
    id_sede: number;
    clave: string;
    nombre_sede: string;
    direccion: string | null;
    estado: boolean;
    examenes_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface SedeStats {
    total: number;
    activas: number;
    inactivas: number;
    examenes_programados: number;
}

export interface SedeFilters {
    search?: string;
    estado?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedSedes {
    data: Sede[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface SedesIndexProps {
    sedes: PaginatedSedes;
    stats: SedeStats;
    filters: SedeFilters;
}
