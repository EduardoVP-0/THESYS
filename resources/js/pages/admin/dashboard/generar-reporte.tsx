import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { report } from '@/routes/admin/dashboard';
import type { TesisReciente } from './types';

type FormatoReporte = 'pdf' | 'csv';

interface GenerarReporteProps {
    tesis: TesisReciente[];
    total: number;
}

export function GenerarReporte({ tesis, total }: GenerarReporteProps) {
    const [formato, setFormato] = useState<FormatoReporte>('pdf');

    const generarReporte = () => {
        const url = report.url({ query: { format: formato } });

        if (formato === 'pdf') {
            window.open(url, '_blank', 'noopener,noreferrer');

            return;
        }

        window.location.href = url;
    };

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <h2 className="text-base font-bold text-foreground">
                    Generar Reporte
                </h2>
                <Select
                    value={formato}
                    onValueChange={(value) =>
                        setFormato(value as FormatoReporte)
                    }
                >
                    <SelectTrigger
                        className="h-8 w-24 rounded-xl border-border bg-background text-xs font-semibold"
                        aria-label="Formato del reporte"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover">
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex-1 space-y-2">
                    {tesis.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Aún no hay tesis para incluir en el reporte.
                        </p>
                    ) : (
                        tesis.slice(0, 3).map((item) => (
                            <div
                                key={item.id_proyecto}
                                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
                            >
                                <div className="rounded-lg bg-[#10B981]/15 p-2 text-[#10B981]">
                                    <FileText className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="truncate text-xs font-semibold text-foreground"
                                        title={item.titulo}
                                    >
                                        {item.titulo}
                                    </p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        {item.estudiante}
                                    </p>
                                </div>
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                    {item.fecha}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <Button
                    type="button"
                    onClick={generarReporte}
                    disabled={total === 0}
                    className="w-full gap-2 border-2 border-[#10B981] bg-background font-semibold text-[#10B981] shadow-xs hover:bg-accent/40"
                >
                    <Download className="size-4 text-[#10B981]" />
                    Descargar reporte {formato.toUpperCase()}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground">
                    {formato === 'pdf'
                        ? 'Se abrirá una vista imprimible para guardar como PDF.'
                        : 'Se descargará un archivo compatible con Excel.'}
                </p>
            </div>
        </div>
    );
}
