import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdministradorData, ROLES_ADMIN } from './types';
import {
    UserCheck,
    ShieldAlert,
    ShieldCheck,
    Calendar,
    Building2,
    Shield,
} from 'lucide-react';

interface ShowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    administrador: AdministradorData | null;
}

/**
 * MODAL PARA CONSULTAR EXPEDIENTE DEL ADMINISTRADOR
 */
export function ShowModal({ open, onOpenChange, administrador }: ShowModalProps) {
    if (!administrador) return null;

    const idRol = administrador.user?.id_rol ?? 2;
    const rolInfo = ROLES_ADMIN[idRol] ?? { label: 'Administrador', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-background border border-border rounded-xl shadow-xl">
                {/* ENCABEZADO CON AVATAR */}
                <DialogHeader className="border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-lg border border-[#10B981]/30 shrink-0">
                            {administrador.iniciales || 'AD'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-lg font-bold text-foreground break-all">
                                {administrador.nombre_completo || `${administrador.nombre} ${administrador.apellido_p} ${administrador.apellido_m}`}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-1 min-w-0">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${rolInfo.color}`}>
                                    {rolInfo.label}
                                </span>
                                <span>•</span>
                                <span className="truncate">{administrador.area}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* CUERPO DE LA FICHA */}
                <div className="space-y-4 py-3 text-xs min-w-0">
                    {/* SECCIÓN 1: ROL Y ÁREA */}
                    <div className="space-y-2">
                        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                            <Shield className="size-4 text-[#10B981]" /> Rol y Área Administrativa
                        </span>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border col-span-2 min-w-0">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Área de Adscripción
                                </span>
                                <p className="text-sm font-semibold text-foreground mt-0.5 break-all">
                                    {administrador.area}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border min-w-0">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Rol del Sistema
                                </span>
                                <p className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full border inline-block ${rolInfo.color}`}>
                                    {rolInfo.label}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border min-w-0">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Teléfono Móvil
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5 break-all">
                                    {administrador.telefono || 'Sin registrar'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: CONTACTO Y REGISTRO */}
                    <div className="space-y-2">
                        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                            <UserCheck className="size-4 text-[#10B981]" /> Contacto y Registro
                        </span>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border col-span-2 min-w-0">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Correo Institucional
                                </span>
                                <p className="text-xs font-mono font-semibold text-foreground mt-0.5 break-all">
                                    {administrador.user?.email || 'Sin correo'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border min-w-0">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    Fecha de Registro
                                </span>
                                <p className="text-xs font-semibold text-foreground mt-0.5 flex items-center gap-1 break-words">
                                    <Calendar className="size-3 text-muted-foreground shrink-0" />
                                    {administrador.created_at
                                        ? new Date(administrador.created_at).toLocaleDateString('es-MX', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'Reciente'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border min-w-0">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                    ID de Usuario
                                </span>
                                <p className="text-xs font-mono font-semibold text-foreground mt-0.5">
                                    #{administrador.id_usuario}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: ESTADO DE LA CUENTA */}
                    <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            {administrador.user?.estado ? (
                                <ShieldCheck className="size-4 text-[#10B981]" />
                            ) : (
                                <ShieldAlert className="size-4 text-[#EF4444]" />
                            )}
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground">
                                    Acceso al Sistema
                                </p>
                                <p className="text-[11px] text-muted-foreground break-words">
                                    {administrador.user?.estado
                                        ? 'El administrador tiene permitido el inicio de sesión.'
                                        : 'El acceso del administrador se encuentra suspendido temporalmente.'}
                                </p>
                            </div>
                        </div>

                        {administrador.user?.estado ? (
                            <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#10B981]/15 text-[#10B981] shrink-0">
                                Activo
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#EF4444]/15 text-[#EF4444] shrink-0">
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
