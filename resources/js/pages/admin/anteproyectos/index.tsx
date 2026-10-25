import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileText,
    Clock,
    CheckCircle2,
    FileEdit,
    UserX,
    Search,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    XCircle,
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

import { AnteproyectoFilters, AnteproyectoStats, PaginatedProyectos, ProyectoData } from './types';
import { DrawerRevision } from './drawer-revision';

interface Props {
    anteproyectos: PaginatedProyectos;
    stats: AnteproyectoStats;
    filters: AnteproyectoFilters;
}

export default function AnteproyectosIndex({ anteproyectos, stats, filters }: Props) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);

    // Estados para el panel lateral de revision
    const [selectedProyecto, setSelectedProyecto] = useState<ProyectoData | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Filtros locales
    const [search, setSearch] = useState(filters.search || '');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'todos');

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    const handleFilter = (newSearch = search, newEstado = estadoFilter) => {
        router.get(
            '/admin/anteproyectos',
            {
                search: newSearch,
                estado: newEstado,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setEstadoFilter('todos');
        router.get('/admin/anteproyectos', {}, { preserveState: true, replace: true });
    };

    const handleOpenRevision = (proyecto: ProyectoData) => {
        setSelectedProyecto(proyecto);
        setDrawerOpen(true);
    };

    const handleCloseRevision = () => {
        setDrawerOpen(false);
        setSelectedProyecto(null);
    };

    // Helper para formatear fechas
    const formatFecha = (fechaStr: string | null) => {
        if (!fechaStr) return 'Sin enviar';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Helper para badges de estado
    const renderEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Borrador':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                        Borrador
                    </span>
                );
            case 'En revisión':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        En revisión
                    </span>
                );
            case 'Aprobado':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Aprobado
                    </span>
                );
            case 'Con cambios':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        Con cambios
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                        {estado}
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Validación de Anteproyectos" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">
                {/* ALERTA FLASH */}
                {flash?.success && showAlert && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 text-foreground animate-in fade-in-50 duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        <button
                            onClick={() => setShowAlert(false)}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {flash?.error && showAlert && (
                    <div className="alert alert-error alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#EF4444] bg-red-50 dark:bg-red-950/30 text-foreground animate-in fade-in-50 duration-300">
                        <div className="flex items-center gap-2">
                            <XCircle className="size-4 text-[#EF4444] shrink-0" />
                            <span className="font-medium">{flash.error}</span>
                        </div>
                        <button
                            onClick={() => setShowAlert(false)}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* 5 FICHAS DE METRICAS SUPERIORES */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Total */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <FileText className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* En revision */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">En revisión</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.en_revision}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <Clock className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aprobados */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Aprobados</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.aprobados}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-[#10B981]">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Con cambios */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Con cambios</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.con_cambios}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                <FileEdit className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sin asesor */}
                    <Card className="border-border shadow-xs rounded-xl bg-card col-span-2 sm:col-span-1">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Sin asesor</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.sin_asesor}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                <UserX className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CONTENEDOR FLEXIBLE: TABLA PRINCIPAL + PANEL DERECHO DE REVISION */}
                <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
                    {/* TARJETA DE LA BANDEJA DE ANTEPROYECTOS */}
                    <Card className="border-border shadow-xs rounded-xl bg-card flex-1 w-full overflow-hidden">
                        <CardContent className="p-5 space-y-4">
                            {/* TITULO DE LA SECCION */}
                            <div>
                                <h1 className="text-lg font-bold tracking-tight text-foreground">
                                    Validación de anteproyectos
                                </h1>
                            </div>

                            {/* FILTROS: BUSCAR + ESTADO */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                {/* Buscador */}
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground block">
                                        Buscar
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Título, nombre, matrícula o correo"
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                handleFilter(e.target.value, estadoFilter);
                                            }}
                                            className="pl-9 bg-background border-border rounded-lg text-xs placeholder:text-muted-foreground h-9"
                                        />
                                    </div>
                                </div>

                                {/* Filtro por Estado */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-muted-foreground block">
                                            Estado
                                        </label>
                                        {(search || estadoFilter !== 'todos') && (
                                            <button
                                                type="button"
                                                onClick={handleResetFilters}
                                                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                                                title="Limpiar filtros"
                                            >
                                                <RotateCcw className="size-2.5" /> Limpiar
                                            </button>
                                        )}
                                    </div>
                                    <Select
                                        value={estadoFilter}
                                        onValueChange={(val) => {
                                            setEstadoFilter(val);
                                            handleFilter(search, val);
                                        }}
                                    >
                                        <SelectTrigger className="w-full border-border rounded-lg bg-background text-xs h-9">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-xs">
                                            <SelectItem value="todos">Todos</SelectItem>
                                            <SelectItem value="Borrador">Borrador</SelectItem>
                                            <SelectItem value="En revisión">En revisión</SelectItem>
                                            <SelectItem value="Aprobado">Aprobado</SelectItem>
                                            <SelectItem value="Con cambios">Con cambios</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* TABLA DE ANTEPROYECTOS */}
                            <div className="rounded-xl border border-border overflow-hidden bg-background">
                                <Table className="table-fixed min-w-[760px]">
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="border-b border-border">
                                            <TableHead className="font-semibold text-foreground w-[32%] text-xs">Título</TableHead>
                                            <TableHead className="font-semibold text-foreground w-[18%] text-xs">Sustentante</TableHead>
                                            <TableHead className="font-semibold text-foreground w-[12%] text-center text-xs">Matrícula</TableHead>
                                            <TableHead className="font-semibold text-foreground w-[12%] text-center text-xs">Envío</TableHead>
                                            <TableHead className="font-semibold text-foreground w-[13%] text-center text-xs">Estado</TableHead>
                                            <TableHead className="font-semibold text-foreground w-[13%] text-center text-xs">Asesor</TableHead>
                                            <TableHead className="text-center font-semibold text-foreground w-[12%] text-xs">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {anteproyectos.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                                                    No se encontraron anteproyectos registrados con los filtros aplicados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            anteproyectos.data.map((proyecto) => {
                                                const sust = proyecto.sustentante || proyecto.alumnos?.[0];
                                                const nomSust = sust?.nombre_completo ||
                                                    (sust ? `${sust.nombre} ${sust.apellido_p}` : 'Sin asignar');
                                                const matricula = sust?.matricula || '—';
                                                const asesor = proyecto.asesor_asignado || proyecto.asesores?.[0];
                                                const nomAsesor = asesor?.nombre_completo ||
                                                    (asesor ? `${asesor.nombre} ${asesor.apellido_p}` : 'Pendiente');

                                                const isSelected = selectedProyecto?.id_proyecto === proyecto.id_proyecto;

                                                return (
                                                    <TableRow
                                                        key={proyecto.id_proyecto}
                                                        className={`border-b border-border hover:bg-accent/20 transition-colors text-xs ${isSelected ? 'bg-accent/30 font-medium' : ''
                                                            }`}
                                                    >
                                                        {/* Titulo */}
                                                        <TableCell className="font-medium text-foreground">
                                                            <span className="truncate block" title={proyecto.titulo}>
                                                                {proyecto.titulo}
                                                            </span>
                                                        </TableCell>

                                                        {/* Sustentante */}
                                                        <TableCell className="text-foreground">
                                                            <span className="truncate block" title={nomSust}>
                                                                {nomSust}
                                                            </span>
                                                        </TableCell>

                                                        {/* Matricula */}
                                                        <TableCell className="text-center text-muted-foreground font-mono text-[11px]">
                                                            {matricula}
                                                        </TableCell>

                                                        {/* Envio */}
                                                        <TableCell className="text-center text-muted-foreground text-[11px] whitespace-nowrap">
                                                            {formatFecha(proyecto.fecha_envio)}
                                                        </TableCell>

                                                        {/* Estado */}
                                                        <TableCell className="text-center">
                                                            {renderEstadoBadge(proyecto.estado)}
                                                        </TableCell>

                                                        {/* Asesor */}
                                                        <TableCell className="text-center text-muted-foreground">
                                                            <span className="truncate block max-w-[120px] mx-auto" title={nomAsesor}>
                                                                {nomAsesor}
                                                            </span>
                                                        </TableCell>

                                                        {/* Acciones: Boton Revisar */}
                                                        <TableCell className="text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenRevision(proyecto)}
                                                                    className={`btn btn-xs bg-background border px-3 text-xs font-semibold hover:bg-accent/40 transition-colors ${isSelected
                                                                            ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                                                                            : 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                                        }`}
                                                                >
                                                                    Revisar
                                                                </button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* PAGINACION */}
                            <div className="flex items-center justify-end gap-3 pt-2 text-xs text-muted-foreground">
                                <p>
                                    Página <span className="font-semibold text-foreground">{anteproyectos.current_page}</span> de{' '}
                                    <span className="font-semibold text-foreground">{anteproyectos.last_page}</span>
                                </p>

                                <div className="flex items-center gap-1">
                                    {anteproyectos.links.map((link, index) => {
                                        const isPrev = link.label.includes('Previous') || link.label.includes('pagination.previous');
                                        const isNext = link.label.includes('Next') || link.label.includes('pagination.next');

                                        if (isPrev) {
                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`btn btn-xs border border-border bg-background hover:bg-accent/40 text-foreground gap-1 ${!link.url ? 'btn-disabled opacity-40' : ''
                                                        }`}
                                                    preserveScroll
                                                >
                                                    <ChevronLeft className="size-3" />
                                                    Anterior
                                                </Link>
                                            );
                                        }

                                        if (isNext) {
                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`btn btn-xs border border-border bg-background hover:bg-accent/40 text-foreground gap-1 ${!link.url ? 'btn-disabled opacity-40' : ''
                                                        }`}
                                                    preserveScroll
                                                >
                                                    Siguiente
                                                    <ChevronRight className="size-3" />
                                                </Link>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DRAWER LATERAL DERECHO DE REVISION */}
                    {drawerOpen && (
                        <DrawerRevision
                            open={drawerOpen}
                            onClose={handleCloseRevision}
                            proyecto={selectedProyecto}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

// Breadcrumbs para la barra superior
AnteproyectosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Anteproyectos',
            href: '/admin/anteproyectos',
        },
    ],
};
