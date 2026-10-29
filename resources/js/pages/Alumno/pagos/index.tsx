import { Head, Link } from '@inertiajs/react';
import { FileText, CreditCard, Eye, CreditCard as PayIcon, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { PaymentDetailsModal, type PagoDetalle } from './show-pagos';

interface Props {
    pagos?: PagoDetalle[];
}

export default function AlumnoPagosIndex({ pagos = [] }: Props) {
    const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoDetalle | null>(null);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <>
            <Head title="Mis Pagos" />

            <div className="flex flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                {/* ENCABEZADO Y TÍTULO */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            MIS PAGOS
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Consulta tu estado de cuenta, historial de pagos y aranceles del proceso de titulación.
                        </p>
                    </div>
                </div>

                {/* ACTIVIDAD DE PAGOS */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    {/* Header de la tarjeta */}
                    <div className="border-b border-border px-6 py-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">
                                Actividad de Pagos
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Aranceles oficiales asignados y estado de validación.
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                            <CreditCard className="size-4" />
                            {pagos.length} trámites asignados
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 text-left">
                                <tr className="border-b border-border">
                                    <th className="px-6 py-4 font-semibold text-muted-foreground">Concepto</th>
                                    <th className="px-6 py-4 font-semibold text-muted-foreground">Fecha</th>
                                    <th className="px-6 py-4 font-semibold text-muted-foreground">Monto</th>
                                    <th className="px-6 py-4 font-semibold text-muted-foreground">Estado</th>
                                    <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagos.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            No tienes trámites o aranceles pendientes en este momento.
                                        </td>
                                    </tr>
                                ) : (
                                    pagos.map((pago) => {
                                        const esValidado = pago.estado_validacion === 'Validado';
                                        const esRechazado = pago.estado_validacion === 'Rechazado';
                                        const enRevision =
                                            pago.estado_validacion === 'Pendiente' &&
                                            Boolean(pago.referencia_bancaria);

                                        return (
                                            <tr
                                                key={pago.id_pago}
                                                className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 rounded-lg bg-[#B8D4E3]/20 text-[#315c73] dark:bg-[#B8D4E3]/10 dark:text-[#B8D4E3] mt-0.5">
                                                            <FileText className="size-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-semibold text-foreground block">
                                                                {pago.concepto}
                                                            </span>
                                                            {pago.referencia_bancaria && (
                                                                <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                                                                    Archivo: {pago.referencia_bancaria}
                                                                </span>
                                                            )}
                                                            {esRechazado && pago.comentarios && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-medium mt-1">
                                                                    <AlertCircle className="size-3 shrink-0" />
                                                                    Motivo de rechazo: {pago.comentarios}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                                    {formatDate(pago.fecha_pago || pago.created_at)}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-foreground whitespace-nowrap">
                                                    {formatCurrency(pago.monto)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {esValidado ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                                                            <CheckCircle2 className="size-3" />
                                                            Validado
                                                        </span>
                                                    ) : esRechazado ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                                                            <XCircle className="size-3" />
                                                            Rechazado
                                                        </span>
                                                    ) : enRevision ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800">
                                                            <Clock className="size-3" />
                                                            En revisión
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                                            <Clock className="size-3" />
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Si está Validado o En revisión o Rechazado, mostrar botón de Ver Detalles */}
                                                        {(esValidado || enRevision || esRechazado) && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setPagoSeleccionado(pago)}
                                                                className="gap-1.5 border-[#B8D4E3] text-[#315c73] hover:bg-[#B8D4E3]/20 dark:border-[#B8D4E3]/50 dark:text-[#B8D4E3] dark:hover:bg-[#B8D4E3]/10 cursor-pointer"
                                                            >
                                                                <Eye className="size-4" />
                                                                Detalles
                                                            </Button>
                                                        )}

                                                        {/* Si está Pendiente (sin pagar) o Rechazado, mostrar botón de Pagar Ahora */}
                                                        {(!esValidado && !enRevision) && (
                                                            <Button
                                                                asChild
                                                                size="sm"
                                                                className="gap-1.5 bg-[#10B981] hover:bg-[#0ea371] text-white"
                                                            >
                                                                <Link href={`/alumno/pagos/create?id_pago=${pago.id_pago}`}>
                                                                    <PayIcon className="size-4" />
                                                                    Pagar Ahora
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de detalles del pago */}
            <PaymentDetailsModal
                isOpen={Boolean(pagoSeleccionado)}
                onClose={() => setPagoSeleccionado(null)}
                pago={pagoSeleccionado}
            />
        </>
    );
}

// Breadcrumbs para la barra superior
AlumnoPagosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Pagos',
            href: '/alumno/pagos',
        },
    ],
};
