export interface CarreraItem {
    id_carrera: number;
    nombre_carrera: string;
}

export interface AlumnoData {
    id_usuario: number;
    matricula: string;
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    nombre_completo?: string;
    iniciales?: string;
    fecha_nacimiento?: string;
    sexo?: string;
    curp: string;
    telefono?: string;
    calle?: string;
    colonia?: string;
    codigo_postal?: string;
    id_carrera: number;
    turno: 'Matutino' | 'Vespertino' | 'Mixto';
    fecha_ingreso?: string;
    generacion?: string;
    estado_academico: string;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        estado: boolean;
        id_rol: number;
    };
    carrera?: {
        id_carrera: number;
        nombre_carrera: string;
    };
}

export interface AlumnoStats {
    total: number;
    activos: number;
    egresados: number;
    bajas: number;
}

export interface AlumnoFilters {
    search?: string;
    carrera?: string;
    turno?: string;
    estado?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedAlumnos {
    data: AlumnoData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface CredentialsData {
    nombre: string;
    matricula: string;
    email: string;
    password: string;
}
