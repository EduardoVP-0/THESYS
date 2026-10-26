import { CalendarClock, Info, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Sede } from './types';

interface ShowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sede: Sede | null;
}

export function ShowModal({ open, onOpenChange, sede }: ShowModalProps) {
    if (!sede) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden border-border bg-background sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                        <MapPin className="size-5 text-[#10B981]" />
                        Detalles de la sede
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Consulta la información registrada de esta sede.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-w-0 space-y-4 py-2">
                    <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Nombre de la sede
                        </span>
                        <p className="mt-0.5 text-base font-semibold break-all text-foreground">
                            {sede.nombre_sede}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                            {sede.clave}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <span className="flex items-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <Info className="size-3.5" />
                                Estado
                            </span>
                            <div className="mt-1">
                                {sede.estado ? (
                                    <span className="inline-flex rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0F9F6E] dark:text-[#34D399]">
                                        Activa
                                    </span>
                                ) : (
                                    <span className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                                        Inactiva
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <span className="flex items-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <CalendarClock className="size-3.5" />
                                Exámenes
                            </span>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                                {sede.examenes_count} programado
                                {sede.examenes_count === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>

                    <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Dirección
                        </span>
                        <p className="mt-1 text-sm break-all whitespace-pre-line text-muted-foreground">
                            {sede.direccion ?? 'Sin dirección registrada.'}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-border text-foreground"
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
