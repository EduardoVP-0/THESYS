import { useState, useEffect } from 'react';
import {
    X,
    FileText,
    Calendar,
    Mail,
    Phone,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
    BookOpen,
    MessageSquareText,
    GraduationCap,
    FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AsesoradoItem } from './types';

interface DrawerDetalleProps {
    open: boolean;
    onClose: () => void;
    asesorado: AsesoradoItem | null;
}

type TabKey = 'detalles' | 'versiones';

export function DrawerDetalle({ open, onClose, asesorado }: DrawerDetalleProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('detalles');

    useEffect(() => {
        if (open) {
            setActiveTab('detalles');
        }
    }, [asesorado?.id_asesor_proyecto, open]);

    if (!open || !asesorado) {
        return null;
    }

    const { sustentante, ultima_version, versiones, anteproyecto_archivo } = asesorado;

    const renderEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Aprobado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/15 text-emerald-700 dark:text-emerald-400 border border-[#10B981]/30">
                        <CheckCircle2 className="size-3.5 text-[#10B981]" />
                        Aprobado
                    </span>
                );
            case 'En revisión':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#B8D4E3]/40 dark:bg-[#B8D4E3]/15 text-slate-800 dark:text-slate-200 border border-[#B8D4E3]/60">
                        <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
                        En revisión
                    </span>
                );
            case 'Con cambios':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <AlertCircle className="size-3.5 text-[#F59E0B]" />
                        Con cambios
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        Sin entregas
                    </span>
                );
        }
    };

    return (
        <aside className="w-full lg:w-[430px] xl:w-[470px] shrink-0 border-l border-border bg-card p-6 flex flex-col justify-between h-auto min-h-full rounded-r-xl shadow-lg animate-in slide-in-from-right duration-300">
            <div className="space-y-5">
                {/* ENCABEZADO DEL PANEL CON PERFIL DEL SUSTENTANTE */}
                <div className="relative flex flex-col items-center text-center pb-4 border-b border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-0 top-0 btn btn-sm btn-square btn-ghost text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Cerrar panel"
                    >
                        <X className="size-4" />
                    </button>

                    <div className="size-15 rounded-full bg-[#B8D4E3]/45 dark:bg-[#B8D4E3]/20 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-lg border border-[#B8D4E3]/70 mb-2.5 select-none">
                        {sustentante.iniciales}
                    </div>

                    <h2 className="text-base font-bold text-foreground leading-snug px-6">
                        {sustentante.nombre_completo}
                    </h2>

                    <p
                        className="text-xs text-muted-foreground mt-0.5 max-w-full truncate px-4"
                        title={`${sustentante.matricula} • ${sustentante.carrera}`}
                    >
                        <span className="font-mono font-semibold text-foreground">
                            {sustentante.matricula}
                        </span>{' '}
                        &bull; {sustentante.carrera}
                    </p>

                    <div className="mt-2.5">{renderEstadoBadge(asesorado.estado_tesis)}</div>
                </div>

                {/* SUBSECCIONES / PESTAÑAS DEL PANEL */}
                <div className="flex items-center border-b border-border gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('detalles')}
                        className={`flex-1 pb-2.5 text-xs font-bold tracking-wide transition-colors border-b-2 cursor-pointer ${
                            activeTab === 'detalles'
                                ? 'border-[#10B981] text-[#10B981]'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Detalles
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('versiones')}
                        className={`flex-1 pb-2.5 text-xs font-bold tracking-wide transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'versiones'
                                ? 'border-[#10B981] text-[#10B981]'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span>Versiones y Archivos</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-foreground">
                            {asesorado.total_versiones + (anteproyecto_archivo ? 1 : 0)}
                        </span>
                    </button>
                </div>

                {/* CONTENIDO DE PESTAÑA 1: DETALLES */}
                {activeTab === 'detalles' && (
                    <div className="space-y-4 text-xs animate-in fade-in duration-200">
                        {/* Titulo y Resumen del Proyecto */}
                        <div className="p-3.5 rounded-xl bg-muted/25 border border-border space-y-2">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Título del proyecto
                                </span>
                                <h3 className="text-sm font-bold text-foreground mt-0.5 leading-snug">
                                    {asesorado.titulo}
                                </h3>
                            </div>

                            <div className="pt-2 border-t border-border/60">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Resumen registrado
                                </span>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-h-36 overflow-y-auto pr-1">
                                    {asesorado.resumen}
                                </p>
                            </div>
                        </div>

                        {/* Fecha asignada y Estado */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-3 rounded-xl bg-muted/25 border border-border">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Fecha asignada
                                </span>
                                <p className="text-xs font-bold text-foreground mt-1 flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-[#10B981]" />
                                    {asesorado.fecha_asignacion}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-muted/25 border border-border">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Entregas registradas
                                </span>
                                <p className="text-xs font-bold text-foreground mt-1 flex items-center gap-1.5">
                                    <FolderOpen className="size-3.5 text-[#10B981]" />
                                    {asesorado.total_versiones} versión(es)
                                </p>
                            </div>
                        </div>

                        {/* Datos de contacto del sustentante */}
                        <div className="p-3.5 rounded-xl bg-muted/25 border border-border space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <GraduationCap className="size-3.5 text-[#10B981]" />
                                Datos del Sustentante
                            </span>

                            <div className="space-y-1.5 pt-0.5">
                                <div className="flex items-center gap-2 text-xs text-foreground">
                                    <Mail className="size-3.5 text-muted-foreground shrink-0" />
                                    <span className="truncate">{sustentante.email}</span>
                                </div>

                                {sustentante.telefono && (
                                    <div className="flex items-center gap-2 text-xs text-foreground">
                                        <Phone className="size-3.5 text-muted-foreground shrink-0" />
                                        <span>{sustentante.telefono}</span>
                                    </div>
                                )}

                                {(sustentante.generacion || sustentante.turno) && (
                                    <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                                        {sustentante.generacion && (
                                            <span>Gen. {sustentante.generacion}</span>
                                        )}
                                        {sustentante.generacion && sustentante.turno && (
                                            <span> &bull; </span>
                                        )}
                                        {sustentante.turno && <span>Turno {sustentante.turno}</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Último avance / Documento más reciente */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                Último avance entregado
                            </span>

                            {ultima_version ? (
                                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="p-2 rounded-lg bg-[#10B981]/10 text-[#10B981] shrink-0">
                                                <FileText className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground">
                                                    {ultima_version.numero_version} enviada
                                                </p>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {ultima_version.fecha_envio}
                                                </p>
                                            </div>
                                        </div>

                                        {ultima_version.url_archivo && (
                                            <a
                                                href={ultima_version.url_archivo}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0"
                                            >
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-500/10 cursor-pointer"
                                                >
                                                    <Eye className="size-3.5 mr-1" />
                                                    Ver PDF
                                                </Button>
                                            </a>
                                        )}
                                    </div>

                                    {ultima_version.comentario_alumno && (
                                        <p className="text-[11px] text-muted-foreground italic border-t border-border/60 pt-2">
                                            &ldquo;{ultima_version.comentario_alumno}&rdquo;
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-xl border border-dashed border-border text-center text-muted-foreground italic">
                                    El sustentante aún no ha subido versiones de tesis para revisión.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CONTENIDO DE PESTAÑA 2: VERSIONES Y ARCHIVOS (COMBINADA) */}
                {activeTab === 'versiones' && (
                    <div className="space-y-4 text-xs animate-in fade-in duration-200 max-h-[540px] overflow-y-auto pr-1">
                        {/* SECCIÓN A: HISTORIAL DE VERSIONES DE TESIS */}
                        <div className="space-y-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                Historial de Versiones de Tesis ({versiones.length})
                            </span>

                            {versiones.length > 0 ? (
                                <div className="relative pl-4 border-l-2 border-border space-y-3">
                                    {versiones.map((v, idx) => (
                                        <div
                                            key={v.id_version}
                                            className="relative p-3 rounded-xl bg-muted/25 border border-border space-y-2"
                                        >
                                            {/* Punto en la línea del tiempo */}
                                            <span
                                                className={`absolute -left-[21px] top-4 size-2.5 rounded-full ring-4 ring-card ${
                                                    idx === 0
                                                        ? 'bg-[#10B981]'
                                                        : 'bg-muted-foreground/40'
                                                }`}
                                            />

                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-foreground">
                                                            {v.numero_version}
                                                        </span>
                                                        {renderEstadoBadge(v.estado_revision)}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        Enviado: {v.fecha_envio}
                                                    </p>
                                                </div>

                                                {v.url_archivo && (
                                                    <a
                                                        href={v.url_archivo}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="shrink-0"
                                                    >
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-500/10 cursor-pointer"
                                                        >
                                                            <Eye className="size-3.5 mr-1" />
                                                            PDF
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>

                                            {v.nombre_archivo && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-background/60 px-2.5 py-1.5 rounded-lg border border-border/60">
                                                    <FileText className="size-3.5 text-red-500 shrink-0" />
                                                    <span className="truncate font-medium text-foreground">
                                                        {v.nombre_archivo}
                                                    </span>
                                                </div>
                                            )}

                                            {v.comentario_alumno && (
                                                <div className="text-[11px] text-muted-foreground pt-1">
                                                    <span className="font-semibold text-foreground block">
                                                        Nota del alumno:
                                                    </span>
                                                    &ldquo;{v.comentario_alumno}&rdquo;
                                                </div>
                                            )}

                                            {v.observaciones_asesor && (
                                                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-0.5">
                                                    <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                                        <MessageSquareText className="size-3" />
                                                        Observaciones registradas:
                                                    </span>
                                                    <p className="text-foreground/90 leading-relaxed">
                                                        {v.observaciones_asesor}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl border border-dashed border-border text-center text-muted-foreground italic">
                                    Aún no se han registrado entregas de versiones de tesis para este proyecto.
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN B: DOCUMENTO BASE DEL ANTEPROYECTO */}
                        <div className="space-y-2 pt-2 border-t border-border">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <BookOpen className="size-3.5 text-[#10B981]" />
                                Documento Base (Anteproyecto Aprobado)
                            </span>

                            {anteproyecto_archivo ? (
                                <div className="p-3 rounded-xl bg-muted/25 border border-border flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                            <FileText className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-foreground truncate">
                                                {anteproyecto_archivo.nombre_archivo}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Protocolo inicial &bull; {anteproyecto_archivo.fecha_envio}
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href={anteproyecto_archivo.url_archivo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0"
                                    >
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer"
                                        >
                                            <Eye className="size-3.5 mr-1" />
                                            Ver
                                        </Button>
                                    </a>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">
                                    Sin documento PDF de anteproyecto disponible.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* PIE DEL PANEL */}
            <div className="pt-4 border-t border-border mt-6 flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="w-full text-xs font-semibold cursor-pointer"
                >
                    Cerrar panel lateral
                </Button>
            </div>
        </aside>
    );
}

