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
import { Textarea } from '@/components/ui/textarea';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

/**
 * Tipo Carrera: espejo del modelo Eloquent en PHP.
 * Debe mantenerse sincronizado con los campos de la tabla `tblcarreras`
 * y con el accessor `clave` definido en App\Models\Carrera.
 */
interface Carrera {
    id_carrera: number;        // Clave primaria de la tabla
    clave: string;             // Accessor calculado: "CAR-00001"
    nombre_carrera: string;
    descripcion: string | null;
    duracion_semestres: number;
    estado: boolean;           // Baja lógica: true = vigente, false = inactiva
}

// ─── PROPS DEL COMPONENTE ─────────────────────────────────────────────────────

/**
 * Props que recibe este modal desde index.tsx (componente padre):
 *
 * - open:          Controla si el modal está visible o no.
 * - onOpenChange:  Función para notificarle al padre cuándo cerrar el modal.
 * - carrera:       La carrera seleccionada para editar (null si aún no se eligió ninguna).
 */
interface EditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    carrera: Carrera | null;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function EditModal({ open, onOpenChange, carrera }: EditModalProps) {

    /**
     * useForm de Inertia maneja el estado del formulario de edición.
     *
     * - data:        Valores actuales de los campos.
     * - setData:     Actualiza un campo individual o todos de una vez.
     * - put:         Envía una petición HTTP PUT a Laravel (para actualizar recursos).
     * - processing:  true mientras Inertia espera respuesta del servidor.
     * - errors:      Errores de validación devueltos por UpdateCarreraRequest.
     * - reset:       Restaura todos los campos a los valores iniciales vacíos.
     * - clearErrors: Limpia los mensajes de error del formulario.
     *
     * Nota: Los valores iniciales aquí son sólo los defaults temporales.
     * Los datos reales de la carrera se cargan en el useEffect de abajo.
     */
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        nombre_carrera: '',
        descripcion: '',
        duracion_semestres: 6,
        estado: true,
    });

    /**
     * PRECARGA DE DATOS (Paso 3 del flujo)
     *
     * Se ejecuta cada vez que la prop `carrera` cambia, es decir,
     * cuando el usuario elige editar una carrera diferente en la tabla.
     *
     * setData recibe un objeto completo para actualizar todos los campos
     * de una vez, rellenando el formulario con los datos actuales de la
     * carrera seleccionada.
     */
    useEffect(() => {
        if (carrera) {
            setData({
                nombre_carrera: carrera.nombre_carrera,
                descripcion: carrera.descripcion || '',    // null → string vacío
                duracion_semestres: carrera.duracion_semestres,
                estado: Boolean(carrera.estado),           // Cast explícito a boolean
            });
        }
    }, [carrera]);

    /**
     * ENVÍO DEL FORMULARIO (Paso 4 del flujo)
     *
     * Se ejecuta al presionar "Actualizar Carrera".
     * - Previene el comportamiento por defecto del formulario HTML (recarga de página).
     * - Guarda de llamar si no hay carrera seleccionada (seguridad adicional).
     * - put() envía los datos a PUT /admin/carreras/{id}, que Laravel enruta
     *   al método update() de CarreraController.
     * - onSuccess se ejecuta si Laravel responde con éxito (redirección Inertia).
     */
    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        // Doble verificación: no enviar si no hay carrera cargada en props
        if (!carrera) return;

        put(`/admin/carreras/${carrera.id_carrera}`, {
            onSuccess: () => {
                clearErrors();          // Limpia errores previos del formulario
                onOpenChange(false);    // Le avisa al padre que cierre el modal
            },
        });
    };

    /**
     * CIERRE DEL MODAL (Cancelar o clic en la X)
     *
     * Al cerrar (isOpen = false), limpiamos el formulario para que
     * no queden datos de la sesión anterior si se abre otro registro.
     */
    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            {/*
             * onPointerDownOutside y onInteractOutside evitan que el modal se cierre
             * si el usuario hace clic fuera de él accidentalmente mientras edita.
             */}
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-[520px] bg-white border-[#D1D5DB] rounded-xl shadow-lg"
            >
                <form onSubmit={handleSubmit}>

                    {/* Encabezado del Modal */}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#000000]">
                            Editar Carrera
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#2D2D2D]/70">
                            Actualiza los datos de la carrera seleccionada.
                        </DialogDescription>
                    </DialogHeader>

                    {/* ── CAMPOS DEL FORMULARIO ─────────────────────────────── */}
                    <div className="grid gap-4 py-4">

                        {/* Campo: Nombre de la Carrera (Obligatorio) */}
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
                            {/* Error de validación de UpdateCarreraRequest (servidor) */}
                            {errors.nombre_carrera && (
                                <p className="text-xs text-[#EF4444] mt-0.5">{errors.nombre_carrera}</p>
                            )}
                        </div>

                        {/* Campo: Duración en Semestres (Obligatorio, entre 1 y 9) */}
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

                        {/* Campo: Descripción (Opcional) */}
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

                    {/* ── BOTONES DE ACCIÓN ─────────────────────────────────── */}
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">

                        {/* Cancelar: limpia el formulario y cierra el modal */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleClose(false)}
                            className="btn btn-ghost btn-sm border-[#D1D5DB] text-[#2D2D2D] gap-2"
                            disabled={processing}
                        >
                            Cancelar
                        </Button>

                        {/* Actualizar: envía PUT y muestra spinner mientras procesa */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-sm border-2 border-[#10B981] text-[#10B981] bg-white hover:bg-[#B8D4E3]/20 font-medium shadow-sm flex items-center gap-2"
                        >
                            {/* Spinner de DaisyUI visible sólo mientras `processing` es true */}
                            {processing && <span className="loading loading-spinner loading-xs text-[#10B981]"></span>}
                            {processing ? 'Actualizando...' : 'Actualizar Carrera'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

