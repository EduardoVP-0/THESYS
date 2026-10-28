import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Award,
    BookOpen,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Mail,
    Scale,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import {
    SinodalItem,
    getDescripcionCargoProtocolo,
} from './types';

interface ShowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sinodal: SinodalItem | null;
}

/**
 * MODAL DE FICHA PUBLICA E INSTITUCIONAL DEL SINODAL
 */
export function ShowModal({
    open,
    onOpenChange,
    sinodal,
}: ShowModalProps) {
    const [copied, setCopied] = useState(false);

    if (!sinodal) {
        return null;
    }

    const { docente } = sinodal;
    const protocolo = getDescripcionCargoProtocolo(sinodal.cargo);

    const nombreConGrado = docente.abreviatura_grado
        ? `${docente.abreviatura_grado} ${docente.nombre_completo}`
        : docente.nombre_completo;

    const handleCopyEmail = async () => {
        if (!docente.email) return;
        try {
            await navigator.clipboard.writeText(docente.email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback silencioso
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Aceptado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#10B981]/15 text-emerald-700 dark:text-emerald-400 border border-[#10B981]/30">
                        <CheckCircle2 className="size-3.5 text-[#10B981]" />
                        Confirmado
                    </span>
                );
            case 'Rechazado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
                        <XCircle className="size-3.5 text-[#EF4444]" />
                        En sustitución
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="size-3.5 text-[#F59E0B]" />
                        Pendiente de confirmación
                    </span>
                );
        }
    };

    const getGradoBadgeColor = (grado: string) => {
        const lower = grado.toLowerCase();
        if (lower.includes('doc')) {
            return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
        }
        if (lower.includes('mae') || lower.includes('mtr')) {
            return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        }
        if (lower.includes('esp')) {
            return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        }
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-background border border-border rounded-xl shadow-xl">
                {/* ENCABEZADO CON AVATAR E INFORMACION PRINCIPAL */}
                <DialogHeader className="border-b border-border pb-4 text-left">
                    <div className="flex items-start gap-3.5">
                        <div className="size-13 rounded-full bg-[#B8D4E3]/45 dark:bg-[#B8D4E3]/20 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-base border border-[#B8D4E3]/70 shrink-0">
                            {docente.iniciales}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {sinodal.cargo}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                        sinodal.es_titular
                                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25'
                                            : 'bg-muted text-muted-foreground border-border'
                                    }`}
                                >
                                    {sinodal.es_titular ? 'Sinodal Titular' : 'Sinodal Suplente'}
                                </span>
                                {getEstadoBadge(sinodal.estado_aceptacion)}
                            </div>

                            <DialogTitle className="text-lg font-bold text-foreground leading-snug">
                                {nombreConGrado}
                            </DialogTitle>

                            <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getGradoBadgeColor(
                                        docente.grado_academico,
                                    )}`}
                                >
                                    {docente.grado_academico}
                                </span>
                                {sinodal.fecha_asignacion && (
                                    <>
                                        <span>•</span>
                                        <span>Designado el {sinodal.fecha_asignacion}</span>
                                    </>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* CUERPO DE LA FICHA ACADEMICA Y PROTOCOLARIA */}
                <div className="space-y-4 py-2 text-xs">
                    {/* SECCION 1: PERFIL ACADEMICO */}
                    <div className="space-y-2">
                        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                            <Award className="size-4 text-[#10B981]" />
                            Información Académica e Institucional
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="p-3 rounded-lg bg-muted/30 border border-border sm:col-span-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Especialidad / Línea de Conocimiento
                                </span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                    {docente.especialidad}
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-muted/30 border border-border sm:col-span-2 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                        Correo Electrónico Institucional
                                    </span>
                                    <p className="text-xs font-medium text-foreground mt-0.5 truncate flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-muted-foreground shrink-0" />
                                        {docente.email || 'Correo no registrado'}
                                    </p>
                                </div>

                                {docente.email && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyEmail}
                                        className="h-7 text-[11px] gap-1.5 shrink-0 cursor-pointer"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="size-3.5 text-[#10B981]" />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3.5" />
                                                Copiar
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECCION 2: FUNCION NORMATIVA EN LA DEFENSA DE TESIS */}
                    <div className="space-y-2">
                        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                            <Scale className="size-4 text-[#10B981]" />
                            Función en tu Examen de Defensa de Tesis
                        </span>

                        <div className="p-3.5 rounded-xl bg-muted/25 border border-border space-y-2.5">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <p className="text-xs font-bold text-foreground">
                                    {protocolo.tituloProtocolar}
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {protocolo.descripcion}
                            </p>

                            <div className="pt-2 border-t border-border/60 flex items-start gap-2 text-[11px] text-foreground/90">
                                <BookOpen className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <span>
                                    <strong>Intervención y voto:</strong>{' '}
                                    {protocolo.participacionDefensa}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PIE DEL MODAL */}
                <DialogFooter className="border-t border-border pt-3 flex sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-medium cursor-pointer"
                    >
                        Cerrar ficha
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

