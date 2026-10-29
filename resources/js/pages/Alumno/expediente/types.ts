export interface AlumnoDetalle {
    id_usuario: number;
    matricula: string;
    nombre_completo: string;
    iniciales: string;
    curp: string;
    email?: string;
    telefono?: string;
    carrera: string;
    turno?: string;
    generacion?: string;
    estado_academico: string;
    fecha_ingreso?: string;
}

export interface AnteproyectoDoc {
    id_proyecto: number;
    nombre_archivo: string;
    ruta: string;
    fecha_envio: string;
    url_visor: string;
    estado: string;
}

export interface VersionTesisDoc {
    id_version: number;
    numero_version: string;
    comentario?: string | null;
    nombre_archivo: string;
    ruta: string;
    fecha: string;
    url_visor: string;
}

export interface OficioDoc {
    id_oficio: number;
    tipo_oficio: string;
    nombre_archivo: string;
    ruta: string;
    fecha: string;
    url_visor: string;
}

export interface PagoDoc {
    id_pago: number;
    concepto: string;
    monto: number | string;
    referencia_bancaria?: string | null;
    estado_validacion: string;
    fecha: string;
}

export interface DocenteParticipante {
    id_usuario: number;
    nombre_completo: string;
    grado_academico?: string;
    especialidad?: string;
    email?: string;
}

export interface ProyectoDetalle {
    id_proyecto: number;
    titulo: string;
    resumen?: string | null;
    estado: string;
    observaciones_coordinacion?: string | null;
    asesor?: DocenteParticipante | null;
    revisores: DocenteParticipante[];
}

export interface CarpetasExpediente {
    anteproyecto: AnteproyectoDoc | null;
    versiones_tesis: VersionTesisDoc[];
    oficios: OficioDoc[];
    pagos: PagoDoc[];
}

export interface ResumenExpediente {
    total_archivos: number;
    tiene_anteproyecto: boolean;
    tiene_asesor: boolean;
    tiene_revisores: boolean;
    tiene_versiones: boolean;
    tiene_oficios: boolean;
}

