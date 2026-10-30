import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    RotateCcw,
    Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as juradosIndex } from '@/routes/admin/asignaciones/jurados';
import { JURY_SLOTS } from '../constants';
import {
    contarMiembrosAceptados,
    estadoProyectoClasses,
    obtenerEstadoGeneral,
    obtenerMiembroPorCargo,
} from '../jury-utils';
import type { DocenteJurado, JuryStatusFilter, MiembroJurado, ProyectoJurado } from '../types';
import { StatusBadge } from './status-badge';
import { SustituirJuradoModal } from './sustituir-jurado-modal';

const PAGE_SIZE = 8;

interface ConsultaTableProps {
    proyectos: ProyectoJurado[];
    docentes?: DocenteJurado[];
}

interface JuryMemberSummaryProps {
    member?: MiembroJurado;
    label?: string;
    onSustituir?: (member: MiembroJurado) => void;
}

function JuryMemberSummary({ member, label, onSustituir }: JuryMemberSummaryProps) {
    if (!member) {
        return (
            <span className="text-[11px] text-muted-foreground italic">
                Sin asignar
            </span>
        );
    }

    const esRechazado = member.estado_aceptacion.toLowerCase().startsWith('rechaz');

    return (
        <div className="min-w-0">
            <p
                className="truncate text-xs font-semibold text-foreground"
                title={member.docente.nombre_completo}
            >
                {label && (
                    <span className="mr-1 text-[10px] font-bold text-muted-foreground">
                        {label}
                    </span>
                )}
                {member.docente.nombre_completo}
            </p>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <StatusBadge estado={member.estado_aceptacion} className="text-[9px] py-0" />
                {esRechazado && onSustituir && (
                    <button
                        type="button"
                        onClick={() => onSustituir(member)}
                        className="text-[10px] text-amber-600 dark:text-amber-400 font-bold underline hover:text-amber-700"
                        title="Sustituir a este docente que rechazó"
                    >
                        Sustituir
                    </button>
                )}
            </div>
        </div>
    );
}

export function ConsultaTable({ proyectos, docentes = [] }: ConsultaTableProps) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<JuryStatusFilter>('todos');
    const [page, setPage] = useState(1);

    // Estado del modal de sustitución
    const [sustituirOpen, setSustituirOpen] = useState(false);
    const [proyectoParaSustituir, setProyectoParaSustituir] = useState<ProyectoJurado | null>(null);
    const [miembroParaSustituir, setMiembroParaSustituir] = useState<MiembroJurado | null>(null);

    const handleAbrirSustitucion = (proyecto: ProyectoJurado, miembro?: MiembroJurado) => {
        setProyectoParaSustituir(proyecto);
        setMiembroParaSustituir(miembro ?? null);
        setSustituirOpen(true);
    };

    const filteredProyectos = useMemo(() => {
        const term = search.trim().toLowerCase();

        return proyectos.filter((proyecto) => {
            const estadoGeneral = obtenerEstadoGeneral(proyecto);

            if (status !== 'todos' && estadoGeneral !== status) {
                return false;
            }

            if (term === '') {
                return true;
            }

            const searchable = [
                proyecto.titulo,
                proyecto.estado,
                ...proyecto.sustentantes.map(
                    (sustentante) => sustentante.nombre_completo,
                ),
                ...proyecto.sustentantes.map(
                    (sustentante) => sustentante.matricula,
                ),
                ...proyecto.asesores.map((asesor) => asesor.nombre_completo),
                ...proyecto.jurado.map(
                    (miembro) => miembro.docente.nombre_completo,
                ),
            ];

            return searchable.some((value) =>
                value.toLowerCase().includes(term),
            );
        });
    }, [proyectos, search, status]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredProyectos.length / PAGE_SIZE),
    );

    useEffect(() => {
        setPage(1);
    }, [search, status, proyectos]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const pageStart = (page - 1) * PAGE_SIZE;
    const pageItems = filteredProyectos.slice(pageStart, pageStart + PAGE_SIZE);

    const rangoInicio = filteredProyectos.length === 0 ? 0 : pageStart + 1;
    const rangoFin = Math.min(pageStart + PAGE_SIZE, filteredProyectos.length);

    const hasFilters = search !== '' || status !== 'todos';

    const clearFilters = () => {
        setSearch('');
        setStatus('todos');
    };

    return (
        <section className="flex flex-col gap-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Buscador reactivo amplio */}
                    <div className="relative w-full md:w-[460px] lg:w-[520px]">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por tesista, tesis, matrícula, asesor o jurado..."
                            className="h-10 rounded-xl border-border bg-background pl-9 text-sm"
                        />
                    </div>

                    {/* Selector de estado y botón limpiar */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Select
                            value={status}
                            onValueChange={(value) =>
                                setStatus(value as JuryStatusFilter)
                            }
                        >
                            <SelectTrigger className="h-10 w-full md:w-56 rounded-xl border-border bg-background text-sm">
                                <SelectValue placeholder="Estado de aceptación" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-popover">
                                <SelectItem value="todos">
                                    Todos los estados
                                </SelectItem>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Aceptado">Aceptado</SelectItem>
                                <SelectItem value="Rechazado">Rechazado</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasFilters && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="h-10 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0 border-border"
                            >
                                <RotateCcw className="size-3.5" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1280px] table-fixed">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[18%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Tesis
                                </TableHead>
                                <TableHead className="w-[11%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Sustentante
                                </TableHead>
                                <TableHead className="w-[11%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Asesor
                                </TableHead>
                                <TableHead className="w-[11%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Presidente
                                </TableHead>
                                <TableHead className="w-[11%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Secretario
                                </TableHead>
                                <TableHead className="w-[11%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Vocal
                                </TableHead>
                                <TableHead className="w-[11%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Suplentes
                                </TableHead>
                                <TableHead className="w-[11%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Estado
                                </TableHead>
                                <TableHead className="w-[5%] px-4 text-right text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Ver
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {pageItems.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="px-4 py-12 text-center"
                                    >
                                        <p className="text-sm font-medium text-foreground">
                                            {proyectos.length === 0
                                                ? 'Aún no hay jurados asignados.'
                                                : 'No se encontraron tesis con los filtros aplicados.'}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {proyectos.length === 0
                                                ? 'Integra el primer jurado desde la vista de asignación.'
                                                : 'Prueba con otro término de búsqueda o cambia el estado.'}
                                        </p>
                                        {proyectos.length === 0 && (
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="mt-3 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10"
                                            >
                                                <Link href={juradosIndex.url()}>
                                                    Asignar jurado
                                                </Link>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageItems.map((proyecto) => {
                                    const estadoGeneral =
                                        obtenerEstadoGeneral(proyecto);
                                    const aceptados =
                                        contarMiembrosAceptados(proyecto);
                                    const presidente = obtenerMiembroPorCargo(
                                        proyecto,
                                        'Presidente',
                                    );
                                    const secretario = obtenerMiembroPorCargo(
                                        proyecto,
                                        'Secretario',
                                    );
                                    const vocal = obtenerMiembroPorCargo(
                                        proyecto,
                                        'Vocal',
                                    );
                                    const suplente1 = obtenerMiembroPorCargo(
                                        proyecto,
                                        'Suplente 1',
                                    );
                                    const suplente2 = obtenerMiembroPorCargo(
                                        proyecto,
                                        'Suplente 2',
                                    );

                                    return (
                                        <TableRow
                                            key={proyecto.id_proyecto}
                                            className="align-top hover:bg-accent/20"
                                        >
                                            <TableCell className="px-4 py-3">
                                                <Link
                                                    href={juradosIndex.url({
                                                        query: {
                                                            proyecto:
                                                                proyecto.id_proyecto,
                                                        },
                                                    })}
                                                    className="line-clamp-2 text-sm font-bold text-foreground transition-colors hover:text-[#10B981]"
                                                    title={proyecto.titulo}
                                                >
                                                    {proyecto.titulo}
                                                </Link>
                                                <span
                                                    className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${estadoProyectoClasses(proyecto.estado)}`}
                                                >
                                                    {proyecto.estado}
                                                </span>
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <p
                                                    className="line-clamp-2 text-xs font-semibold text-foreground"
                                                    title={proyecto.sustentantes
                                                        .map(
                                                            (sustentante) =>
                                                                sustentante.nombre_completo,
                                                        )
                                                        .join(', ')}
                                                >
                                                    {proyecto.sustentantes
                                                        .map(
                                                            (sustentante) =>
                                                                sustentante.nombre_completo,
                                                        )
                                                        .join(', ') ||
                                                        'Sin sustentante'}
                                                </p>
                                                {proyecto.sustentantes[0] && (
                                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                                        {
                                                            proyecto
                                                                .sustentantes[0]
                                                                .matricula
                                                        }
                                                    </p>
                                                )}
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <p
                                                    className="line-clamp-2 text-xs font-semibold text-foreground"
                                                    title={proyecto.asesores
                                                        .map(
                                                            (asesor) =>
                                                                asesor.nombre_completo,
                                                        )
                                                        .join(', ')}
                                                >
                                                    {proyecto.asesores
                                                        .map(
                                                            (asesor) =>
                                                                asesor.nombre_completo,
                                                        )
                                                        .join(', ') ||
                                                        'Sin asesor'}
                                                </p>
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <JuryMemberSummary
                                                    member={presidente}
                                                    onSustituir={(m) => handleAbrirSustitucion(proyecto, m)}
                                                />
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <JuryMemberSummary
                                                    member={secretario}
                                                    onSustituir={(m) => handleAbrirSustitucion(proyecto, m)}
                                                />
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <JuryMemberSummary
                                                    member={vocal}
                                                    onSustituir={(m) => handleAbrirSustitucion(proyecto, m)}
                                                />
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <div className="flex flex-col gap-2">
                                                    <JuryMemberSummary
                                                        member={suplente1}
                                                        label="S1"
                                                        onSustituir={(m) => handleAbrirSustitucion(proyecto, m)}
                                                    />
                                                    <JuryMemberSummary
                                                        member={suplente2}
                                                        label="S2"
                                                        onSustituir={(m) => handleAbrirSustitucion(proyecto, m)}
                                                    />
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-4 py-3 min-w-[120px]">
                                                <StatusBadge
                                                    estado={estadoGeneral}
                                                    dot
                                                    className="whitespace-nowrap"
                                                />
                                                <p className="mt-1.5 text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {aceptados} de{' '}
                                                    {JURY_SLOTS.length}{' '}
                                                    aceptados
                                                </p>
                                                {proyecto.jurado.some((m) =>
                                                    m.estado_aceptacion.toLowerCase().startsWith('rechaz')
                                                ) && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleAbrirSustitucion(proyecto)}
                                                        className="mt-2 h-6 px-2 text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-1 shadow-xs"
                                                    >
                                                        <RefreshCw className="size-2.5" />
                                                        Sustituir
                                                    </Button>
                                                )}
                                            </TableCell>

                                            <TableCell className="px-4 py-3 text-right">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:bg-[#10B981]/10 hover:text-[#10B981]"
                                                >
                                                    <Link
                                                        href={juradosIndex.url({
                                                            query: {
                                                                proyecto:
                                                                    proyecto.id_proyecto,
                                                            },
                                                        })}
                                                        title="Ver asignación del jurado"
                                                    >
                                                        <ArrowUpRight className="size-4" />
                                                        <span className="sr-only">
                                                            Ver asignación
                                                        </span>
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/10 px-4 py-3 sm:flex-row">
                    <p className="text-[11px] text-muted-foreground">
                        Mostrando {rangoInicio}–{rangoFin} de{' '}
                        {filteredProyectos.length} tesis con jurado
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() =>
                                setPage((current) => Math.max(1, current - 1))
                            }
                            className="h-8 gap-1 border-border bg-background text-xs"
                        >
                            <ChevronLeft className="size-3.5" />
                            Anterior
                        </Button>
                        <span className="min-w-24 text-center text-[11px] font-medium text-muted-foreground">
                            Página {page} de {totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage((current) =>
                                    Math.min(totalPages, current + 1),
                                )
                            }
                            className="h-8 gap-1 border-border bg-background text-xs"
                        >
                            Siguiente
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            <SustituirJuradoModal
                open={sustituirOpen}
                onOpenChange={setSustituirOpen}
                proyecto={proyectoParaSustituir}
                docentes={docentes}
                miembroInicial={miembroParaSustituir}
            />
        </section>
    );
}
