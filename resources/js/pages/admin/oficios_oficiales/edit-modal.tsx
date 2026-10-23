import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';
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
import { FileUp, FileText } from 'lucide-react';

interface Oficio {
    id_oficio_oficial: number;
    nombre_oficio: string;
    tipo: string;
    url_archivo: string;
    estado: boolean;
    created_at?: string;
    id_usuario_registro?: number | null;
    usuario_registro?: {
        id: number;
        name: string;
    } | null;
}

interface EditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    oficio: Oficio | null;
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

export function EditModal({ open, onOpenChange, oficio }: EditModalProps) {
    const [nombreArchivoPreview, setNombreArchivoPreview] = useState<string | null>(null);

    /**
     * useForm con _method: 'PUT' para soportar subida multipart de archivos en actualización.
     */
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        _method: 'PUT',
        nombre_oficio: '',
        tipo: '',
        archivo: null as File | null,
        estado: true,
    });

    /**
     * Precarga los datos del oficio seleccionado cada vez que se abre el modal o cambia el oficio.
     */
    useEffect(() => {
        if (open && oficio) {
            setData({
                _method: 'PUT',
                nombre_oficio: oficio.nombre_oficio || '',
                tipo: oficio.tipo || '',
                archivo: null,
                estado: Boolean(oficio.estado),
            });
            setNombreArchivoPreview(null);
            clearErrors();
        }
    }, [open, oficio]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!oficio) return;

        post(`/admin/oficios_oficiales/${oficio.id_oficio_oficial}`, {
            forceFormData: true,
            onSuccess: () => {
                clearErrors();
                setNombreArchivoPreview(null);
                onOpenChange(false);
            },
        });
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
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
                            Editar Oficio Oficial
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Actualiza los datos del oficio y opcionalmente reemplaza el archivo PDF.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Campos */}
                    <div className="grid gap-4 py-4">
                        {/* 1. Nombre del Oficio */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="edit_nombre_oficio" className="text-sm font-semibold text-foreground">
                                    Nombre del Oficio <span className="text-[#EF4444]">*</span>
                                </Label>
                                <span className="text-[11px] text-muted-foreground">
                                    {data.nombre_oficio.length}/100
                                </span>
                            </div>
                            <Input
                                id="edit_nombre_oficio"
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
                            {errors.nombre_oficio && (
                                <p className="text-xs text-[#EF4444]">{errors.nombre_oficio}</p>
                            )}
                        </div>

                        {/* 2. Tipo / Trámite */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="edit_tipo" className="text-sm font-semibold text-foreground">
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

                        {/* 3. Reemplazar Archivo PDF (Opcional en edición) */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-foreground">
                                    Archivo del Oficio (.pdf)
                                </Label>
                                <span className="text-[11px] text-muted-foreground">
                                    (Opcional)
                                </span>
                            </div>

                            {/* Mostrar archivo actual si existe y no se ha seleccionado uno nuevo */}
                            {oficio?.url_archivo && !nombreArchivoPreview && (
                                <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
                                    <FileText className="size-4 text-[#EF4444] shrink-0" />
                                    <span className="truncate flex-1">
                                        Archivo actual: <strong className="text-foreground">{oficio.url_archivo.split('/').pop() || 'documento.pdf'}</strong>
                                    </span>
                                </div>
                            )}

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
                                        {nombreArchivoPreview ? (
                                            <span className="text-[#10B981] font-semibold">Nuevo: {nombreArchivoPreview}</span>
                                        ) : (
                                            'Haz clic o arrastra un archivo PDF para reemplazar el actual'
                                        )}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {nombreArchivoPreview ? 'Se actualizará el documento al guardar' : 'Si no seleccionas un archivo, se mantendrá el actual'}
                                    </span>
                                </div>
                            </div>
                            {errors.archivo && (
                                <p className="text-xs text-[#EF4444]">{errors.archivo}</p>
                            )}
                        </div>

                        {/* 4. Estado */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="edit_estado" className="text-sm font-semibold text-foreground">
                                Estado
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

                    {/* Botones de acción del Modal (idéntico a Carreras y CreateModal) */}
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
                            className="flex-1 sm:flex-none sm:w-36 bg-white hover:bg-[#fdff00]/10 text-black border-2 border-[#fdff00] rounded-xl gap-2 font-semibold"
                        >
                            {processing && (
                                <span className="loading loading-spinner loading-xs text-[#10B981]"></span>
                            )}
                            {processing ? 'Actualizando...' : 'Actualizar Oficio'}
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    );
}
