import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    Info,
    MapPin,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
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
import { index as sedesIndex } from '@/routes/admin/sedes';
import { store as storeExamen } from '@/routes/admin/asignaciones/examenes';
import { CalendarAvailability } from './components/calendar-availability';
import { ProjectSelector } from './components/project-selector';
import { formatearFecha } from './utils';
import type { AsignacionExamenProps, ExamenFormData } from './types';

const EMPTY_FORM: ExamenFormData = {
    id_proyecto: '',
    fecha_examen: '',
    hora_examen: '',
    id_sede: '',
};

export default function AsignacionExamenesIndex({
    proyectos,
    sedes,
    proyectoSeleccionadoId,
    fechaMinima,
    diasInhabiles,
    fechasOcupadas,
}: AsignacionExamenProps) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);

    const { data, setData, post, processing, errors, clearErrors } =
        useForm<ExamenFormData>({
            ...EMPTY_FORM,
            id_proyecto: proyectoSeleccionadoId
                ? String(proyectoSeleccionadoId)
                : '',
        });

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);

            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    const proyectoSeleccionado =
        proyectos.find(
            (proyecto) => String(proyecto.id_proyecto) === data.id_proyecto,
        ) ?? null;

    const sedeSeleccionada =
        sedes.find((sede) => String(sede.id_sede) === data.id_sede) ?? null;

    const puedeProgramar = Boolean(proyectoSeleccionado?.jurado_completo);
    const formularioDeshabilitado = !puedeProgramar || processing;
    const hasErrors = Object.keys(errors).length > 0;

    const canSubmit =
        Boolean(proyectoSeleccionado) &&
        puedeProgramar &&
        data.fecha_examen !== '' &&
        data.hora_examen !== '' &&
        data.id_sede !== '' &&
        !processing;

    const handleProjectChange = (value: string) => {
        setData('id_proyecto', value);
        clearErrors();
    };

    const handleDateSelect = (fecha: string) => {
        setData('fecha_examen', fecha);
        clearErrors('fecha_examen');
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        post(storeExamen.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setData(EMPTY_FORM);
                clearErrors();
            },
        });
    };

    return (
        <>
            <Head title="Asignar Examen" />

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

                {flash?.error && showAlert && (
                    <div className="alert flex animate-in items-center justify-between border-l-4 border-l-[#EF4444] bg-red-50 alert-soft px-4 py-2.5 text-sm alert-error text-foreground shadow-xs duration-300 fade-in-50 dark:bg-red-950/30">
                        <div className="flex items-center gap-2">
                            <XCircle className="size-4 text-[#EF4444]" />
                            <span className="font-medium">{flash.error}</span>
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

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            ASIGNACIÓN DE EXAMEN
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Programa la fecha, la hora y la sede del examen
                            profesional de un proyecto de tesis.
                        </p>
                    </div>

                    <Button
                        asChild
                        variant="outline"
                        className="w-full gap-2 border-2 border-[#10B981] bg-background font-semibold text-[#10B981] hover:bg-[#10B981]/10 hover:text-[#10B981] sm:w-auto"
                    >
                        <Link href={sedesIndex.url()}>
                            <MapPin className="size-4" />
                            Gestionar sedes
                        </Link>
                    </Button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6"
                    noValidate
                >
                    <ProjectSelector
                        proyectos={proyectos}
                        value={data.id_proyecto}
                        onValueChange={handleProjectChange}
                        disabled={processing}
                        error={errors.id_proyecto}
                    />

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
                        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-[#10B981]/15 p-2.5 text-[#10B981]">
                                    <CalendarClock className="size-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-[#10B981]/15 text-[10px] font-bold text-[#10B981]">
                                            2
                                        </span>
                                        <h2 className="text-lg font-bold text-foreground">
                                            Programar examen profesional
                                        </h2>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        La fecha se elige únicamente desde el
                                        calendario de disponibilidad.
                                    </p>
                                </div>
                            </div>

                            {!proyectoSeleccionado ? (
                                <div className="mt-5 flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
                                    <Info className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                                    <p>
                                        Selecciona un proyecto de tesis para
                                        habilitar la fecha, la hora y la sede
                                        del examen.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="fecha_examen"
                                            className="text-xs font-semibold"
                                        >
                                            Fecha del examen{' '}
                                            <span className="text-[#EF4444]">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="fecha_examen"
                                                type="text"
                                                readOnly
                                                value={
                                                    data.fecha_examen
                                                        ? formatearFecha(
                                                              data.fecha_examen,
                                                          )
                                                        : ''
                                                }
                                                placeholder="Selecciona una fecha en el calendario"
                                                aria-readonly="true"
                                                aria-invalid={Boolean(
                                                    errors.fecha_examen,
                                                )}
                                                className="h-10 cursor-default border-border bg-muted/20 pr-10 text-sm text-foreground focus-visible:ring-0"
                                            />
                                            <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#10B981]" />
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Este campo no se puede escribir. Usa
                                            el calendario de la derecha.
                                        </p>
                                        {errors.fecha_examen && (
                                            <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                                                <AlertCircle className="size-3.5" />
                                                {errors.fecha_examen}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="hora_examen"
                                            className="text-xs font-semibold"
                                        >
                                            Hora del examen{' '}
                                            <span className="text-[#EF4444]">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="hora_examen"
                                                type="time"
                                                value={data.hora_examen}
                                                onChange={(event) =>
                                                    setData(
                                                        'hora_examen',
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    formularioDeshabilitado
                                                }
                                                aria-invalid={Boolean(
                                                    errors.hora_examen,
                                                )}
                                                className="h-10 border-border bg-background pr-10 text-sm"
                                            />
                                            <Clock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        </div>
                                        {errors.hora_examen && (
                                            <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                                                <AlertCircle className="size-3.5" />
                                                {errors.hora_examen}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label
                                            htmlFor="id_sede"
                                            className="text-xs font-semibold"
                                        >
                                            Sede{' '}
                                            <span className="text-[#EF4444]">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={data.id_sede}
                                            onValueChange={(value) => {
                                                setData('id_sede', value);
                                                clearErrors('id_sede');
                                            }}
                                            disabled={
                                                formularioDeshabilitado ||
                                                sedes.length === 0
                                            }
                                        >
                                            <SelectTrigger
                                                id="id_sede"
                                                aria-invalid={Boolean(
                                                    errors.id_sede,
                                                )}
                                                className="h-10 w-full border-border bg-background text-sm"
                                            >
                                                <SelectValue
                                                    placeholder={
                                                        sedes.length === 0
                                                            ? 'No hay sedes activas registradas'
                                                            : 'Selecciona la sede del examen'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="border-border bg-popover">
                                                {sedes.map((sede) => (
                                                    <SelectItem
                                                        key={sede.id_sede}
                                                        value={String(
                                                            sede.id_sede,
                                                        )}
                                                    >
                                                        {sede.nombre_sede}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {sedeSeleccionada?.direccion && (
                                            <p className="flex items-start gap-1 text-[11px] text-muted-foreground">
                                                <MapPin className="mt-0.5 size-3 shrink-0" />
                                                {sedeSeleccionada.direccion}
                                            </p>
                                        )}
                                        {errors.id_sede && (
                                            <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                                                <AlertCircle className="size-3.5" />
                                                {errors.id_sede}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {sedes.length === 0 && proyectoSeleccionado && (
                                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                                    <p>
                                        No hay sedes activas disponibles.
                                        Registra o activa una sede desde{' '}
                                        <Link
                                            href={sedesIndex.url()}
                                            className="font-semibold underline underline-offset-2"
                                        >
                                            Gestión de sedes
                                        </Link>
                                        .
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="h-fit rounded-xl border border-border bg-card p-5 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-[#10B981]/15 p-2.5 text-[#10B981]">
                                    <CalendarDays className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">
                                        Calendario de disponibilidad
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Los fines de semana, días inhábiles y
                                        fechas ocupadas aparecen deshabilitados.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5">
                                <CalendarAvailability
                                    selectedDate={data.fecha_examen}
                                    fechaMinima={fechaMinima}
                                    diasInhabiles={diasInhabiles}
                                    fechasOcupadas={fechasOcupadas}
                                    onSelectDate={handleDateSelect}
                                    disabled={!puedeProgramar || processing}
                                    disabledMessage={
                                        !proyectoSeleccionado
                                            ? 'Selecciona un proyecto de tesis para habilitar la selección de fechas.'
                                            : !proyectoSeleccionado.jurado_completo
                                              ? 'RN-04: completa el jurado del proyecto para habilitar la selección de fechas.'
                                              : undefined
                                    }
                                />
                            </div>
                        </section>
                    </div>

                    <section className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            {proyectoSeleccionado?.jurado_completo ? (
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                            ) : (
                                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                            )}
                            <p>
                                {!proyectoSeleccionado
                                    ? 'Selecciona un proyecto de tesis para programar su examen.'
                                    : !proyectoSeleccionado.jurado_completo
                                      ? 'RN-04: el jurado debe tener sus cinco puestos titulares y suplentes completos antes de fijar la fecha del examen.'
                                      : 'El jurado está completo. Revisa la fecha, la hora y la sede antes de confirmar la programación.'}
                            </p>
                        </div>

                        <div className="flex flex-col items-stretch gap-2 sm:items-end">
                            {hasErrors && (
                                <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                                    <AlertCircle className="size-3.5" />
                                    Revisa los campos marcados para continuar.
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={!canSubmit}
                                className="min-w-[240px] gap-2 bg-[#10B981] font-semibold text-white shadow-xs hover:bg-[#0FA875]"
                            >
                                {processing ? (
                                    <Spinner className="size-4 text-white" />
                                ) : (
                                    <ClipboardCheck className="size-4" />
                                )}
                                {processing
                                    ? 'Programando examen...'
                                    : 'Confirmar programación'}
                            </Button>
                        </div>
                    </section>
                </form>
            </div>
        </>
    );
}

AsignacionExamenesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Asignaciones',
            href: '/admin/asignaciones/examenes',
        },
        {
            title: 'Examen',
            href: '/admin/asignaciones/examenes',
        },
    ],
};
