import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    Eye,
    Info,
    RefreshCw,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { consulta, store } from '@/routes/admin/asignaciones/jurados';
import { DocentesTable } from './components/docentes-table';
import { JuradosTabs } from './components/jurados-tabs';
import { JuryStructure } from './components/jury-structure';
import { ProjectSelector } from './components/project-selector';
import { SustituirJuradoModal } from './components/sustituir-jurado-modal';
import { EMPTY_JURY_FORM, JURY_SLOTS } from './constants';
import type { AsignacionJuradoProps, JuryFormData, JurySlotKey, MiembroJurado } from './types';

/**
 * VISTA PRINCIPAL: ASIGNAR JURADO A UN PROYECTO DE TESIS
 */
export default function AsignacionJuradosIndex({
    proyectos,
    docentes,
    proyectoSeleccionadoId,
}: AsignacionJuradoProps) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);

    const { data, setData, post, processing, errors, clearErrors } =
        useForm<JuryFormData>({
            ...EMPTY_JURY_FORM,
            id_proyecto: proyectoSeleccionadoId
                ? String(proyectoSeleccionadoId)
                : '',
        });

    const [sustituirOpen, setSustituirOpen] = useState(false);
    const [miembroParaSustituir, setMiembroParaSustituir] = useState<MiembroJurado | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);

            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const proyectoSeleccionado =
        proyectos.find(
            (proyecto) => String(proyecto.id_proyecto) === data.id_proyecto,
        ) ?? null;

    const advisorIds =
        proyectoSeleccionado?.asesores.map((asesor) => asesor.id_usuario) ?? [];
    const sustentanteIds =
        proyectoSeleccionado?.sustentantes.map(
            (sustentante) => sustentante.id_usuario,
        ) ?? [];
    const existingJury = proyectoSeleccionado?.jurado ?? [];
    const readOnly = proyectoSeleccionado?.tiene_jurado ?? false;

    const slotValues = {} as Record<JurySlotKey, string>;

    JURY_SLOTS.forEach((slot) => {
        if (readOnly) {
            const miembro = existingJury.find(
                (integrante) => integrante.cargo === slot.cargo,
            );
            slotValues[slot.key] = miembro
                ? String(miembro.docente.id_usuario)
                : '';
        } else {
            slotValues[slot.key] = data[slot.key];
        }
    });

    const selectedSlots: Record<number, string> = {};

    JURY_SLOTS.forEach((slot) => {
        const value = slotValues[slot.key];

        if (value !== '') {
            selectedSlots[Number(value)] = slot.cargo;
        }
    });

    const valoresSeleccionados = JURY_SLOTS.map(
        (slot) => slotValues[slot.key],
    ).filter((value) => value !== '');

    const complete = valoresSeleccionados.length === JURY_SLOTS.length;
    const unique = new Set(valoresSeleccionados).size === JURY_SLOTS.length;
    const asesorEsPresidente =
        data.presidente !== '' && advisorIds.includes(Number(data.presidente));
    const hasErrors = Object.keys(errors).length > 0;

    const canSubmit =
        Boolean(proyectoSeleccionado) &&
        !readOnly &&
        complete &&
        unique &&
        !asesorEsPresidente &&
        !processing;

    const handleProjectChange = (value: string) => {
        setData({
            ...EMPTY_JURY_FORM,
            id_proyecto: value,
        });
        clearErrors();
    };

    const handleSlotChange = (key: JurySlotKey, value: string) => {
        setData(key, value);
        clearErrors();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        post(
            store.url({
                query: {
                    proyecto: data.id_proyecto,
                },
            }),
            {
                preserveScroll: true,
                onSuccess: () => clearErrors(),
            },
        );
    };

    return (
        <>
            <Head title="Asignar Jurado" />

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

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            ASIGNACIÓN DE JURADO
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Integra el jurado de un proyecto de tesis y define
                            la estructura oficial de sus cinco puestos.
                        </p>
                    </div>

                    <Button
                        asChild
                        variant="outline"
                        className="w-full gap-2 border-2 border-[#10B981] bg-background font-semibold text-[#10B981] hover:bg-[#10B981]/10 hover:text-[#10B981] sm:w-auto"
                    >
                        <Link href={consulta.url()}>
                            <Eye className="size-4" />
                            Ver jurados asignados
                        </Link>
                    </Button>
                </div>

                <JuradosTabs />

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

                    <DocentesTable
                        docentes={docentes}
                        selectedSlots={selectedSlots}
                        advisorIds={advisorIds}
                        sustentanteIds={sustentanteIds}
                    />

                    {proyectoSeleccionado ? (
                        <>
                            <JuryStructure
                                docentes={docentes}
                                values={slotValues}
                                existingJury={existingJury}
                                advisorIds={advisorIds}
                                sustentanteIds={sustentanteIds}
                                readOnly={readOnly}
                                disabled={processing}
                                processing={processing}
                                errors={errors}
                                onChange={handleSlotChange}
                                onSustituir={(miembro) => {
                                    setMiembroParaSustituir(miembro);
                                    setSustituirOpen(true);
                                }}
                            />

                            {hasErrors && (
                                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                    <p>
                                        {errors.id_proyecto ??
                                            'Revisa los puestos marcados. Cada integrante debe ser un docente activo y diferente, y el asesor no puede ocupar la presidencia.'}
                                    </p>
                                </div>
                            )}

                            {readOnly ? (
                                existingJury.some((m) =>
                                    m.estado_aceptacion.toLowerCase().startsWith('rechaz')
                                ) ? (
                                    <section className="flex flex-col justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-xs sm:flex-row sm:items-center">
                                        <div className="flex items-start gap-2.5 text-xs">
                                            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    Atención: Integrante(s) han rechazado la designación
                                                </p>
                                                <p className="text-muted-foreground mt-0.5">
                                                    Uno o más docentes rechazaron integrar este jurado. Puedes promover a un suplente y asignar a un nuevo suplente para completar la estructura.
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setMiembroParaSustituir(null);
                                                setSustituirOpen(true);
                                            }}
                                            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs shrink-0"
                                        >
                                            <RefreshCw className="size-4" />
                                            Sustituir integrante
                                        </Button>
                                    </section>
                                ) : (
                                    <section className="flex flex-col justify-between gap-3 rounded-xl border border-[#10B981]/25 bg-[#10B981]/5 p-4 shadow-xs sm:flex-row sm:items-center">
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                                            <p>
                                                Este proyecto ya tiene un jurado
                                                registrado con{' '}
                                                <strong className="font-semibold text-foreground">
                                                    {existingJury.length} de 5
                                                </strong>{' '}
                                                integrantes. Consulta la
                                                conformación completa y el estado de
                                                aceptación en la vista de jurados
                                                asignados.
                                            </p>
                                        </div>

                                        <Button
                                            asChild
                                            variant="outline"
                                            className="gap-2 border-[#10B981]/40 bg-background font-semibold text-[#10B981] hover:bg-[#10B981]/10"
                                        >
                                            <Link href={consulta.url()}>
                                                <Eye className="size-4" />
                                                Consultar jurado
                                            </Link>
                                        </Button>
                                    </section>
                                )
                            ) : (
                                <section className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <UsersRound className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                                        <p>
                                            {complete ? (
                                                <>
                                                    La estructura está completa.
                                                    Se registrarán{' '}
                                                    <strong className="font-semibold text-foreground">
                                                        5 integrantes
                                                    </strong>{' '}
                                                    con estado{' '}
                                                    <strong className="font-semibold text-foreground">
                                                        Pendiente
                                                    </strong>{' '}
                                                    de aceptación.
                                                </>
                                            ) : (
                                                <>
                                                    Aún no existe un jurado
                                                    confirmado para este
                                                    proyecto. Asigna los cinco
                                                    puestos para continuar.
                                                </>
                                            )}
                                        </p>
                                    </div>

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
                                            ? 'Asignando jurado...'
                                            : 'Confirmar estructura del jurado'}
                                    </Button>
                                </section>
                            )}
                        </>
                    ) : (
                        <section className="flex items-start gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                            <Info className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                            <p>
                                {proyectos.length === 0
                                    ? 'No hay proyectos con asesor activo disponibles para integrar un jurado.'
                                    : 'Selecciona un proyecto de tesis para habilitar la estructura oficial del jurado.'}
                            </p>
                        </section>
                    )}
                </form>

                <SustituirJuradoModal
                    open={sustituirOpen}
                    onOpenChange={setSustituirOpen}
                    proyecto={proyectoSeleccionado}
                    docentes={docentes}
                    miembroInicial={miembroParaSustituir}
                />
            </div>
        </>
    );
}

AsignacionJuradosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Asignaciones',
            href: '/admin/asignaciones/jurados',
        },
        {
            title: 'Jurado',
            href: '/admin/asignaciones/jurados',
        },
    ],
};
