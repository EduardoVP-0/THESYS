import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    FileText,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    AsesoradoItem,
    AsesoradosFilters,
    AsesoradosStats,
    CarreraOption,
    PaginatedAsesorados,
} from './types';
import { DrawerDetalle } from './drawer-detalle';

interface Props {
    asesorados: PaginatedAsesorados;
    stats: AsesoradosStats;
    carreras: CarreraOption[];
    filters: AsesoradosFilters;
}

export default function MisAsesoradosIndex({
    asesorados,
    stats,
    carreras,
    filters,
}: Props) {
    // Estados para el panel lateral derecho
    const [selectedAsesorado, setSelectedAsesorado] = useState<AsesoradoItem | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Filtros locales
    const [search, setSearch] = useState(filters.search || '');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'todos');
    const [carreraFilter, setCarreraFilter] = useState(filters.carrera || 'todas');

    // Sincronizar elemento seleccionado cuando recargan los datos
    useEffect(() => {
        if (selectedAsesorado) {
            const updated = asesorados.data.find(
                (item) => item.id_asesor_proyecto === selectedAsesorado.id_asesor_proyecto,
            );
            if (updated) {
                setSelectedAsesorado(updated);
            }
        }
    }, [asesorados.data]);

    // Buscador con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                applyFilters(search, estadoFilter, carreraFilter);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const applyFilters = (
        newSearch: string,
        newEstado: string,
        newCarrera: string,
    ) => {
        router.get(
            '/docente/asesorados',
            {
                search: newSearch || undefined,
                estado: newEstado !== 'todos' ? newEstado : undefined,
                carrera: newCarrera !== 'todas' ? newCarrera : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleEstadoChange = (value: string) => {
        setEstadoFilter(value);
        applyFilters(search, value, carreraFilter);
    };

    const handleCarreraChange = (value: string) => {
        setCarreraFilter(value);
        applyFilters(search, estadoFilter, value);
    };

    const handleResetFilters = () => {
        setSearch('');
        setEstadoFilter('todos');
        setCarreraFilter('todas');
        router.get(
            '/docente/asesorados',
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSelectRow = (item: AsesoradoItem) => {
        setSelectedAsesorado(item);
        setDrawerOpen(true);
    };

    const renderEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Aprobado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/15 text-emerald-700 dark:text-emerald-400 border border-[#10B981]/30">
                        <span className="size-1.5 rounded-full bg-[#10B981]" />
                        Aprobado
                    </span>
                );
            case 'En revisión':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#B8D4E3]/40 dark:bg-[#B8D4E3]/15 text-slate-800 dark:text-slate-200 border border-[#B8D4E3]/60">
                        <span className="size-1.5 rounded-full bg-blue-500" />
                        En revisión
                    </span>
                );
            case 'Con cambios':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <span className="size-1.5 rounded-full bg-[#F59E0B]" />
                        Cambios solicitados
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                        Sin entregas
                    </span>
                );
        }
    };

    const hasActiveFilters =
        search !== '' || estadoFilter !== 'todos' || carreraFilter !== 'todas';

    return (
        <>
            <Head title="Mis Asesorados" />

            <div className="flex flex-col gap-5 p-4 md:p-6">
                {/* ENCABEZADO INSTITUCIONAL */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                            Asesor / Mis asesorados
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                            MIS ASESORADOS
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Gestiona y da seguimiento a tus proyectos de titulación asignados como Director de Tesis.
                        </p>
                    </div>
                </div>

                {/* TARJETAS DE METRICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <Card className="border-border shadow-xs bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total Asesorados
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Users className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    En Revisión
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.en_revision}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#B8D4E3]/40 text-slate-700 dark:text-[#B8D4E3]">
                                <Clock className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Cambios Solicitados
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.con_cambios}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-500/15 text-[#F59E0B]">
                                <AlertCircle className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Tesis Aprobadas
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.aprobados}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#10B981]/15 text-[#10B981]">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CONTENEDOR PRINCIPAL: TABLA + PANEL LATERAL DERECHO */}
                <div className="flex flex-col lg:flex-row gap-0 border border-border rounded-xl bg-card shadow-xs overflow-hidden">
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* BARRA DE HERRAMIENTAS: BUSCADOR Y FILTROS */}
                        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    maxLength={100}
                                    placeholder="Buscar por estudiante, matrícula o título de tesis..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs bg-background border-border"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Select
                                    value={carreraFilter}
                                    onValueChange={handleCarreraChange}
                                >
                                    <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs bg-background border-border">
                                        <SelectValue placeholder="Todas las carreras" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todas">
                                            Todas las carreras
                                        </SelectItem>
                                        {carreras.map((c) => (
                                            <SelectItem
                                                key={c.id_carrera}
                                                value={String(c.id_carrera)}
                                            >
                                                {c.nombre_carrera}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={estadoFilter}
                                    onValueChange={handleEstadoChange}
                                >
                                    <SelectTrigger className="w-full sm:w-[175px] h-9 text-xs bg-background border-border">
                                        <SelectValue placeholder="Todos los estados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">
                                            Todos los estados
                                        </SelectItem>
                                        <SelectItem value="En revisión">
                                            En revisión
                                        </SelectItem>
                                        <SelectItem value="Con cambios">
                                            Cambios solicitados
                                        </SelectItem>
                                        <SelectItem value="Aprobado">
                                            Aprobado
                                        </SelectItem>
                                        <SelectItem value="Sin entregas">
                                            Sin entregas
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="btn btn-sm h-9 px-3 btn-ghost border border-border text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                        title="Limpiar filtros"
                                    >
                                        <RotateCcw className="size-3.5" />
                                        Restablecer
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* TABLA DE ASESORADOS (SIN BARRA DE PROGRESO) */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 pl-4">
                                            Estudiante
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                            Carrera
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                            Título de tesis
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                            Última versión
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 pr-4">
                                            Estado
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asesorados.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-44 text-center text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="size-8 text-muted-foreground/50" />
                                                    <p className="text-sm font-medium">
                                                        No se encontraron proyectos asesorados
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {hasActiveFilters
                                                            ? 'Intenta ajustar los filtros de búsqueda.'
                                                            : 'Aún no tienes proyectos asignados como Director de Tesis.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        asesorados.data.map((item) => {
                                            const isSelected =
                                                drawerOpen &&
                                                selectedAsesorado?.id_asesor_proyecto ===
                                                    item.id_asesor_proyecto;

                                            return (
                                                <TableRow
                                                    key={item.id_asesor_proyecto}
                                                    onClick={() => handleSelectRow(item)}
                                                    className={`cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? 'bg-[#B8D4E3]/25 dark:bg-[#B8D4E3]/10 hover:bg-[#B8D4E3]/30'
                                                            : 'hover:bg-muted/40'
                                                    }`}
                                                >
                                                    {/* ESTUDIANTE + MATRICULA */}
                                                    <TableCell className="py-3.5 pl-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-9 rounded-full bg-[#B8D4E3]/45 dark:bg-[#B8D4E3]/20 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                                                                {item.sustentante.iniciales}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-foreground truncate">
                                                                    {item.sustentante.nombre_completo}
                                                                </p>
                                                                <p className="text-[11px] font-mono text-muted-foreground">
                                                                    {item.sustentante.matricula}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* CARRERA */}
                                                    <TableCell className="py-3.5 text-xs text-muted-foreground max-w-[190px]">
                                                        <p
                                                            className="truncate max-w-[180px]"
                                                            title={item.sustentante.carrera}
                                                        >
                                                            {item.sustentante.carrera}
                                                        </p>
                                                    </TableCell>

                                                    {/* TITULO DE TESIS */}
                                                    <TableCell className="py-3.5 max-w-[270px]">
                                                        <p
                                                            className="text-xs font-semibold text-foreground truncate max-w-[260px]"
                                                            title={item.titulo}
                                                        >
                                                            {item.titulo}
                                                        </p>
                                                    </TableCell>

                                                    {/* ULTIMA VERSION */}
                                                    <TableCell className="py-3.5 text-xs">
                                                        {item.ultima_version ? (
                                                            <div>
                                                                <span className="font-semibold text-foreground block">
                                                                    {item.ultima_version.numero_version}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    {item.ultima_version.fecha_envio_corta}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">
                                                                Sin versión enviada
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* ESTADO */}
                                                    <TableCell className="py-3.5 pr-4">
                                                        {renderEstadoBadge(item.estado_tesis)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* PAGINACION */}
                        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10 mt-auto">
                            <p className="text-xs text-muted-foreground">
                                Mostrando{' '}
                                <span className="font-semibold text-foreground">
                                    {asesorados.from || 0}
                                </span>{' '}
                                a{' '}
                                <span className="font-semibold text-foreground">
                                    {asesorados.to || 0}
                                </span>{' '}
                                de{' '}
                                <span className="font-semibold text-foreground">
                                    {asesorados.total}
                                </span>{' '}
                                registros
                            </p>

                            {asesorados.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    {asesorados.links.map((link, idx) => {
                                        const isPrev =
                                            link.label.includes('Previous') ||
                                            link.label.includes('Anterior') ||
                                            link.label.includes('&laquo;');
                                        const isNext =
                                            link.label.includes('Next') ||
                                            link.label.includes('Siguiente') ||
                                            link.label.includes('&raquo;');

                                        if (isPrev) {
                                            return link.url ? (
                                                <Link
                                                    key={idx}
                                                    href={link.url}
                                                    preserveState
                                                    preserveScroll
                                                    className="btn btn-xs h-7 px-2 btn-ghost border border-border"
                                                >
                                                    <ChevronLeft className="size-3.5" />
                                                </Link>
                                            ) : (
                                                <span
                                                    key={idx}
                                                    className="btn btn-xs h-7 px-2 btn-disabled border border-border opacity-40"
                                                >
                                                    <ChevronLeft className="size-3.5" />
                                                </span>
                                            );
                                        }

                                        if (isNext) {
                                            return link.url ? (
                                                <Link
                                                    key={idx}
                                                    href={link.url}
                                                    preserveState
                                                    preserveScroll
                                                    className="btn btn-xs h-7 px-2 btn-ghost border border-border"
                                                >
                                                    <ChevronRight className="size-3.5" />
                                                </Link>
                                            ) : (
                                                <span
                                                    key={idx}
                                                    className="btn btn-xs h-7 px-2 btn-disabled border border-border opacity-40"
                                                >
                                                    <ChevronRight className="size-3.5" />
                                                </span>
                                            );
                                        }

                                        return link.url ? (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                preserveState
                                                preserveScroll
                                                className={`btn btn-xs h-7 min-w-7 px-2 text-xs ${
                                                    link.active
                                                        ? 'bg-[#10B981] text-white border-[#10B981] hover:bg-emerald-600'
                                                        : 'btn-ghost border border-border'
                                                }`}
                                            >
                                                {link.label}
                                            </Link>
                                        ) : (
                                            <span
                                                key={idx}
                                                className="btn btn-xs h-7 min-w-7 px-2 text-xs btn-disabled"
                                            >
                                                {link.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PANEL LATERAL DERECHO DE DETALLE Y VERSIONES */}
                    <DrawerDetalle
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        asesorado={selectedAsesorado}
                    />
                </div>
            </div>
        </>
    );
}

// Breadcrumbs para la barra superior
MisAsesoradosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Docente',
            href: '/docente/dashboard',
        },
        {
            title: 'Mis Asesorados',
            href: '/docente/asesorados',
        },
    ],
};

