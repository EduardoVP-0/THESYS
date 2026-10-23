export interface DocenteData {
    id_usuario: number;
    id_usuario_registro?: number | null;
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    nombre_completo?: string;
    iniciales?: string;
    telefono?: string | null;
    cedula_profesional: string;
    curp: string;
    especialidad: string;
    grado_academico: 'Licenciatura' | 'Maestría' | 'Doctorado' | 'Especialidad';
    tipo_contrato: 'Tiempo completo' | 'Medio tiempo' | 'Por horas' | 'Interino';
    estado: boolean;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        estado: boolean;
        id_rol: number;
    };
    usuario_registro?: {
        id: number;
        name: string;
        email: string;
    };
}

export interface DocenteStats {
    total: number;
    activos: number;
    posgrado: number;
    tiempo_completo: number;
}

export interface DocenteFilters {
    search?: string;
    grado?: string;
    contrato?: string;
    estado?: string;
}

export interface PaginatedDocentes {
    data: DocenteData[];
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
