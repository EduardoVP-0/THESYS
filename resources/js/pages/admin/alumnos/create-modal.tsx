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
import { UserPlus, User, GraduationCap, Mail, Info, MapPin } from 'lucide-react';
import { CarreraItem } from './types';

interface CreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    carreras: CarreraItem[];
}

/**
 * MODAL PARA REGISTRAR ALUMNO (SUSTENTANTE)
 * Mapeado exactamente a las columnas de la tabla `tblalumnos` y `users`.
 */
export function CreateModal({ open, onOpenChange, carreras }: CreateModalProps) {
    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm({
        // Datos de la cuenta (users)
        email: '',

        // Datos personales (tblalumnos)
        nombre: '',
        apellido_p: '',
        apellido_m: '',
        fecha_nacimiento: '',
        sexo: 'Masculino',
        curp: '',
        telefono: '',
        calle: '',
        colonia: '',
        codigo_postal: '',

        // Datos escolares / expediente (tblalumnos)
        matricula: '',
        id_carrera: carreras.length > 0 ? String(carreras[0].id_carrera) : '',
        turno: 'Matutino',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        generacion: `${new Date().getFullYear() - 4} - ${new Date().getFullYear()}`,
        estado_academico: 'Activo',
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
            matricula: formData.matricula.trim().toUpperCase(),
            curp: formData.curp.trim().toUpperCase(),
        }));

        post('/admin/alumnos', {
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
                className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto overscroll-contain bg-background border-border rounded-xl shadow-xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/60"
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
                                    Registrar Nuevo Alumno
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Ingresa los datos del sustentante. Se enviará un correo con su contraseña institucional.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-10 py-5 text-sm">
                        {/* SECCIÓN 1: DATOS PERSONALES */}
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
                                        placeholder="Ej: Carlos Eduardo"
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
                                        placeholder="Ej: Gómez"
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
                                        placeholder="Ej: Pérez"
                                        className={`h-9 text-xs border-border ${errors.apellido_m ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.apellido_m && <p className="text-[11px] text-[#EF4444]">{errors.apellido_m}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-5">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="fecha_nacimiento" className="text-xs font-semibold text-foreground">
                                        Fecha de Nacimiento <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="fecha_nacimiento"
                                        type="date"
                                        value={data.fecha_nacimiento}
                                        onChange={(e) => setData('fecha_nacimiento', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.fecha_nacimiento ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.fecha_nacimiento && <p className="text-[11px] text-[#EF4444]">{errors.fecha_nacimiento}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="sexo" className="text-xs font-semibold text-foreground">
                                        Sexo <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Select value={data.sexo} onValueChange={(val) => setData('sexo', val)}>
                                        <SelectTrigger className="h-9 text-xs border-border bg-background">
                                            <SelectValue placeholder="Sexo" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="Masculino">Masculino</SelectItem>
                                            <SelectItem value="Femenino">Femenino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.sexo && <p className="text-[11px] text-[#EF4444]">{errors.sexo}</p>}
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

                            <div className="grid grid-cols-1 gap-x-3 gap-y-5">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="curp" className="text-xs font-semibold text-foreground">
                                        CURP (18 caracteres) <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="curp"
                                        maxLength={18}
                                        value={data.curp}
                                        onChange={(e) => setData('curp', e.target.value.toUpperCase())}
                                        placeholder="ABCD010203HDFRRN09"
                                        className={`h-9 text-xs uppercase font-mono border-border ${errors.curp ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.curp && <p className="text-[11px] text-[#EF4444]">{errors.curp}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: EXPEDIENTE ACADÉMICO */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <GraduationCap className="size-4 text-[#10B981]" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Expediente y Carrera
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-5">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="matricula" className="text-xs font-semibold text-foreground">
                                        Matrícula Escolar <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="matricula"
                                        maxLength={10}
                                        value={data.matricula}
                                        onChange={(e) => setData('matricula', e.target.value.toUpperCase())}
                                        placeholder="Ej: A190012"
                                        className={`h-9 text-xs uppercase font-mono font-semibold border-border ${errors.matricula ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.matricula && <p className="text-[11px] text-[#EF4444]">{errors.matricula}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="id_carrera" className="text-xs font-semibold text-foreground">
                                        Carrera / Programa <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Select
                                        value={String(data.id_carrera)}
                                        onValueChange={(val) => setData('id_carrera', val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-border bg-background">
                                            <SelectValue placeholder="Selecciona la carrera" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {carreras.map((c) => (
                                                <SelectItem key={c.id_carrera} value={String(c.id_carrera)}>
                                                    {c.nombre_carrera}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.id_carrera && <p className="text-[11px] text-[#EF4444]">{errors.id_carrera}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-3 gap-y-5">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="turno" className="text-xs font-semibold text-foreground">
                                        Turno <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Select value={data.turno} onValueChange={(val) => setData('turno', val)}>
                                        <SelectTrigger className="h-9 text-xs border-border bg-background">
                                            <SelectValue placeholder="Turno" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="Matutino">Matutino</SelectItem>
                                            <SelectItem value="Vespertino">Vespertino</SelectItem>
                                            <SelectItem value="Mixto">Mixto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.turno && <p className="text-[11px] text-[#EF4444]">{errors.turno}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="fecha_ingreso" className="text-xs font-semibold text-foreground">
                                        Fecha Ingreso <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="fecha_ingreso"
                                        type="date"
                                        value={data.fecha_ingreso}
                                        onChange={(e) => setData('fecha_ingreso', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.fecha_ingreso ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.fecha_ingreso && <p className="text-[11px] text-[#EF4444]">{errors.fecha_ingreso}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="generacion" className="text-xs font-semibold text-foreground">
                                        Generación <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="generacion"
                                        maxLength={50}
                                        value={data.generacion}
                                        onChange={(e) => setData('generacion', e.target.value)}
                                        placeholder="2020 - 2024"
                                        className={`h-9 text-xs border-border ${errors.generacion ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.generacion && <p className="text-[11px] text-[#EF4444]">{errors.generacion}</p>}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="estado_academico" className="text-xs font-semibold text-foreground">
                                        Estado Académico
                                    </Label>
                                    <Select
                                        value={data.estado_academico}
                                        onValueChange={(val) => setData('estado_academico', val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-border bg-background">
                                            <SelectValue placeholder="Estado" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="Activo">Activo</SelectItem>
                                            <SelectItem value="Egresado">Egresado</SelectItem>
                                            <SelectItem value="Baja temporal">Baja temporal</SelectItem>
                                            <SelectItem value="Baja definitiva">Baja definitiva</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: CUENTA INSTITUCIONAL */}
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
                                    placeholder="alumno.apellido@unach.mx"
                                    className={`h-9 text-xs border-border ${errors.email ? 'border-[#EF4444]' : ''}`}
                                />
                                {errors.email && <p className="text-[11px] text-[#EF4444]">{errors.email}</p>}

                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground mt-1">
                                    <Info className="size-4 text-[#10B981] shrink-0 mt-0.5" />
                                    <span>
                                        Se generará automáticamente una <strong>contraseña segura de 12 caracteres</strong> y el sistema le enviará un correo de bienvenida con sus credenciales mediante <strong>Brevo</strong>.
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
                            {processing ? 'Registrando y enviando...' : 'Registrar Alumno'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
