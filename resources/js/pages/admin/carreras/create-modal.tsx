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
import { Textarea } from '@/components/ui/textarea';

// PROPS DEL COMPONENTE
// Recibe dos cosas del componente padre (index.tsx):
// open: un booleano (true/false) que dice si el modal debe mostrarse o no
// onOpenChange: una función para avisarle a index.tsx cuándo cerrarlo
interface CreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateModal({ open, onOpenChange }: CreateModalProps) {
    /**
     * data: los valores actuales del formulario
     * setData: función para actualizar un campo específico
     * post: envía los datos por HTTP POST a Laravel sin recargar la página
     * processing: true si el formulario se está guardando (sirve para deshabilitar botones)
     * errors: contiene los mensajes de error enviados por StoreCarreraRequest si algo falla
     * reset: limpia todos los campos a su estado original
     */
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        nombre_carrera: '',
        descripcion: '',
        duracion_semestres: 6,
        estado: true,
    });

    //Se ejecuta al presionar "Guardar Carrera"
    const handleSubmit: FormEventHandler = (e) => {
        // e.preventDefault() evita el comportamiento por defecto de HTML (que recargaría la página completa)
        e.preventDefault();

        // Enviamos los datos a la ruta store de Laravel
        post('/admin/carreras', {
            // Si Laravel responde con éxito
            onSuccess: () => {
                reset(); // Vaciamos los campos del formulario
                clearErrors(); // Limpiamos cualquier error previo
                onOpenChange(false); // Cerramos el modal
            },
        });
    };

    // Se ejecuta si el usuario cancela
    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            {/* onPointerDownOutside y onInteractOutside evitan que el modal se cierre al hacer clic afuera */}
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-[520px] bg-background border-border rounded-xl shadow-lg"
            >
                <form onSubmit={handleSubmit}>
                    {/* Encabezado del Modal */}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">
                            Registrar Nueva Carrera
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Ingresa los datos de la nueva carrera.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Campos del Formulario */}
                    <div className="grid gap-4 py-4">
                        {/* Campo: Nombre de la Carrera */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="nombre_carrera" className="text-sm font-semibold text-foreground">
                                    Nombre de la Carrera <span className="text-[#EF4444]">*</span>
                                </Label>
                                <span className="text-[11px] text-muted-foreground">
                                    {data.nombre_carrera.length}/50
                                </span>
                            </div>
                            <Input
                                id="nombre_carrera"
                                maxLength={50}
                                value={data.nombre_carrera}
                                onChange={(e) => setData('nombre_carrera', e.target.value)}
                                placeholder="Ej: Ing. en Desarrollo de Software"
                                className={`border-border focus-visible:ring-ring ${errors.nombre_carrera ? 'border-[#EF4444]' : ''
                                    }`}
                                autoFocus
                            />
                            {/* Mensaje de error de validación (proviene de StoreCarreraRequest) */}
                            {errors.nombre_carrera && (
                                <p className="text-xs text-[#EF4444] mt-0.5">{errors.nombre_carrera}</p>
                            )}
                        </div>

                        {/* Campo: Duración en Semestres */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="duracion_semestres" className="text-sm font-semibold text-foreground">
                                Duración (Semestres) <span className="text-[#EF4444]">*</span>
                            </Label>
                            <Input
                                id="duracion_semestres"
                                type="number"
                                min={1}
                                max={9}
                                value={data.duracion_semestres}
                                onChange={(e) => setData('duracion_semestres', parseInt(e.target.value) || 0)}
                                className={`border-border focus-visible:ring-ring ${errors.duracion_semestres ? 'border-[#EF4444]' : ''
                                    }`}
                            />
                            {errors.duracion_semestres && (
                                <p className="text-xs text-[#EF4444] mt-0.5">{errors.duracion_semestres}</p>
                            )}
                        </div>

                        {/* Campo: Descripción */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="descripcion" className="text-sm font-semibold text-foreground">
                                Descripción de la carrera
                            </Label>
                            <Textarea
                                id="descripcion"
                                rows={3}
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                placeholder="Breve descripción del perfil o enfoque de la carrera..."
                                className="border-border focus-visible:ring-ring resize-none"
                            />
                            {errors.descripcion && (
                                <p className="text-xs text-[#EF4444] mt-0.5">{errors.descripcion}</p>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción del Modal */}
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
                            {/* Spinner animado mientras se guarda */}
                            {processing && <span className="loading loading-spinner loading-xs text-[#10B981]"></span>}
                            {processing ? 'Guardando...' : 'Guardar Carrera'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
