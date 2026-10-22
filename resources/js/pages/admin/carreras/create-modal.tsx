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
import { Button } from '@/components/ui/button';
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
                className="sm:max-w-[520px] bg-white border-[#D1D5DB] rounded-xl shadow-lg"
            >
                <form onSubmit={handleSubmit}>
                    {/* Encabezado del Modal */}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#000000]">
                            Registrar Nueva Carrera
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#2D2D2D]/70">
                            Ingresa los datos de la nueva carrera.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Campos del Formulario */}
                    <div className="grid gap-4 py-4">
                        {/* Campo: Nombre de la Carrera */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="nombre_carrera" className="text-sm font-semibold text-[#2D2D2D]">
                                Nombre de la Carrera <span className="text-[#EF4444]">*</span>
                            </Label>
                            <Input
                                id="nombre_carrera"
                                value={data.nombre_carrera}
                                onChange={(e) => setData('nombre_carrera', e.target.value)}
                                placeholder="Ej: Ingeniería en Desarrollo de Software"
                                className={`border-[#D1D5DB] focus-visible:ring-[#B8D4E3] ${
                                    errors.nombre_carrera ? 'border-[#EF4444]' : ''
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
                            <Label htmlFor="duracion_semestres" className="text-sm font-semibold text-[#2D2D2D]">
                                Duración (Semestres) <span className="text-[#EF4444]">*</span>
                            </Label>
                            <Input
                                id="duracion_semestres"
                                type="number"
                                min={1}
                                max={9}
                                value={data.duracion_semestres}
                                onChange={(e) => setData('duracion_semestres', parseInt(e.target.value) || 0)}
                                className={`border-[#D1D5DB] focus-visible:ring-[#B8D4E3] ${
                                    errors.duracion_semestres ? 'border-[#EF4444]' : ''
                                }`}
                            />
                            {errors.duracion_semestres && (
                                <p className="text-xs text-[#EF4444] mt-0.5">{errors.duracion_semestres}</p>
                            )}
                        </div>

                        {/* Campo: Descripción */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="descripcion" className="text-sm font-semibold text-[#2D2D2D]">
                                Descripción de la carrera
                            </Label>
                            <Textarea
                                id="descripcion"
                                rows={3}
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                placeholder="Breve descripción del perfil o enfoque de la carrera..."
                                className="border-[#D1D5DB] focus-visible:ring-[#B8D4E3] resize-none"
                            />
                            {errors.descripcion && (
                                <p className="text-xs text-[#EF4444] mt-0.5">{errors.descripcion}</p>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción del Modal */}
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleClose(false)}
                            className="btn btn-ghost btn-sm border-[#D1D5DB] text-[#2D2D2D] gap-2"
                            disabled={processing}
                        >
                            Cancelar
                        </Button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-sm border-2 border-[#10B981] text-[#10B981] bg-white hover:bg-[#B8D4E3]/20 font-medium shadow-sm flex items-center gap-2"
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
