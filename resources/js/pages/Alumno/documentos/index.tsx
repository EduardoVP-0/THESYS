import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    CloudUpload,
    Eye,
    FileText,
    Info,
    Loader2,
    Lock,
    MessageSquare,
    PlayCircle,
    Send,
    Unlock,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface DocumentoItem {
    id_requisito: number;
    clave: string;
    title: string;
    desc: string | null;
    etapa: number;
    obligatorio: boolean;
    isSystem: boolean;
    isAnteproyectoLink: boolean;
    isUploaded: boolean;
    id_oficio: number | null;
    fileName: string;
    estadoValidacion: string;
    observaciones: string | null;
    fechaSubida: string | null;
    urlVisor: string | null;
}

interface MensajeChat {
    id: number;
    etapa: number;
    emisor: 'alumno' | 'admin' | string;
    nombre: string;
    fecha: string;
    mensaje: string;
    estado: string;
}

interface Props {
    documentosPorEtapa: {
        etapa1: DocumentoItem[];
        etapa2: DocumentoItem[];
        etapa3: DocumentoItem[];
        etapa4: DocumentoItem[];
    };
    resumen: {
        total_requeridos: number;
        total_subidos: number;
        porcentaje: number;
    };
    historialChat: MensajeChat[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function MisDocumentosIndex({
    documentosPorEtapa,
    resumen,
    historialChat = [],
    flash,
}: Props) {
    const { errors } = usePage().props as { errors?: Record<string, string> };

    const [openStage, setOpenStage] = useState<number | null>(1);
    const [prorrogaModalOpen, setProrrogaModalOpen] = useState(false);
    const [selectedStageNumber, setSelectedStageNumber] = useState<number>(1);
    const [selectedStageForProrroga, setSelectedStageForProrroga] = useState<string>(
        'Etapa 1: El Arranque',
    );

    /*
     * TODO (Validaciones futuras):
     * Cuando se active el bloqueo automático por fecha_limite (60 días) y validación
     * secuencial de etapas en base de datos, este estado vendrá directamente del servidor.
     * Por ahora se deja desbloqueado por defecto para permitir subir documentos libremente
     * durante la presentación, con opción de activar la vista previa del bloqueo.
     */
    const [simularPlazoVencidoEtapa1, setSimularPlazoVencidoEtapa1] = useState<boolean>(false);

    const [uploadingRequisitoId, setUploadingRequisitoId] = useState<number | null>(null);
    const [deletingOficioId, setDeletingOficioId] = useState<number | null>(null);
    const [motivoProrroga, setMotivoProrroga] = useState('');
    const [enviandoProrroga, setEnviandoProrroga] = useState(false);

    const toggleStage = (stage: number) => {
        setOpenStage(openStage === stage ? null : stage);
    };

    const etapa1Docs = documentosPorEtapa?.etapa1 ?? [];
    const etapa2Docs = documentosPorEtapa?.etapa2 ?? [];
    const etapa3Docs = documentosPorEtapa?.etapa3 ?? [];
    const etapa4Docs = documentosPorEtapa?.etapa4 ?? [];

    const countUploaded = (docs: DocumentoItem[]) =>
        docs.filter((d) => d.isUploaded).length;

    const handleFileSelect = (idRequisito: number, file: File | undefined) => {
        if (!file) {
            return;
        }

        setUploadingRequisitoId(idRequisito);

        router.post(
            '/alumno/mis-documentos',
            {
                id_requisito: idRequisito,
                documento: file,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setUploadingRequisitoId(null),
            },
        );
    };

    const handleEliminarArchivo = (idOficio: number | null) => {
        if (!idOficio) {
            return;
        }

        setDeletingOficioId(idOficio);

        router.delete(`/alumno/mis-documentos/${idOficio}`, {
            preserveScroll: true,
            onFinish: () => setDeletingOficioId(null),
        });
    };

    const handleEnviarSolicitud = () => {
        if (!motivoProrroga.trim() || enviandoProrroga) {
            return;
        }

        setEnviandoProrroga(true);

        router.post(
            '/alumno/mis-documentos/prorroga',
            {
                etapa: selectedStageNumber,
                mensaje: motivoProrroga,
            },
            {
                preserveScroll: true,
                onSuccess: () => setMotivoProrroga(''),
                onFinish: () => setEnviandoProrroga(false),
            },
        );
    };

    const FileUploadCard = ({
        doc,
        isStageBlocked = false,
    }: {
        doc: DocumentoItem;
        isStageBlocked?: boolean;
    }) => {
        const inputRef = useRef<HTMLInputElement | null>(null);
        const isUploading = uploadingRequisitoId === doc.id_requisito;
        const isDeleting = doc.id_oficio !== null && deletingOficioId === doc.id_oficio;

        return (
            <div
                className={cn(
                    'flex flex-col rounded-xl border p-4 shadow-xs transition-all',
                    isStageBlocked && !doc.isUploaded
                        ? 'border-border bg-muted/40 opacity-75'
                        : doc.isSystem
                          ? 'border-accent bg-accent/10 hover:bg-accent/20'
                          : 'border-border bg-card hover:border-accent hover:bg-accent/10',
                )}
            >
                <div className="mb-4 flex items-start gap-3">
                    <div
                        className={cn(
                            'shrink-0 rounded-lg p-2',
                            isStageBlocked && !doc.isUploaded
                                ? 'bg-muted text-muted-foreground'
                                : doc.isSystem
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                  : 'bg-muted text-muted-foreground',
                        )}
                    >
                        <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-foreground">
                                {doc.title}
                            </h4>
                            {!doc.obligatorio && (
                                <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    Opcional
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {doc.desc}
                        </p>
                        {doc.isAnteproyectoLink ? (
                            <span className="mt-2 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                Sincronizado de Mi Anteproyecto
                            </span>
                        ) : doc.isSystem ? (
                            <span className="mt-2 inline-block rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                                Generado / Emitido por Facultad
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* ZONA DE SUBIDA / VISUALIZACIÓN */}
                {doc.isAnteproyectoLink ? (
                    <div className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <div className="min-w-0">
                                <span
                                    className="block truncate text-xs font-semibold text-foreground"
                                    title={doc.fileName}
                                >
                                    {doc.fileName}
                                </span>
                                <span className="block text-[10px] text-muted-foreground">
                                    Estado: {doc.estadoValidacion}
                                </span>
                            </div>
                        </div>
                        {doc.urlVisor ? (
                            <a
                                href={doc.urlVisor}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                            >
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 cursor-pointer border-emerald-500/30 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
                                >
                                    <Eye className="mr-1 size-3.5" />
                                    Ver PDF
                                </Button>
                            </a>
                        ) : (
                            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                Pendiente en Anteproyecto
                            </span>
                        )}
                    </div>
                ) : doc.isUploaded ? (
                    <div className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <div className="min-w-0">
                                <span
                                    className="block truncate text-xs font-medium text-foreground"
                                    title={doc.fileName}
                                >
                                    {doc.fileName}
                                </span>
                                {doc.fechaSubida && (
                                    <span className="block text-[10px] text-muted-foreground">
                                        Subido el {doc.fechaSubida}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            {doc.urlVisor && (
                                <a
                                    href={doc.urlVisor}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 cursor-pointer border-emerald-500/30 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
                                    >
                                        <Eye className="mr-1 size-3.5" />
                                        Ver
                                    </Button>
                                </a>
                            )}
                            {!isStageBlocked && (
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => handleEliminarArchivo(doc.id_oficio)}
                                    className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                                    title="Eliminar archivo para subir otro"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <X className="size-4" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ) : isStageBlocked ? (
                    <div className="mt-auto flex w-full cursor-not-allowed flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 p-4">
                        <Lock className="mb-1.5 size-5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">
                            Entrega Bloqueada
                        </span>
                        <span className="mt-0.5 text-[10px] text-muted-foreground/80">
                            Plazo vencido (Requiere prórroga)
                        </span>
                    </div>
                ) : (
                    <>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) =>
                                handleFileSelect(doc.id_requisito, e.target.files?.[0])
                            }
                        />
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => inputRef.current?.click()}
                            className="group mt-auto flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-4 transition-all hover:border-accent hover:bg-accent/20 disabled:cursor-wait disabled:opacity-60"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mb-2 size-6 animate-spin text-foreground" />
                                    <span className="text-xs font-semibold text-foreground">
                                        Subiendo a Supabase...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CloudUpload className="mb-2 size-6 text-muted-foreground transition-colors group-hover:text-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                                        Haz clic para subir PDF
                                    </span>
                                    <span className="mt-1 text-[10px] text-muted-foreground">
                                        PDF (Máx. 10MB) • Se guarda en tu Expediente
                                    </span>
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title="Mis Documentos" />

            <div className="flex min-h-screen flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                {/* ALERTAS FLASH Y ERRORES */}
                {flash?.success && (
                    <div className="flex animate-in items-center gap-2 rounded-xl border border-emerald-500/30 border-l-4 border-l-[#10B981] bg-emerald-500/10 px-4 py-2.5 text-sm text-foreground shadow-xs duration-300 fade-in-50">
                        <CheckCircle2 className="size-4 shrink-0 text-[#10B981]" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                )}

                {(flash?.error || errors?.documento || errors?.mensaje) && (
                    <div className="flex animate-in items-center gap-2 rounded-xl border border-red-500/30 border-l-4 border-l-red-500 bg-red-500/10 px-4 py-2.5 text-sm text-foreground shadow-xs duration-300 fade-in-50">
                        <AlertCircle className="size-4 shrink-0 text-red-500" />
                        <span className="font-medium">
                            {flash?.error || errors?.documento || errors?.mensaje}
                        </span>
                    </div>
                )}

                {/* ENCABEZADO */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
                            MIS DOCUMENTOS
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Consulta los requisitos de cada etapa y carga tus documentos oficiales para integrarlos a tu Expediente Digital.
                        </p>
                    </div>

                    {/* Botón demostrativo para alternar bloqueo de 2 meses o abrir minichat de prórroga */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setSimularPlazoVencidoEtapa1(!simularPlazoVencidoEtapa1)
                            }
                            className="cursor-pointer rounded-xl border-border bg-card text-xs text-foreground hover:border-accent hover:bg-accent/20"
                        >
                            {simularPlazoVencidoEtapa1 ? (
                                <>
                                    <Unlock className="mr-1.5 size-3.5 text-emerald-500" />
                                    Desbloquear Etapa 1
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-1.5 size-3.5 text-amber-500" />
                                    Simular Plazo Vencido (60 días)
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSelectedStageNumber(1);
                                setSelectedStageForProrroga('Etapa 1: El Arranque');
                                setProrrogaModalOpen(true);
                            }}
                            className="cursor-pointer rounded-xl border-border bg-card text-xs text-foreground hover:border-accent hover:bg-accent/20"
                        >
                            <MessageSquare className="mr-1.5 size-3.5 text-amber-500" />
                            Minichat de Prórroga
                        </Button>
                    </div>
                </div>

                {/* PROGRESO DE LOS DOCUMENTOS */}
                <Card className="rounded-2xl border-border bg-card shadow-xs">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Avance Integral de Titulación
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Progreso calculado con los {resumen?.total_requeridos ?? 14} documentos de las etapas reglamentarias ({resumen?.total_subidos ?? 0} registrados).
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-[#10B981]">
                                        {resumen?.porcentaje ?? 0}%
                                    </span>
                                    <span className="block text-sm text-muted-foreground">
                                        completado
                                    </span>
                                </div>
                            </div>

                            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-3 rounded-full bg-[#10B981] transition-all duration-500"
                                    style={{ width: `${resumen?.porcentaje ?? 0}%` }}
                                />
                            </div>

                            {/* TARJETAS RESUMEN DE LAS 5 ETAPAS */}
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <button
                                    type="button"
                                    onClick={() => setOpenStage(1)}
                                    className={cn(
                                        'flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all',
                                        openStage === 1
                                            ? 'border-accent bg-accent/20 ring-2 ring-accent'
                                            : 'border-border bg-card hover:border-accent hover:bg-accent/20',
                                    )}
                                >
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                                            1
                                        </span>
                                        {simularPlazoVencidoEtapa1 ? (
                                            <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                                <Lock className="size-2.5" /> Bloqueado
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                <PlayCircle className="size-2.5" /> Abierta
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">
                                        1. Arranque
                                    </h4>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {countUploaded(etapa1Docs)} de {etapa1Docs.length} docs
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setOpenStage(2)}
                                    className={cn(
                                        'flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all',
                                        openStage === 2
                                            ? 'border-accent bg-accent/20 ring-2 ring-accent'
                                            : 'border-border bg-card hover:border-accent hover:bg-accent/20',
                                    )}
                                >
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                                            2
                                        </span>
                                        <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                                            <PlayCircle className="size-2.5" /> Abierta
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">
                                        2. Desarrollo
                                    </h4>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {countUploaded(etapa2Docs)} de {etapa2Docs.length} docs
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setOpenStage(3)}
                                    className={cn(
                                        'flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all',
                                        openStage === 3
                                            ? 'border-accent bg-accent/20 ring-2 ring-accent'
                                            : 'border-border bg-card hover:border-accent hover:bg-accent/20',
                                    )}
                                >
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                                            3
                                        </span>
                                        <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                                            <PlayCircle className="size-2.5" /> Abierta
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">
                                        3. Revisión
                                    </h4>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {countUploaded(etapa3Docs)} de {etapa3Docs.length} docs
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setOpenStage(4)}
                                    className={cn(
                                        'flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all',
                                        openStage === 4
                                            ? 'border-accent bg-accent/20 ring-2 ring-accent'
                                            : 'border-border bg-card hover:border-accent hover:bg-accent/20',
                                    )}
                                >
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                                            4
                                        </span>
                                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                            Exp. Final
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">
                                        4. Exp. Final
                                    </h4>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {countUploaded(etapa4Docs)} de {etapa4Docs.length} docs
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setOpenStage(5)}
                                    className={cn(
                                        'flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all',
                                        openStage === 5
                                            ? 'border-accent bg-accent/20 ring-2 ring-accent'
                                            : 'border-border bg-card hover:border-accent hover:bg-accent/20',
                                    )}
                                >
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                                            5
                                        </span>
                                        <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-400">
                                            Defensa
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">
                                        5. Examen
                                    </h4>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        Protocolo oral
                                    </p>
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SECCIÓN: ACORDEONES DE LAS ETAPAS */}
                <div className="flex flex-col gap-4">
                    {/* ETAPA 1: EL ARRANQUE */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                        <button
                            type="button"
                            onClick={() => toggleStage(1)}
                            className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-accent/20"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        'flex size-8 items-center justify-center rounded-full text-sm font-bold',
                                        simularPlazoVencidoEtapa1
                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                                    )}
                                >
                                    {simularPlazoVencidoEtapa1 ? (
                                        <Lock className="size-4" />
                                    ) : (
                                        '1'
                                    )}
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-foreground sm:text-lg">
                                            Etapa 1: El Arranque (Registro y Aprobación del Tema)
                                        </h3>
                                        {simularPlazoVencidoEtapa1 ? (
                                            <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                Plazo vencido (2 meses)
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                {countUploaded(etapa1Docs)} de {etapa1Docs.length} entregados
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Solicitud formal de tesis, certificado de estudios y liberación de servicio social.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 1 ? (
                                    <ChevronUp className="size-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="size-5 text-muted-foreground" />
                                )}
                            </div>
                        </button>

                        {openStage === 1 && (
                            <div className="flex flex-col gap-4 border-t border-border bg-card p-5">
                                {simularPlazoVencidoEtapa1 && (
                                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
                                        <div className="flex items-start gap-3">
                                            <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-foreground">
                                                    El tiempo reglamentario de entrega ha finalizado
                                                </h4>
                                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                                    Han transcurrido más de 60 días desde la habilitación de esta etapa. Puedes solicitar una prórroga con justificación a Coordinación.
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setSelectedStageNumber(1);
                                                setSelectedStageForProrroga('Etapa 1: El Arranque');
                                                setProrrogaModalOpen(true);
                                            }}
                                            className="shrink-0 cursor-pointer gap-2 bg-amber-600 text-xs font-semibold text-white shadow-xs hover:bg-amber-700"
                                        >
                                            <MessageSquare className="size-4" />
                                            Solicitar Prórroga
                                        </Button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {etapa1Docs.map((doc) => (
                                        <FileUploadCard
                                            key={doc.id_requisito}
                                            doc={doc}
                                            isStageBlocked={simularPlazoVencidoEtapa1}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ETAPA 2: EL DESARROLLO */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                        <button
                            type="button"
                            onClick={() => toggleStage(2)}
                            className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-accent/20"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    2
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-foreground sm:text-lg">
                                            Etapa 2: El Desarrollo (Elaboración de la Tesis)
                                        </h3>
                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                            {countUploaded(etapa2Docs)} de {etapa2Docs.length} entregados
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Protocolo sincronizado de Mi Anteproyecto y carta protesta de honestidad e integridad académica.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 2 ? (
                                    <ChevronUp className="size-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="size-5 text-muted-foreground" />
                                )}
                            </div>
                        </button>

                        {openStage === 2 && (
                            <div className="border-t border-border bg-card p-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {etapa2Docs.map((doc) => (
                                        <FileUploadCard key={doc.id_requisito} doc={doc} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ETAPA 3: LA REVISIÓN */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                        <button
                            type="button"
                            onClick={() => toggleStage(3)}
                            className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-accent/20"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex size-8 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-600 dark:text-blue-400">
                                    3
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-foreground sm:text-lg">
                                            Etapa 3: La Revisión (Aprobación del Trabajo)
                                        </h3>
                                        <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                                            {countUploaded(etapa3Docs)} de {etapa3Docs.length} entregados
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Acta de aprobación del Comité Tutorial y designación oficial del jurado sinodal.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 3 ? (
                                    <ChevronUp className="size-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="size-5 text-muted-foreground" />
                                )}
                            </div>
                        </button>

                        {openStage === 3 && (
                            <div className="border-t border-border bg-card p-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {etapa3Docs.map((doc) => (
                                        <FileUploadCard key={doc.id_requisito} doc={doc} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ETAPA 4: EL EXPEDIENTE FINAL */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                        <button
                            type="button"
                            onClick={() => toggleStage(4)}
                            className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-accent/20"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                                    4
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-foreground sm:text-lg">
                                            Etapa 4: El Expediente Final (Trámites previos al Examen)
                                        </h3>
                                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                            {countUploaded(etapa4Docs)} de {etapa4Docs.length} entregados
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Entrega digital a biblioteca, constancias de no adeudo, cuotas de pago y documentos de Servicios Escolares.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 4 ? (
                                    <ChevronUp className="size-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="size-5 text-muted-foreground" />
                                )}
                            </div>
                        </button>

                        {openStage === 4 && (
                            <div className="border-t border-border bg-card p-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {etapa4Docs.map((doc) => (
                                        <FileUploadCard key={doc.id_requisito} doc={doc} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ETAPA 5: LA DEFENSA (EXAMEN PROFESIONAL) */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                        <button
                            type="button"
                            onClick={() => toggleStage(5)}
                            className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-accent/20"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex size-8 items-center justify-center rounded-full bg-purple-500/15 text-sm font-bold text-purple-600 dark:text-purple-400">
                                    5
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-foreground sm:text-lg">
                                            Etapa 5: La Defensa (Examen Profesional y Toma de Protesta)
                                        </h3>
                                        <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                                            Acto protocolario
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Exposición oral de la tesis (90 min), deliberación del jurado y firma del acta oficial (Art. 214).
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 5 ? (
                                    <ChevronUp className="size-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="size-5 text-muted-foreground" />
                                )}
                            </div>
                        </button>

                        {openStage === 5 && (
                            <div className="border-t border-border bg-card p-5">
                                <div className="flex items-start gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                                    <Info className="mt-0.5 size-5 shrink-0 text-purple-600 dark:text-purple-400" />
                                    <div className="space-y-1 text-xs leading-relaxed text-foreground">
                                        <p className="text-sm font-semibold">
                                            Criterios de la Defensa Oral:
                                        </p>
                                        <p className="text-muted-foreground">
                                            • Esta etapa se programa una vez validado al 100% el expediente de la Etapa 4 por Servicios Escolares.
                                        </p>
                                        <p className="text-muted-foreground">
                                            • La réplica oral tiene una duración máxima de 90 minutos ante los 3 sinodales titulares.
                                        </p>
                                        <p className="text-muted-foreground">
                                            • Una vez aprobado el examen, el acta de examen profesional y el título oficial se emiten conforme al Artículo 199 del Estatuto.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AVISO NORMATIVO (Minimalista, compatible con modo oscuro/claro) */}
                <div className="mt-2 flex items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
                    <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">
                            Aviso Normativo (Artículos 212 y 214)
                        </h4>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            La tesis debe ser un producto académico original e inédito. Puede ser de autoría individual o colectiva (máximo 2 personas). Su extensión y formato deben sujetarse a los criterios establecidos por tu Facultad. Asegúrate de entregar los ejemplares impresos y digitales que se te soliciten.
                        </p>
                    </div>
                </div>

                {/* MODAL / MINICHAT DE SOLICITUD DE PRÓRROGA */}
                <Dialog open={prorrogaModalOpen} onOpenChange={setProrrogaModalOpen}>
                    <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden rounded-2xl border-border bg-card p-0 text-foreground sm:max-w-[580px]">
                        <DialogHeader className="shrink-0 border-b border-border bg-muted/30 p-6 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-lg bg-amber-500/15 p-2 text-amber-600 dark:text-amber-400">
                                    <MessageSquare className="size-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-foreground">
                                        Solicitud de Prórroga
                                    </DialogTitle>
                                    <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                        {selectedStageForProrroga} • Coordinación de Titulación
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                            {/* Alerta informativa */}
                            <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-foreground">
                                <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                <p className="text-muted-foreground">
                                    Explica el motivo por el cual no pudiste cargar tu documentación en los 2 meses fijados. El Administrador revisará tu mensaje y decidirá si otorga días adicionales para reactivar tus entregas.
                                </p>
                            </div>

                            {/* HILO DE CONVERSACIÓN / MINICHAT */}
                            <div className="max-h-[240px] space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4">
                                {historialChat.map((msg, index) => (
                                    <div
                                        key={msg.id ?? index}
                                        className={cn(
                                            'flex flex-col',
                                            msg.emisor === 'alumno' ? 'items-end' : 'items-start',
                                        )}
                                    >
                                        <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
                                            <span className="font-semibold text-foreground">
                                                {msg.nombre}
                                            </span>
                                            <span>•</span>
                                            <span>{msg.fecha}</span>
                                        </div>
                                        <div
                                            className={cn(
                                                'max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed break-words whitespace-pre-wrap',
                                                msg.emisor === 'alumno'
                                                    ? 'rounded-tr-xs bg-[#10B981] text-white'
                                                    : 'rounded-tl-xs border border-border bg-card text-foreground shadow-2xs',
                                            )}
                                        >
                                            {msg.mensaje}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CAJA DE MENSAJE NUEVO */}
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-foreground">
                                        Redactar justificación o mensaje para Coordinación:
                                    </label>
                                    <span className="text-[10px] text-muted-foreground">
                                        {motivoProrroga.length} / 1000 caracteres
                                    </span>
                                </div>
                                <textarea
                                    value={motivoProrroga}
                                    onChange={(e) =>
                                        setMotivoProrroga(e.target.value.slice(0, 1000))
                                    }
                                    placeholder="Escribe detalladamente tu situación (ej. retraso de constancia laboral/servicio social, incapacidad, etc.)..."
                                    className="h-28 max-h-36 w-full resize-none overflow-y-auto rounded-xl border border-border bg-background p-3 text-xs text-foreground outline-none break-words focus:border-accent focus:ring-2 focus:ring-accent"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex shrink-0 items-center gap-2 border-t border-border bg-muted/20 p-4 sm:justify-between">
                            <span className="hidden text-[11px] text-muted-foreground sm:inline">
                                Respuesta estimada: 24 a 48 hrs hábiles
                            </span>
                            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setProrrogaModalOpen(false)}
                                    className="cursor-pointer rounded-xl border-border bg-background text-xs text-foreground hover:bg-accent/40"
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleEnviarSolicitud}
                                    disabled={!motivoProrroga.trim() || enviandoProrroga}
                                    className="cursor-pointer gap-1.5 rounded-xl bg-[#10B981] text-xs font-semibold text-white hover:bg-[#059669] disabled:opacity-50"
                                >
                                    {enviandoProrroga ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Send className="size-3.5" />
                                    )}
                                    Enviar Mensaje
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

// Breadcrumbs para la barra superior
MisDocumentosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Mis Documentos',
            href: '/alumno/mis-documentos',
        },
    ],
};
