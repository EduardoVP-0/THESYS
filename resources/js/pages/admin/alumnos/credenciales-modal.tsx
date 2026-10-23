import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Copy, Check, Eye, EyeOff, UserCheck, KeyRound } from 'lucide-react';

/**
 * Estructura de los datos de credenciales que envía el AlumnoController
 * a través de la sesión flash de Laravel.
 */
export interface CredentialsData {
    nombre: string;
    matricula: string;
    email: string;
    password: string;
}

interface CredencialesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    credentials: CredentialsData | null;
}

/**
 * MODAL DE CREDENCIALES GENERADAS
 * 
 * Se activa de manera automática una vez que se registra exitosamente un alumno.
 * Muestra el usuario, matrícula, correo institucional y la contraseña aleatoria
 * generada por Laravel (Str::password), permitiendo copiar todo con un solo clic.
 */
export function CredencialesModal({ open, onOpenChange, credentials }: CredencialesModalProps) {
    // Si no hay datos de credenciales cargados, no se dibuja nada
    if (!credentials) return null;

    // Estado local para alternar la visibilidad de la contraseña
    const [showPassword, setShowPassword] = useState(false);
    // Estado local para mostrar animación de "Copiado con éxito"
    const [copied, setCopied] = useState(false);

    /**
     * Copia al portapapeles un resumen formateado de las credenciales
     * para que el administrador pueda enviárselo al alumno.
     */
    const handleCopyAll = async () => {
        const textToCopy = `CREDENCIALES DE ACCESO - SISTEMA THESYS UNACH
========================================
Alumno: ${credentials.nombre}
Matrícula: ${credentials.matricula}
Correo Institucional: ${credentials.email}
Contraseña Temporal: ${credentials.password}
========================================
* Se recomienda cambiar la contraseña en el primer inicio de sesión.`;

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* onPointerDownOutside y onInteractOutside evitan cierres accidentales al hacer clic afuera */}
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-[480px] bg-background border-border rounded-xl shadow-xl"
            >
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2.5 text-[#10B981]">
                        <div className="p-2 rounded-lg bg-[#10B981]/15">
                            <ShieldCheck className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Credenciales de Acceso Generadas
                            </DialogTitle>
                            <span className="text-xs text-muted-foreground font-normal">
                                Registro de Alumno completado con éxito
                            </span>
                        </div>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                        La cuenta institucional ha sido creada. Guarda o comparte esta clave con el alumno; 
                        por seguridad, esta es la única ocasión en que se mostrará en texto plano.
                    </DialogDescription>
                </DialogHeader>

                {/* TARJETA DE CREDENCIALES */}
                <div className="space-y-3 py-2">
                    {/* Alumno y Matrícula */}
                    <div className="p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <UserCheck className="size-4 text-muted-foreground" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Alumno Asignado
                            </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                            {credentials.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Matrícula: <span className="font-semibold text-foreground">{credentials.matricula}</span>
                        </p>
                    </div>

                    {/* Correo Institucional */}
                    <div className="p-3 bg-muted/30 rounded-lg border border-border">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                            Correo Institucional (@unach.mx)
                        </span>
                        <code className="text-xs font-mono font-semibold text-foreground bg-background px-2 py-1 rounded border border-border block select-all">
                            {credentials.email}
                        </code>
                    </div>

                    {/* Contraseña Temporal Generada */}
                    <div className="p-3 bg-emerald-500/10 border border-[#10B981]/30 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#10B981] uppercase tracking-wider">
                                <KeyRound className="size-3.5" /> Contraseña Temporal
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                                {showPassword ? (
                                    <>
                                        <EyeOff className="size-3.5" /> Ocultar
                                    </>
                                ) : (
                                    <>
                                        <Eye className="size-3.5" /> Mostrar
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Visualizador de la contraseña con tipografía monoespaciada */}
                        <div className="flex items-center justify-between bg-background p-2.5 rounded border border-border">
                            <span className="font-mono text-base font-bold tracking-wider text-foreground select-all">
                                {showPassword ? credentials.password : '••••••••••••'}
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                12 car.
                            </span>
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyAll}
                        className="btn btn-sm bg-background border-border text-foreground hover:bg-accent/40 font-medium gap-2 flex-1"
                    >
                        {copied ? (
                            <>
                                <Check className="size-4 text-[#10B981]" />
                                <span className="text-[#10B981] font-semibold">¡Credenciales Copiadas!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="size-4" />
                                <span>Copiar Credenciales</span>
                            </>
                        )}
                    </Button>

                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="btn btn-sm border-2 border-[#10B981] text-[#10B981] bg-background hover:bg-accent/40 font-semibold"
                    >
                        Entendido / Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
