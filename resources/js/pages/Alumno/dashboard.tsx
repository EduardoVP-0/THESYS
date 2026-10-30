import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    Clock,
    FolderKanban,
    History,
    MessageSquareText,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { ESTILOS_TONO, ICONOS_EVENTO } from '@/lib/eventos';
import { index as calendarioIndex } from '@/routes/alumno/calendario';
import { index as tesisAsesorIndex } from '@/routes/alumno/tesis-asesor';
import { index as tesisRevisoresIndex } from '@/routes/alumno/tesis-revisores';

interface AlumnoInfo {
    nombre_completo: string;
    matricula: string;
    carrera: string;
}

interface ProyectoInfo {
    id_proyecto: number;
    titulo: string;
    estado: string;
}

interface EtapaProgreso {
    clave: string;
    etiqueta: string;
    corta: string;
    peso: number;
    estado: 'completado' | 'en_curso' | 'pendiente';
    porcentaje: number;
    detalle: string;
}

interface Progreso {
    porcentaje: number;
    completadas: number;
    total: number;
    etapas: EtapaProgreso[];
}

interface EstadoResumen {
    label: string;
    detalle: string;
    tono: string;
}

interface ProximoHito {
    titulo: string;
    fecha: string | null;
    etiqueta_fecha: string | null;
    dias_restantes: number | null;
    detalle: string;
    estado: string;
}

interface Retroalimentacion {
    total: number;
    autor: string | null;
    origen: 'director' | 'revisor' | null;
    fecha: string | null;
    texto: string | null;
}

interface Actividad {
    id: string;
    tipo: string;
    tono: string;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    etiqueta_tiempo: string;
}

interface ProximaFecha {
    id: string;
    titulo: string;
    categoria: string;
    fecha: string | null;
    detalle: string;
    estado: string;
}

interface Props {
    nombre: string;
    alumno: AlumnoInfo | null;
    proyecto: ProyectoInfo | null;
    saludo: string;
    fecha_larga: string;
    resumen: {
        estado: EstadoResumen;
        proximo_hito: ProximoHito;
        retroalimentacion: Retroalimentacion;
    };
    progreso: Progreso;
    actividad_reciente: Actividad[];
    proximas_fechas: ProximaFecha[];
}

const MESES_CORTOS = [
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

const ESTILOS_ESTADO: Record<string, { badge: string; punto: string }> = {
    success: {
        badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        punto: 'bg-emerald-500',
    },
    info: {
        badge: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
        punto: 'bg-sky-500',
    },
    warning: {
        badge: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        punto: 'bg-amber-500',
    },
    danger: {
        badge: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400',
        punto: 'bg-red-500',
    },
    neutral: {
        badge: 'border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300',
        punto: 'bg-slate-400',
    },
};

const COLORES_ETAPA: Record<EtapaProgreso['estado'], string> = {
    completado: 'bg-[#B8D4E3] dark:bg-[#B8D4E3]/80',
    en_curso: 'bg-[#10B981]',
    pendiente: 'bg-slate-300 dark:bg-slate-700',
};

const ESTILOS_FECHA: Record<string, string> = {
    programada:
        'bg-[#B8D4E3]/30 text-slate-700 dark:bg-[#B8D4E3]/10 dark:text-slate-200',
    en_espera: 'bg-muted text-muted-foreground',
    pendiente: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    concluida: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
};

function descomponerFecha(iso: string): { dia: string; mes: string } {
    const [, mes, dia] = iso.split('-').map(Number);

    return {
        dia: String(dia).padStart(2, '0'),
        mes: MESES_CORTOS[mes - 1] ?? '',
    };
}

function etiquetaDias(dias: number | null): string | null {
    if (dias === null) {
        return null;
    }

    if (dias === 0) {
        return 'Hoy';
    }

    if (dias === 1) {
        return '1 día restante';
    }

    if (dias > 1) {
        return `${dias} días restantes`;
    }

    return 'Fecha pasada';
}

function TarjetaFecha({ item }: { item: ProximaFecha }) {
    const fecha = item.fecha ? descomponerFecha(item.fecha) : null;
    const estilo = ESTILOS_FECHA[item.estado] ?? ESTILOS_FECHA.en_espera;

    return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3">
            <div
                className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-lg ${estilo}`}
            >
                {fecha ? (
                    <>
                        <span className="text-base leading-none font-bold">
                            {fecha.dia}
                        </span>
                        <span className="mt-0.5 text-[9px] font-semibold tracking-wider uppercase">
                            {fecha.mes}
                        </span>
                    </>
                ) : (
                    <Clock className="size-5" />
                )}
            </div>

            <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground">
                    {item.titulo}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">
                    {item.categoria}
                </p>
                {item.detalle && (
                    <p className="truncate text-[10px] text-muted-foreground">
                        {item.detalle}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function AlumnoDashboard({
    nombre,
    alumno,
    proyecto,
    saludo,
    fecha_larga,
    resumen,
    progreso,
    actividad_reciente,
    proximas_fechas,
}: Props) {
    const estadoEstilos =
        ESTILOS_ESTADO[resumen.estado.tono] ?? ESTILOS_ESTADO.neutral;
    const retroalimentacion = resumen.retroalimentacion;
    const proximoHito = resumen.proximo_hito;
    const diasRestantes = etiquetaDias(proximoHito.dias_restantes);

    const feedbackHref =
        retroalimentacion.total > 0 && retroalimentacion.origen === 'director'
            ? tesisAsesorIndex()
            : retroalimentacion.total > 0 &&
                retroalimentacion.origen === 'revisor'
              ? tesisRevisoresIndex()
              : null;

    const tarjetaRetroalimentacion = (
        <Card className="h-full gap-0 rounded-xl border-border bg-card py-0 shadow-xs transition-colors hover:border-[#B8D4E3]">
            <CardContent className="flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Retroalimentación reciente
                    </p>
                    <div className="rounded-lg bg-[#B8D4E3]/30 p-1.5 text-slate-600 dark:bg-[#B8D4E3]/10 dark:text-slate-300">
                        <MessageSquareText className="size-4" />
                    </div>
                </div>

                <p className="mt-2 text-sm leading-snug font-bold text-foreground">
                    {retroalimentacion.total > 0
                        ? `${retroalimentacion.total} ${
                              retroalimentacion.total === 1
                                  ? 'comentario'
                                  : 'comentarios'
                          }`
                        : 'Sin comentarios'}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {retroalimentacion.autor
                        ? `De ${retroalimentacion.autor}`
                        : 'Aún no hay retroalimentación'}
                </p>

                {feedbackHref && (
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[10px] font-semibold text-[#10B981]">
                        Ver retroalimentación
                        <ArrowRight className="size-3" />
                    </span>
                )}
            </CardContent>
        </Card>
    );

    return (
        <>
            <Head title="Mi panel" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 text-foreground md:p-6">
                <header className="flex flex-col gap-1">
                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {fecha_larga}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {saludo}, {nombre}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Esto es lo que está pasando con tu tesis.
                    </p>
                    {alumno && (
                        <p className="text-[11px] text-muted-foreground/80">
                            {alumno.carrera} · {alumno.matricula}
                        </p>
                    )}
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="h-full gap-0 rounded-xl border-border bg-card py-0 shadow-xs">
                        <CardContent className="flex h-full flex-col p-4">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Mi proyecto
                                </p>
                                <div className="rounded-lg bg-[#B8D4E3]/30 p-1.5 text-slate-600 dark:bg-[#B8D4E3]/10 dark:text-slate-300">
                                    <FolderKanban className="size-4" />
                                </div>
                            </div>

                            <p className="mt-2 line-clamp-2 min-h-9 text-sm leading-snug font-bold text-foreground">
                                {proyecto?.titulo ?? 'Sin proyecto registrado'}
                            </p>

                            <div className="mt-auto pt-3">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground">
                                        Progreso
                                    </span>
                                    <span className="font-bold text-foreground">
                                        {progreso.porcentaje}%
                                    </span>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-[#10B981] transition-all"
                                        style={{
                                            width: `${progreso.porcentaje}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-full gap-0 rounded-xl border-border bg-card py-0 shadow-xs">
                        <CardContent className="flex h-full flex-col p-4">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Estado
                                </p>
                                <div className="rounded-lg bg-[#B8D4E3]/30 p-1.5 text-slate-600 dark:bg-[#B8D4E3]/10 dark:text-slate-300">
                                    <Activity className="size-4" />
                                </div>
                            </div>

                            <p className="mt-2 text-sm leading-snug font-bold text-foreground">
                                {resumen.estado.label}
                            </p>
                            <span
                                className={`mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${estadoEstilos.badge}`}
                            >
                                <span
                                    className={`size-1.5 rounded-full ${estadoEstilos.punto}`}
                                />
                                {resumen.estado.detalle}
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="h-full gap-0 rounded-xl border-border bg-card py-0 shadow-xs">
                        <CardContent className="flex h-full flex-col p-4">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Próximo hito
                                </p>
                                <div className="rounded-lg bg-[#B8D4E3]/30 p-1.5 text-slate-600 dark:bg-[#B8D4E3]/10 dark:text-slate-300">
                                    <CalendarClock className="size-4" />
                                </div>
                            </div>

                            <p className="mt-2 text-sm leading-snug font-bold text-foreground">
                                {proximoHito.etiqueta_fecha ?? 'Por definir'}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                                {proximoHito.titulo} · {proximoHito.detalle}
                            </p>

                            <div className="mt-auto pt-2">
                                {proximoHito.estado === 'concluida' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                        <CheckCircle2 className="size-3" />
                                        Completado
                                    </span>
                                ) : diasRestantes ? (
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                            proximoHito.estado === 'pendiente'
                                                ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                : 'border-[#10B981]/25 bg-[#10B981]/10 text-[#10B981]'
                                        }`}
                                    >
                                        <Clock className="size-3" />
                                        {diasRestantes}
                                    </span>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    {feedbackHref ? (
                        <Link href={feedbackHref} className="block h-full">
                            {tarjetaRetroalimentacion}
                        </Link>
                    ) : (
                        tarjetaRetroalimentacion
                    )}
                </section>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="gap-0 rounded-xl border-border bg-card py-0 shadow-xs lg:col-span-2">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-foreground">
                                        Progreso de la tesis
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground">
                                        {progreso.completadas} de {progreso.total}{' '}
                                        etapas completadas
                                    </p>
                                </div>

                                <Link
                                    href={calendarioIndex()}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Ver detalles
                                    <ArrowRight className="size-3" />
                                </Link>
                            </div>

                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-foreground">
                                    {progreso.porcentaje}%
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    completado
                                </span>
                            </div>

                            <div
                                className="mt-5 flex h-44 items-end gap-2 sm:gap-3"
                                role="img"
                                aria-label={`Progreso de la tesis: ${progreso.porcentaje}% completado`}
                            >
                                {progreso.etapas.map((etapa) => (
                                    <div
                                        key={etapa.clave}
                                        className="flex flex-1 flex-col items-center gap-2"
                                    >
                                        <span className="text-[9px] font-semibold text-muted-foreground">
                                            {etapa.porcentaje}%
                                        </span>
                                        <div
                                            className="flex h-36 w-full items-end overflow-hidden rounded-t-md bg-muted/50"
                                            title={`${etapa.etiqueta}: ${etapa.detalle}`}
                                        >
                                            <div
                                                className={`w-full rounded-t-md transition-all ${COLORES_ETAPA[etapa.estado]}`}
                                                style={{
                                                    height: `${Math.max(
                                                        etapa.porcentaje,
                                                        4,
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-full truncate text-center text-[9px] font-medium text-muted-foreground">
                                            {etapa.corta}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span className="size-1.5 rounded-full bg-[#B8D4E3]" />
                                    Completado
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span className="size-1.5 rounded-full bg-[#10B981]" />
                                    En curso
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span className="size-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    Pendiente
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 rounded-xl border-border bg-card py-0 shadow-xs">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-base font-bold text-foreground">
                                    Actividad reciente
                                </h2>
                                <Link
                                    href={calendarioIndex()}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Ver todo
                                    <ArrowRight className="size-3" />
                                </Link>
                            </div>

                            {actividad_reciente.length > 0 ? (
                                <div className="mt-4 space-y-3">
                                    {actividad_reciente.map((item) => {
                                        const estilos =
                                            ESTILOS_TONO[item.tono] ??
                                            ESTILOS_TONO.info;
                                        const Icono =
                                            ICONOS_EVENTO[item.tipo] ?? History;

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-start gap-3"
                                            >
                                                <div
                                                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${estilos.icono}`}
                                                >
                                                    <Icono className="size-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-foreground">
                                                        {item.titulo}
                                                    </p>
                                                    {item.descripcion && (
                                                        <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                                            {item.descripcion}
                                                        </p>
                                                    )}
                                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                        {item.etiqueta_tiempo}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
                                    <div className="rounded-full bg-muted p-3 text-muted-foreground">
                                        <History className="size-5" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        Aún no hay actividad
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Tus avances aparecerán aquí.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Card className="gap-0 rounded-xl border-border bg-card py-0 shadow-xs">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold text-foreground">
                                    Próximas fechas
                                </h2>
                                <p className="text-[11px] text-muted-foreground">
                                    Los siguientes hitos de tu proceso.
                                </p>
                            </div>

                            <Link
                                href={calendarioIndex()}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Abrir calendario
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>

                        {proximas_fechas.length > 0 ? (
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {proximas_fechas.map((item) => (
                                    <TarjetaFecha key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
                                <CalendarDays className="size-6 text-muted-foreground" />
                                <p className="text-xs font-medium text-foreground">
                                    Sin fechas próximas
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Cuando se programen nuevos hitos aparecerán
                                    aquí.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AlumnoDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Dashboard',
            href: '/alumno/dashboard',
        },
    ],
};
