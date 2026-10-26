import {
    CalendarDays,
    Clock3,
    MapPin,
    Scale,
    UserRoundCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { VeredictoBadge } from './status-badge';
import type { JuradoVeredicto, Veredicto } from './types';

interface DetalleVeredictoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    veredicto: Veredicto | null;
    onRegistrar: (veredicto: Veredicto) => void;
}

const COLOR_VOTO: Record<string, string> = {
    'A favor':
        'border-[#10B981]/20 bg-[#10B981]/10 text-[#0F9F6E] dark:text-[#34D399]',
    'En contra': 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
    Abstención:
        'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export function DetalleVeredictoModal({
    open,
    onOpenChange,
    veredicto,
    onRegistrar,
}: DetalleVeredictoModalProps) {
    if (!veredicto) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-background shadow-lg sm:max-w-[640px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-[#10B981]/15 p-2 text-[#10B981]">
                            <Scale className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                Detalle del veredicto
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Votos emitidos por el jurado del examen
                                profesional.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#10B981]/15 text-sm font-bold text-[#10B981]">
                                    {veredicto.estudiante.iniciales}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-foreground">
                                        {veredicto.estudiante.nombre_completo}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {veredicto.estudiante.matricula}
                                    </p>
                                </div>
                            </div>
                            <VeredictoBadge
                                estado={veredicto.estado}
                                estadoKey={veredicto.estado_key}
                            />
                        </div>
                        <p className="mt-3 text-sm font-medium text-foreground">
                            {veredicto.titulo}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <span className="flex items-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <CalendarDays className="size-3.5" />
                                Fecha
                            </span>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                                {veredicto.fecha}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <span className="flex items-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <Clock3 className="size-3.5" />
                                Hora
                            </span>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                                {veredicto.hora}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <span className="flex items-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <MapPin className="size-3.5" />
                                Sede
                            </span>
                            <p
                                className="mt-1 truncate text-sm font-semibold text-foreground"
                                title={veredicto.sede ?? undefined}
                            >
                                {veredicto.sede ?? 'Sin sede'}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Votación titular
                                </p>
                                <p className="mt-1 text-2xl font-bold text-foreground">
                                    {veredicto.voto_resumen}
                                </p>
                            </div>
                            <div className="flex gap-4 text-center text-xs">
                                <div>
                                    <p className="text-lg font-bold text-[#0F9F6E] dark:text-[#34D399]">
                                        {veredicto.votos.favor}
                                    </p>
                                    <p className="text-muted-foreground">
                                        A favor
                                    </p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-red-500">
                                        {veredicto.votos.contra}
                                    </p>
                                    <p className="text-muted-foreground">
                                        En contra
                                    </p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-amber-500">
                                        {veredicto.votos.abstencion}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Abstención
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {veredicto.votos.emitidos} de{' '}
                            {veredicto.votos.titulares} integrantes titulares
                            han emitido su voto.
                            {veredicto.resultado_final && (
                                <>
                                    {' '}
                                    Resultado registrado:{' '}
                                    <span className="font-semibold text-foreground">
                                        {veredicto.resultado_final}
                                    </span>
                                    .
                                </>
                            )}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <UserRoundCheck className="size-4 text-[#10B981]" />
                            <h3 className="text-sm font-semibold text-foreground">
                                Integrantes del jurado
                            </h3>
                        </div>

                        {veredicto.jurados.map((jurado) => (
                            <JuradoCard key={jurado.id_jurado_proyecto} jurado={jurado} />
                        ))}
                    </div>
                </div>

                <DialogFooter className="mt-2 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="min-w-[120px] border-border bg-background text-foreground hover:bg-accent/40"
                    >
                        Cerrar
                    </Button>
                    {veredicto.puede_registrar && (
                        <Button
                            type="button"
                            onClick={() => onRegistrar(veredicto)}
                            className="min-w-[170px] gap-2 bg-[#10B981] font-semibold text-white shadow-xs hover:bg-[#0FA875]"
                        >
                            <Scale className="size-4" />
                            Registrar / actualizar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function JuradoCard({ jurado }: { jurado: JuradoVeredicto }) {
    return (
        <div
            className={`rounded-lg border border-border p-3 ${
                jurado.es_titular ? 'bg-card' : 'bg-muted/20'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#10B981]/15 text-xs font-bold text-[#10B981]">
                        {jurado.docente.iniciales}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                            {jurado.docente.nombre_completo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {jurado.cargo}
                            {!jurado.es_titular && ' · No contabiliza'}
                        </p>
                    </div>
                </div>

                {jurado.voto ? (
                    <span
                        className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                            COLOR_VOTO[jurado.voto] ??
                            'border-border bg-muted/50 text-muted-foreground'
                        }`}
                    >
                        {jurado.voto}
                    </span>
                ) : (
                    <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Sin voto
                    </span>
                )}
            </div>

            {jurado.observaciones && (
                <p className="mt-2 rounded-md bg-muted/40 px-2.5 py-2 text-xs whitespace-pre-line text-muted-foreground">
                    {jurado.observaciones}
                </p>
            )}
        </div>
    );
}
