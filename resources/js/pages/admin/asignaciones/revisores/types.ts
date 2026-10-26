export interface DocenteItem {
    id_usuario: number;
    nombre_completo: string;
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    grado_academico?: string;
    especialidad?: string;
    email?: string;
    carga_total: number;
    max_carga: number;
    disponible: boolean;
}

export interface AsesorInfo {
    id_usuario: number;
    nombre_completo: string;
    grado_academico?: string;
    email?: string;
}

export interface RevisorInfo {
    id_usuario: number;
    nombre_completo: string;
    grado_academico?: string;
}

export interface ProyectoAprobado {
    id_proyecto: number;
    titulo: string;
    estado: string;
    asesor: AsesorInfo | null;
    revisores_actuales: RevisorInfo[];
}

export interface AlumnoConProyectos {
    id_usuario: number;
    nombre_completo: string;
    matricula: string;
    carrera: string;
    proyectos: ProyectoAprobado[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedDocentes {
    data: DocenteItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

export interface AsignacionStats {
    total_docentes: number;
    disponibles: number;
    carga_completa: number;
}

export interface AsignacionFilters {
    search: string;
    disponibilidad: string;
    especialidad?: string;
    per_page?: number;
}

/**
 * Convierte el grado academico de la base de datos (e.g. Doctorado, Maestría, Licenciatura, Especialidad)
 * a su abreviatura academica formal correspondiente: Dr., Mtro., Lic. o Especialista.
 */
export function formatGradoAcademico(grado?: string | null): string {
    if (!grado) return '';
    const g = grado.trim().toLowerCase();
    if (g.includes('doc') || g.startsWith('dr')) {
        return 'Dr.';
    }
    if (g.includes('mae') || g.includes('mtr') || g.startsWith('mt')) {
        return 'Mtro.';
    }
    if (g.includes('lic')) {
        return 'Lic.';
    }
    if (g.includes('esp')) {
        return 'Especialista';
    }
    return grado.trim();
}
