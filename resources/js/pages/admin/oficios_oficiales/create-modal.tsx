import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
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
import { FileUp } from 'lucide-react';

interface CreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const OPCIONES_TIPO = [
    'Registro de Titulación',
    'Asignación de Asesor',
    'Liberación de Tesis',
    'Votos del Jurado',
    'Certificados Académicos',
    'Constancias Administrativas',
    'Autorización de Examen',
    'Acta de Evaluación',
];

export function CreateModal({ open, onOpenChange }: CreateModalProps) {
    // Nombre del archivo solo para mostrarlo en la interfaz visual
    const [nombreArchivoPreview, setNombreArchivoPreview] = useState<string | null>(null);

    /**
     * useForm de Inertia (idéntico a Carreras):
     * Maneja datos, subida de archivos, errores de backend y estado processing.
     */
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        nombre_oficio: '',
        tipo: '',
        archivo: null as File | null,
        estado: true,
    });

    // Se ejecuta al dar clic en "Guardar Oficio"
    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        // Envía la petición POST a Laravel (StoreOficioRequest)
        post('/admin/oficios_oficiales', {
            forceFormData: true, // Necesario para enviar archivos adjuntos
            onSuccess: () => {
                reset();
                clearErrors();
                setNombreArchivoPreview(null);
                onOpenChange(false);
            },
        });
    };

    // Se ejecuta al cancelar o cerrar
    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
            setNombreArchivoPreview(null);
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent 
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-[520px] bg-background border-border rounded-xl shadow-lg"
            >
                <form onSubmit={handleSubmit}>
                    {/* Encabezado */}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">
                            Registrar Nuevo Oficio Oficial
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Ingresa los datos y sube el documento del catálogo oficial.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Campos */}
                    <div className="grid gap-4 py-4">
                        {/* 1. Nombre del Oficio */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="nombre_oficio" className="text-sm font-semibold text-foreground">
                                    Nombre del Oficio <span className="text-[#EF4444]">*</span>
                                </Label>
                                <span className="text-[11px] text-muted-foreground">
                                    {data.nombre_oficio.length}/100
                                </span>
                            </div>
                            <Input
                                id="nombre_oficio"
                                placeholder="Ej: Formato Solicitud de Titulación..."
                                maxLength={100}
                                value={data.nombre_oficio}
                                onChange={(e) => setData('nombre_oficio', e.target.value)}
                                className={`bg-background border-border rounded-xl text-sm ${
                                    errors.nombre_oficio ? 'border-[#EF4444]' : ''
                                }`}
                                disabled={processing}
                                required
                            />
                            {/* Error de validación de Laravel */}
                            {errors.nombre_oficio && (
                                <p className="text-xs text-[#EF4444]">{errors.nombre_oficio}</p>
                            )}
                        </div>

                        {/* 2. Tipo / Trámite */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="tipo" className="text-sm font-semibold text-foreground">
                                Trámite / Tipo <span className="text-[#EF4444]">*</span>
                            </Label>
                            <Select 
                                value={data.tipo} 
                                onValueChange={(val) => setData('tipo', val)}
                                disabled={processing}
                                required
                            >
                                <SelectTrigger className={`w-full bg-background border-border rounded-xl text-sm ${
                                    errors.tipo ? 'border-[#EF4444]' : ''
                                }`}>
                                    <SelectValue placeholder="Selecciona un trámite del catálogo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {OPCIONES_TIPO.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.tipo && (
                                <p className="text-xs text-[#EF4444]">{errors.tipo}</p>
                            )}
                        </div>

                        {/* 3. Subir Archivo PDF */}
                        <div className="grid gap-1.5">
                            <Label className="text-sm font-semibold text-foreground">
                                Archivo del Oficio (.pdf) <span className="text-[#EF4444]">*</span>
                            </Label>
                            <div className={`border-2 border-dashed rounded-xl p-4 text-center hover:bg-accent/20 transition-colors cursor-pointer relative ${
                                errors.archivo ? 'border-[#EF4444]' : 'border-border'
                            }`}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    disabled={processing}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setData('archivo', file);
                                        setNombreArchivoPreview(file ? file.name : null);
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <FileUp className="size-6 text-muted-foreground" />
                                    <span className="text-xs font-medium text-foreground">
                                        {nombreArchivoPreview ? nombreArchivoPreview : 'Haz clic o arrastra un archivo PDF aquí'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">PDF hasta 5MB</span>
                                </div>
                            </div>
                            {errors.archivo && (
                                <p className="text-xs text-[#EF4444]">{errors.archivo}</p>
                            )}
                        </div>

                        {/* 4. Estado */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="estado" className="text-sm font-semibold text-foreground">
                                Estado inicial
                            </Label>
                            <Select 
                                value={data.estado ? '1' : '0'} 
                                onValueChange={(val) => setData('estado', val === '1')}
                                disabled={processing}
                            >
                                <SelectTrigger className="w-full bg-background border-border rounded-xl text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Activo</SelectItem>
                                    <SelectItem value="0">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Botones de acción del Modal (igual que en Carreras) */}
                    <DialogFooter className="flex flex-row gap-3 w-full sm:justify-end mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleClose(false)}
                            disabled={processing}
                            className="flex-1 sm:flex-none sm:w-30 bg-background border-border text-foreground hover:bg-accent/40 rounded-xl"
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="flex-1 sm:flex-none sm:w-30 bg-white hover:bg-[#10B981]/10 text-[#10B981] border-2 border-[#10B981] rounded-xl gap-2"
                        >
                            {processing && (
                                <span className="loading loading-spinner loading-xs text-[#10B981]"></span>
                            )}
                            {processing ? 'Guardando...' : 'Guardar Oficio'}
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    );
}
