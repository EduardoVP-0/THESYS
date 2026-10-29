import { X, Download, CheckCircle2, FileText, Clock, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PagoDetalle {
    id_pago: number;
    id_usuario: number;
    id_concepto?: number | null;
    concepto: string;
    monto: number;
    referencia_bancaria?: string | null;
    metodo_pago?: string | null;
    estado_validacion: 'Pendiente' | 'Validado' | 'Rechazado';
    comentarios?: string | null;
    fecha_pago?: string | null;
    created_at?: string;
    updated_at?: string;
    url_comprobante?: string | null;
    url_descarga?: string | null;
    concepto_pago?: {
        id_concepto: number;
        clave?: string | null;
        nombre: string;
        descripcion?: string | null;
    } | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pago: PagoDetalle | null;
}

export function PaymentDetailsModal({ isOpen, onClose, pago }: Props) {
    if (!isOpen || !pago) return null;

    const esValidado = pago.estado_validacion === 'Validado';
    const esRechazado = pago.estado_validacion === 'Rechazado';
    const enRevision = pago.estado_validacion === 'Pendiente' && Boolean(pago.referencia_bancaria);

    const referenciaLimpia = pago.referencia_bancaria
        ? pago.referencia_bancaria.replace(/\.pdf$/i, '')
        : 'Sin referencia';

    const nombreArchivoPdf = pago.referencia_bancaria
        ? pago.referencia_bancaria.endsWith('.pdf')
            ? pago.referencia_bancaria
            : `${pago.referencia_bancaria}.pdf`
        : 'comprobante.pdf';

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header del Modal */}
                <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-4">
                    <div className="pr-4">
                        <h2 className="text-lg font-bold text-foreground">Detalles del Pago</h2>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">{pago.concepto}</p>
                        <p className="text-xs font-mono text-[#10B981] font-semibold mt-1">
                            Referencia: {referenciaLimpia}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Badge de Estado */}
                <div className="px-6 pt-4 shrink-0 flex items-center justify-between">
                    {esValidado ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                            <CheckCircle2 className="size-3.5" />
                            Pago Validado
                        </span>
                    ) : esRechazado ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                            <XCircle className="size-3.5" />
                            Pago Rechazado
                        </span>
                    ) : enRevision ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800">
                            <Clock className="size-3.5" />
                            En revisión administrativa
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                            <Clock className="size-3.5" />
                            Pendiente
                        </span>
                    )}

                    {pago.concepto_pago?.clave && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                            Clave: {pago.concepto_pago.clave}
                        </span>
                    )}
                </div>

                {/* Body del Modal */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto min-h-0">
                    {/* Si fue rechazado, mostrar comentario del Administrador de forma destacada */}
                    {esRechazado && (
                        <div className="rounded-xl border border-red-300 bg-red-50/90 p-4 text-red-900 dark:border-red-800/80 dark:bg-red-950/40 dark:text-red-200 space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-red-700 dark:text-red-300">
                                <AlertTriangle className="size-4 shrink-0" />
                                Motivo del rechazo (Administrador)
                            </div>
                            <p className="text-sm leading-relaxed font-medium">
                                {pago.comentarios || 'El área administrativa rechazó este comprobante por inconsistencias en la validación. Por favor, realiza el pago nuevamente.'}
                            </p>
                        </div>
                    )}

                    {/* Si no está rechazado pero el admin dejó un comentario */}
                    {!esRechazado && pago.comentarios && (
                        <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs space-y-1">
                            <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                                Nota del Administrador:
                            </p>
                            <p className="text-muted-foreground leading-relaxed">{pago.comentarios}</p>
                        </div>
                    )}

                    {/* Concepto */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Descripción del concepto
                        </h3>
                        <p className="text-sm text-foreground mt-1 leading-relaxed">
                            {pago.concepto_pago?.descripcion || 'Trámite oficial requerido dentro del proceso de titulación integral.'}
                        </p>
                    </div>

                    {/* Monto */}
                    <div className="rounded-xl bg-muted/30 p-4 border border-border flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Monto Total
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Pesos mexicanos (MXN)</p>
                        </div>
                        <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(pago.monto)}</p>
                    </div>

                    {/* Detalles de Transacción */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground">Fecha de registro</p>
                            <p className="font-medium text-foreground mt-1 text-xs">
                                {formatDate(pago.fecha_pago || pago.updated_at || pago.created_at)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground">Método de pago</p>
                            <p className="font-medium text-foreground mt-1 text-xs">
                                {pago.metodo_pago || 'Pago referenciado'}
                            </p>
                        </div>
                    </div>

                    {/* Archivo generado */}
                    {pago.referencia_bancaria && (
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/20 p-3 text-xs border border-border">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded-lg bg-[#10B981]/10 text-[#10B981]">
                                    <FileText className="size-4 shrink-0" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono font-bold text-foreground truncate">
                                        {nombreArchivoPdf}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Comprobante oficial resguardado en expediente
                                    </p>
                                </div>
                            </div>
                            {pago.url_comprobante && (
                                <a
                                    href={pago.url_comprobante}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    title="Ver PDF en nueva pestaña"
                                >
                                    <ExternalLink className="size-4" />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer con Botones */}
                <div className="flex shrink-0 gap-3 border-t border-border bg-muted/10 px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 border-border text-foreground hover:bg-accent/40 cursor-pointer"
                    >
                        Cerrar
                    </Button>
                    {pago.url_descarga && (
                        <Button
                            asChild
                            className="flex-1 bg-[#10B981] hover:bg-[#0ea371] text-white gap-2 font-bold"
                        >
                            <a href={pago.url_descarga} download={nombreArchivoPdf}>
                                <Download className="size-4" />
                                Descargar recibo
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
