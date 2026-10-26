export interface SolicitudAsignacion {
    id_alumno: number;
    id_proyecto: number;
    alumno: {
        nombre_completo: string;
        matricula: string;
        carrera: string | null;
    };
    proyecto: {
        id_proyecto: number;
        titulo: string;
        resumen: string | null;
        estado: string;
    };
}

export interface AsesorAsignacion {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
    especialidad: string;
    grado_academico: string;
    carga_actual: number;
    carga_maxima: number;
    disponible: boolean;
}

export interface AsignacionAsesorProps {
    solicitudes: SolicitudAsignacion[];
    asesores: AsesorAsignacion[];
}
