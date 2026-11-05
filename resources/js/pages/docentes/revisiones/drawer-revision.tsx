import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    X,
    FileText,
    Calendar,
    ShieldAlert,
    CheckCircle2,
    Eye,
    ExternalLink,
    AlertCircle,
    Clock,
    History,
    ChevronDown,
    ChevronUp,
    MessageSquareText,
    UserCheck,
    BookCheck,
} from 'lucide-react';
import { RevisionItem } from './types';

interface DrawerRevisionProps {
    open: boolean;
    onClose: () => void;
    revision: RevisionItem | null;
}

export function DrawerRevision({ open, onClose, revision }: DrawerRevisionProps) {
    const [observaciones, setObservaciones] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [historialAbierto, setHistorialAbierto] = useState(true);

    useEffect(() => {
        if (revision && open) {
            setObservaciones(
                revision.puede_dictaminar ? '' : revision.observaciones_actuales || '',
            );
            setErrorMessage(null);
            setHistorialAbierto(revision.versiones.length > 1);
        }
    }, [revision?.identificador, revision?.estado, open]);

    if (!open || !revision) {
        return null;
    }

    const { sustentante, ultima_version, versiones, puede_dictaminar } = revision;
    const versionesAnteriores = versiones.filter((v) => !v.es_actual);

    const handleAprobar = () => {
        if (!puede_dictaminar || processing) {
            return;
        }

        setProcessing(true);
        setErrorMessage(null);

        router.patch(
            revision.url_aprobar,
            {
                observaciones: observaciones.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: (errors) => {
                    setProcessing(false);
                    if (errors.observaciones) {
                        setErrorMessage(errors.observaciones);
                    }
                },
            },
        );
    };

    const handleSolicitarCambios = () => {
        if (!puede_dictaminar || processing) {
            return;
        }

        if (observaciones.trim().length < 5) {
            setErrorMessage(
                'Debes redactar las observaciones (mínimo 5 caracteres) para solicitar cambios al sustentante.',
            );
            return;
        }

        setProcessing(true);
        setErrorMessage(null);

        router.patch(
            revision.url_solicitar_cambios,
            {
                observaciones: observaciones.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: (errors) => {
                    setProcessing(false);
                    if (errors.observaciones) {
                        setErrorMessage(errors.observaciones);
                    }
                },
            },
        );
    };

    const renderEstadoMiniBadge = (estado: string) => {
        switch (estado) {
            case 'Aprobado':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        Aprobado
                    </span>
                );
            case 'Con cambios':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        Con cambios
                    </span>
                );
            case 'Entrega anterior':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                        Entrega anterior
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        En revisión
                    </span>
                );
        }
    };

    return (
        <aside className="w-full lg:w-[430px] xl:w-[470px] shrink-0 border-l border-border bg-card p-6 flex flex-col justify-between h-auto min-h-full rounded-r-xl shadow-lg animate-in slide-in-from-right duration-300">
            <div className="space-y-5">
                {/* ENCABEZADO CON ROL Y BOTON DE CERRAR */}
                <div className="flex items-start justify-between border-b border-border pb-3.5 gap-3">
                    <div className="space-y-1.5 min-w-0">
                        <h2 className="text-lg font-bold text-foreground leading-tight">
                            Revisar tesis
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            {revision.rol_docente === 'Asesor' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                                    <UserCheck className="size-3 shrink-0" />
                                    {revision.rol_detalle}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                    <BookCheck className="size-3 shrink-0" />
                                    {revision.rol_detalle}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-square btn-ghost text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                        title="Cerrar panel"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* AVISO CONTEXTUAL SI NO ESTA HABILITADO EL DICTAMEN */}
                {!puede_dictaminar && revision.aviso_flujo && (
                    <div
                        className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs shadow-xs ${
                            revision.estado === 'Aprobado'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                : revision.estado === 'Con cambios'
                                  ? 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300'
                                  : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                        }`}
                    >
                        {revision.estado === 'Aprobado' ? (
                            <CheckCircle2 className="size-4 shrink-0 text-[#10B981] mt-0.5" />
                        ) : revision.estado === 'Con cambios' ? (
                            <AlertCircle className="size-4 shrink-0 text-red-500 mt-0.5" />
                        ) : (
                            <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                            <p className="font-semibold">
                                {revision.estado === 'Aprobado'
                                    ? 'Dictamen aprobatorio registrado'
                                    : revision.estado === 'Con cambios'
                                      ? 'Correcciones solicitadas al sustentante'
                                      : 'En espera de entrega de archivo PDF'}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {revision.aviso_flujo}
                            </p>
                            {revision.fecha_dictamen_actual && (
                                <p className="text-[10px] font-medium text-muted-foreground pt-0.5">
                                    Fecha de dictamen: {revision.fecha_dictamen_actual}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* TITULO */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Título
                    </label>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                        {revision.titulo}
                    </p>
                </div>

                {/* RESUMEN */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Resumen
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border max-h-32 overflow-y-auto">
                        {revision.resumen}
                    </p>
                </div>

                {/* SUSTENTANTE */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Sustentante
                    </label>
                    <p className="text-xs font-medium text-foreground flex flex-wrap items-center gap-1.5">
                        <span className="font-bold">{sustentante.nombre_completo}</span>
                        <span className="text-muted-foreground">&middot;</span>
                        <span className="text-muted-foreground font-mono">
                            {sustentante.matricula}
                        </span>
                        <span className="text-muted-foreground">&middot;</span>
                        <span className="text-muted-foreground">{sustentante.email}</span>
                    </p>
                    <p
                        className="text-[11px] text-muted-foreground truncate"
                        title={sustentante.carrera}
                    >
                        {sustentante.carrera}
                    </p>
                </div>

                {/* FECHA DE ENVIO */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Fecha de envío
                    </label>
                    <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {ultima_version
                            ? `${ultima_version.numero_version} · ${ultima_version.fecha_envio}`
                            : 'Sin envíos registrados'}
                    </p>
                </div>

                {/* DOCUMENTO ADJUNTO (VERSION ACTUAL A EVALUAR) */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Documento adjunto {ultima_version ? `(${ultima_version.numero_version})` : ''}
                    </label>
                    {ultima_version && ultima_version.url_archivo ? (
                        <div className="p-3 rounded-xl border border-border bg-card hover:border-red-500/30 transition-all space-y-2.5 shadow-xs">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                        <FileText className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            className="text-xs font-semibold text-foreground truncate max-w-[195px]"
                                            title={ultima_version.nombre_archivo || ''}
                                        >
                                            {ultima_version.nombre_archivo ||
                                                `${ultima_version.numero_version}.pdf`}
                                        </p>
                                        <span className="inline-block text-[10px] text-muted-foreground">
                                            Versión vigente &middot; Formato PDF oficial
                                        </span>
                                    </div>
                                </div>

                                <a
                                    href={ultima_version.url_archivo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-xs bg-red-600 hover:bg-red-700 text-white border-none gap-1.5 shrink-0 shadow-xs font-medium"
                                    title="Abrir PDF en pestaña nueva"
                                >
                                    <Eye className="size-3" />
                                    <span>Ver PDF</span>
                                    <ExternalLink className="size-3 opacity-80" />
                                </a>
                            </div>

                            {ultima_version.comentario_alumno && (
                                <div className="text-[11px] text-muted-foreground italic border-t border-border/60 pt-2">
                                    <span className="not-italic font-semibold text-foreground">
                                        Nota del sustentante:{' '}
                                    </span>
                                    &ldquo;{ultima_version.comentario_alumno}&rdquo;
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl border border-dashed border-border bg-muted/20 flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-muted text-muted-foreground/60 flex items-center justify-center shrink-0">
                                <FileText className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Sin documento adjunto en este flujo
                                </p>
                                <p className="text-[10px] text-muted-foreground/80">
                                    El sustentante aún no carga un archivo PDF para esta etapa.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* HISTORIAL DE VERSIONES ENTREGADAS (PDFs ANTERIORES PARA COMPARAR) */}
                {versiones.length > 0 && (
                    <div className="space-y-2">
                        {versionesAnteriores.length > 0 ? (
                            <div className="rounded-xl border border-border bg-muted/15 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setHistorialAbierto(!historialAbierto)}
                                    className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                                >
                                    <span className="flex items-center gap-2">
                                        <History className="size-3.5 text-[#10B981] shrink-0" />
                                        <span>
                                            Historial de versiones anteriores ({versionesAnteriores.length})
                                        </span>
                                    </span>
                                    {historialAbierto ? (
                                        <ChevronUp className="size-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="size-4 text-muted-foreground" />
                                    )}
                                </button>

                                {historialAbierto && (
                                    <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-2 max-h-56 overflow-y-auto">
                                        {versionesAnteriores.map((versionAnt) => (
                                            <div
                                                key={versionAnt.id_version}
                                                className="p-2.5 rounded-lg bg-background border border-border space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-xs font-bold text-foreground">
                                                                {versionAnt.numero_version}
                                                            </span>
                                                            {renderEstadoMiniBadge(
                                                                versionAnt.estado_revision,
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            Enviado: {versionAnt.fecha_envio}
                                                        </p>
                                                    </div>

                                                    {versionAnt.url_archivo && (
                                                        <a
                                                            href={versionAnt.url_archivo}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-xs border border-border bg-card hover:bg-accent/40 text-foreground gap-1 shrink-0 font-medium"
                                                            title={`Abrir ${versionAnt.numero_version} en pestaña nueva`}
                                                        >
                                                            <Eye className="size-3 text-red-500" />
                                                            <span>Ver PDF</span>
                                                        </a>
                                                    )}
                                                </div>

                                                {versionAnt.nombre_archivo && (
                                                    <p
                                                        className="text-[10px] text-muted-foreground truncate"
                                                        title={versionAnt.nombre_archivo}
                                                    >
                                                        Archivo: {versionAnt.nombre_archivo}
                                                    </p>
                                                )}

                                                {versionAnt.comentario_alumno && (
                                                    <div className="text-[10px] text-muted-foreground italic pt-0.5">
                                                        <span className="not-italic font-semibold text-foreground">
                                                            Nota del sustentante:{' '}
                                                        </span>
                                                        &ldquo;{versionAnt.comentario_alumno}&rdquo;
                                                    </div>
                                                )}

                                                {versionAnt.observaciones && (
                                                    <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] space-y-0.5">
                                                        <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                                            <MessageSquareText className="size-2.5 shrink-0" />
                                                            Observaciones emitidas:
                                                        </span>
                                                        <p className="text-foreground/90 leading-relaxed">
                                                            {versionAnt.observaciones}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="px-3 py-2 rounded-lg border border-border/70 bg-muted/15 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <History className="size-3.5 text-muted-foreground shrink-0" />
                                <span>
                                    Primera entrega en este flujo (sin versiones PDF previas para comparar).
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* OBSERVACIONES DE REVISION */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="obs_revision_tesis"
                        className="text-xs font-semibold text-foreground block"
                    >
                        {revision.rol_docente === 'Asesor'
                            ? 'Observaciones del Director de Tesis'
                            : 'Observaciones del Revisor'}
                    </label>
                    <textarea
                        id="obs_revision_tesis"
                        rows={4}
                        value={observaciones}
                        disabled={!puede_dictaminar || processing}
                        onChange={(e) => {
                            setObservaciones(e.target.value);
                            if (errorMessage) {
                                setErrorMessage(null);
                            }
                        }}
                        placeholder={
                            !puede_dictaminar
                                ? revision.estado === 'Sin entregas'
                                    ? 'Disponible cuando el sustentante envíe su archivo PDF...'
                                    : 'No se registraron observaciones adicionales en este dictamen.'
                                : 'Escribe aquí tus comentarios o correcciones para el sustentante (obligatorio al solicitar cambios)...'
                        }
                        className={`w-full p-3 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#10B981] placeholder:text-muted-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                            errorMessage ? 'border-[#EF4444]' : 'border-border'
                        }`}
                    />
                    {errorMessage && (
                        <p className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1">
                            <ShieldAlert className="size-3 shrink-0" />
                            {errorMessage}
                        </p>
                    )}
                </div>
            </div>

            {/* BOTONES DE ACCION AL PIE */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    className="btn btn-sm border border-border bg-background hover:bg-accent/40 text-foreground font-medium text-xs px-4 cursor-pointer"
                >
                    {puede_dictaminar ? 'Cancelar' : 'Cerrar'}
                </button>

                {puede_dictaminar ? (
                    <>
                        <button
                            type="button"
                            onClick={handleSolicitarCambios}
                            disabled={processing}
                            className="btn btn-sm border-2 border-red-500 text-red-600 dark:text-red-400 bg-background hover:bg-red-500/10 font-semibold text-xs px-3 shadow-xs cursor-pointer"
                        >
                            {processing ? 'Enviando...' : 'Solicitar cambios'}
                        </button>

                        <button
                            type="button"
                            onClick={handleAprobar}
                            disabled={processing}
                            className="btn btn-sm border-2 border-[#10B981] text-[#10B981] bg-background hover:bg-emerald-500/10 font-semibold text-xs px-4 shadow-xs cursor-pointer"
                        >
                            {processing ? 'Aprobando...' : 'Aprobar'}
                        </button>
                    </>
                ) : (
                    <span className="text-[11px] text-muted-foreground italic">
                        {revision.estado === 'Sin entregas'
                            ? 'Sin versión por dictaminar'
                            : 'Dictamen registrado'}
                    </span>
                )}
            </div>
        </aside>
    );
}

