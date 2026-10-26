import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    FileText,
    GraduationCap,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index as asesoresIndex } from '@/routes/admin/asignaciones/asesores';
import { estadoProyectoClasses } from '../jury-utils';
import type { ProyectoJurado } from '../types';

interface ProjectSelectorProps {
    proyectos: ProyectoJurado[];
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
}

export function ProjectSelector({
    proyectos,
    value,
    onValueChange,
    disabled = false,
    error,
}: ProjectSelectorProps) {
    const proyectoSeleccionado =
        proyectos.find((proyecto) => String(proyecto.id_proyecto) === value) ??
        null;

    const sustentantes =
        proyectoSeleccionado?.sustentantes
            .map((sustentante) => sustentante.nombre_completo)
            .join(', ') || 'Sin sustentante registrado';

    const asesores =
        proyectoSeleccionado?.asesores
            .map((asesor) => asesor.nombre_completo)
            .join(', ') || 'Sin asesor activo';

    return (
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[#10B981]/15 p-2.5 text-[#10B981]">
                    <FileText className="size-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-[#10B981]/15 text-[10px] font-bold text-[#10B981]">
                            1
                        </span>
                        <h2 className="text-lg font-bold text-foreground">
                            Proyecto de tesis
                        </h2>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Selecciona la tesis para consultar sus datos y armar su
                        jurado.
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-1.5">
                <Label
                    htmlFor="proyecto-jurado"
                    className="text-xs font-semibold"
                >
                    Tesis
                </Label>
                <Select
                    value={value}
                    onValueChange={onValueChange}
                    disabled={disabled || proyectos.length === 0}
                >
                    <SelectTrigger
                        id="proyecto-jurado"
                        aria-invalid={Boolean(error)}
                        className="h-10 w-full border-border bg-background text-sm"
                    >
                        <SelectValue
                            placeholder={
                                proyectos.length === 0
                                    ? 'No hay proyectos con asesor activo'
                                    : 'Selecciona un proyecto de tesis'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover">
                        {proyectos.map((proyecto) => (
                            <SelectItem
                                key={proyecto.id_proyecto}
                                value={String(proyecto.id_proyecto)}
                            >
                                {proyecto.titulo}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {error && (
                    <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                        <AlertCircle className="size-3.5" />
                        {error}
                    </p>
                )}
            </div>

            {proyectos.length === 0 && (
                <p className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                    Todos los proyectos deben tener un asesor activo antes de
                    integrar el jurado. Asigna uno desde{' '}
                    <Link
                        href={asesoresIndex.url()}
                        className="font-semibold text-[#10B981] underline-offset-2 hover:underline"
                    >
                        Asignación de asesores
                    </Link>
                    .
                </p>
            )}

            {proyectoSeleccionado ? (
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                            <FileText className="size-3.5" />
                            Título de la tesis
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-foreground">
                            {proyectoSeleccionado.titulo}
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                            <GraduationCap className="size-3.5" />
                            Sustentante
                        </div>
                        <p
                            className="mt-1.5 truncate text-sm font-semibold text-foreground"
                            title={sustentantes}
                        >
                            {sustentantes}
                        </p>
                        {proyectoSeleccionado.sustentantes[0] && (
                            <p className="text-[11px] text-muted-foreground">
                                Matrícula:{' '}
                                {proyectoSeleccionado.sustentantes[0].matricula}
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                            <UserRound className="size-3.5" />
                            Asesor asignado
                        </div>
                        <p
                            className="mt-1.5 truncate text-sm font-semibold text-foreground"
                            title={asesores}
                        >
                            {asesores}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            No puede ocupar la presidencia del jurado.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                            <ShieldCheck className="size-3.5" />
                            Estado del proyecto
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${estadoProyectoClasses(proyectoSeleccionado.estado)}`}
                            >
                                {proyectoSeleccionado.estado}
                            </span>
                            {proyectoSeleccionado.tiene_jurado && (
                                <span className="inline-flex w-fit items-center rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0F9F6E] dark:text-[#34D399]">
                                    Jurado registrado
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                proyectos.length > 0 && (
                    <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                        Selecciona un proyecto para ver sus datos y comenzar la
                        integración del jurado.
                    </p>
                )
            )}
        </section>
    );
}
