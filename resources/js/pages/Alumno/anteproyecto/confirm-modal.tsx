import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send, Sparkles } from 'lucide-react';

interface ConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tieneCambiosSolicitados: boolean;
    titulo: string;
    documentoLabel?: string | null;
    submittingReview: boolean;
    onConfirm: () => void;
}

export function ConfirmModal({
    open,
    onOpenChange,
    tieneCambiosSolicitados,
    titulo,
    documentoLabel,
    submittingReview,
    onConfirm,
}: ConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-md border-border bg-card"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                        <Sparkles className="size-5 text-[#10B981]" />
                        {tieneCambiosSolicitados
                            ? '¿Reenviar anteproyecto corregido?'
                            : '¿Enviar anteproyecto a revisión oficial?'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                        Una vez enviado a revisión,{' '}
                        <strong className="text-foreground">
                            ya no podrás modificar el título, el resumen ni el documento PDF
                        </strong>{' '}
                        mientras la coordinación académica evalúa tu propuesta. Solo se volverá a habilitar la edición en caso de que te soliciten correcciones.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5 text-xs">
                    <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                            Título a registrar:
                        </span>
                        <p className="font-semibold text-foreground line-clamp-2">{titulo}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                            Documento PDF:
                        </span>
                        <p className="font-medium text-foreground truncate">
                            {documentoLabel || 'Sin documento'}
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={submittingReview}
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-medium cursor-pointer"
                    >
                        Cancelar y seguir editando
                    </Button>
                    <Button
                        type="button"
                        disabled={submittingReview}
                        onClick={onConfirm}
                        className="bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                        <Send className="size-3.5" />
                        {submittingReview ? 'Enviando propuesta...' : 'Sí, enviar oficialmente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

