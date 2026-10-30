export type JurySlotKey =
    | 'presidente'
    | 'secretario'
    | 'vocal'
    | 'suplente_1'
    | 'suplente_2';

export type JuryStatusFilter = 'todos' | 'Pendiente' | 'Aceptado' | 'Rechazado';

export type EstadoGeneralJurado = 'Pendiente' | 'Aceptado' | 'Rechazado';

export interface DocenteJurado {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
    email: string | null;
    cedula_profesional: string | null;
    especialidad: string | null;
    grado_academico: string | null;
    tipo_contrato: string | null;
}

export interface SustentanteJurado {
    id_usuario: number;
    nombre_completo: string;
    matricula: string;
}

export interface AsesorProyecto {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
}

export interface MiembroJurado {
    id_jurado_proyecto: number;
    id_usuario: number;
    cargo: string;
    estado_aceptacion: string;
    docente: {
        id_usuario: number;
        nombre_completo: string;
        iniciales: string;
        email: string | null;
    };
}

export interface ProyectoJurado {
    id_proyecto: number;
    titulo: string;
    resumen: string | null;
    estado: string;
    sustentantes: SustentanteJurado[];
    asesores: AsesorProyecto[];
    jurado: MiembroJurado[];
    tiene_jurado: boolean;
}

export interface JuryFormData {
    id_proyecto: string;
    presidente: string;
    secretario: string;
    vocal: string;
    suplente_1: string;
    suplente_2: string;
}

export interface AsignacionJuradoProps {
    proyectos: ProyectoJurado[];
    docentes: DocenteJurado[];
    proyectoSeleccionadoId: number | null;
}

export interface ConsultaJuradosProps {
    proyectos: ProyectoJurado[];
    docentes: DocenteJurado[];
}
