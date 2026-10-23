import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DocenteData } from './types';
import {
    UserCheck,
    Briefcase,
    ShieldAlert,
    ShieldCheck,
    Award,
    Calendar,
} from 'lucide-react';

interface ShowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    docente: DocenteData | null;
}

/**
 * MODAL PARA CONSULTAR EXPEDIENTE DEL DOCENTE
 */
export function ShowModal({ open, onOpenChange, docente }: ShowModalProps) {
    if (!docente) return null;

    const getGradoBadgeColor = (grado: string) => {
        switch (grado) {
            case 'Doctorado':
                return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'Maestría':
                return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'Especialidad':
                return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px] bg-background border border-border rounded-xl shadow-xl">
                {/* ENCABEZADO CON AVATAR */}
                <DialogHeader className="border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-lg border border-[#10B981]/30 shrink-0">
                            {docente.iniciales || 'DC'}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                {docente.nombre_completo || `${docente.nombre} ${docente.apellido_p} ${docente.apellido_m}`}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                                <span>Cédula: <strong className="text-foreground font-mono">{docente.cedula_profesional}</strong></span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getGradoBadgeColor(docente.grado_academico)}`}>
                                    {docente.grado_academico}
                                </span>
                                <span>•</span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                                    {docente.tipo_contrato}
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* CUERPO DE LA FICHA */}
                <div className="space-y-4 py-3 text-xs">
                    {/* SECCION 1: PERFIL ACADEMICO Y LABORAL */}
                    <div className="space-y-2">
                        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                            <Briefcase className="size-4 text-[#10B981]" /> Perfil Académico y Laboral
                        </span>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border col-span-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Especialidad / Área de Conocimiento
                                </span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                    {docente.especialidad}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Grado Académico
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5">
                                    {docente.grado_academico}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Tipo de Contrato
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5">
                                    {docente.tipo_contrato}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECCION 2: IDENTIDAD Y CONTACTO */}
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
                                    {docente.curp}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Teléfono Móvil
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5">
                                    {docente.telefono || 'Sin registrar'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Correo Institucional
                                </span>
                                <p className="text-xs font-mono font-semibold text-foreground mt-0.5">
                                    {docente.user?.email || 'Sin correo'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Fecha de Registro
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5 flex items-center gap-1">
                                    <Calendar className="size-3 text-muted-foreground" />
                                    {docente.created_at
                                        ? new Date(docente.created_at).toLocaleDateString('es-MX', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'Reciente'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECCION 3: ESTADO DE LA CUENTA */}
                    <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {docente.user?.estado ? (
                                <ShieldCheck className="size-4 text-[#10B981]" />
                            ) : (
                                <ShieldAlert className="size-4 text-[#EF4444]" />
                            )}
                            <div>
                                <p className="text-xs font-bold text-foreground">
                                    Acceso al Sistema
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {docente.user?.estado
                                        ? 'El docente tiene permitido el inicio de sesión.'
                                        : 'El acceso del docente se encuentra suspendido temporalmente.'}
                                </p>
                            </div>
                        </div>

                        {docente.user?.estado ? (
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
