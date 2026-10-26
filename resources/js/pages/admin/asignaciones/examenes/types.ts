export interface SustentanteExamen {
    id_usuario: number;
    nombre_completo: string;
    matricula: string;
}

export interface AsesorExamen {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
}

export interface DocenteResumenExamen {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
    email: string | null;
}

export interface MiembroJuradoExamen {
    id_jurado_proyecto: number;
    id_usuario: number;
    cargo: string;
    estado_aceptacion: string;
    docente: DocenteResumenExamen;
}

export interface ProyectoExamen {
    id_proyecto: number;
    titulo: string;
    resumen: string | null;
    estado: string;
    sustentantes: SustentanteExamen[];
    asesores: AsesorExamen[];
    jurado: MiembroJuradoExamen[];
    jurado_completo: boolean;
    jurado_count: number;
}

export interface SedeExamen {
    id_sede: number;
    clave: string;
    nombre_sede: string;
    direccion: string | null;
}

export interface ExamenFormData {
    id_proyecto: string;
    fecha_examen: string;
    hora_examen: string;
    id_sede: string;
}

export interface AsignacionExamenProps {
    proyectos: ProyectoExamen[];
    sedes: SedeExamen[];
    proyectoSeleccionadoId: number | null;
    fechaMinima: string;
    diasInhabiles: Record<string, string>;
    fechasOcupadas: Record<string, string>;
}
