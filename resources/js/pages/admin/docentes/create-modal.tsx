import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus, User, Briefcase, Mail, Info } from 'lucide-react';

interface CreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * MODAL PARA REGISTRAR DOCENTE
 * Mapeado a las columnas de `tbldocentes` y `users`
 */
export function CreateModal({ open, onOpenChange }: CreateModalProps) {
    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm({
        // Datos de la cuenta (users)
        email: '',

        // Datos personales (tbldocentes)
        nombre: '',
        apellido_p: '',
        apellido_m: '',
        telefono: '',
        curp: '',

        // Datos academicos y laborales (tbldocentes)
        cedula_profesional: '',
        especialidad: '',
        grado_academico: 'Maestría',
        tipo_contrato: 'Tiempo completo',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        let formattedEmail = data.email.trim().toLowerCase();
        if (formattedEmail && !formattedEmail.endsWith('@unach.mx')) {
            formattedEmail = `${formattedEmail}@unach.mx`;
        }

        transform((formData) => ({
            ...formData,
            email: formattedEmail,
            curp: formData.curp.trim().toUpperCase(),
            cedula_profesional: formData.cedula_profesional.trim().toUpperCase(),
            nombre: formData.nombre.trim(),
            apellido_p: formData.apellido_p.trim(),
            apellido_m: formData.apellido_m.trim(),
            especialidad: formData.especialidad.trim(),
        }));

        post('/admin/docentes', {
            onSuccess: () => {
                reset();
                clearErrors();
                onOpenChange(false);
            },
        });
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto overscroll-contain bg-background border-border rounded-xl shadow-xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/60"
            >
                <form onSubmit={handleSubmit}>
                    {/* ENCABEZADO */}
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[#10B981]/15 text-[#10B981]">
                                <UserPlus className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    Registrar Nuevo Docente
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Ingresa los datos del docente. Se le enviará automáticamente un correo institucional con su contraseña de acceso.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-10 py-5 text-sm">
                        {/* SECCION 1: DATOS PERSONALES */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <User className="size-4 text-[#10B981]" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Información Personal
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-5">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="nombre" className="text-xs font-semibold text-foreground">
                                        Nombre(s) <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="nombre"
                                        maxLength={100}
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        placeholder="Ej: Laura Elena"
                                        className={`h-9 text-xs border-border ${errors.nombre ? 'border-[#EF4444]' : ''}`}
                                        autoFocus
                                    />
                                    {errors.nombre && <p className="text-[11px] text-[#EF4444]">{errors.nombre}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="apellido_p" className="text-xs font-semibold text-foreground">
                                        Apellido Paterno <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="apellido_p"
                                        maxLength={100}
                                        value={data.apellido_p}
                                        onChange={(e) => setData('apellido_p', e.target.value)}
                                        placeholder="Ej: Morales"
                                        className={`h-9 text-xs border-border ${errors.apellido_p ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.apellido_p && <p className="text-[11px] text-[#EF4444]">{errors.apellido_p}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="apellido_m" className="text-xs font-semibold text-foreground">
                                        Apellido Materno <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="apellido_m"
                                        maxLength={100}
                                        value={data.apellido_m}
                                        onChange={(e) => setData('apellido_m', e.target.value)}
                                        placeholder="Ej: Sánchez"
                                        className={`h-9 text-xs border-border ${errors.apellido_m ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.apellido_m && <p className="text-[11px] text-[#EF4444]">{errors.apellido_m}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-5">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="curp" className="text-xs font-semibold text-foreground">
                                        CURP (18 caracteres) <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="curp"
                                        maxLength={18}
                                        value={data.curp}
                                        onChange={(e) => setData('curp', e.target.value.toUpperCase())}
                                        placeholder="MOSL800101MDFRRN01"
                                        className={`h-9 text-xs uppercase font-mono border-border ${errors.curp ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.curp && <p className="text-[11px] text-[#EF4444]">{errors.curp}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="telefono" className="text-xs font-semibold text-foreground">
                                        Teléfono de Contacto
                                    </Label>
                                    <Input
                                        id="telefono"
                                        maxLength={20}
                                        value={data.telefono}
                                        onChange={(e) => setData('telefono', e.target.value)}
                                        placeholder="Ej: 9611234567"
                                        className="h-9 text-xs border-border"
                                    />
                                    {errors.telefono && <p className="text-[11px] text-[#EF4444]">{errors.telefono}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECCION 2: DATOS ACADEMICOS Y LABORALES */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <Briefcase className="size-4 text-[#10B981]" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Información Académica y Laboral
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-5">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="cedula_profesional" className="text-xs font-semibold text-foreground">
                                        Cédula Profesional <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="cedula_profesional"
                                        maxLength={20}
                                        value={data.cedula_profesional}
                                        onChange={(e) => setData('cedula_profesional', e.target.value.toUpperCase())}
                                        placeholder="Ej: 12345678"
                                        className={`h-9 text-xs uppercase font-mono border-border ${errors.cedula_profesional ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.cedula_profesional && <p className="text-[11px] text-[#EF4444]">{errors.cedula_profesional}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="especialidad" className="text-xs font-semibold text-foreground">
                                        Especialidad / Área de Conocimiento <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="especialidad"
                                        maxLength={100}
                                        value={data.especialidad}
                                        onChange={(e) => setData('especialidad', e.target.value)}
                                        placeholder="Ej: Inteligencia Artificial, Redes, etc."
                                        className={`h-9 text-xs border-border ${errors.especialidad ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.especialidad && <p className="text-[11px] text-[#EF4444]">{errors.especialidad}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-5">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="grado_academico" className="text-xs font-semibold text-foreground">
                                        Grado Académico <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Select
                                        value={data.grado_academico}
                                        onValueChange={(val) => setData('grado_academico', val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-border bg-background">
                                            <SelectValue placeholder="Selecciona grado" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                                            <SelectItem value="Maestría">Maestría</SelectItem>
                                            <SelectItem value="Doctorado">Doctorado</SelectItem>
                                            <SelectItem value="Especialidad">Especialidad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.grado_academico && <p className="text-[11px] text-[#EF4444]">{errors.grado_academico}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="tipo_contrato" className="text-xs font-semibold text-foreground">
                                        Tipo de Contrato <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Select
                                        value={data.tipo_contrato}
                                        onValueChange={(val) => setData('tipo_contrato', val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-border bg-background">
                                            <SelectValue placeholder="Selecciona tipo de contrato" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="Tiempo completo">Tiempo completo</SelectItem>
                                            <SelectItem value="Medio tiempo">Medio tiempo</SelectItem>
                                            <SelectItem value="Por horas">Por horas</SelectItem>
                                            <SelectItem value="Interino">Interino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.tipo_contrato && <p className="text-[11px] text-[#EF4444]">{errors.tipo_contrato}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECCION 3: CUENTA INSTITUCIONAL */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <Mail className="size-4 text-[#10B981]" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Cuenta y Acceso al Sistema
                                </h3>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                                    Correo Institucional (Debe terminar en @unach.mx) <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value.toLowerCase())}
                                    placeholder="docente.apellido@unach.mx"
                                    className={`h-9 text-xs border-border ${errors.email ? 'border-[#EF4444]' : ''}`}
                                />
                                {errors.email && <p className="text-[11px] text-[#EF4444]">{errors.email}</p>}

                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground mt-1">
                                    <Info className="size-4 text-[#10B981] shrink-0 mt-0.5" />
                                    <span>
                                        Se generará automáticamente una <strong>contraseña segura de 12 caracteres</strong> y el sistema le enviará un correo institucional de bienvenida con sus credenciales de acceso.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PIE */}
                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end items-center gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => handleClose(false)}
                            disabled={processing}
                            className="btn btn-sm min-w-[140px] border-2 border-border text-foreground hover:bg-accent/40 hover:border-muted-foreground/50 bg-background font-medium shadow-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-sm min-w-[140px] border-2 border-[#10B981] text-[#10B981] bg-background hover:bg-accent/40 font-medium shadow-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            {processing && <span className="loading loading-spinner loading-xs text-[#10B981]"></span>}
                            {processing ? 'Registrando y enviando...' : 'Registrar Docente'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
