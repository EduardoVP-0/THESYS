import { useState, FormEventHandler, ChangeEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet, FileText, Upload, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ExportImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportImportModal({ open, onOpenChange }: ExportImportModalProps) {
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

    // useForm de Inertia para subir el archivo CSV
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        archivo_csv: File | null;
    }>({
        archivo_csv: null,
    });

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setData('archivo_csv', e.target.files[0]);
        }
    };

    const handleImportSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/carreras/import', {
            onSuccess: () => {
                reset();
                clearErrors();
                onOpenChange(false);
            },
        });
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    const handlePrintPDF = () => {
        onOpenChange(false);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent 
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-[500px] bg-white border-[#D1D5DB] rounded-xl shadow-lg"
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#000000]">
                        Exportar / Importar Carreras
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#2D2D2D]/70">
                        Descarga el catálogo institucional en CSV/PDF o importa nuevas carreras masivamente.
                    </DialogDescription>
                </DialogHeader>

                {/* Selector de Pestañas con DaisyUI */}
                <div className="flex border-b border-[#D1D5DB] gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('export')}
                        className={`pb-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
                            activeTab === 'export'
                                ? 'border-[#B8D4E3] text-[#000000]'
                                : 'border-transparent text-[#2D2D2D]/60 hover:text-[#2D2D2D]'
                        }`}
                    >
                        Exportar Datos
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('import')}
                        className={`pb-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
                            activeTab === 'import'
                                ? 'border-[#B8D4E3] text-[#000000]'
                                : 'border-transparent text-[#2D2D2D]/60 hover:text-[#2D2D2D]'
                        }`}
                    >
                        Importar desde CSV
                    </button>
                </div>

                {/* CONTENIDO PESTAÑA: EXPORTAR */}
                {activeTab === 'export' && (
                    <div className="grid gap-3 py-4">
                        <p className="text-xs text-[#2D2D2D]">
                            Selecciona el formato en el que deseas obtener el catálogo de carreras:
                        </p>

                        {/* Opción 1: Descargar CSV */}
                        <a
                            href="/admin/carreras/export-csv"
                            download
                            className="flex items-center justify-between p-3.5 border border-[#D1D5DB] rounded-xl hover:bg-[#B8D4E3]/20 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#B8D4E3]/30 text-[#2D2D2D]">
                                    <FileSpreadsheet className="size-5 text-[#10B981]" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#000000]">Descargar en formato CSV</h4>
                                    <p className="text-xs text-[#2D2D2D]/70">Compatible con Microsoft Excel, Google Sheets y Calc.</p>
                                </div>
                            </div>
                            <Download className="size-4 text-[#2D2D2D]/60 group-hover:text-[#000000]" />
                        </a>

                        {/* Opción 2: Exportar a PDF (Impresión institucional) */}
                        <button
                            type="button"
                            onClick={handlePrintPDF}
                            className="flex items-center justify-between p-3.5 border border-[#D1D5DB] rounded-xl hover:bg-[#B8D4E3]/20 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#B8D4E3]/30 text-[#2D2D2D]">
                                    <FileText className="size-5 text-[#EF4444]" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#000000]">Exportar a PDF / Imprimir</h4>
                                    <p className="text-xs text-[#2D2D2D]/70">Genera una vista imprimible y limpia para archivo o reporte oficial.</p>
                                </div>
                            </div>
                            <Download className="size-4 text-[#2D2D2D]/60 group-hover:text-[#000000]" />
                        </button>
                    </div>
                )}

                {/* CONTENIDO PESTAÑA: IMPORTAR */}
                {activeTab === 'import' && (
                    <form onSubmit={handleImportSubmit} className="grid gap-4 py-4">
                        <div className="p-3 bg-neutral-50 border border-[#D1D5DB] rounded-xl text-xs text-[#2D2D2D] flex gap-2 items-start">
                            <AlertCircle className="size-4 text-[#F59E0B] shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold">Estructura requerida del archivo CSV:</span>
                                <p className="mt-0.5">Columna 1: Nombre de la Carrera, Columna 2: Duración (Semestres), Columna 3: Descripción.</p>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="archivo_csv" className="text-sm font-semibold text-[#2D2D2D]">
                                Seleccionar archivo CSV (.csv)
                            </Label>
                            <input
                                id="archivo_csv"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleFileChange}
                                className="file-input file-input-bordered file-input-sm w-full border-[#D1D5DB] bg-white rounded-lg"
                                required
                            />
                            {errors.archivo_csv && (
                                <p className="text-xs text-[#EF4444] mt-1">{errors.archivo_csv}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleClose(false)}
                                className="border-[#D1D5DB] text-[#2D2D2D]"
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <button
                                type="submit"
                                disabled={processing || !data.archivo_csv}
                                className="btn btn-sm border-2 border-[#10B981] text-[#10B981] bg-white hover:bg-[#B8D4E3]/20 font-medium"
                            >
                                {processing && <span className="loading loading-spinner loading-xs"></span>}
                                <Upload className="size-4" />
                                {processing ? 'Importando...' : 'Subir e Importar'}
                            </button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
