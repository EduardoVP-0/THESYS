import { Download, FileSpreadsheet, FileText, FileIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Props que recibe del componente padre (index.tsx)
interface ExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {

    /**
     * Abre la ruta de exportación a PDF en una nueva pestaña.
     * La página HTML generada por Laravel ejecuta window.print() automáticamente,
     * así el usuario puede guardar como PDF desde el diálogo de impresión del navegador.
     */
    const handleExportPdf = () => {
        window.open('/admin/carreras/export-pdf', '_blank');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-[500px] bg-background border-border rounded-xl shadow-lg"
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-foreground">
                        Exportar Carreras
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Selecciona el formato en el que deseas obtener el catálogo de carreras.
                    </DialogDescription>
                </DialogHeader>

                {/* Opciones de exportación */}
                <div className="grid gap-3 py-4">

                    {/* Opción 1: Descargar CSV */}
                    <a
                        href="/admin/carreras/export-csv"
                        download
                        className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:bg-accent/40 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/15">
                                <FileSpreadsheet className="size-5 text-[#10B981]" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground">Descargar en formato CSV</h4>
                                <p className="text-xs text-muted-foreground">Compatible con Microsoft Excel</p>
                            </div>
                        </div>
                        <Download className="size-4 text-muted-foreground group-hover:text-foreground" />
                    </a>

                    {/* Opción 2: Exportar a PDF (abre pestaña para imprimir solo la tabla) */}
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:bg-accent/40 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/15">
                                <FileText className="size-5 text-[#EF4444]" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground">Exportar a PDF</h4>
                                <p className="text-xs text-muted-foreground">Genera un documento imprimible con los datos de la tabla.</p>
                            </div>
                        </div>
                        <Download className="size-4 text-muted-foreground group-hover:text-foreground" />
                    </button>

                    {/* Opción 3: Descargar en formato Word (.doc) */}
                    <a
                        href="/admin/carreras/export-word"
                        download
                        className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:bg-accent/40 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/15">
                                <FileIcon className="size-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground">Descargar en formato Word</h4>
                                <p className="text-xs text-muted-foreground">Documento .doc editable, compatible con Microsoft Word</p>
                            </div>
                        </div>
                        <Download className="size-4 text-muted-foreground group-hover:text-foreground" />
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
}
