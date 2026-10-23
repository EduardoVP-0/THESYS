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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pencil, User, Mail, Shield } from 'lucide-react';
import { AdministradorData, RolData } from './types';

interface EditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    administrador: AdministradorData | null;
    roles: RolData[];
}

/**
 * MODAL PARA EDITAR EXPEDIENTE DEL ADMINISTRADOR
 */
export function EditModal({ open, onOpenChange, administrador, roles }: EditModalProps) {
    const { data, setData, put, transform, processing, errors, reset, clearErrors } = useForm({
        email: '',
        id_rol: '2',
        nombre: '',
        apellido_p: '',
        apellido_m: '',
        telefono: '',
        area: '',
    });

    useEffect(() => {
        if (administrador && open) {
            setData({
                email: administrador.user?.email || '',
                id_rol: String(administrador.user?.id_rol || 2),
                nombre: administrador.nombre || '',
                apellido_p: administrador.apellido_p || '',
                apellido_m: administrador.apellido_m || '',
                telefono: administrador.telefono || '',
                area: administrador.area || '',
            });
        }
    }, [administrador, open]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!administrador) return;

        let formattedEmail = data.email.trim().toLowerCase();
        if (formattedEmail && !formattedEmail.endsWith('@unach.mx')) {
            formattedEmail = `${formattedEmail}@unach.mx`;
        }

        transform((formData) => ({
            ...formData,
            email: formattedEmail,
            nombre: formData.nombre.trim(),
            apellido_p: formData.apellido_p.trim(),
            apellido_m: formData.apellido_m.trim(),
            area: formData.area.trim(),
            id_rol: Number(formData.id_rol),
        }));

        put(`/admin/administradores/${administrador.id_usuario}`, {
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
                className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-background border-border rounded-xl shadow-xl"
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
                                    Editar Expediente del Administrador
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Modifica los datos personales, rol o acceso del administrador.
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
                                    <Label htmlFor="edit_adm_nombre" className="text-xs font-semibold text-foreground">
                                        Nombre(s) <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_adm_nombre"
                                        maxLength={100}
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.nombre ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.nombre && <p className="text-[11px] text-[#EF4444]">{errors.nombre}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_adm_apellido_p" className="text-xs font-semibold text-foreground">
                                        Apellido Paterno <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_adm_apellido_p"
                                        maxLength={100}
                                        value={data.apellido_p}
                                        onChange={(e) => setData('apellido_p', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.apellido_p ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.apellido_p && <p className="text-[11px] text-[#EF4444]">{errors.apellido_p}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_adm_apellido_m" className="text-xs font-semibold text-foreground">
                                        Apellido Materno <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_adm_apellido_m"
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
                                    <Label htmlFor="edit_adm_telefono" className="text-xs font-semibold text-foreground">
                                        Teléfono de Contacto
                                    </Label>
                                    <Input
                                        id="edit_adm_telefono"
                                        maxLength={20}
                                        value={data.telefono}
                                        onChange={(e) => setData('telefono', e.target.value)}
                                        className="h-9 text-xs border-border"
                                    />
                                    {errors.telefono && <p className="text-[11px] text-[#EF4444]">{errors.telefono}</p>}
                                </div>

                                <div className="grid gap-1">
                                    <Label htmlFor="edit_adm_area" className="text-xs font-semibold text-foreground">
                                        Área de Adscripción <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="edit_adm_area"
                                        maxLength={150}
                                        value={data.area}
                                        onChange={(e) => setData('area', e.target.value)}
                                        className={`h-9 text-xs border-border ${errors.area ? 'border-[#EF4444]' : ''}`}
                                    />
                                    {errors.area && <p className="text-[11px] text-[#EF4444]">{errors.area}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: ROL ADMINISTRATIVO */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <Shield className="size-4 text-amber-500" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Rol y Permisos del Sistema
                                </h3>
                            </div>

                            <div className="grid gap-1">
                                <Label htmlFor="edit_adm_rol" className="text-xs font-semibold text-foreground">
                                    Rol Administrativo <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Select
                                    value={data.id_rol}
                                    onValueChange={(val) => setData('id_rol', val)}
                                >
                                    <SelectTrigger id="edit_adm_rol" className="h-9 text-xs border-border bg-background">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        {roles.map((rol) => (
                                            <SelectItem key={rol.id_rol} value={String(rol.id_rol)}>
                                                {rol.nombre_rol}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.id_rol && <p className="text-[11px] text-[#EF4444]">{errors.id_rol}</p>}
                            </div>
                        </div>

                        {/* SECCIÓN 3: CUENTA INSTITUCIONAL */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <Mail className="size-4 text-amber-500" />
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                    Cuenta y Acceso al Sistema
                                </h3>
                            </div>

                            <div className="grid gap-1">
                                <Label htmlFor="edit_adm_email" className="text-xs font-semibold text-foreground">
                                    Correo Institucional (@unach.mx) <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Input
                                    id="edit_adm_email"
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
