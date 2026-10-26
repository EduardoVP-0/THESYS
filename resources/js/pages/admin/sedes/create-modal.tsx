import { useForm } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/routes/admin/sedes';

interface CreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateModal({ open, onOpenChange }: CreateModalProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            nombre_sede: '',
            direccion: '',
            estado: true,
        });

    const handleSubmit: FormEventHandler = (event) => {
        event.preventDefault();

        post(store.url(), {
            preserveScroll: true,
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
                onPointerDownOutside={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                className="border-border bg-background shadow-lg sm:max-w-[520px]"
            >
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-[#10B981]/15 p-2 text-[#10B981]">
                                <MapPin className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    Registrar nueva sede
                                </DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Agrega un espacio disponible para programar
                                    exámenes profesionales.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="nombre_sede"
                                    className="text-sm font-semibold text-foreground"
                                >
                                    Nombre de la sede{' '}
                                    <span className="text-[#EF4444]">*</span>
                                </Label>
                                <span className="text-[11px] text-muted-foreground">
                                    {data.nombre_sede.length}/120
                                </span>
                            </div>
                            <Input
                                id="nombre_sede"
                                maxLength={120}
                                value={data.nombre_sede}
                                onChange={(event) =>
                                    setData('nombre_sede', event.target.value)
                                }
                                placeholder="Ej. Sala de titulación"
                                className={`border-border focus-visible:ring-ring ${
                                    errors.nombre_sede ? 'border-[#EF4444]' : ''
                                }`}
                                autoFocus
                            />
                            {errors.nombre_sede && (
                                <p className="mt-0.5 text-xs text-[#EF4444]">
                                    {errors.nombre_sede}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="direccion"
                                className="text-sm font-semibold text-foreground"
                            >
                                Dirección
                            </Label>
                            <Textarea
                                id="direccion"
                                rows={3}
                                maxLength={255}
                                value={data.direccion}
                                onChange={(event) =>
                                    setData('direccion', event.target.value)
                                }
                                placeholder="Ubicación o referencias de la sede..."
                                className={`resize-none border-border focus-visible:ring-ring ${
                                    errors.direccion ? 'border-[#EF4444]' : ''
                                }`}
                            />
                            {errors.direccion && (
                                <p className="mt-0.5 text-xs text-[#EF4444]">
                                    {errors.direccion}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-4 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleClose(false)}
                            disabled={processing}
                            className="min-w-[140px] border-2 border-border bg-background font-medium text-foreground hover:bg-accent/40"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="min-w-[160px] gap-2 bg-[#10B981] font-semibold text-white shadow-xs hover:bg-[#0FA875]"
                        >
                            {processing && (
                                <Spinner className="size-4 text-white" />
                            )}
                            {processing ? 'Guardando...' : 'Guardar sede'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
