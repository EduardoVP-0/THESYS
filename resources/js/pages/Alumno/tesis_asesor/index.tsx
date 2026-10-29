import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    ExternalLink,
    Eye,
    FileEdit,
    FileText,
    MessageSquareText,
    Send,
    ShieldAlert,
    Trash2,
    UploadCloud,
    UserCheck,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

interface AsesorRevisor {
    nombre_completo: string;
    grado_academico?: string | null;
}

interface VersionTesisItem {
    id_version: number;
    numero_version: string;
    comentario_alumno: string | null;
    nombre_archivo: string;
    url_archivo: string;
    fecha_envio: string | null;
    estado_revision: string;
    estado_label: 'En revisión' | 'Con cambios' | 'Aprobado' | string;
    observaciones: string | null;
    fecha_revision: string | null;
    asesor_revisor: AsesorRevisor | null;
}

interface ProyectoInfo {
    id_proyecto: number;
    titulo: string;
    estado: string;
}

interface AsesorInfo {
    id_asesor_proyecto: number;
    nombre_completo: string;
    grado_academico?: string | null;
    especialidad?: string | null;
    email?: string | null;
}

interface ControlCarga {
    puede_subir: boolean;
    siguiente_version: string;
    siguiente_numero: number;
    estado_global: string;
    motivo_bloqueo: string | null;
    tiene_asesor: boolean;
}

interface Props {
    proyecto: ProyectoInfo | null;
    asesor: AsesorInfo | null;
    versiones: VersionTesisItem[];
    controlCarga: ControlCarga;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function AlumnoTesisAsesorIndex({
    proyecto,
    asesor,
    versiones = [],
    controlCarga,
}: Props) {
    const { flash, errors: serverErrors } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
        errors?: Record<string, string>;
    }>().props;

    // Alertas flash y aviso amarillo superior
    const [showFlashAlert, setShowFlashAlert] = useState(false);
    const [showReminderBanner, setShowReminderBanner] = useState(true);

    // Estado de carga de nueva versión
    const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
    const [comentarioAlumno, setComentarioAlumno] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Estado de versión seleccionada en el historial para mostrar retroalimentación (observaciones)
    const [versionSeleccionadaId, setVersionSeleccionadaId] = useState<number | null>(
        versiones.length > 0 ? versiones[0].id_version : null
    );

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const puedeSubir = Boolean(controlCarga?.puede_subir);
    const siguienteVersionTexto = controlCarga?.siguiente_version || 'Versión 1';

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowFlashAlert(true);
            const timer = setTimeout(() => setShowFlashAlert(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (versiones.length > 0 && versionSeleccionadaId === null) {
            setVersionSeleccionadaId(versiones[0].id_version);
        }
    }, [versiones]);

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

    const validarArchivo = (file: File | undefined | null) => {
        if (!file) {
            return;
        }

        const esPdf =
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (!esPdf) {
            setLocalError('Solo se permiten archivos en formato PDF (.pdf).');
            setArchivoNuevo(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setLocalError(
                `El archivo pesa ${formatFileSize(file.size)} y supera el máximo permitido de 10 MB.`
            );
            setArchivoNuevo(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setLocalError(null);
        setArchivoNuevo(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validarArchivo(e.target.files?.[0]);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (puedeSubir && !submitting) {
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

        if (!puedeSubir || submitting) {
            return;
        }

        validarArchivo(e.dataTransfer.files?.[0]);
    };

    const handleQuitarArchivo = () => {
        setArchivoNuevo(null);
        setLocalError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleEnviarVersion = (e: React.FormEvent) => {
        e.preventDefault();

        if (!puedeSubir || submitting) {
            return;
        }

        if (!archivoNuevo) {
            setLocalError(`Selecciona o arrastra el archivo PDF para registrar la ${siguienteVersionTexto}.`);
            return;
        }

        setLocalError(null);
        setSubmitting(true);

        router.post(
            '/alumno/tesis-asesor',
            {
                archivo: archivoNuevo,
                comentario_alumno: comentarioAlumno.trim(),
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setArchivoNuevo(null);
                    setComentarioAlumno('');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            }
        );
    };

    const toggleVersionSeleccionada = (idVersion: number) => {
        setVersionSeleccionadaId((prev) => (prev === idVersion ? null : idVersion));
    };

    const renderEstadoBadge = (estadoLabel: string) => {
        if (estadoLabel === 'Aprobado') {
            return (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-[#10B981]">
                    <CheckCircle2 className="size-3.5" />
                    Aprobado por asesor
                </span>
            );
        }

        if (estadoLabel === 'Con cambios') {
            return (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-[#EF4444]">
                    <FileEdit className="size-3.5" />
                    Con cambios
                </span>
            );
        }

        return (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-xs font-semibold text-[#d97706] dark:bg-yellow-900/30 dark:text-yellow-500">
                <Clock className="size-3.5" />
                En revisión
            </span>
        );
    };

    const errorArchivo = localError || serverErrors?.archivo || serverErrors?.comentario_alumno;

    return (
        <>
            <Head title="Mi Tesis (Director de Tesis)" />

            <div className="flex flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                {/* ALERTAS FLASH SUPERIORES */}
                {flash?.success && showFlashAlert && (
                    <div className="alert alert-success alert-soft flex animate-in items-center justify-between rounded-lg border-l-4 border-l-[#10B981] bg-emerald-50 px-4 py-2.5 text-sm text-foreground shadow-xs duration-300 fade-in-50 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0 text-[#10B981]" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFlashAlert(false)}
                            className="cursor-pointer text-lg leading-none text-muted-foreground hover:text-foreground"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {flash?.error && showFlashAlert && (
                    <div className="alert alert-error alert-soft flex animate-in items-center justify-between rounded-lg border-l-4 border-l-[#EF4444] bg-red-50 px-4 py-2.5 text-sm text-foreground shadow-xs duration-300 fade-in-50 dark:bg-red-950/30">
                        <div className="flex items-center gap-2">
                            <XCircle className="size-4 shrink-0 text-[#EF4444]" />
                            <span className="font-medium">{flash.error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFlashAlert(false)}
                            className="cursor-pointer text-lg leading-none text-muted-foreground hover:text-foreground"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* ENCABEZADO */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            MI TESIS
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Historial cronológico y carga de nuevas versiones con tu director de tesis.
                        </p>
                    </div>

                    {asesor && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs">
                            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-[#10B981]">
                                <UserCheck className="size-4" />
                            </div>
                            <div className="text-xs">
                                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Director de tesis
                                </p>
                                <p className="font-semibold text-foreground">
                                    {asesor.grado_academico ? `${asesor.grado_academico} ` : ''}
                                    {asesor.nombre_completo}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ALERTA DE TIEMPO DE ENTREGA (se puede quitar con una X) */}
                {showReminderBanner && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-yellow-200 bg-[#fffbeb] p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
                        <span>
                            {asesor
                                ? `Entrega tus avances en formato PDF para que tu director de tesis (${asesor.nombre_completo}) registre sus observaciones.`
                                : 'Recuerda entregar tu siguiente versión a tiempo. La carga requiere un asesor asignado.'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowReminderBanner(false)}
                            className="shrink-0 cursor-pointer rounded-md p-1 text-yellow-800/70 transition-colors hover:bg-yellow-500/10 hover:text-yellow-900 dark:text-yellow-200/70 dark:hover:text-yellow-100"
                            title="Cerrar aviso"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {/* CONTENEDOR PRINCIPAL (Zona de carga + Historial) */}
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    {/* ZONA DE CARGA (DRAG & DROP) */}
                    <form onSubmit={handleEnviarVersion} className="p-4 md:p-6">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleFileChange}
                            disabled={!puedeSubir || submitting}
                            className="hidden"
                        />

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => {
                                if (puedeSubir && !archivoNuevo && !submitting) {
                                    fileInputRef.current?.click();
                                }
                            }}
                            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                                !puedeSubir
                                    ? 'cursor-not-allowed border-muted-foreground/25 bg-muted/10 opacity-80'
                                    : isDragging
                                      ? 'cursor-pointer border-[#10B981] bg-emerald-500/10'
                                      : archivoNuevo
                                        ? 'border-[#10B981]/50 bg-emerald-500/5'
                                        : 'cursor-pointer border-muted-foreground/30 bg-muted/10 hover:border-[#B8D4E3] hover:bg-muted/30'
                            }`}
                        >
                            <div className="mb-3 rounded-full border border-border bg-background p-3 shadow-sm">
                                <UploadCloud
                                    className={`size-6 ${
                                        puedeSubir ? 'text-foreground' : 'text-muted-foreground'
                                    }`}
                                />
                            </div>

                            <h3 className="text-lg font-bold text-foreground">
                                {controlCarga?.estado_global === 'Aprobado'
                                    ? 'Versión final aprobada por tu director de tesis'
                                    : 'Arrastra tu nueva versión aquí'}
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {controlCarga?.estado_global === 'Aprobado'
                                    ? 'El proceso de revisiones con tu asesor ha concluido satisfactoriamente.'
                                    : `PDF · ${siguienteVersionTexto.toLowerCase()} · máximo 10 MB`}
                            </p>

                            {/* Si el alumno ya seleccionó un archivo PDF para subir */}
                            {archivoNuevo && puedeSubir && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-5 flex w-full max-w-xl flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left shadow-xs"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981]">
                                                <FileText className="size-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {archivoNuevo.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(archivoNuevo.size)} · Se registrará como{' '}
                                                    <strong className="text-foreground">
                                                        {siguienteVersionTexto}
                                                    </strong>
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleQuitarArchivo}
                                            disabled={submitting}
                                            className="h-8 shrink-0 border-red-500/30 px-2.5 text-xs text-red-600 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="mr-1 size-3.5" />
                                            Quitar
                                        </Button>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-foreground">
                                            Comentario de entrega para tu asesor (opcional)
                                        </label>
                                        <textarea
                                            rows={2}
                                            maxLength={1000}
                                            value={comentarioAlumno}
                                            onChange={(e) => setComentarioAlumno(e.target.value)}
                                            placeholder="Ej. Se atendieron las observaciones del capítulo 2 y se agregó el marco metodológico..."
                                            className="w-full rounded-lg border border-border bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#B8D4E3] focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción dentro del recuadro */}
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-6 flex flex-wrap items-center justify-center gap-3"
                            >
                                {!archivoNuevo ? (
                                    <Button
                                        type="button"
                                        disabled={!puedeSubir || submitting}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={
                                            puedeSubir
                                                ? 'bg-[#2D2D2D] text-white hover:bg-[#2D2D2D]/90'
                                                : 'bg-[#8ba3b5] text-white'
                                        }
                                    >
                                        Cargar nueva versión
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="gap-2 border-2 border-[#10B981] bg-background font-semibold text-[#10B981] hover:bg-emerald-500/10"
                                    >
                                        <Send className="size-4 text-[#10B981]" />
                                        {submitting
                                            ? 'Subiendo versión...'
                                            : `Enviar ${siguienteVersionTexto} a revisión`}
                                    </Button>
                                )}
                            </div>

                            {/* Mensajes de estado o bloqueo */}
                            {errorArchivo && (
                                <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#EF4444]">
                                    <ShieldAlert className="size-3.5 shrink-0" />
                                    {errorArchivo}
                                </p>
                            )}

                            {!puedeSubir && controlCarga?.motivo_bloqueo && (
                                <p
                                    className={`mt-4 text-xs font-medium ${
                                        controlCarga.estado_global === 'Aprobado'
                                            ? 'text-[#10B981]'
                                            : controlCarga.estado_global === 'En revisión'
                                              ? 'text-[#d97706] dark:text-yellow-400'
                                              : 'text-[#EF4444]'
                                    }`}
                                >
                                    {controlCarga.motivo_bloqueo}
                                </p>
                            )}

                            {puedeSubir && controlCarga?.estado_global === 'Con cambios' && !archivoNuevo && (
                                <p className="mt-4 text-xs font-medium text-[#10B981]">
                                    Tu asesor solicitó cambios en la versión anterior. Ya puedes subir tu{' '}
                                    {siguienteVersionTexto} corregida.
                                </p>
                            )}
                        </div>
                    </form>

                    {/* HISTORIAL DE DOCUMENTOS Y RETROALIMENTACIÓN AL HACER CLIC */}
                    <div className="border-t border-border bg-card p-4 md:p-6">
                        <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    Historial de documentos
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Haz clic sobre cualquier versión para ver la retroalimentación y observaciones de tu asesor.
                                </p>
                            </div>
                            {versiones.length > 0 && (
                                <span className="text-xs font-medium text-muted-foreground">
                                    {versiones.length} versión(es) registrada(s)
                                </span>
                            )}
                        </div>

                        {versiones.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                                Aún no has subido ninguna versión de tu tesis. Cuando cargues tu primer documento, aparecerá aquí como{' '}
                                <strong className="text-foreground">Versión 1</strong>.
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                                {versiones.map((v) => {
                                    const abierta = versionSeleccionadaId === v.id_version;

                                    return (
                                        <div key={v.id_version} className="flex flex-col">
                                            {/* Fila principal clickeable */}
                                            <div
                                                onClick={() => toggleVersionSeleccionada(v.id_version)}
                                                className={`flex cursor-pointer flex-col justify-between gap-3 px-4 py-3.5 transition-colors sm:flex-row sm:items-center ${
                                                    abierta ? 'bg-accent/25' : 'hover:bg-accent/15'
                                                }`}
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <FileText className="size-5 shrink-0 text-muted-foreground" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">
                                                            {v.numero_version}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Subido el {v.fecha_envio || 'recientemente'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                                    {renderEstadoBadge(v.estado_label)}
                                                    <span className="text-muted-foreground">
                                                        {abierta ? (
                                                            <ChevronUp className="size-4" />
                                                        ) : (
                                                            <ChevronDown className="size-4" />
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Panel desplegable con las Observaciones del Asesor (`tblrevisiones_asesor`) */}
                                            {abierta && (
                                                <div className="space-y-4 border-t border-border bg-muted/15 px-4 py-4 text-xs">
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        {/* Bloque 1: Retroalimentación del Asesor */}
                                                        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
                                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2 font-semibold text-foreground">
                                                                    <MessageSquareText className="size-4 text-[#10B981]" />
                                                                    <span>
                                                                        Retroalimentación del Director de Tesis
                                                                    </span>
                                                                </div>
                                                                {v.fecha_revision && (
                                                                    <span className="text-[11px] text-muted-foreground">
                                                                        Revisado: {v.fecha_revision}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {v.observaciones && v.observaciones.trim() !== '' ? (
                                                                <p className="leading-relaxed whitespace-pre-line text-foreground">
                                                                    {v.observaciones}
                                                                </p>
                                                            ) : (
                                                                <p className="italic text-muted-foreground">
                                                                    {v.estado_label === 'En revisión'
                                                                        ? 'Tu asesor aún está revisando esta versión y no ha registrado observaciones.'
                                                                        : 'El asesor no dejó observaciones adicionales en esta revisión.'}
                                                                </p>
                                                            )}

                                                            {v.asesor_revisor && (
                                                                <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
                                                                    Revisor:{' '}
                                                                    <strong className="text-foreground">
                                                                        {v.asesor_revisor.grado_academico
                                                                            ? `${v.asesor_revisor.grado_academico} `
                                                                            : ''}
                                                                        {v.asesor_revisor.nombre_completo}
                                                                    </strong>
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Bloque 2: Comentario del Alumno y acceso al PDF */}
                                                        <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
                                                            <div>
                                                                <p className="mb-1.5 font-semibold text-foreground">
                                                                    Tu nota de entrega
                                                                </p>
                                                                {v.comentario_alumno ? (
                                                                    <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                                                                        {v.comentario_alumno}
                                                                    </p>
                                                                ) : (
                                                                    <p className="italic text-muted-foreground">
                                                                        No agregaste comentarios al subir esta versión.
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex justify-end border-t border-border pt-3">
                                                                <Button
                                                                    asChild
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 gap-1.5 text-xs font-semibold"
                                                                >
                                                                    <a
                                                                        href={v.url_archivo}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <Eye className="size-3.5 text-red-500" />
                                                                        Ver PDF de {v.numero_version}
                                                                        <ExternalLink className="size-3 opacity-70" />
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// Breadcrumbs para la barra superior
AlumnoTesisAsesorIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Mi Tesis (Director de Tesis)',
            href: '/alumno/tesis-asesor',
        },
    ],
};
