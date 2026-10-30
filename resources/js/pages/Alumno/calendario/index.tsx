import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    CalendarX2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { ESTILOS_TONO, ICONOS_EVENTO } from '@/lib/eventos';

interface AlumnoInfo {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
    matricula: string;
    carrera: string;
}

interface ProyectoInfo {
    id_proyecto: number;
    titulo: string;
    estado: string;
}

interface Evento {
    id: string;
    fecha: string;
    tipo: string;
    tono: string;
    etiqueta: string;
    titulo: string;
    descripcion: string | null;
}

interface Props {
    alumno: AlumnoInfo | null;
    proyecto: ProyectoInfo | null;
    hoy: string;
    eventos: Evento[];
}

const MESES = [
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

const DIAS_SEMANA = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
];

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const LEYENDA = [
    { tono: 'info', etiqueta: 'Registros' },
    { tono: 'success', etiqueta: 'Aprobaciones' },
    { tono: 'warning', etiqueta: 'Cambios solicitados' },
    { tono: 'danger', etiqueta: 'Examen' },
    { tono: 'neutral', etiqueta: 'Jurado' },
    { tono: 'gold', etiqueta: 'Culminación' },
];

function capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function isoDelDia(anio: number, mes: number, dia: number): string {
    return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function TarjetaEvento({ evento }: { evento: Evento }) {
    const estilos = ESTILOS_TONO[evento.tono] ?? ESTILOS_TONO.info;
    const Icono = ICONOS_EVENTO[evento.tipo] ?? CalendarDays;

    return (
        <div className={`rounded-xl border p-3 ${estilos.card}`}>
            <div className="flex items-start gap-2.5">
                <div
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${estilos.icono}`}
                >
                    <Icono className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <span
                        className={`block text-[9px] font-bold tracking-wider uppercase ${estilos.etiqueta}`}
                    >
                        {evento.etiqueta}
                    </span>
                    <p className="mt-0.5 text-xs font-bold text-foreground">
                        {evento.titulo}
                    </p>
                    {evento.descripcion && (
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {evento.descripcion}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CalendarioAcademicoIndex({
    alumno,
    proyecto,
    hoy,
    eventos,
}: Props) {
    const hoyDate = useMemo(() => new Date(`${hoy}T00:00:00`), [hoy]);

    const [mes, setMes] = useState(
        () => new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1),
    );
    const [seleccionada, setSeleccionada] = useState(hoy);

    const eventosPorFecha = useMemo(() => {
        const mapa: Record<string, Evento[]> = {};

        for (const evento of eventos) {
            (mapa[evento.fecha] ??= []).push(evento);
        }

        return mapa;
    }, [eventos]);

    const anio = mes.getFullYear();
    const mesIndex = mes.getMonth();
    const primerDiaSemana = new Date(anio, mesIndex, 1).getDay();
    const diasEnMes = new Date(anio, mesIndex + 1, 0).getDate();

    const celdas: (number | null)[] = [
        ...Array.from({ length: primerDiaSemana }, () => null),
        ...Array.from({ length: diasEnMes }, (_, indice) => indice + 1),
    ];

    const etiquetaMes = `${capitalizar(MESES[mesIndex])} ${anio}`;

    const [anioSel, mesSel, diaSel] = seleccionada.split('-').map(Number);
    const fechaSeleccionada = new Date(anioSel, mesSel - 1, diaSel);
    const diaSemanaSeleccionado = DIAS_SEMANA[fechaSeleccionada.getDay()];
    const etiquetaSeleccionada = `${diaSel} de ${MESES[mesSel - 1]} de ${anioSel}`;
    const eventosDelDia = eventosPorFecha[seleccionada] ?? [];

    const irMesAnterior = () => {
        setMes(
            (actual) =>
                new Date(actual.getFullYear(), actual.getMonth() - 1, 1),
        );
    };

    const irMesSiguiente = () => {
        setMes(
            (actual) =>
                new Date(actual.getFullYear(), actual.getMonth() + 1, 1),
        );
    };

    const irHoy = () => {
        setMes(new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1));
        setSeleccionada(hoy);
    };

    return (
        <>
            <Head title="Calendario Académico" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
                {/* ENCABEZADO INSTITUCIONAL */}
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <span className="mb-0.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Mi historial académico
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                            CALENDARIO ACADÉMICO
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Consulta cuándo subiste tus versiones, se asignaron
                            tus revisores y jurado, y la fecha de tu examen.
                        </p>
                        {alumno && (
                            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                                {alumno.nombre_completo} · {alumno.matricula} ·{' '}
                                {alumno.carrera}
                            </p>
                        )}
                    </div>

                    {proyecto && (
                        <div className="flex flex-col items-start gap-1 sm:items-end">
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8D4E3]/50 bg-[#B8D4E3]/25 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-[#B8D4E3]/10 dark:text-slate-200">
                                <CalendarDays className="size-4" />
                                {eventos.length}{' '}
                                {eventos.length === 1 ? 'evento' : 'eventos'}
                            </span>
                            <span className="max-w-[280px] truncate text-[10px] text-muted-foreground">
                                {proyecto.titulo}
                            </span>
                        </div>
                    )}
                </div>

                {!proyecto ? (
                    <Card className="rounded-2xl border-border bg-card shadow-xs">
                        <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                            <CalendarX2 className="size-8 text-muted-foreground" />
                            <p className="text-sm font-bold text-foreground">
                                Aún no tienes un proyecto registrado
                            </p>
                            <p className="max-w-md text-xs text-muted-foreground">
                                Cuando tu anteproyecto sea registrado podrás
                                consultar aquí el historial completo de tu
                                proceso de titulación.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
                        {/* CALENDARIO MENSUAL */}
                        <Card className="rounded-2xl border-border bg-card shadow-xs">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={irMesAnterior}
                                        aria-label="Mes anterior"
                                        className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-foreground">
                                            {etiquetaMes}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={irHoy}
                                            className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            Hoy
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={irMesSiguiente}
                                        aria-label="Mes siguiente"
                                        className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>

                                <div className="mt-4 grid grid-cols-7 gap-1">
                                    {DIAS_CORTOS.map((dia) => (
                                        <div
                                            key={dia}
                                            className="py-1 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                                        >
                                            {dia}
                                        </div>
                                    ))}

                                    {celdas.map((dia, indice) => {
                                        if (dia === null) {
                                            return (
                                                <div
                                                    key={`vacio-${indice}`}
                                                    aria-hidden="true"
                                                />
                                            );
                                        }

                                        const iso = isoDelDia(
                                            anio,
                                            mesIndex,
                                            dia,
                                        );
                                        const esHoy = iso === hoy;
                                        const esSeleccionado =
                                            iso === seleccionada;
                                        const eventosDia =
                                            eventosPorFecha[iso] ?? [];
                                        const tonos = [
                                            ...new Set(
                                                eventosDia.map(
                                                    (evento) => evento.tono,
                                                ),
                                            ),
                                        ].slice(0, 3);

                                        return (
                                            <button
                                                key={iso}
                                                type="button"
                                                onClick={() =>
                                                    setSeleccionada(iso)
                                                }
                                                aria-label={`Seleccionar ${dia} de ${MESES[mesIndex]} de ${anio}`}
                                                className={`relative flex h-10 w-full items-center justify-center rounded-lg text-xs transition-colors sm:h-11 ${
                                                    esSeleccionado
                                                        ? 'bg-[#B8D4E3]/60 font-bold text-slate-900 dark:bg-[#B8D4E3]/25 dark:text-slate-100'
                                                        : esHoy
                                                          ? 'font-semibold text-foreground ring-1 ring-[#10B981]/40 hover:bg-muted'
                                                          : 'text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {dia}

                                                {esHoy && (
                                                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[#10B981]" />
                                                )}

                                                {tonos.length > 0 && (
                                                    <span className="absolute bottom-1 flex items-center gap-0.5">
                                                        {tonos.map((tono) => (
                                                            <span
                                                                key={tono}
                                                                className={`size-1 rounded-full ${
                                                                    ESTILOS_TONO[
                                                                        tono
                                                                    ]?.punto ??
                                                                    'bg-slate-400'
                                                                }`}
                                                            />
                                                        ))}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3">
                                    {LEYENDA.map(({ tono, etiqueta }) => (
                                        <span
                                            key={tono}
                                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                                        >
                                            <span
                                                className={`size-1.5 rounded-full ${ESTILOS_TONO[tono].punto}`}
                                            />
                                            {etiqueta}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* EVENTOS DEL DÍA SELECCIONADO */}
                        <Card className="rounded-2xl border-border bg-card shadow-xs lg:sticky lg:top-6">
                            <CardContent className="p-4 sm:p-5">
                                <div className="border-b border-border pb-3">
                                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        {diaSemanaSeleccionado}
                                    </p>
                                    <h2 className="mt-0.5 text-base font-bold text-foreground">
                                        {etiquetaSeleccionada}
                                    </h2>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {eventosDelDia.length === 0
                                            ? 'Sin eventos registrados'
                                            : `${eventosDelDia.length} ${
                                                  eventosDelDia.length === 1
                                                      ? 'evento registrado'
                                                      : 'eventos registrados'
                                              }`}
                                    </p>
                                </div>

                                <div className="mt-4 flex flex-col gap-2.5">
                                    {eventosDelDia.length > 0 ? (
                                        eventosDelDia.map((evento) => (
                                            <TarjetaEvento
                                                key={evento.id}
                                                evento={evento}
                                            />
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                                            <CalendarX2 className="size-8 text-muted-foreground/60" />
                                            <p className="text-xs font-semibold text-foreground">
                                                Sin eventos este día
                                            </p>
                                            <p className="max-w-[240px] text-[11px] text-muted-foreground">
                                                Selecciona otro día para
                                                consultar tu historial
                                                académico.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}
