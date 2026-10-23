import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlumnoData } from './types';
import {
    UserCheck,
    GraduationCap,
    ShieldAlert,
    ShieldCheck
} from 'lucide-react';

interface ShowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    alumno: AlumnoData | null;
}

/**
 * MODAL PARA CONSULTAR EXPEDIENTE DEL ALUMNO
 */
export function ShowModal({ open, onOpenChange, alumno }: ShowModalProps) {
    if (!alumno) return null;

    const getBadgeStatusColor = (estado: string) => {
        switch (estado) {
            case 'Activo':
                return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
            case 'Egresado':
            case 'Titulado':
                return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
            case 'Baja temporal':
                return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300';
            case 'Baja definitiva':
                return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background border border-border rounded-xl shadow-xl">
                {/* ENCABEZADO CON AVATAR */}
                <DialogHeader className="border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-lg border border-[#10B981]/30">
                            {alumno.iniciales || 'AL'}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                {alumno.nombre_completo || `${alumno.nombre} ${alumno.apellido_p} ${alumno.apellido_m}`}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span>Matrícula: <strong className="text-foreground">{alumno.matricula}</strong></span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getBadgeStatusColor(alumno.estado_academico)}`}>
                                    {alumno.estado_academico}
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* CUERPO DE LA FICHA */}
                <div className="space-y-4 py-3 text-xs">
                    {/* SECCIÓN 1: DATOS ACADÉMICOS */}
                    <div className="space-y-2">
                        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                            <GraduationCap className="size-4 text-[#10B981]" /> Programa Académico
                        </span>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border col-span-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Carrera
                                </span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                    {alumno.carrera?.nombre_carrera || 'No asignada'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Turno
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5">
                                    {alumno.turno}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Generación
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5">
                                    {alumno.generacion || 'No especificada'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: IDENTIDAD Y CONTACTO */}
                    <div className="space-y-2">
                        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                            <UserCheck className="size-4 text-[#10B981]" /> Identidad y Contacto
                        </span>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    CURP
                                </span>
                                <p className="text-xs font-mono font-semibold text-foreground mt-0.5">
                                    {alumno.curp}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Teléfono Móvil
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5">
                                    {alumno.telefono || 'Sin teléfono'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Sexo
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5">
                                    {alumno.sexo || 'No registrado'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Fecha de Nacimiento
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5">
                                    {alumno.fecha_nacimiento ? String(alumno.fecha_nacimiento).split('T')[0] : 'No registrada'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border col-span-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Correo Institucional
                                </span>
                                <p className="text-xs font-mono font-semibold text-foreground mt-0.5">
                                    {alumno.user?.email || 'No registrado'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: ESTADO DE LA CUENTA */}
                    <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {alumno.user?.estado ? (
                                <ShieldCheck className="size-4 text-[#10B981]" />
                            ) : (
                                <ShieldAlert className="size-4 text-[#EF4444]" />
                            )}
                            <div>
                                <p className="text-xs font-bold text-foreground">
                                    Acceso al Sistema
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {alumno.user?.estado 
                                        ? 'El alumno tiene permitido el inicio de sesión.' 
                                        : 'El acceso del alumno se encuentra suspendido temporalmente.'}
                                </p>
                            </div>
                        </div>

                        {alumno.user?.estado ? (
                            <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#10B981]/15 text-[#10B981]">
                                Activo
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#EF4444]/15 text-[#EF4444]">
                                Suspendido
                            </span>
                        )}
                    </div>
                </div>

                {/* PIE */}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-border text-foreground text-xs"
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
