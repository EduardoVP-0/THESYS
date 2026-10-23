import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pencil, User, GraduationCap, Mail } from 'lucide-react';
import { AlumnoData, CarreraItem } from './types';
export type { AlumnoData, CarreraItem };

interface EditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    alumno: AlumnoData | null;
    carreras: CarreraItem[];
}

/**
 * MODAL PARA EDITAR EXPEDIENTE DEL ALUMNO
 */
export function EditModal({ open, onOpenChange, alumno, carreras }: EditModalProps) {
    const { data, setData, put, transform, processing, errors, reset, clearErrors } = useForm({
        email: '',
        nombre: '',
        apellido_p: '',
        apellido_m: '',
        fecha_nacimiento: '',
        sexo: 'Masculino',
        curp: '',
        telefono: '',
        matricula: '',
        id_carrera: '',
        turno: 'Matutino',
        fecha_ingreso: '',
        generacion: '',
        estado_academico: 'Activo',
    });

    useEffect(() => {
        if (alumno && open) {
            setData({
                email: alumno.user?.email || '',
                nombre: alumno.nombre || '',
                apellido_p: alumno.apellido_p || '',
                apellido_m: alumno.apellido_m || '',
                fecha_nacimiento: alumno.fecha_nacimiento ? String(alumno.fecha_nacimiento).split('T')[0] : '',
                sexo: alumno.sexo || 'Masculino',
                curp: alumno.curp || '',
                telefono: alumno.telefono || '',
                matricula: alumno.matricula || '',
                id_carrera: String(alumno.id_carrera || ''),
                turno: alumno.turno || 'Matutino',
                fecha_ingreso: alumno.fecha_ingreso ? String(alumno.fecha_ingreso).split('T')[0] : '',
                generacion: alumno.generacion || '',
                estado_academico: alumno.estado_academico || 'Activo',
            });
        }
    }, [alumno, open]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!alumno) return;

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

        put(`/admin/alumnos/${alumno.id_usuario}`, {
            onSuccess: () => {
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
                className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto bg-background border-border rounded-xl shadow-xl"
            >
                <form onSubmit={handleSubmit}>
                    {/* ENCABEZADO */}
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500">
                                <Pencil className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    Editar Expediente del Alumno
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Modifica los datos personales, escolares o de acceso del sustentante.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5 py-4 text-sm">
                        {/* SECCIÓN 1: DATOS PERSONALES */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <User className="size-4 text-amber-500" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Información Personal
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="edit_nombre" className="text-xs font-semibold text-foreground">
                                        Nombre(s) <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_nombre"
                                        maxLength={100}
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.nombre ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.nombre && <p className="text-[11px] text-[#EF4444]">{errors.nombre}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_apellido_p" className="text-xs font-semibold text-foreground">
                                        Apellido Paterno <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_apellido_p"
                                        maxLength={100}
                                        value={data.apellido_p}
                                        onChange={(e) => setData('apellido_p', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.apellido_p ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.apellido_p && <p className="text-[11px] text-[#EF4444]">{errors.apellido_p}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_apellido_m" className="text-xs font-semibold text-foreground">
                                        Apellido Materno <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_apellido_m"
                                        maxLength={100}
                                        value={data.apellido_m}
                                        onChange={(e) => setData('apellido_m', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.apellido_m ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.apellido_m && <p className="text-[11px] text-[#EF4444]">{errors.apellido_m}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="edit_fecha_nacimiento" className="text-xs font-semibold text-foreground">
                                        Fecha de Nacimiento <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_fecha_nacimiento"
                                        type="date"
                                        value={data.fecha_nacimiento}
                                        onChange={(e) => setData('fecha_nacimiento', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.fecha_nacimiento ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.fecha_nacimiento && <p className="text-[11px] text-[#EF4444]">{errors.fecha_nacimiento}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_sexo" className="text-xs font-semibold text-foreground">
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
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_telefono" className="text-xs font-semibold text-foreground">
                                        Teléfono de Contacto
                                    </Label>
                                    <Input
                                        id="edit_telefono"
                                        maxLength={20}
                                        value={data.telefono}
                                        onChange={(e) => setData('telefono', e.target.value)}
                                        className="h-9 text-xs border-border"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="edit_curp" className="text-xs font-semibold text-foreground">
                                        CURP (18 caracteres) <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_curp"
                                        maxLength={18}
                                        value={data.curp}
                                        onChange={(e) => setData('curp', e.target.value.toUpperCase())}
                                        className={`h-9 text-xs uppercase font-mono border-border ${errors.curp ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.curp && <p className="text-[11px] text-[#EF4444]">{errors.curp}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: EXPEDIENTE ACADÉMICO */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <GraduationCap className="size-4 text-amber-500" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Expediente y Carrera
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="edit_matricula" className="text-xs font-semibold text-foreground">
                                        Matrícula Escolar <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_matricula"
                                        maxLength={10}
                                        value={data.matricula}
                                        onChange={(e) => setData('matricula', e.target.value.toUpperCase())}
                                        className={`h-9 text-xs uppercase font-mono font-semibold border-border ${errors.matricula ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.matricula && <p className="text-[11px] text-[#EF4444]">{errors.matricula}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_id_carrera" className="text-xs font-semibold text-foreground">
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
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="edit_turno" className="text-xs font-semibold text-foreground">
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
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_fecha_ingreso" className="text-xs font-semibold text-foreground">
                                        Fecha Ingreso <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_fecha_ingreso"
                                        type="date"
                                        value={data.fecha_ingreso}
                                        onChange={(e) => setData('fecha_ingreso', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.fecha_ingreso ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.fecha_ingreso && <p className="text-[11px] text-[#EF4444]">{errors.fecha_ingreso}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_generacion" className="text-xs font-semibold text-foreground">
                                        Generación <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_generacion"
                                        maxLength={50}
                                        value={data.generacion}
                                        onChange={(e) => setData('generacion', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.generacion ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.generacion && <p className="text-[11px] text-[#EF4444]">{errors.generacion}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_estado_academico" className="text-xs font-semibold text-foreground">
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

                        {/* SECCIÓN 3: CORREO */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <Mail className="size-4 text-amber-500" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Cuenta Institucional
                                </h3>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="edit_email" className="text-xs font-semibold text-foreground">
                                    Correo Institucional (@unach.mx) <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Input
                                    id="edit_email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value.toLowerCase())}
                                    className={`h-9 text-xs border-border ${errors.email ? 'border-[#EF4444]' : ''}`}
                                />
                                {errors.email && <p className="text-[11px] text-[#EF4444]">{errors.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* PIE */}
                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end items-center gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => handleClose(false)}
                            className="btn btn-sm min-w-[140px] border-2 border-border text-foreground hover:bg-accent/40 hover:border-muted-foreground/50 bg-background font-medium shadow-sm flex items-center justify-center gap-2 transition-colors"
                            disabled={processing}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-sm border-2 border-amber-500 text-amber-600 dark:text-amber-400 bg-background hover:bg-accent/40 font-semibold shadow-xs flex items-center gap-2"
                        >
                            {processing && <span className="loading loading-spinner loading-xs text-amber-500"></span>}
                            {processing ? 'Actualizando...' : 'Actualizar Expediente'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
