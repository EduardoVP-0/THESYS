export interface RolData {
    id_rol: number;
    nombre_rol: string;
}

export interface AdministradorData {
    id_usuario: number;
    id_usuario_registro?: number | null;
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    nombre_completo?: string;
    iniciales?: string;
    telefono?: string | null;
    area: string;
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

export interface AdministradorStats {
    total: number;
    activos: number;
    superadmins: number;
    coordinacion: number;
}

export interface AdministradorFilters {
    search?: string;
    rol?: string;
    estado?: string;
}

export interface PaginatedAdministradores {
    data: AdministradorData[];
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

export const ROLES_ADMIN: Record<number, { label: string; color: string }> = {
    1: { label: 'Superadmin', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
    2: { label: 'Administrador', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
    3: { label: 'Coordinación', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
};
