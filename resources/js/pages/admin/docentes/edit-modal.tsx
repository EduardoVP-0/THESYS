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
import { Pencil, User, Briefcase, Mail } from 'lucide-react';
import { DocenteData } from './types';

interface EditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    docente: DocenteData | null;
}

/**
 * MODAL PARA EDITAR EXPEDIENTE DEL DOCENTE
 */
export function EditModal({ open, onOpenChange, docente }: EditModalProps) {
    const { data, setData, put, transform, processing, errors, reset, clearErrors } = useForm({
        email: '',
        nombre: '',
        apellido_p: '',
        apellido_m: '',
        telefono: '',
        curp: '',
        cedula_profesional: '',
        especialidad: '',
        grado_academico: 'Maestría',
        tipo_contrato: 'Tiempo completo',
    });

    useEffect(() => {
        if (docente) {
            setData({
                email: docente.user?.email || '',
                nombre: docente.nombre || '',
                apellido_p: docente.apellido_p || '',
                apellido_m: docente.apellido_m || '',
                telefono: docente.telefono || '',
                curp: docente.curp || '',
                cedula_profesional: docente.cedula_profesional || '',
                especialidad: docente.especialidad || '',
                grado_academico: docente.grado_academico || 'Maestría',
                tipo_contrato: docente.tipo_contrato || 'Tiempo completo',
            });
        }
    }, [docente]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!docente) return;

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

        put(`/admin/docentes/${docente.id_usuario}`, {
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
                className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background border-border rounded-xl shadow-xl"
            >
                <form onSubmit={handleSubmit}>
                    {/* ENCABEZADO */}
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[#10B981]/15 text-[#10B981]">
                                <Pencil className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    Editar Expediente Docente
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Actualiza la información personal, académica o cuenta de {docente?.nombre_completo || 'docente'}.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5 py-4 text-sm">
                        {/* SECCIÓN 1: DATOS PERSONALES */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <User className="size-4 text-[#10B981]" />
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    {errors.telefono && <p className="text-[11px] text-[#EF4444]">{errors.telefono}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: DATOS ACADÉMICOS Y LABORALES */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <Briefcase className="size-4 text-[#10B981]" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Información Académica y Laboral
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="edit_cedula" className="text-xs font-semibold text-foreground">
                                        Cédula Profesional <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_cedula"
                                        maxLength={20}
                                        value={data.cedula_profesional}
                                        onChange={(e) => setData('cedula_profesional', e.target.value.toUpperCase())}
                                        className={`h-9 text-xs uppercase font-mono border-border ${errors.cedula_profesional ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.cedula_profesional && <p className="text-[11px] text-[#EF4444]">{errors.cedula_profesional}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_especialidad" className="text-xs font-semibold text-foreground">
                                        Especialidad / Área <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_especialidad"
                                        maxLength={100}
                                        value={data.especialidad}
                                        onChange={(e) => setData('especialidad', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.especialidad ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.especialidad && <p className="text-[11px] text-[#EF4444]">{errors.especialidad}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="edit_grado" className="text-xs font-semibold text-foreground">
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

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_contrato" className="text-xs font-semibold text-foreground">
                                        Tipo de Contrato <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Select
                                        value={data.tipo_contrato}
                                        onValueChange={(val) => setData('tipo_contrato', val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-border bg-background">
                                            <SelectValue placeholder="Selecciona contrato" />
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

                        {/* SECCIÓN 3: CUENTA INSTITUCIONAL */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <Mail className="size-4 text-[#10B981]" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Cuenta y Acceso al Sistema
                                </h3>
                            </div>

                            <div className="grid gap-1">
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
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleClose(false)}
                            className="btn btn-ghost btn-sm border-border text-foreground"
                            disabled={processing}
                        >
                            Cancelar
                        </Button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-sm border-2 border-[#10B981] text-[#10B981] bg-background hover:bg-accent/40 font-semibold shadow-xs flex items-center gap-2"
                        >
                            {processing && <span className="loading loading-spinner loading-xs text-[#10B981]"></span>}
                            {processing ? 'Guardando cambios...' : 'Guardar Cambios'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
