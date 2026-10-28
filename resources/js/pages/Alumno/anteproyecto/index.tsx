import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    FileText,
    UploadCloud,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileEdit,
    Eye,
    ExternalLink,
    Save,
    Send,
    Trash2,
    Lock,
    ShieldAlert,
    XCircle,
    UserCheck,
    MessageSquareWarning,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { AlumnoBasicInfo, MiAnteproyectoData } from './types';
import { ConfirmModal } from './confirm-modal';

interface Props {
    proyecto: MiAnteproyectoData | null;
    alumno: AlumnoBasicInfo | null;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB exactos
const MAX_TITULO_LENGTH = 255;
const MAX_RESUMEN_LENGTH = 2000;

export default function MiAnteproyectoIndex({ proyecto, alumno }: Props) {
    const { flash, errors: serverErrors } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
        errors?: Record<string, string>;
    }>().props;

    // Estado de alertas flash superiores
    const [showAlert, setShowAlert] = useState(false);

    // Campos del formulario inicializados con los datos guardados automaticamente
    const [titulo, setTitulo] = useState(proyecto?.titulo || '');
    const [resumen, setResumen] = useState(proyecto?.resumen || '');
    const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);

    // Estados de control de UI y validacion local
    const [isDragging, setIsDragging] = useState(false);
    const [localErrors, setLocalErrors] = useState<{
        titulo?: string;
        resumen?: string;
        documento?: string;
    }>({});
    const [savingDraft, setSavingDraft] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Determinar permisos de edicion segun el estado actual del anteproyecto
    const estadoActual = proyecto?.estado || 'Sin iniciar';
    const esEditable = proyecto ? proyecto.editable : true;
    const estaEnRevision = estadoActual === 'En revisión';
    const estaAprobado = estadoActual === 'Aprobado' || estadoActual === 'Aprobada';
    const tieneCambiosSolicitados = estadoActual === 'Con cambios';
    const esBorrador = estadoActual === 'Borrador' || estadoActual === 'Sin iniciar';

    const tieneDocumentoGuardado = Boolean(proyecto?.url_documento && proyecto?.nombre_documento);

    // Sincronizar datos cuando el servidor actualiza el proyecto
    useEffect(() => {
        setTitulo(proyecto?.titulo || '');
        setResumen(proyecto?.resumen || '');
        setArchivoNuevo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [proyecto?.id_proyecto, proyecto?.updated_at, proyecto?.estado]);

    // Auto-ocultar alerta flash después de 6 segundos
    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        const kb = bytes / 1024;
        if (kb < 1024) {
            return `${kb.toFixed(1)} KB`;
        }
        const mb = kb / 1024;
        return `${mb.toFixed(2)} MB`;
    };

    /**
     * Valida de inmediato el archivo PDF seleccionado o arrastrado (tipo y tamaño <= 2MB)
     */
    const validarYSeleccionarArchivo = (file: File | undefined | null) => {
        if (!file) {
            return;
        }

        const esPdf =
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (!esPdf) {
            setLocalErrors((prev) => ({
                ...prev,
                documento: 'Formato no permitido. Solo puedes subir archivos en formato PDF (.pdf).',
            }));
            setArchivoNuevo(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setLocalErrors((prev) => ({
                ...prev,
                documento: `El archivo seleccionado pesa ${formatFileSize(file.size)} y excede el límite máximo de 2.00 MB.`,
            }));
            setArchivoNuevo(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setLocalErrors((prev) => ({ ...prev, documento: undefined }));
        setArchivoNuevo(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        validarYSeleccionarArchivo(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (esEditable && !savingDraft && !submittingReview) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!esEditable || savingDraft || submittingReview) {
            return;
        }

        const file = e.dataTransfer.files?.[0];
        validarYSeleccionarArchivo(file);
    };

    const handleQuitarArchivoNuevo = () => {
        setArchivoNuevo(null);
        setLocalErrors((prev) => ({ ...prev, documento: undefined }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /**
     * Accion 1: Guardar como Borrador
     */
    const handleGuardarBorrador = (e: React.FormEvent) => {
        e.preventDefault();
        if (!esEditable) {
            return;
        }

        const nuevosErrores: typeof localErrors = {};
        if (titulo.trim().length < 5) {
            nuevosErrores.titulo = 'Ingresa un título de al menos 5 caracteres para guardar tu borrador.';
        } else if (titulo.trim().length > MAX_TITULO_LENGTH) {
            nuevosErrores.titulo = `El título no puede superar los ${MAX_TITULO_LENGTH} caracteres.`;
        }

        if (resumen.trim().length > MAX_RESUMEN_LENGTH) {
            nuevosErrores.resumen = `El resumen no puede superar los ${MAX_RESUMEN_LENGTH} caracteres.`;
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setLocalErrors(nuevosErrores);
            return;
        }

        setLocalErrors({});
        setSavingDraft(true);

        router.post(
            '/alumno/mi-anteproyecto/borrador',
            {
                titulo: titulo.trim(),
                resumen: resumen.trim(),
                documento: archivoNuevo,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setSavingDraft(false),
            }
        );
    };

    /**
     * Pre-validacion antes de abrir el modal de confirmacion de envio oficial
     */
    const handleIntentarEnviarRevision = () => {
        if (!esEditable) {
            return;
        }

        const nuevosErrores: typeof localErrors = {};

        if (titulo.trim().length < 10) {
            nuevosErrores.titulo = 'El título definitivo debe contener al menos 10 caracteres.';
        } else if (titulo.trim().length > MAX_TITULO_LENGTH) {
            nuevosErrores.titulo = `El título no puede superar los ${MAX_TITULO_LENGTH} caracteres.`;
        }

        if (resumen.trim().length < 30) {
            nuevosErrores.resumen = 'El resumen es obligatorio y debe describir tu propuesta en al menos 30 caracteres.';
        } else if (resumen.trim().length > MAX_RESUMEN_LENGTH) {
            nuevosErrores.resumen = `El resumen no puede superar los ${MAX_RESUMEN_LENGTH} caracteres.`;
        }

        if (!archivoNuevo && !tieneDocumentoGuardado) {
            nuevosErrores.documento = 'Debes adjuntar el archivo PDF de tu anteproyecto para enviarlo a revisión.';
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setLocalErrors(nuevosErrores);
            return;
        }

        setLocalErrors({});
        setConfirmModalOpen(true);
    };

    /**
     * Accion 2: Confirmar envio oficial a revision
     */
    const handleConfirmarEnvioRevision = () => {
        setSubmittingReview(true);

        router.post(
            '/alumno/mi-anteproyecto/enviar',
            {
                titulo: titulo.trim(),
                resumen: resumen.trim(),
                documento: archivoNuevo,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmModalOpen(false);
                },
                onFinish: () => {
                    setSubmittingReview(false);
                },
            }
        );
    };

    /**
     * Renderiza el badge institucional según el estado actual
     */
    const renderEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Aprobado':
            case 'Aprobada':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-[#10B981] border border-emerald-500/30">
                        <CheckCircle2 className="size-3.5" />
                        Aprobado
                    </span>
                );
            case 'En revisión':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="size-3.5" />
                        En revisión
                    </span>
                );
            case 'Con cambios':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        <FileEdit className="size-3.5" />
                        Con cambios solicitados
                    </span>
                );
            case 'Borrador':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                        <FileText className="size-3.5" />
                        Borrador guardado
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        <FileText className="size-3.5" />
                        Sin registrar
                    </span>
                );
        }
    };

    const errorTitulo = localErrors.titulo || serverErrors?.titulo;
    const errorResumen = localErrors.resumen || serverErrors?.resumen;
    const errorDocumento = localErrors.documento || serverErrors?.documento;

    return (
        <>
            <Head title="Mi Anteproyecto" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">
                {/* ALERTAS FLASH SUPERIORES */}
                {flash?.success && showAlert && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 text-foreground animate-in fade-in-50 duration-300 rounded-lg">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAlert(false)}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {flash?.error && showAlert && (
                    <div className="alert alert-error alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#EF4444] bg-red-50 dark:bg-red-950/30 text-foreground animate-in fade-in-50 duration-300 rounded-lg">
                        <div className="flex items-center gap-2">
                            <XCircle className="size-4 text-[#EF4444] shrink-0" />
                            <span className="font-medium">{flash.error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAlert(false)}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* ENCABEZADO INSTITUCIONAL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            MI ANTEPROYECTO
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Registra los detalles de tu propuesta de titulación, adjunta tu documento PDF y da seguimiento a su dictamen.
                        </p>
                    </div>
                </div>

                {/* CONTENEDOR PRINCIPAL: FORMULARIO IZQUIERDA (8 COL) + ESTADO/TIMELINE DERECHA (4 COL) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* COLUMNA IZQUIERDA: DETALLES DE LA PROPUESTA */}
                    <Card className="lg:col-span-8 border-border shadow-xs rounded-xl bg-card overflow-hidden">
                        <CardContent className="p-5 sm:p-6 space-y-6">
                            {/* CABECERA DE LA TARJETA */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                                        Detalles de la propuesta
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {proyecto?.updated_at_formateada
                                            ? `Último guardado: ${proyecto.updated_at_formateada}`
                                            : 'Aún no se ha guardado ningún borrador'}
                                    </p>
                                </div>
                                <div className="self-start sm:self-auto">
                                    {renderEstadoBadge(estadoActual)}
                                </div>
                            </div>

                            {/* BANNERS INFORMATIVOS SEGÚN ESTADO DE BLOQUEO */}
                            {estaEnRevision && (
                                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-foreground flex items-start gap-3 text-xs">
                                    <Lock className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-amber-800 dark:text-amber-300">
                                            Propuesta enviada y en revisión por Coordinación
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Tu anteproyecto fue enviado oficialmente el{' '}
                                            <span className="font-semibold text-foreground">
                                                {proyecto?.fecha_envio_formateada || 'recientemente'}
                                            </span>
                                            . Los campos permanecen en modo de solo lectura y solo se desbloquearán si la coordinación solicita correcciones.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {tieneCambiosSolicitados && (
                                <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-foreground flex items-start gap-3 text-xs">
                                    <FileEdit className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-red-700 dark:text-red-300">
                                            Se solicitaron correcciones en tu anteproyecto
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Revisa las observaciones de la coordinación en el panel derecho, realiza los ajustes necesarios en el formulario o en tu archivo PDF y vuelve a enviarlo a revisión.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {estaAprobado && (
                                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-foreground flex items-start gap-3 text-xs">
                                    <CheckCircle2 className="size-4 text-[#10B981] shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                                            Anteproyecto aprobado oficialmente
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Tu propuesta de titulación ha sido validada y aprobada por la coordinación académica. La información ha quedado registrada de forma definitiva en tu expediente.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* FORMULARIO */}
                            <form onSubmit={handleGuardarBorrador} className="space-y-5">
                                {/* CAMPO 1: TÍTULO DEL PROYECTO */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <label
                                            htmlFor="titulo_anteproyecto"
                                            className="text-xs font-semibold text-foreground block"
                                        >
                                            Título del proyecto <span className="text-red-500">*</span>
                                        </label>
                                        <span
                                            className={`text-[11px] font-medium ${
                                                titulo.length >= MAX_TITULO_LENGTH
                                                    ? 'text-red-500 font-semibold'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {titulo.length} / {MAX_TITULO_LENGTH} caracteres
                                        </span>
                                    </div>
                                    <Input
                                        id="titulo_anteproyecto"
                                        type="text"
                                        maxLength={MAX_TITULO_LENGTH}
                                        value={titulo}
                                        disabled={!esEditable || savingDraft || submittingReview}
                                        onChange={(e) => {
                                            setTitulo(e.target.value);
                                            if (localErrors.titulo) {
                                                setLocalErrors((prev) => ({ ...prev, titulo: undefined }));
                                            }
                                        }}
                                        placeholder="Ej. Sistema web para la gestión y seguimiento de proyectos de titulación..."
                                        className={`h-10 text-sm bg-background ${
                                            errorTitulo ? 'border-[#EF4444] focus-visible:ring-[#EF4444]' : 'border-border'
                                        }`}
                                    />
                                    {errorTitulo && (
                                        <p className="text-xs text-[#EF4444] font-medium flex items-center gap-1.5 mt-1">
                                            <ShieldAlert className="size-3.5 shrink-0" />
                                            {errorTitulo}
                                        </p>
                                    )}
                                </div>

                                {/* CAMPO 2: RESUMEN / ABSTRACT */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <label
                                            htmlFor="resumen_anteproyecto"
                                            className="text-xs font-semibold text-foreground block"
                                        >
                                            Resumen ejecutivo <span className="text-red-500">*</span>
                                        </label>
                                        <span
                                            className={`text-[11px] font-medium ${
                                                resumen.length >= MAX_RESUMEN_LENGTH
                                                    ? 'text-red-500 font-semibold'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {resumen.length} / {MAX_RESUMEN_LENGTH} caracteres
                                        </span>
                                    </div>
                                    <textarea
                                        id="resumen_anteproyecto"
                                        rows={6}
                                        maxLength={MAX_RESUMEN_LENGTH}
                                        value={resumen}
                                        disabled={!esEditable || savingDraft || submittingReview}
                                        onChange={(e) => {
                                            setResumen(e.target.value);
                                            if (localErrors.resumen) {
                                                setLocalErrors((prev) => ({ ...prev, resumen: undefined }));
                                            }
                                        }}
                                        placeholder="Describe la problemática a resolver, el objetivo general, el alcance y la metodología propuesta para tu proyecto de tesis..."
                                        className={`w-full p-3 rounded-lg border bg-background text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#B8D4E3] placeholder:text-muted-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                            errorResumen ? 'border-[#EF4444]' : 'border-border'
                                        }`}
                                    />
                                    {errorResumen && (
                                        <p className="text-xs text-[#EF4444] font-medium flex items-center gap-1.5 mt-1">
                                            <ShieldAlert className="size-3.5 shrink-0" />
                                            {errorResumen}
                                        </p>
                                    )}
                                </div>

                                {/* CAMPO 3: DOCUMENTO PDF DEL ANTEPROYECTO */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground block">
                                            Documento del anteproyecto (PDF) <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-muted-foreground">
                                            Formato exclusivo PDF · Máximo 2 MB
                                        </span>
                                    </div>

                                    {/* TARJETA DEL ARCHIVO ACTUAL GUARDADO EN SUPABASE */}
                                    {tieneDocumentoGuardado && (
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-10 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                                    <FileText className="size-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p
                                                            className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-xs sm:max-w-md"
                                                            title={proyecto?.nombre_documento || ''}
                                                        >
                                                            {proyecto?.nombre_documento}
                                                        </p>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-[#10B981] border border-emerald-500/30">
                                                            Almacenado en nube
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {esEditable
                                                            ? 'Puedes visualizar tu archivo actual o subir uno nuevo abajo para reemplazarlo.'
                                                            : 'Documento oficial asociado a tu anteproyecto.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <a
                                                href={proyecto?.url_documento || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-accent/40 text-foreground shrink-0 shadow-xs transition-colors"
                                            >
                                                <Eye className="size-3.5 text-red-500" />
                                                <span>Ver PDF actual</span>
                                                <ExternalLink className="size-3 opacity-70" />
                                            </a>
                                        </div>
                                    )}

                                    {/* ZONA DRAG & DROP DE SUBIDA (SOLO VISIBLE SI ES EDITABLE) */}
                                    {esEditable && (
                                        <>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="application/pdf,.pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />

                                            {!archivoNuevo ? (
                                                <div
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
                                                        isDragging
                                                            ? 'border-[#10B981] bg-emerald-500/10'
                                                            : errorDocumento
                                                            ? 'border-[#EF4444] bg-red-500/5'
                                                            : 'border-border hover:border-[#B8D4E3] hover:bg-muted/30 bg-muted/10'
                                                    }`}
                                                >
                                                    <div className="size-10 rounded-full bg-[#B8D4E3]/25 text-foreground flex items-center justify-center">
                                                        <UploadCloud className="size-5" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs sm:text-sm font-medium text-foreground">
                                                            Arrastra tu archivo PDF aquí, o{' '}
                                                            <span className="text-[#10B981] font-semibold underline underline-offset-2">
                                                                explora en tu equipo
                                                            </span>
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {tieneDocumentoGuardado
                                                                ? 'Selecciona un archivo solo si deseas reemplazar el PDF guardado (Máx. 2 MB)'
                                                                : 'Únicamente archivos en formato PDF de hasta 2 MB'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3.5 rounded-xl border-2 border-[#10B981]/50 bg-emerald-500/5 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="size-9 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                                                            <FileText className="size-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                                                                {archivoNuevo.name}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Tamaño: <strong className="text-foreground">{formatFileSize(archivoNuevo.size)}</strong> · Listo para subir al guardar o enviar
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleQuitarArchivoNuevo}
                                                        disabled={savingDraft || submittingReview}
                                                        className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-500/30 shrink-0 cursor-pointer"
                                                    >
                                                        <Trash2 className="size-3.5 mr-1" />
                                                        Quitar
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {errorDocumento && (
                                        <p className="text-xs text-[#EF4444] font-medium flex items-center gap-1.5 mt-1">
                                            <ShieldAlert className="size-3.5 shrink-0" />
                                            {errorDocumento}
                                        </p>
                                    )}
                                </div>

                                {/* BOTONES DE ACCION (SOLO SI ES EDITABLE) */}
                                {esEditable && (
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            disabled={savingDraft || submittingReview}
                                            className="bg-background hover:bg-accent/40 text-foreground border-border font-semibold shadow-xs gap-2 cursor-pointer"
                                        >
                                            <Save className="size-4 text-muted-foreground" />
                                            {savingDraft ? 'Guardando borrador...' : 'Guardar borrador'}
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={handleIntentarEnviarRevision}
                                            disabled={savingDraft || submittingReview}
                                            className="bg-background hover:bg-emerald-500/10 text-[#10B981] border-2 border-[#10B981] font-semibold shadow-xs gap-2 cursor-pointer"
                                        >
                                            <Send className="size-4 text-[#10B981]" />
                                            {tieneCambiosSolicitados ? 'Reenviar a revisión' : 'Enviar a revisión'}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* COLUMNA DERECHA: ESTADO DEL TRAMITE, LINEA DEL TIEMPO Y OBSERVACIONES */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* TARJETA 1: ESTADO Y LINEA DEL TIEMPO */}
                        <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                            <CardContent className="p-5 sm:p-6 space-y-5">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-foreground">
                                        Estado del trámite
                                    </h3>
                                    <div>{renderEstadoBadge(estadoActual)}</div>
                                    <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                                        {estaAprobado
                                            ? 'Tu anteproyecto ha sido aprobado. Puedes continuar con el seguimiento de tu tesis junto a tu director asignado.'
                                            : estaEnRevision
                                            ? 'Tu propuesta está siendo evaluada por la coordinación. Consulta aquí si requiere modificaciones o ya fue aprobada.'
                                            : tieneCambiosSolicitados
                                            ? 'La coordinación revisó tu propuesta y solicitó ajustes. Atiende las observaciones indicadas abajo y reenvía tu documento.'
                                            : 'Guarda tus avances en borrador cuantas veces necesites. Cuando estés seguro, envíalo oficialmente a revisión.'}
                                    </p>
                                </div>

                                {/* LÍNEA DEL TIEMPO VERTICAL */}
                                <div className="pt-3 border-t border-border">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                                        Progreso del anteproyecto
                                    </p>

                                    <ol className="relative border-s border-border ms-3 space-y-6">
                                        {/* PASO 1: BORRADOR / REGISTRO */}
                                        <li className="ms-5">
                                            <span
                                                className={`absolute flex items-center justify-center size-6 rounded-full -start-3 ring-4 ring-card ${
                                                    proyecto
                                                        ? 'bg-[#10B981]/20 text-[#10B981]'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                <FileText className="size-3.5" />
                                            </span>
                                            <h4 className="text-xs font-bold text-foreground">
                                                1. Registro de borrador
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {proyecto
                                                    ? `Guardado el ${proyecto.updated_at_formateada}`
                                                    : 'Pendiente de guardar datos iniciales'}
                                            </p>
                                        </li>

                                        {/* PASO 2: ENVIO A REVISION */}
                                        <li className="ms-5">
                                            <span
                                                className={`absolute flex items-center justify-center size-6 rounded-full -start-3 ring-4 ring-card ${
                                                    estaEnRevision
                                                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                                        : estaAprobado || tieneCambiosSolicitados
                                                        ? 'bg-[#10B981]/20 text-[#10B981]'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                <Clock className="size-3.5" />
                                            </span>
                                            <h4 className="text-xs font-bold text-foreground">
                                                2. En revisión por Coordinación
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {proyecto?.fecha_envio_formateada
                                                    ? `Enviado el ${proyecto.fecha_envio_formateada}`
                                                    : 'Sin enviar a revision oficial'}
                                            </p>
                                        </li>

                                        {/* PASO 3: OBSERVACIONES / EVALUACION */}
                                        <li className="ms-5">
                                            <span
                                                className={`absolute flex items-center justify-center size-6 rounded-full -start-3 ring-4 ring-card ${
                                                    tieneCambiosSolicitados
                                                        ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                                        : estaAprobado
                                                        ? 'bg-[#10B981]/20 text-[#10B981]'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {tieneCambiosSolicitados ? (
                                                    <AlertCircle className="size-3.5" />
                                                ) : (
                                                    <FileEdit className="size-3.5" />
                                                )}
                                            </span>
                                            <h4 className="text-xs font-bold text-foreground">
                                                3. Dictamen de Coordinación
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {tieneCambiosSolicitados
                                                    ? 'Requiere correcciones por parte del sustentante'
                                                    : estaAprobado
                                                    ? 'Sin observaciones pendientes'
                                                    : 'En espera de dictamen académico'}
                                            </p>
                                        </li>

                                        {/* PASO 4: APROBACION FINAL */}
                                        <li className="ms-5">
                                            <span
                                                className={`absolute flex items-center justify-center size-6 rounded-full -start-3 ring-4 ring-card ${
                                                    estaAprobado
                                                        ? 'bg-[#10B981] text-white'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                <CheckCircle2 className="size-3.5" />
                                            </span>
                                            <h4 className="text-xs font-bold text-foreground">
                                                4. Anteproyecto aprobado
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {estaAprobado
                                                    ? 'Propuesta autorizada oficialmente'
                                                    : 'Etapa final de autorización del tema'}
                                            </p>
                                        </li>
                                    </ol>
                                </div>
                            </CardContent>
                        </Card>

                        {/* TARJETA 2: COMENTARIOS / RETROALIMENTACION DE COORDINACION */}
                        {(proyecto?.observaciones_coordinacion || tieneCambiosSolicitados) && (
                            <Card
                                className={`shadow-xs rounded-xl bg-card overflow-hidden border ${
                                    tieneCambiosSolicitados
                                        ? 'border-red-500/40'
                                        : estaAprobado
                                        ? 'border-emerald-500/40'
                                        : 'border-border'
                                }`}
                            >
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`p-2 rounded-lg ${
                                                tieneCambiosSolicitados
                                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                    : 'bg-emerald-500/10 text-[#10B981]'
                                            }`}
                                        >
                                            <MessageSquareWarning className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                Observaciones de Coordinación
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground">
                                                Retroalimentación sobre tu anteproyecto
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-lg bg-muted/30 border border-border text-xs text-foreground leading-relaxed whitespace-pre-line">
                                        {proyecto?.observaciones_coordinacion ||
                                            'Se solicitaron ajustes en tu propuesta. Por favor revisa tu documento.'}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* TARJETA 3: DIRECTOR DE TESIS ASIGNADO (SI YA CUENTA CON ASESOR) */}
                        {proyecto?.asesor && (
                            <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <UserCheck className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                Director de Tesis Asignado
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground">
                                                Asesor académico de tu proyecto
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-lg bg-muted/25 border border-border space-y-0.5">
                                        <p className="text-xs font-bold text-foreground">
                                            {proyecto.asesor.grado_academico
                                                ? `${proyecto.asesor.grado_academico} `
                                                : ''}
                                            {proyecto.asesor.nombre_completo}
                                        </p>
                                        {proyecto.asesor.email && (
                                            <p className="text-[11px] text-muted-foreground">
                                                {proyecto.asesor.email}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE CONFIRMACION PARA ENVIO OFICIAL A REVISION */}
            <ConfirmModal
                open={confirmModalOpen}
                onOpenChange={setConfirmModalOpen}
                tieneCambiosSolicitados={tieneCambiosSolicitados}
                titulo={titulo}
                documentoLabel={
                    archivoNuevo
                        ? `${archivoNuevo.name} (${formatFileSize(archivoNuevo.size)})`
                        : proyecto?.nombre_documento
                }
                submittingReview={submittingReview}
                onConfirm={handleConfirmarEnvioRevision}
            />
        </>
    );
}

// Breadcrumbs para la barra superior
MiAnteproyectoIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Mi Anteproyecto',
            href: '/alumno/mi-anteproyecto',
        },
    ],
};

