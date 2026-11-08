import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    Search,
    UserCheck,
    UserRoundCheck,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { store } from '@/routes/admin/asignaciones/asesores';
import type { AsignacionAsesorProps, AsesorAsignacion } from './types';

/**
 * VISTA PRINCIPAL: ASIGNAR ASESOR A ANTEPROYECTO APROBADO
 */
export default function AsignacionAsesoresIndex({
    solicitudes,
    asesores,
}: AsignacionAsesorProps) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes' | 'asignados'>('todos');
    const [busquedaAsesor, setBusquedaAsesor] = useState('');

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            id_alumno: '',
            id_proyecto: '',
            id_asesor: '',
        });

    const solicitudesFiltradas = useMemo(() => {
        if (filtroEstado === 'pendientes') {
            return solicitudes.filter((s) => !s.asesor_actual);
        }
        if (filtroEstado === 'asignados') {
            return solicitudes.filter((s) => Boolean(s.asesor_actual));
        }
        return solicitudes;
    }, [solicitudes, filtroEstado]);

    const solicitudSeleccionada =
        solicitudes.find(
            (solicitud) =>
                String(solicitud.id_alumno) === data.id_alumno &&
                String(solicitud.id_proyecto) === data.id_proyecto,
        ) ?? null;

    const esCambioAsesor = Boolean(solicitudSeleccionada?.asesor_actual);
    const proyectoBloqueado = Boolean(solicitudSeleccionada?.bloqueado);

    const asesoresFiltrados = useMemo(() => {
        const term = busquedaAsesor.trim().toLowerCase();
        if (!term) return asesores;
        return asesores.filter(
            (a) =>
                a.nombre_completo.toLowerCase().includes(term) ||
                a.especialidad.toLowerCase().includes(term) ||
                a.grado_academico.toLowerCase().includes(term),
        );
    }, [asesores, busquedaAsesor]);

    const asesorSeleccionado =
        asesores.find(
            (asesor) => String(asesor.id_usuario) === data.id_asesor,
        ) ?? null;

    const asesoresDisponibles = asesores.filter(
        (asesor) => asesor.disponible,
    ).length;

    const totalPendientes = solicitudes.filter((s) => !s.asesor_actual).length;
    const totalAsignados = solicitudes.filter((s) => Boolean(s.asesor_actual)).length;

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);

            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const handleSolicitudChange = (value: string) => {
        const solicitud = solicitudes.find(
            (item) => `${item.id_alumno}:${item.id_proyecto}` === value,
        );

        setData({
            id_alumno: solicitud ? String(solicitud.id_alumno) : '',
            id_proyecto: solicitud ? String(solicitud.id_proyecto) : '',
            id_asesor: '',
        });
        clearErrors();
    };

    const handleAsesorSelect = (asesor: AsesorAsignacion) => {
        if (!asesor.disponible) {
            return;
        }

        setData(
            'id_asesor',
            data.id_asesor === String(asesor.id_usuario)
                ? ''
                : String(asesor.id_usuario),
        );
        clearErrors('id_asesor');
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
            },
        });
    };

    return (
        <>
            <Head title="Asignar Asesor" />

            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                {flash?.success && showAlert && (
                    <div className="alert flex animate-in items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 alert-soft px-4 py-2.5 text-sm alert-success text-foreground shadow-xs duration-300 fade-in-50 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAlert(false)}
                            className="text-lg leading-none text-muted-foreground hover:text-foreground"
                        >
                            &times;
                        </button>
                    </div>
                )}

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        ASIGNACIÓN DE ASESOR
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Vincula un asesor académico a los anteproyectos
                        aprobados que aún no cuentan con uno.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6"
                    noValidate
                >
                    <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-[#10B981]/15 p-2.5 text-[#10B981]">
                                    <UserRoundCheck className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">
                                        Asignar o cambiar asesor de anteproyecto aprobado
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Selecciona al sustentante para asignarle su asesor inicial o cambiar su asesor actual.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setFiltroEstado('todos')}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                        filtroEstado === 'todos'
                                            ? 'border-[#10B981] bg-[#10B981]/15 text-[#10B981]'
                                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Todos ({solicitudes.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFiltroEstado('pendientes')}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                        filtroEstado === 'pendientes'
                                            ? 'border-[#10B981] bg-[#10B981]/15 text-[#10B981]'
                                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Pendientes ({totalPendientes})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFiltroEstado('asignados')}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                        filtroEstado === 'asignados'
                                            ? 'border-[#10B981] bg-[#10B981]/15 text-[#10B981]'
                                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Con asesor ({totalAsignados})
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="sustentante"
                                    className="text-xs font-semibold"
                                >
                                    Sustentante
                                </Label>
                                <Select
                                    value={
                                        solicitudSeleccionada
                                            ? `${solicitudSeleccionada.id_alumno}:${solicitudSeleccionada.id_proyecto}`
                                            : ''
                                    }
                                    onValueChange={handleSolicitudChange}
                                    disabled={
                                        solicitudesFiltradas.length === 0 || processing
                                    }
                                >
                                    <SelectTrigger
                                        id="sustentante"
                                        aria-invalid={Boolean(errors.id_alumno)}
                                        className="h-10 w-full border-border bg-background text-sm"
                                    >
                                        <SelectValue
                                            placeholder={
                                                solicitudesFiltradas.length === 0
                                                    ? 'No hay sustentantes en este filtro'
                                                    : 'Selecciona un sustentante'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="border-border bg-popover max-h-72">
                                        {solicitudesFiltradas.map((solicitud) => (
                                            <SelectItem
                                                key={`${solicitud.id_alumno}:${solicitud.id_proyecto}`}
                                                value={`${solicitud.id_alumno}:${solicitud.id_proyecto}`}
                                            >
                                                {
                                                    solicitud.alumno
                                                        .nombre_completo
                                                }{' '}
                                                - {solicitud.alumno.matricula}
                                                {solicitud.asesor_actual
                                                    ? ` · (Asesor: ${solicitud.asesor_actual.nombre_completo})`
                                                    : ' · (Sin asesor)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.id_alumno && (
                                    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                                        <AlertCircle className="size-3.5" />
                                        {errors.id_alumno}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="anteproyecto"
                                    className="text-xs font-semibold"
                                >
                                    Anteproyecto aprobado
                                </Label>
                                <Input
                                    id="anteproyecto"
                                    readOnly
                                    value={
                                        solicitudSeleccionada?.proyecto
                                            .titulo ?? ''
                                    }
                                    placeholder="Selecciona un sustentante para ver su anteproyecto"
                                    title={
                                        solicitudSeleccionada?.proyecto
                                            .titulo ?? ''
                                    }
                                    className="h-10 cursor-default border-border bg-muted/30 text-sm text-foreground"
                                />
                                {errors.id_proyecto && (
                                    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                                        <AlertCircle className="size-3.5" />
                                        {errors.id_proyecto}
                                    </p>
                                )}
                                {!errors.id_proyecto &&
                                    solicitudSeleccionada?.alumno.carrera && (
                                        <p
                                            className="truncate text-[11px] text-muted-foreground"
                                            title={
                                                solicitudSeleccionada.alumno
                                                    .carrera
                                            }
                                        >
                                            Carrera:{' '}
                                            {
                                                solicitudSeleccionada.alumno
                                                    .carrera
                                            }
                                        </p>
                                    )}
                            </div>
                        </div>

                        {solicitudes.length === 0 && (
                            <p className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                                Todos los anteproyectos aprobados ya tienen un
                                asesor asignado. Cuando exista uno pendiente
                                aparecerá en esta sección.
                            </p>
                        )}

                        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="size-4 shrink-0 text-[#10B981]" />
                                {asesorSeleccionado ? (
                                    <span>
                                        {esCambioAsesor ? 'Nuevo asesor seleccionado:' : 'Asesor seleccionado:'}{' '}
                                        <strong className="font-semibold text-foreground">
                                            {asesorSeleccionado.nombre_completo}
                                        </strong>
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        {solicitudes.length === 0
                                            ? 'No hay anteproyectos aprobados registrados.'
                                            : solicitudSeleccionada
                                              ? proyectoBloqueado
                                                  ? 'Este proyecto ya concluyó su examen profesional y no admite cambios de asesor.'
                                                  : esCambioAsesor
                                                    ? 'Selecciona un nuevo docente de la lista inferior para reemplazar al asesor actual.'
                                                    : 'Selecciona un asesor de la lista para continuar.'
                                              : 'Selecciona primero un sustentante y luego un asesor.'}
                                    </span>
                                )}
                            </div>
                            {solicitudSeleccionada?.asesor_actual && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10B981]">
                                    Asesor actual: {solicitudSeleccionada.asesor_actual.nombre_completo}
                                </span>
                            )}
                        </div>
                    </section>

                    <section className="flex flex-col gap-3">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">
                                    Asesores
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Disponibilidad y carga académica ({asesoresDisponibles} de {asesores.length} disponibles).
                                </p>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={busquedaAsesor}
                                    onChange={(e) => setBusquedaAsesor(e.target.value)}
                                    placeholder="Buscar docente o especialidad..."
                                    className="h-9 border-border bg-card pl-8 text-xs"
                                />
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                            <Table className="min-w-[860px] table-fixed">
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[42%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                            Docente
                                        </TableHead>
                                        <TableHead className="w-[20%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                            Carga académica
                                        </TableHead>
                                        <TableHead className="w-[20%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                            Disponibilidad
                                        </TableHead>
                                        <TableHead className="w-[18%] px-4 text-right text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                            Acción
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asesoresFiltrados.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="px-4 py-10 text-center text-sm text-muted-foreground"
                                            >
                                                No se encontraron docentes con ese criterio de búsqueda.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        asesoresFiltrados.map((asesor) => {
                                            const estaSeleccionado =
                                                data.id_asesor ===
                                                String(asesor.id_usuario);
                                            const esAsesorActual =
                                                solicitudSeleccionada?.asesor_actual?.id_usuario ===
                                                asesor.id_usuario;
                                            const esRevisorProyecto = Boolean(
                                                solicitudSeleccionada?.revisores_ids?.includes(
                                                    asesor.id_usuario,
                                                ),
                                            );
                                            const esPresidenteJurado =
                                                solicitudSeleccionada?.presidente_jurado_id ===
                                                asesor.id_usuario;
                                            const porcentajeCarga = Math.min(
                                                (asesor.carga_actual /
                                                    asesor.carga_maxima) *
                                                    100,
                                                100,
                                            );

                                            return (
                                                <TableRow
                                                    key={asesor.id_usuario}
                                                    className={
                                                        estaSeleccionado
                                                            ? 'bg-[#10B981]/5'
                                                            : undefined
                                                    }
                                                >
                                                    <TableCell className="px-4 py-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#10B981]/25 bg-[#10B981]/15 text-xs font-bold text-[#10B981]">
                                                                {
                                                                    asesor.iniciales
                                                                }
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p
                                                                    className="truncate text-sm font-bold text-foreground"
                                                                    title={
                                                                        asesor.nombre_completo
                                                                    }
                                                                >
                                                                    {
                                                                        asesor.nombre_completo
                                                                    }
                                                                </p>
                                                                <p
                                                                    className="truncate text-[11px] text-muted-foreground"
                                                                    title={`${asesor.grado_academico} · ${asesor.especialidad}`}
                                                                >
                                                                    {
                                                                        asesor.grado_academico
                                                                    }{' '}
                                                                    ·{' '}
                                                                    {
                                                                        asesor.especialidad
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <div className="space-y-1.5">
                                                            <p className="text-xs font-medium text-foreground">
                                                                <span
                                                                    className={
                                                                        asesor.disponible
                                                                            ? 'text-foreground'
                                                                            : 'text-[#EF4444]'
                                                                    }
                                                                >
                                                                    {
                                                                        asesor.carga_actual
                                                                    }
                                                                </span>{' '}
                                                                /{' '}
                                                                {
                                                                    asesor.carga_maxima
                                                                }{' '}
                                                                proyectos
                                                            </p>
                                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                                                <div
                                                                    className={`h-full rounded-full ${
                                                                        asesor.disponible
                                                                            ? 'bg-[#10B981]'
                                                                            : 'bg-[#EF4444]'
                                                                    }`}
                                                                    style={{
                                                                        width: `${porcentajeCarga}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                                asesor.disponible
                                                                    ? 'bg-[#10B981]/15 text-[#10B981]'
                                                                    : 'bg-[#EF4444]/15 text-[#EF4444]'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`size-1.5 rounded-full ${
                                                                    asesor.disponible
                                                                        ? 'bg-[#10B981]'
                                                                        : 'bg-[#EF4444]'
                                                                }`}
                                                            />
                                                            {asesor.disponible
                                                                ? 'Disponible'
                                                                : 'Carga completa'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-right">
                                                        {esAsesorActual ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled
                                                                className="min-w-[120px] border-2 border-[#10B981]/50 bg-[#10B981]/10 text-xs font-semibold text-[#10B981]"
                                                            >
                                                                Asesor actual
                                                            </Button>
                                                        ) : esRevisorProyecto ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled
                                                                className="min-w-[120px] border-2 border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                                                            >
                                                                Es revisor
                                                            </Button>
                                                        ) : esPresidenteJurado ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled
                                                                className="min-w-[120px] border-2 border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                                                            >
                                                                Presidente jurado
                                                            </Button>
                                                        ) : asesor.disponible ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    !solicitudSeleccionada ||
                                                                    proyectoBloqueado ||
                                                                    processing
                                                                }
                                                                onClick={() =>
                                                                    handleAsesorSelect(
                                                                        asesor,
                                                                    )
                                                                }
                                                                className={`min-w-[120px] text-xs font-semibold ${
                                                                    estaSeleccionado
                                                                        ? 'border-2 border-[#10B981] bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                                                                        : 'border-2 border-[#10B981] bg-background text-[#10B981] hover:bg-accent/40'
                                                                }`}
                                                            >
                                                                {estaSeleccionado ? (
                                                                    <>
                                                                        <CheckCircle2 className="size-3.5" />
                                                                        Seleccionado
                                                                    </>
                                                                ) : (
                                                                    'Seleccionar'
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled
                                                                className="min-w-[120px] border-2 border-border bg-background text-xs font-semibold text-muted-foreground"
                                                            >
                                                                No disponible
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {errors.id_asesor && (
                            <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                                <AlertCircle className="size-3.5" />
                                {errors.id_asesor}
                            </p>
                        )}
                    </section>

                    <section className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <UsersRound className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                            <p>
                                {solicitudSeleccionada && asesorSeleccionado ? (
                                    <>
                                        Se asignará a{' '}
                                        <strong className="font-semibold text-foreground">
                                            {asesorSeleccionado.nombre_completo}
                                        </strong>{' '}
                                        como asesor del anteproyecto{' '}
                                        <strong className="font-semibold text-foreground">
                                            {
                                                solicitudSeleccionada.proyecto
                                                    .titulo
                                            }
                                        </strong>
                                        .
                                    </>
                                ) : (
                                    'Selecciona un sustentante y un asesor para confirmar la asignación.'
                                )}
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={
                                !solicitudSeleccionada ||
                                proyectoBloqueado ||
                                !asesorSeleccionado ||
                                !asesorSeleccionado.disponible ||
                                processing
                            }
                            className="min-w-[210px] gap-2 bg-[#10B981] font-semibold text-white shadow-xs hover:bg-[#0FA875]"
                        >
                            {processing ? (
                                <Spinner className="size-4 text-white" />
                            ) : (
                                <ClipboardCheck className="size-4" />
                            )}
                            {processing
                                ? 'Guardando...'
                                : esCambioAsesor
                                  ? 'Cambiar asesor'
                                  : 'Confirmar asignación'}
                        </Button>
                    </section>
                </form>
            </div>
        </>
    );
}

AsignacionAsesoresIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Asignaciones',
            href: '/admin/asignaciones/asesores',
        },
        {
            title: 'Asesor',
            href: '/admin/asignaciones/asesores',
        },
    ],
};
