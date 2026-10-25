import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { X, FileText, Calendar, User, Mail, ShieldAlert, CheckCircle2, Eye, ExternalLink, AlertCircle } from 'lucide-react';
import { ProyectoData } from './types';

interface DrawerRevisionProps {
    open: boolean;
    onClose: () => void;
    proyecto: ProyectoData | null;
}

export function DrawerRevision({ open, onClose, proyecto }: DrawerRevisionProps) {
    const [observaciones, setObservaciones] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (proyecto && open) {
            setObservaciones(proyecto.observaciones_coordinacion || '');
            setErrorMessage(null);
        }
    }, [proyecto, open]);

    if (!open || !proyecto) return null;

    const isBorrador = proyecto.estado === 'Borrador';
    const hasDocumento = Boolean(proyecto.ruta_documento && proyecto.ruta_documento.trim() !== '');

    const sustentante = proyecto.sustentante || proyecto.alumnos?.[0];
    const nombreSustentante = sustentante?.nombre_completo || 
        (sustentante ? `${sustentante.nombre} ${sustentante.apellido_p}` : 'Sin sustentante asignado');
    const matriculaSustentante = sustentante?.matricula || 'S/M';
    const emailSustentante = sustentante?.user?.email || 'Sin correo registrado';

    const fechaEnvioFormateada = proyecto.fecha_envio
        ? new Date(proyecto.fecha_envio).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : 'Sin enviar';

    const handleAprobar = () => {
        setProcessing(true);
        setErrorMessage(null);

        router.patch(
            `/admin/anteproyectos/${proyecto.id_proyecto}/aprobar`,
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
            }
        );
    };

    const handleSolicitarCambios = () => {
        if (!observaciones.trim()) {
            setErrorMessage('Debes redactar las observaciones para solicitar cambios al sustentante.');
            return;
        }

        setProcessing(true);
        setErrorMessage(null);

        router.patch(
            `/admin/anteproyectos/${proyecto.id_proyecto}/solicitar-cambios`,
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
            }
        );
    };

    return (
        <aside className="w-full lg:w-[420px] xl:w-[460px] shrink-0 border-l border-border bg-card p-6 flex flex-col justify-between h-auto min-h-full rounded-r-xl shadow-lg animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
                {/* ENCABEZADO CON BOTON DE CERRAR */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <h2 className="text-lg font-bold text-foreground">Revisar anteproyecto</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-square btn-ghost text-muted-foreground hover:text-foreground"
                        title="Cerrar panel"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* AVISO SI ESTA EN FASE DE BORRADOR */}
                {isBorrador && (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 text-xs shadow-xs">
                        <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="space-y-0.5">
                            <p className="font-semibold">Propuesta en fase de borrador</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                El alumno aún no envía formalmente este anteproyecto. Las acciones de dictamen se habilitarán cuando pase a revisión oficial.
                            </p>
                        </div>
                    </div>
                )}

                {/* TITULO */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Título
                    </label>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                        {proyecto.titulo}
                    </p>
                </div>

                {/* RESUMEN */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Resumen
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border">
                        {proyecto.resumen || 'Sin resumen registrado por el sustentante.'}
                    </p>
                </div>

                {/* SUSTENTANTE */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Sustentante
                    </label>
                    <p className="text-xs font-medium text-foreground flex flex-wrap items-center gap-1.5">
                        <span className="font-bold">{nombreSustentante}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground font-mono">{matriculaSustentante}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{emailSustentante}</span>
                    </p>
                </div>

                {/* FECHA DE ENVIO */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Fecha de envío
                    </label>
                    <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {fechaEnvioFormateada}
                    </p>
                </div>

                {/* DOCUMENTO DEL ANTEPROYECTO */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Documento adjunto
                    </label>
                    {hasDocumento ? (
                        <div className="p-3 rounded-xl border border-border bg-card hover:border-red-500/30 transition-all flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                    <FileText className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate max-w-[190px]" title={proyecto.ruta_documento || ''}>
                                        {proyecto.ruta_documento}
                                    </p>
                                    <span className="inline-block text-[10px] text-muted-foreground">
                                        {isBorrador ? 'Documento preliminar' : 'Formato PDF oficial'}
                                    </span>
                                </div>
                            </div>
                            <a
                                href={`/admin/anteproyectos/${proyecto.id_proyecto}/documento`}
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
                    ) : (
                        <div className="p-3 rounded-xl border border-dashed border-border bg-muted/20 flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-muted text-muted-foreground/60 flex items-center justify-center shrink-0">
                                <FileText className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Sin documento adjunto
                                </p>
                                <p className="text-[10px] text-muted-foreground/80">
                                    El alumno aún no carga su archivo PDF.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* OBSERVACIONES DE COORDINACION */}
                <div className="space-y-1.5">
                    <label htmlFor="obs_coordinacion" className="text-xs font-semibold text-foreground block">
                        Observaciones de coordinación
                    </label>
                    <textarea
                        id="obs_coordinacion"
                        rows={4}
                        value={observaciones}
                        disabled={isBorrador}
                        onChange={(e) => {
                            setObservaciones(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder={
                            isBorrador
                                ? 'No disponible mientras el anteproyecto esté en fase de borrador...'
                                : 'Escribe aquí las observaciones o retroalimentación sobre el anteproyecto...'
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
                    className="btn btn-sm border border-border bg-background hover:bg-accent/40 text-foreground font-medium text-xs px-4"
                >
                    {isBorrador ? 'Cerrar' : 'Cancelar'}
                </button>

                {isBorrador ? (
                    <span className="text-[11px] text-muted-foreground italic">
                        Acciones deshabilitadas en borrador
                    </span>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={handleSolicitarCambios}
                            disabled={processing}
                            className="btn btn-sm border-2 border-red-500 text-red-600 dark:text-red-400 bg-background hover:bg-red-500/10 font-semibold text-xs px-3 shadow-xs"
                        >
                            {processing ? 'Enviando...' : 'Solicitar cambios'}
                        </button>

                        <button
                            type="button"
                            onClick={handleAprobar}
                            disabled={processing}
                            className="btn btn-sm border-2 border-[#10B981] text-[#10B981] bg-background hover:bg-emerald-500/10 font-semibold text-xs px-4 shadow-xs"
                        >
                            {processing ? 'Aprobando...' : 'Aprobar'}
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
}
