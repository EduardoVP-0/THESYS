export interface SinodalDocenteInfo {
    nombre_completo: string;
    iniciales: string;
    grado_academico: string;
    abreviatura_grado: string;
    especialidad: string;
    email?: string | null;
}

export interface SinodalItem {
    id_jurado_proyecto: number;
    id_usuario: number;
    cargo: string;
    es_titular: boolean;
    estado_aceptacion: string;
    fecha_asignacion?: string | null;
    docente: SinodalDocenteInfo;
}

export interface AsesorInfo {
    nombre_completo: string;
    iniciales: string;
    grado_academico: string;
    abreviatura_grado: string;
    especialidad: string;
    email?: string | null;
}

export interface MiJuradoProyectoData {
    id_proyecto: number;
    titulo: string;
    estado: string;
    tiene_jurado: boolean;
    jurados: SinodalItem[];
    asesor?: AsesorInfo | null;
}

export interface AlumnoBasicInfo {
    id_usuario: number;
    nombre_completo: string;
    matricula: string;
    carrera: string;
}

/**
 * Devuelve la descripcion protocolaria normativa del cargo dentro del examen profesional.
 */
export function getDescripcionCargoProtocolo(cargo: string): {
    tituloProtocolar: string;
    descripcion: string;
    participacionDefensa: string;
} {
    switch (cargo) {
        case 'Presidente':
            return {
                tituloProtocolar: 'Presidente del Jurado (Titular)',
                descripcion:
                    'Es la máxima autoridad académica durante el examen profesional. Dirige el acto protocolario, conduce el orden de las réplicas, coordina la deliberación privada del comité y toma la protesta de ley al sustentante en caso de aprobación.',
                participacionDefensa:
                    'Participa activamente en la réplica oral y emite voto directo para el veredicto oficial.',
            };
        case 'Secretario':
            return {
                tituloProtocolar: 'Secretario del Jurado (Titular)',
                descripcion:
                    'Da fe del cumplimiento normativo del acto de defensa de tesis. Verifica la documentación del expediente, redacta y da lectura oficial al acta de examen profesional al concluir la deliberación del jurado.',
                participacionDefensa:
                    'Realiza interrogatorio académico durante la defensa y cuenta con derecho a voto en el dictamen final.',
            };
        case 'Vocal':
            return {
                tituloProtocolar: 'Vocal del Jurado (Titular)',
                descripcion:
                    'Integra la terna titular de evaluación. Inicia el orden de interrogatorio y réplica académica sobre los fundamentos metodológicos, teóricos y resultados del trabajo de investigación presentado.',
                participacionDefensa:
                    'Interroga al sustentante en la defensa oral y emite voto directo para el veredicto del comité.',
            };
        case 'Suplente 1':
        case 'Suplente 2':
            return {
                tituloProtocolar: `${cargo} del Jurado (Suplente)`,
                descripcion:
                    'Docente designado oficialmente para garantizar el quórum reglamentario del examen profesional. En caso de ausencia justificada o causa de fuerza mayor de alguno de los sinodales titulares, asume la titularidad y el derecho a voto.',
                participacionDefensa:
                    'Interviene con voz y voto únicamente cuando sustituye a un integrante titular durante el acto protocolario.',
            };
        default:
            return {
                tituloProtocolar: 'Integrante del Comité Evaluador',
                descripcion:
                    'Docente designado por la coordinación académica para participar en la evaluación y defensa del trabajo recepcional.',
                participacionDefensa:
                    'Participa conforme a los lineamientos vigentes de titulación institucional.',
            };
    }
}


