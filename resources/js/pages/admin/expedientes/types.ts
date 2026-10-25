export interface CarreraItem {
    id_carrera: number;
    nombre_carrera: string;
    siglas?: string;
    modalidad?: string;
    estado?: boolean;
}

export interface ExpedienteProyectoItem {
    id_proyecto: number;
    titulo: string;
    estado: string;
    tiene_documento: boolean;
    asesor?: {
        nombre_completo: string;
        grado_academico?: string;
    } | null;
    revisores_count: number;
    versiones_count: number;
}

export interface ExpedienteItem {
    id_usuario: number;
    matricula: string;
    nombre_completo: string;
    iniciales: string;
    email?: string;
    carrera: string;
    estado_academico: string;
    proyecto: ExpedienteProyectoItem | null;
    total_documentos: number;
    total_oficios: number;
    ultimo_movimiento: string;
}

export interface ExpedientesPagination {
    data: ExpedienteItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface ExpedienteStats {
    total: number;
    con_proyecto: number;
    en_revision: number;
    aprobados: number;
    con_cambios: number;
}

export interface ExpedienteFilters {
    search?: string;
    carrera?: string;
    estado?: string;
    per_page?: number;
}

// Detalle del Alumno (Show view)
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
