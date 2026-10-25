import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    UserCheck,
    FileText,
    GraduationCap,
    Users,
    AlertCircle,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { AlumnoConProyectos, DocenteItem, ProyectoAprobado, formatGradoAcademico } from './types';

interface ConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    alumno: AlumnoConProyectos | null;
    proyecto: ProyectoAprobado | null;
    revisor1: DocenteItem | null;
    revisor2: DocenteItem | null;
    onConfirm: () => void;
    processing: boolean;
}

export function ConfirmModal({
    open,
    onOpenChange,
    alumno,
    proyecto,
    revisor1,
    revisor2,
    onConfirm,
    processing,
}: ConfirmModalProps) {
    if (!alumno || !proyecto || !revisor1 || !revisor2) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden border-border bg-card">
                {/* Cabecera institucional */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
                    <DialogHeader className="text-left space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-white/15 backdrop-blur-xs text-white">
                                <UserCheck className="size-5" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-white tracking-tight">
                                Confirmar Asignación de Revisores
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-emerald-100 text-xs sm:text-sm">
                            Verifica la información antes de oficializar la asignación de revisores para este anteproyecto.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Ficha Sustentante y Proyecto */}
                    <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                                <GraduationCap className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Sustentante
                                </p>
                                <p className="text-sm font-bold text-foreground">
                                    {alumno.nombre_completo}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Matrícula: <span className="font-mono font-medium text-foreground">{alumno.matricula}</span> &bull; {alumno.carrera}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-border/60 pt-2.5 flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                <FileText className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Anteproyecto Aprobado
                                </p>
                                <p className="text-sm font-medium text-foreground line-clamp-2">
                                    {proyecto.titulo}
                                </p>
                            </div>
                        </div>

                        {proyecto.asesor && (
                            <div className="border-t border-border/60 pt-2.5 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">
                                    Director / Asesor de Tesis:
                                </span>
                                <span className="font-semibold text-foreground">
                                    {formatGradoAcademico(proyecto.asesor.grado_academico) ? `${formatGradoAcademico(proyecto.asesor.grado_academico)} ` : ''}
                                    {proyecto.asesor.nombre_completo}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Ficha de los 2 Revisores Designados */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Revisores Designados
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Revisor 1 */}
                            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                        Revisor 1 (Titular)
                                    </span>
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Carga: {revisor1.carga_total} / {revisor1.max_carga}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-foreground mt-1">
                                    {formatGradoAcademico(revisor1.grado_academico) ? `${formatGradoAcademico(revisor1.grado_academico)} ` : ''}
                                    {revisor1.nombre_completo}
                                </p>
                                {revisor1.especialidad && (
                                    <p className="text-xs text-muted-foreground">
                                        {revisor1.especialidad}
                                    </p>
                                )}
                            </div>

                            {/* Revisor 2 */}
                            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                        Revisor 2 (Suplente)
                                    </span>
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Carga: {revisor2.carga_total} / {revisor2.max_carga}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-foreground mt-1">
                                    {formatGradoAcademico(revisor2.grado_academico) ? `${formatGradoAcademico(revisor2.grado_academico)} ` : ''}
                                    {revisor2.nombre_completo}
                                </p>
                                {revisor2.especialidad && (
                                    <p className="text-xs text-muted-foreground">
                                        {revisor2.especialidad}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Aviso normativo institucional */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs">
                        <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <p>
                            Al confirmar, el sistema registrará oficialmente a ambos docentes como revisores del anteproyecto. Cada docente sumará +1 a su carga académica activa.
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-4 sm:p-6 bg-muted/20 border-t border-border flex flex-col sm:flex-row gap-2 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-sm transition-all"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Asignando revisores...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-4 mr-2" />
                                Confirmar y Guardar Asignación
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
