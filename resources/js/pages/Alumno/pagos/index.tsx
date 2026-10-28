import { Head } from '@inertiajs/react';
import { Download, FileText, CreditCard, Eye, CreditCard as PayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Datos Mock (Sin base de datos) ───
const MOCK_PAYMENTS = [
    { id: 1, concept: 'Examen Profesional', date: 'Oct 09, 2026', amount: '$185.00', status: 'Validado' },
    { id: 2, concept: 'Emisión de Título', date: 'Oct 08, 2026', amount: '$240.00', status: 'Validado' },
    { id: 3, concept: 'Autorización de Examen', date: 'Oct 05, 2026', amount: '$115.00', status: 'Pendiente' },
    { id: 4, concept: 'Duplicado de Título', date: 'Oct 03, 2026', amount: '$75.00', status: 'Rechazado' },
    { id: 5, concept: 'Constancia de Estudios', date: 'Sep 29, 2026', amount: '$85.00', status: 'Validado' },
];

export default function AlumnoPagosIndex() {
    return (
        <>
            <Head title="Pagos" />

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

                {/* ACTIVIDAD DE PAGOS (Payment Activity) */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    {/* Header de la tarjeta */}
                    <div className="border-b border-border px-6 py-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">
                                Actividad de Pagos
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Historial de transacciones y estado actual.
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                            <CreditCard className="size-4" />
                            {MOCK_PAYMENTS.length} registros
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
                                {MOCK_PAYMENTS.map((payment) => (
                                    <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-[#B8D4E3]/20 text-[#315c73] dark:bg-[#B8D4E3]/10 dark:text-[#B8D4E3]">
                                                    <FileText className="size-4" />
                                                </div>
                                                <span className="font-semibold text-foreground">{payment.concept}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{payment.date}</td>
                                        <td className="px-6 py-4 font-bold text-foreground">{payment.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                payment.status === 'Validado' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                                                : payment.status === 'Pendiente'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {payment.status === 'Validado' ? (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="gap-2 border-[#B8D4E3] text-[#315c73] hover:bg-[#B8D4E3]/20 dark:border-[#B8D4E3]/50 dark:text-[#B8D4E3] dark:hover:bg-[#B8D4E3]/10"
                                                >
                                                    <Eye className="size-4" />
                                                    Detalles
                                                </Button>
                                            ) : (
                                                <Button 
                                                    size="sm"
                                                    className="gap-2 bg-[#10B981] hover:bg-[#0ea371] text-white"
                                                >
                                                    <PayIcon className="size-4" />
                                                    Pagar 
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
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