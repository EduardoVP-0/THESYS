export interface AlumnoSustentante {
    id_usuario: number;
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    nombre_completo?: string;
    matricula: string;
    telefono?: string | null;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    carrera?: {
        id_carrera: number;
        nombre_carrera: string;
    };
}

export interface DocenteAsesor {
    id_usuario: number;
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    nombre_completo?: string;
    especialidad?: string;
    grado_academico?: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export interface ProyectoData {
    id_proyecto: number;
    titulo: string;
    resumen: string | null;
    estado: 'Borrador' | 'En revisión' | 'Aprobado' | 'Con cambios' | string;
    fecha_envio: string | null;
    ruta_documento: string | null;
    observaciones_coordinacion: string | null;
    created_at?: string;
    updated_at?: string;
    alumnos?: AlumnoSustentante[];
    sustentante?: AlumnoSustentante | null;
    asesores?: DocenteAsesor[];
    asesor_asignado?: DocenteAsesor | null;
}

export interface AnteproyectoStats {
    total: number;
    en_revision: number;
    aprobados: number;
    con_cambios: number;
    sin_asesor: number;
}

export interface AnteproyectoFilters {
    search?: string;
    estado?: string;
}

export interface PaginatedProyectos {
    data: ProyectoData[];
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
