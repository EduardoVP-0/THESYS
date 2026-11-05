export const MESES = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
];

export const MESES_CORTOS = [
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
];

export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const DIAS_SEMANA = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
];

export function capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function isoDelDia(anio: number, mes: number, dia: number): string {
    return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function parseIso(fecha: string): Date {
    const [anio, mes, dia] = fecha.split('-').map(Number);

    return new Date(anio, mes - 1, dia);
}

export function etiquetaMes(fecha: Date): string {
    return `${capitalizar(MESES[fecha.getMonth()])} ${fecha.getFullYear()}`;
}

export function fechaLarga(fecha: string): string {
    const dia = parseIso(fecha);
    const nombreDia = DIAS_SEMANA[dia.getDay()];

    return `${nombreDia} ${dia.getDate()} de ${MESES[dia.getMonth()]} de ${dia.getFullYear()}`;
}
