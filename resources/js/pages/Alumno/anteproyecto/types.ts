export type EstadoAnteproyecto =
    | 'Borrador'
    | 'En revisión'
    | 'Con cambios'
    | 'Aprobado'
    | 'Aprobada'
    | string;

export interface AsesorAsignado {
    nombre_completo: string;
    grado_academico?: string | null;
    email?: string | null;
}

export interface MiAnteproyectoData {
    id_proyecto: number;
    titulo: string;
    resumen: string;
    estado: EstadoAnteproyecto;
    fecha_envio: string | null;
    fecha_envio_formateada: string | null;
    updated_at: string | null;
    updated_at_formateada: string | null;
    ruta_documento: string | null;
    nombre_documento: string | null;
    url_documento: string | null;
    observaciones_coordinacion: string | null;
    editable: boolean;
    asesor: AsesorAsignado | null;
}

export interface AlumnoBasicInfo {
    id_usuario: number;
    nombre_completo: string;
    matricula: string;
    carrera: string;
}

