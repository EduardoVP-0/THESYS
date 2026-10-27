export type Rol = {
    id_rol: number;
    nombre_rol: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    id_rol?: number | null;
    rol?: Rol | null;
    estado?: boolean;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
