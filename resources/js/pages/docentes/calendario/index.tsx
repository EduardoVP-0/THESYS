import { Head } from '@inertiajs/react';
import { CalendarX2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import { CalendarMonth } from './calendar-month';
import { DayEventsDialog } from './day-events-dialog';
import { parseIso } from './date-utils';
import { FiltersMenu } from './filters-menu';
import type {
    CalendarioDocenteProps,
    EventoCalendario,
    RolCalendario,
} from './types';
import { UpcomingEvents } from './upcoming-events';
import { ORDEN_ROLES, ROLES_CALENDARIO } from './visuals';

function compararEventos(a: EventoCalendario, b: EventoCalendario): number {
    const izquierda = `${a.fecha} ${a.hora ?? '00:00'}`;
    const derecha = `${b.fecha} ${b.hora ?? '00:00'}`;

    return izquierda.localeCompare(derecha);
}

export default function CalendarioDocente({
    roles_disponibles,
    eventos,
    hoy,
}: CalendarioDocenteProps) {
    const hoyDate = useMemo(() => parseIso(hoy), [hoy]);

    const [mes, setMes] = useState(
        () => new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1),
    );
    const [seleccionada, setSeleccionada] = useState(hoy);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [rolesActivos, setRolesActivos] = useState<RolCalendario[]>(() =>
        roles_disponibles.map((rol) => rol.clave),
    );

    const eventosFiltrados = useMemo(() => {
        const filtrados = eventos.filter((evento) =>
            evento.roles.some((rol) => rolesActivos.includes(rol)),
        );

        return [...filtrados].sort(compararEventos);
    }, [eventos, rolesActivos]);

    const eventosPorFecha = useMemo(() => {
        const mapa: Record<string, EventoCalendario[]> = {};

        for (const evento of eventosFiltrados) {
            (mapa[evento.fecha] ??= []).push(evento);
        }

        return mapa;
    }, [eventosFiltrados]);

    const eventosDelDia = eventosPorFecha[seleccionada] ?? [];

    const eventosFuturos = useMemo(
        () => eventosFiltrados.filter((evento) => evento.fecha >= hoy),
        [eventosFiltrados, hoy],
    );

    const eventosRecientes = useMemo(
        () =>
            [...eventosFiltrados]
                .filter((evento) => evento.fecha < hoy)
                .reverse(),
        [eventosFiltrados, hoy],
    );

    const listaEventos =
        eventosFuturos.length > 0
            ? eventosFuturos.slice(0, 5)
            : eventosRecientes.slice(0, 5);

    const tituloLista =
        eventosFuturos.length > 0
            ? 'Próximos eventos'
            : eventosRecientes.length > 0
              ? 'Eventos recientes'
              : 'Próximos eventos';

    const detalleLista =
        eventosFuturos.length > 0
            ? 'Tus siguientes fechas importantes.'
            : eventosRecientes.length > 0
              ? 'Últimos movimientos de tus proyectos.'
              : 'Aún no hay registros en tu agenda.';

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

    const seleccionarFecha = (fecha: string) => {
        setSeleccionada(fecha);
        setModalAbierto(true);
    };

    const abrirEvento = (evento: EventoCalendario) => {
        const fecha = parseIso(evento.fecha);

        setMes(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
        setSeleccionada(evento.fecha);
        setModalAbierto(true);
    };

    const alternarRol = (rol: RolCalendario) => {
        setRolesActivos((actuales) => {
            if (actuales.includes(rol)) {
                return actuales.length === 1
                    ? actuales
                    : actuales.filter((actual) => actual !== rol);
            }

            return ORDEN_ROLES.filter(
                (clave) => actuales.includes(clave) || clave === rol,
            );
        });
    };

    const mostrarTodosLosRoles = () => {
        setRolesActivos(roles_disponibles.map((rol) => rol.clave));
    };

    return (
        <>
            <Head title="Calendario docente" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 text-foreground md:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Calendario
                        </h1>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Gestiona y da seguimiento a los proyectos de
                            titulación.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {roles_disponibles.length > 1 ? (
                            <FiltersMenu
                                roles={roles_disponibles}
                                seleccionados={rolesActivos}
                                onToggle={alternarRol}
                                onMostrarTodos={mostrarTodosLosRoles}
                            />
                        ) : roles_disponibles.length === 1 ? (
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase ${ROLES_CALENDARIO[roles_disponibles[0].clave].chip}`}
                            >
                                <span
                                    className={`size-1.5 rounded-full ${ROLES_CALENDARIO[roles_disponibles[0].clave].punto}`}
                                />
                                Vista de {roles_disponibles[0].etiqueta}
                            </span>
                        ) : null}
                    </div>
                </header>

                {roles_disponibles.length === 0 ? (
                    <Card className="rounded-2xl border-border bg-card shadow-xs">
                        <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                            <CalendarX2 className="size-8 text-muted-foreground" />
                            <p className="text-sm font-bold text-foreground">
                                Aún no tienes funciones docentes asignadas
                            </p>
                            <p className="max-w-md text-xs text-muted-foreground">
                                Cuando la coordinación te asigne como Asesor,
                                Revisor o Jurado, aquí aparecerán tus fechas y
                                registros.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
                        <CalendarMonth
                            mes={mes}
                            seleccionada={seleccionada}
                            hoy={hoy}
                            eventosPorFecha={eventosPorFecha}
                            onMesAnterior={irMesAnterior}
                            onMesSiguiente={irMesSiguiente}
                            onIrHoy={irHoy}
                            onSeleccionar={seleccionarFecha}
                        />

                        <UpcomingEvents
                            titulo={tituloLista}
                            detalle={detalleLista}
                            eventos={listaEventos}
                            onEventoClick={abrirEvento}
                        />
                    </div>
                )}
            </div>

            <DayEventsDialog
                abierto={modalAbierto}
                fecha={seleccionada}
                eventos={eventosDelDia}
                onOpenChange={setModalAbierto}
            />
        </>
    );
}

CalendarioDocente.layout = {
    breadcrumbs: [
        {
            title: 'Docente',
            href: '/docente/dashboard',
        },
        {
            title: 'Calendario',
            href: '/docente/calendario',
        },
    ],
};
