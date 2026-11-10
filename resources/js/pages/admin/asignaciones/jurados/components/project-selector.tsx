import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    FileText,
    GraduationCap,
    Search,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
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
    const [busquedaTesista, setBusquedaTesista] = useState('');

    const proyectosFiltrados = useMemo(() => {
        const term = busquedaTesista.trim().toLowerCase();
        if (!term) return proyectos;

        return proyectos.filter((p) => {
            const matchSustentante = p.sustentantes.some((s) =>
                s.nombre_completo.toLowerCase().includes(term) ||
                s.matricula.toLowerCase().includes(term)
            );
            const matchTitulo = p.titulo.toLowerCase().includes(term);
            return matchSustentante || matchTitulo;
        });
    }, [proyectos, busquedaTesista]);

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
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs min-w-0 overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="rounded-lg bg-[#10B981]/15 p-2.5 text-[#10B981] shrink-0">
                        <UserRound className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-full bg-[#10B981]/15 text-[10px] font-bold text-[#10B981] shrink-0">
                                1
                            </span>
                            <h2 className="text-lg font-bold text-foreground">
                                Selección del Tesista (Sustentante)
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Busca y selecciona al alumno sustentante para consultar su tesis e integrar su jurado.
                        </p>
                    </div>
                </div>

                {proyectos.length > 3 && (
                    <div className="relative w-full sm:w-72 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            type="text"
                            value={busquedaTesista}
                            onChange={(e) => setBusquedaTesista(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                }
                            }}
                            placeholder="Buscar por tesista o matrícula..."
                            className="h-8 rounded-lg border-border bg-background pl-8 text-xs placeholder:text-muted-foreground"
                        />
                    </div>
                )}
            </div>

            <div className="mt-5 grid gap-1.5 min-w-0">
                <Label
                    htmlFor="proyecto-jurado"
                    className="text-xs font-semibold"
                >
                    Tesista / Sustentante
                </Label>
                <Select
                    value={value}
                    onValueChange={onValueChange}
                    disabled={disabled || proyectos.length === 0}
                >
                    <SelectTrigger
                        id="proyecto-jurado"
                        aria-invalid={Boolean(error)}
                        className="h-auto min-h-11 w-full border-border bg-background text-sm min-w-0 py-1.5 overflow-hidden text-left *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:w-full *:data-[slot=select-value]:overflow-hidden"
                    >
                        <SelectValue
                            placeholder={
                                proyectos.length === 0
                                    ? 'No hay proyectos con asesor activo'
                                    : 'Selecciona un tesista o sustentante'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover max-h-72 max-w-[calc(100vw-3rem)] sm:max-w-xl">
                        {proyectosFiltrados.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground">
                                No se encontraron tesistas que coincidan con la búsqueda.
                            </div>
                        ) : (
                            proyectosFiltrados.map((proyecto) => {
                                const nombres =
                                    proyecto.sustentantes
                                        .map((s) => s.nombre_completo)
                                        .join(', ') || 'Sin sustentante';
                                const matricula = proyecto.sustentantes[0]?.matricula
                                    ? ` · Matrícula: ${proyecto.sustentantes[0].matricula}`
                                    : '';

                                return (
                                    <SelectItem
                                        key={proyecto.id_proyecto}
                                        value={String(proyecto.id_proyecto)}
                                    >
                                        <div className="flex flex-col text-left py-0.5 min-w-0 w-full overflow-hidden">
                                            <span className="font-semibold text-foreground truncate min-w-0">
                                                {nombres} {matricula}
                                            </span>
                                            <span
                                                className="text-[11px] text-muted-foreground truncate min-w-0"
                                                title={proyecto.titulo}
                                            >
                                                Tesis: {proyecto.titulo}
                                            </span>
                                        </div>
                                    </SelectItem>
                                );
                            })
                        )}
                    </SelectContent>
                </Select>

                {error && (
                    <p className="flex items-center gap-1 text-[11px] font-medium text-destructive min-w-0">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{error}</span>
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
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 min-w-0">
                    <div className="rounded-lg border border-border bg-muted/20 p-3 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                            <FileText className="size-3.5 shrink-0" />
                            Título de la tesis
                        </div>
                        <p
                            className="mt-1.5 text-sm font-semibold text-foreground break-words [overflow-wrap:anywhere]"
                            title={proyectoSeleccionado.titulo}
                        >
                            {proyectoSeleccionado.titulo}
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                            <GraduationCap className="size-3.5 shrink-0" />
                            Sustentante
                        </div>
                        <p
                            className="mt-1.5 text-sm font-semibold text-foreground break-words [overflow-wrap:anywhere]"
                            title={sustentantes}
                        >
                            {sustentantes}
                        </p>
                        {proyectoSeleccionado.sustentantes[0] && (
                            <p className="text-[11px] text-muted-foreground break-words [overflow-wrap:anywhere]">
                                Matrícula:{' '}
                                {proyectoSeleccionado.sustentantes[0].matricula}
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                            <UserRound className="size-3.5 shrink-0" />
                            Asesor asignado
                        </div>
                        <p
                            className="mt-1.5 text-sm font-semibold text-foreground break-words [overflow-wrap:anywhere]"
                            title={asesores}
                        >
                            {asesores}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            No puede ocupar la presidencia del jurado.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                            <ShieldCheck className="size-3.5 shrink-0" />
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
