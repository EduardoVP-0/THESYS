import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { EstadoBadge } from './estado-badge';
import type { TesisReciente } from './types';

interface UltimasTesisProps {
    tesis: TesisReciente[];
    todasTesis: TesisReciente[];
    total: number;
}

export function UltimasTesis({ tesis, todasTesis, total }: UltimasTesisProps) {
    const [dialogoAbierto, setDialogoAbierto] = useState(false);

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-bold text-foreground">
                        Últimas tesis registradas
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Registros más recientes del proceso de titulación.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-border bg-background text-xs font-medium hover:bg-accent/40"
                    onClick={() => setDialogoAbierto(true)}
                >
                    Ver todas
                </Button>
            </div>

            <div className="flex-1">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="border-b border-border">
                            <TableHead className="px-4 font-semibold text-foreground">
                                Título
                            </TableHead>
                            <TableHead className="px-4 font-semibold text-foreground">
                                Estudiante
                            </TableHead>
                            <TableHead className="px-4 text-right font-semibold text-foreground">
                                Estado
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tesis.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    Aún no hay tesis registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tesis.map((item) => (
                                <TableRow
                                    key={item.id_proyecto}
                                    className="border-b border-border transition-colors hover:bg-accent/20"
                                >
                                    <TableCell className="max-w-[280px] px-4 py-3">
                                        <span
                                            className="block truncate text-sm font-medium text-foreground"
                                            title={item.titulo}
                                        >
                                            {item.titulo}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {item.fecha}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[180px] px-4 py-3">
                                        <span
                                            className="block truncate text-sm text-muted-foreground"
                                            title={item.estudiante}
                                        >
                                            {item.estudiante}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-right">
                                        <EstadoBadge estado={item.estado} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-border bg-background sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">
                            Todas las tesis registradas
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Mostrando {todasTesis.length} de {total} tesis,
                            ordenadas por fecha de registro.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-hidden rounded-xl border border-border">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-b border-border">
                                    <TableHead className="px-4 font-semibold text-foreground">
                                        Título
                                    </TableHead>
                                    <TableHead className="px-4 font-semibold text-foreground">
                                        Estudiante
                                    </TableHead>
                                    <TableHead className="px-4 font-semibold text-foreground">
                                        Estado
                                    </TableHead>
                                    <TableHead className="px-4 text-right font-semibold text-foreground">
                                        Fecha
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todasTesis.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            Aún no hay tesis registradas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    todasTesis.map((item) => (
                                        <TableRow
                                            key={item.id_proyecto}
                                            className="border-b border-border transition-colors hover:bg-accent/20"
                                        >
                                            <TableCell className="max-w-[280px] px-4 py-3">
                                                <span
                                                    className="block truncate text-sm font-medium text-foreground"
                                                    title={item.titulo}
                                                >
                                                    {item.titulo}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[180px] px-4 py-3">
                                                <span
                                                    className="block truncate text-sm text-muted-foreground"
                                                    title={item.estudiante}
                                                >
                                                    {item.estudiante}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <EstadoBadge
                                                    estado={item.estado}
                                                />
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-right text-xs text-muted-foreground">
                                                {item.fecha}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {todasTesis.length < total && (
                        <p className="text-center text-[11px] text-muted-foreground">
                            Se muestran las {todasTesis.length} tesis más
                            recientes.
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
