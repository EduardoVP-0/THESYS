import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Info } from 'lucide-react';

// 1. Definimos qué datos tiene la carrera
interface Carrera {
    id_carrera: number;
    nombre_carrera: string;
    descripcion: string | null;
    duracion_semestres: number;
    estado: boolean;
}

// 2. Definimos las props que recibirá el componente desde index.tsx
interface ShowModalProps {
    open: boolean;                           // ¿Está abierto o cerrado?
    onOpenChange: (open: boolean) => void;  // Función para cerrarlo
    carrera: Carrera | null;                 // La carrera que seleccionó el usuario
}

export function ShowModal({ open, onOpenChange, carrera }: ShowModalProps) {
    // Si no han seleccionado ninguna carrera, no renderizamos nada
    if (!carrera) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-background border border-border overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                        <BookOpen className="size-5 text-[#B8D4E3]" />
                        Detalles de la Carrera
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Consulta la información registrada de esta carrera.
                    </DialogDescription>
                </DialogHeader>

                {/* CUERPO: Mostramos la información formateada */}
                <div className="space-y-4 py-2 min-w-0">
                    {/* Nombre */}
                    <div className="rounded-lg bg-muted/30 p-3 border border-border min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Nombre de la Carrera
                        </span>
                        <p className="text-base font-semibold text-foreground mt-0.5 break-all">
                            {carrera.nombre_carrera}
                        </p>
                    </div>

                    {/* Duración y Estado en dos columnas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted/30 p-3 border border-border">
                            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <Clock className="size-3.5" /> Duración
                            </span>
                            <p className="text-sm font-semibold text-foreground mt-1">
                                {carrera.duracion_semestres} Semestres
                            </p>
                        </div>

                        <div className="rounded-lg bg-muted/30 p-3 border border-border">
                            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <Info className="size-3.5" /> Estado
                            </span>
                            <div className="mt-1">
                                {carrera.estado ? (
                                    <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 badge badge-success badge-soft font-semibold text-xs px-2.5 py-0.5">
                                        Vigente
                                    </span>
                                ) : (
                                    <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 badge badge-error badge-soft font-semibold text-xs px-2.5 py-0.5">
                                        Inactivo
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Descripción con scroll vertical y salto de línea */}
                    <div className="rounded-lg bg-muted/30 p-3 border border-border min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Descripción
                        </span>
                        <div className="max-h-48 overflow-y-auto pr-1 mt-1">
                            <p className="text-sm text-muted-foreground whitespace-pre-line break-all">
                                {carrera.descripcion ? carrera.descripcion : 'Sin descripción registrada.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pie con botón para cerrar */}
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
