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
            <DialogContent className="sm:max-w-[480px] bg-white border border-[#B8D4E3]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#2D2D2D]">
                        <BookOpen className="size-5 text-[#B8D4E3]" />
                        Detalles de la Carrera
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Consulta la información registrada de esta carrera.
                    </DialogDescription>
                </DialogHeader>

                {/* CUERPO: Mostramos la información formateada */}
                <div className="space-y-4 py-2">
                    {/* Nombre */}
                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Nombre de la Carrera
                        </span>
                        <p className="text-base font-semibold text-[#2D2D2D] mt-0.5">
                            {carrera.nombre_carrera}
                        </p>
                    </div>

                    {/* Duración y Estado en dos columnas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <Clock className="size-3.5" /> Duración
                            </span>
                            <p className="text-sm font-semibold text-[#2D2D2D] mt-1">
                                {carrera.duracion_semestres} Semestres
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <Info className="size-3.5" /> Estado
                            </span>
                            <div className="mt-1">
                                {carrera.estado ? (
                                    <span className="bg-green-100 text-black badge badge-success badge-soft font-semibold text-xs px-2.5 py-0.5">
                                        Vigente
                                    </span>
                                ) : (
                                    <span className="bg-red-500 text-white badge badge-error badge-soft font-semibold text-xs px-2.5 py-0.5">
                                        Inactivo
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Descripción
                        </span>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                            {carrera.descripcion ? carrera.descripcion : 'Sin descripción registrada.'}
                        </p>
                    </div>
                </div>

                {/* Pie con botón para cerrar */}
                <DialogFooter>
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        className="border-[#6B7280] text-[#2D2D2D]"
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
