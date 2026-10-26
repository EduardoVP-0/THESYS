import { useForm } from '@inertiajs/react';
import { ClipboardCheck, Info, Scale } from 'lucide-react';
import {
    useEffect,
    useMemo,
    useState,
    type FormEventHandler,
} from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/routes/admin/veredictos';
import { VeredictoBadge } from './status-badge';
import type { JuradoVeredicto, Veredicto } from './types';

interface RegistrarVeredictoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proyectos: Veredicto[];
    votos: string[];
    proyectoInicial: Veredicto | null;
}

export function RegistrarVeredictoModal({
    open,
    onOpenChange,
    proyectos,
    votos,
    proyectoInicial,
}: RegistrarVeredictoModalProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            id_jurado_proyecto: '',
            voto: '',
            observaciones: '',
        });

    const [idExamen, setIdExamen] = useState('');

    const proyectoSeleccionado = useMemo(
        () =>
            proyectos.find(
                (proyecto) => String(proyecto.id_examen) === idExamen,
            ) ?? null,
        [proyectos, idExamen],
    );

    const titulares = useMemo(
        () =>
            proyectoSeleccionado?.jurados.filter(
                (jurado) => jurado.es_titular,
            ) ?? [],
        [proyectoSeleccionado],
    );

    const miembroSeleccionado = useMemo(
        () =>
            titulares.find(
                (jurado) =>
                    String(jurado.id_jurado_proyecto) ===
                    data.id_jurado_proyecto,
            ) ?? null,
        [titulares, data.id_jurado_proyecto],
    );

    const esActualizacion = Boolean(miembroSeleccionado?.voto);

    useEffect(() => {
        if (!open) {
            return;
        }

        clearErrors();

        if (!proyectoInicial) {
            setIdExamen('');
            reset();

            return;
        }

        setIdExamen(String(proyectoInicial.id_examen));

        const jurado =
            proyectoInicial.jurados.find(
                (integrante) => integrante.es_titular && !integrante.voto,
            ) ?? proyectoInicial.jurados.find((integrante) => integrante.es_titular);

        setData({
            id_jurado_proyecto: jurado
                ? String(jurado.id_jurado_proyecto)
                : '',
            voto: jurado?.voto ?? '',
            observaciones: jurado?.observaciones ?? '',
        });
    }, [open, proyectoInicial, reset, setData, clearErrors]);

    const seleccionarProyecto = (value: string) => {
        setIdExamen(value);
        clearErrors();

        const proyecto = proyectos.find(
            (item) => String(item.id_examen) === value,
        );
        const jurado =
            proyecto?.jurados.find(
                (integrante) => integrante.es_titular && !integrante.voto,
            ) ?? proyecto?.jurados.find((integrante) => integrante.es_titular);

        setData({
            id_jurado_proyecto: jurado
                ? String(jurado.id_jurado_proyecto)
                : '',
            voto: jurado?.voto ?? '',
            observaciones: jurado?.observaciones ?? '',
        });
    };

    const seleccionarJurado = (value: string) => {
        const jurado = titulares.find(
            (integrante) => String(integrante.id_jurado_proyecto) === value,
        );

        setData({
            id_jurado_proyecto: value,
            voto: jurado?.voto ?? '',
            observaciones: jurado?.observaciones ?? '',
        });
        clearErrors();
    };

    const handleSubmit: FormEventHandler = (event) => {
        event.preventDefault();

        post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIdExamen('');
                onOpenChange(false);
            },
        });
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
            setIdExamen('');
        }

        onOpenChange(isOpen);
    };

    const etiquetaJurado = (jurado: JuradoVeredicto) =>
        `${jurado.cargo} · ${jurado.docente.nombre_completo}${
            jurado.voto ? ` (${jurado.voto})` : ''
        }`;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                onPointerDownOutside={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                className="max-h-[90vh] overflow-y-auto border-border bg-background shadow-lg sm:max-w-[560px]"
            >
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-[#10B981]/15 p-2 text-[#10B981]">
                                <Scale className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    Registrar veredicto
                                </DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Captura el voto de un integrante titular del
                                    jurado para el examen profesional.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {proyectos.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
                            Aún no hay exámenes programados. Programa un examen
                            antes de registrar un veredicto.
                        </div>
                    ) : (
                        <div className="grid gap-4 py-4">
                            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <Info className="mt-0.5 size-3.5 shrink-0 text-[#10B981]" />
                                    <p>
                                        Solo se contabilizan los votos de
                                        Presidente, Secretario y Vocal. Los
                                        suplentes se muestran en el detalle, pero
                                        no forman parte de la votación.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-sm font-semibold text-foreground">
                                    Examen profesional{' '}
                                    <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Select
                                    value={idExamen}
                                    onValueChange={seleccionarProyecto}
                                >
                                    <SelectTrigger className="w-full rounded-xl border-border bg-background text-sm text-foreground">
                                        <SelectValue placeholder="Selecciona un examen" />
                                    </SelectTrigger>
                                    <SelectContent className="border-border bg-popover">
                                        {proyectos.map((proyecto) => (
                                            <SelectItem
                                                key={proyecto.id_examen}
                                                value={String(
                                                    proyecto.id_examen,
                                                )}
                                            >
                                                {proyecto.estudiante.nombre_completo}{' '}
                                                — {proyecto.titulo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {proyectoSeleccionado && (
                                <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-3">
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Proyecto seleccionado
                                            </p>
                                            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                                                {proyectoSeleccionado.titulo}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {
                                                    proyectoSeleccionado
                                                        .estudiante
                                                        .nombre_completo
                                                }{' '}
                                                ·{' '}
                                                {
                                                    proyectoSeleccionado
                                                        .estudiante.matricula
                                                }
                                            </p>
                                        </div>
                                        <VeredictoBadge
                                            estado={proyectoSeleccionado.estado}
                                            estadoKey={
                                                proyectoSeleccionado.estado_key
                                            }
                                        />
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                        <span>
                                            {proyectoSeleccionado.fecha} ·{' '}
                                            {proyectoSeleccionado.hora}
                                        </span>
                                        <span>
                                            Votos:{' '}
                                            <strong className="text-foreground">
                                                {
                                                    proyectoSeleccionado
                                                        .voto_resumen
                                                }
                                            </strong>
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-1.5">
                                <Label className="text-sm font-semibold text-foreground">
                                    Integrante del jurado{' '}
                                    <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Select
                                    value={data.id_jurado_proyecto}
                                    onValueChange={seleccionarJurado}
                                    disabled={!proyectoSeleccionado}
                                >
                                    <SelectTrigger className="w-full rounded-xl border-border bg-background text-sm text-foreground disabled:opacity-60">
                                        <SelectValue placeholder="Selecciona al integrante" />
                                    </SelectTrigger>
                                    <SelectContent className="border-border bg-popover">
                                        {titulares.map((jurado) => (
                                            <SelectItem
                                                key={jurado.id_jurado_proyecto}
                                                value={String(
                                                    jurado.id_jurado_proyecto,
                                                )}
                                            >
                                                {etiquetaJurado(jurado)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.id_jurado_proyecto && (
                                    <p className="mt-0.5 text-xs text-[#EF4444]">
                                        {errors.id_jurado_proyecto}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-sm font-semibold text-foreground">
                                    Sentido del voto{' '}
                                    <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Select
                                    value={data.voto}
                                    onValueChange={(value) =>
                                        setData('voto', value)
                                    }
                                    disabled={!miembroSeleccionado}
                                >
                                    <SelectTrigger className="w-full rounded-xl border-border bg-background text-sm text-foreground disabled:opacity-60">
                                        <SelectValue placeholder="Selecciona el voto" />
                                    </SelectTrigger>
                                    <SelectContent className="border-border bg-popover">
                                        {votos.map((voto) => (
                                            <SelectItem key={voto} value={voto}>
                                                {voto}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.voto && (
                                    <p className="mt-0.5 text-xs text-[#EF4444]">
                                        {errors.voto}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="observaciones"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Observaciones
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        {data.observaciones.length}/2000
                                    </span>
                                </div>
                                <Textarea
                                    id="observaciones"
                                    rows={3}
                                    maxLength={2000}
                                    value={data.observaciones}
                                    onChange={(event) =>
                                        setData(
                                            'observaciones',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Comentarios del integrante del jurado..."
                                    className={`resize-none border-border focus-visible:ring-ring ${
                                        errors.observaciones
                                            ? 'border-[#EF4444]'
                                            : ''
                                    }`}
                                />
                                {errors.observaciones && (
                                    <p className="mt-0.5 text-xs text-[#EF4444]">
                                        {errors.observaciones}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                            className="min-w-[140px] border-2 border-border bg-background font-medium text-foreground hover:bg-accent/40"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                proyectos.length === 0 ||
                                !data.id_jurado_proyecto ||
                                !data.voto
                            }
                            className="min-w-[170px] gap-2 bg-[#10B981] font-semibold text-white shadow-xs hover:bg-[#0FA875]"
                        >
                            {processing ? (
                                <Spinner className="size-4 text-white" />
                            ) : (
                                <ClipboardCheck className="size-4" />
                            )}
                            {processing
                                ? 'Guardando...'
                                : esActualizacion
                                  ? 'Actualizar veredicto'
                                  : 'Guardar veredicto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
