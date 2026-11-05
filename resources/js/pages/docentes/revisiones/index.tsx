import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileText,
    Clock,
    CheckCircle2,
    FileEdit,
    Search,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    XCircle,
    UserCheck,
    BookCheck,
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
    PaginatedRevisiones,
    RevisionFilters,
    RevisionItem,
    RevisionStats,
} from './types';
import { DrawerRevision } from './drawer-revision';

interface Props {
    revisiones: PaginatedRevisiones;
    stats: RevisionStats;
    filters: RevisionFilters;
}

export default function RevisionesDocenteIndex({
    revisiones,
    stats,
    filters,
}: Props) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);

    // Estado para el panel lateral derecho de revision
    const [selectedRevision, setSelectedRevision] = useState<RevisionItem | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Filtros locales
    const [search, setSearch] = useState(filters.search || '');
    const [rolFilter, setRolFilter] = useState(filters.rol || 'todos');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'todos');

    // Mostrar alertas flash temporalmente
    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4500);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    // Sincronizar elemento seleccionado cuando se refrescan los datos
    useEffect(() => {
        if (selectedRevision) {
            const updated = revisiones.data.find(
                (item) => item.identificador === selectedRevision.identificador,
            );
            if (updated) {
                setSelectedRevision(updated);
            }
        }
    }, [revisiones.data]);

    // Buscador con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                applyFilters(search, rolFilter, estadoFilter);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const applyFilters = (
        newSearch: string,
        newRol: string,
        newEstado: string,
    ) => {
        router.get(
            '/docente/revisiones',
            {
                search: newSearch || undefined,
                rol: newRol !== 'todos' ? newRol : undefined,
                estado: newEstado !== 'todos' ? newEstado : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleRolChange = (value: string) => {
        setRolFilter(value);
        applyFilters(search, value, estadoFilter);
    };

    const handleEstadoChange = (value: string) => {
        setEstadoFilter(value);
        applyFilters(search, rolFilter, value);
    };

    const handleResetFilters = () => {
        setSearch('');
        setRolFilter('todos');
        setEstadoFilter('todos');
        router.get(
            '/docente/revisiones',
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleSelectRow = (item: RevisionItem) => {
        setSelectedRevision(item);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
    };

    const renderFuncionBadge = (rolDocente: 'Asesor' | 'Revisor', etiqueta: string) => {
        if (rolDocente === 'Asesor') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 whitespace-nowrap">
                    <UserCheck className="size-3 shrink-0" />
                    {etiqueta}
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 whitespace-nowrap">
                <BookCheck className="size-3 shrink-0" />
                {etiqueta}
            </span>
        );
    };

    const renderEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'En revisión':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        En revisión
                    </span>
                );
            case 'Aprobado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-[#10B981]" />
                        Aprobado
                    </span>
                );
            case 'Con cambios':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-red-500" />
                        Con cambios
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                        Sin entregas
                    </span>
                );
        }
    };

    const hasActiveFilters =
        search !== '' || rolFilter !== 'todos' || estadoFilter !== 'todos';

    return (
        <>
            <Head title="Revisiones de Tesis" />

            <div className="flex flex-col gap-5 p-4 md:p-6">
                {/* ALERTAS FLASH */}
                {flash?.success && showAlert && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 text-foreground animate-in fade-in-50 duration-300 rounded-lg">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">
                                {flash.success}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAlert(false)}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {flash?.error && showAlert && (
                    <div className="alert alert-error alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#EF4444] bg-red-50 dark:bg-red-950/30 text-foreground animate-in fade-in-50 duration-300 rounded-lg">
                        <div className="flex items-center gap-2">
                            <XCircle className="size-4 text-[#EF4444] shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">
                                {flash.error}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAlert(false)}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* ENCABEZADO INSTITUCIONAL */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                            Docente / Revisiones de tesis
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                            REVISIONES
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Evaluación, aprobación y retroalimentación de versiones de tesis como Director de Tesis o Revisor.
                        </p>
                    </div>
                </div>

                {/* 4 TARJETAS DE METRICAS SUPERIORES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Total asignados */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Total asignados
                                </p>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {stats.total}
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <FileText className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* En revision */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    En revisión
                                </p>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {stats.en_revision}
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                <Clock className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aprobados */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Aprobados
                                </p>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {stats.aprobados}
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-[#10B981]">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Con cambios */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Con cambios
                                </p>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {stats.con_cambios}
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-red-500/15 text-red-500">
                                <FileEdit className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CONTENEDOR PRINCIPAL: TABLA UNIFICADA + PANEL LATERAL DERECHO */}
                <div className="flex flex-col lg:flex-row gap-0 border border-border rounded-xl bg-card shadow-xs overflow-hidden">
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* BARRA DE HERRAMIENTAS: BUSCADOR Y FILTROS */}
                        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por título, sustentante, matrícula o correo..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs bg-background border-border"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Filtro por Funcion del Docente */}
                                <Select
                                    value={rolFilter}
                                    onValueChange={handleRolChange}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs bg-background border-border">
                                        <SelectValue placeholder="Todas las funciones" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">
                                            Todas las funciones
                                        </SelectItem>
                                        <SelectItem value="Asesor">
                                            Director de Tesis
                                        </SelectItem>
                                        <SelectItem value="Revisor">
                                            Revisor
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Filtro por Estado */}
                                <Select
                                    value={estadoFilter}
                                    onValueChange={handleEstadoChange}
                                >
                                    <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs bg-background border-border">
                                        <SelectValue placeholder="Todos los estados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">
                                            Todos los estados
                                        </SelectItem>
                                        <SelectItem value="En revisión">
                                            En revisión
                                        </SelectItem>
                                        <SelectItem value="Aprobado">
                                            Aprobado
                                        </SelectItem>
                                        <SelectItem value="Con cambios">
                                            Con cambios
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

                        {/* TABLA DE REVISIONES (SIN COLUMNA DE ACCIONES: CLICK EN FILA ABRE PANEL) */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 pl-4">
                                            Título
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                            Sustentante
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 text-center">
                                            Matrícula
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 text-center">
                                            Mi función
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                            Versión / Envío
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 pr-4 text-center">
                                            Estado
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {revisiones.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-44 text-center text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="size-8 text-muted-foreground/50" />
                                                    <p className="text-sm font-medium">
                                                        No se encontraron proyectos para revisión
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {hasActiveFilters
                                                            ? 'Intenta ajustar o restablecer los filtros de búsqueda.'
                                                            : 'Aún no tienes asignaciones activas como Director de Tesis ni como Revisor.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        revisiones.data.map((item) => {
                                            const isSelected =
                                                drawerOpen &&
                                                selectedRevision?.identificador ===
                                                    item.identificador;

                                            return (
                                                <TableRow
                                                    key={item.identificador}
                                                    onClick={() => handleSelectRow(item)}
                                                    className={`cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? 'bg-[#B8D4E3]/25 dark:bg-[#B8D4E3]/10 hover:bg-[#B8D4E3]/30'
                                                            : 'hover:bg-muted/40'
                                                    }`}
                                                >
                                                    {/* TITULO */}
                                                    <TableCell className="py-3.5 pl-4 max-w-[260px]">
                                                        <p
                                                            className="text-xs font-semibold text-foreground truncate max-w-[250px]"
                                                            title={item.titulo}
                                                        >
                                                            {item.titulo}
                                                        </p>
                                                    </TableCell>

                                                    {/* SUSTENTANTE + CARRERA */}
                                                    <TableCell className="py-3.5 max-w-[210px]">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="size-8 rounded-full bg-[#B8D4E3]/45 dark:bg-[#B8D4E3]/20 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                                                                {item.sustentante.iniciales}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p
                                                                    className="text-xs font-bold text-foreground truncate max-w-[155px]"
                                                                    title={
                                                                        item.sustentante
                                                                            .nombre_completo
                                                                    }
                                                                >
                                                                    {
                                                                        item.sustentante
                                                                            .nombre_completo
                                                                    }
                                                                </p>
                                                                <p
                                                                    className="text-[11px] text-muted-foreground truncate max-w-[155px]"
                                                                    title={item.sustentante.carrera}
                                                                >
                                                                    {item.sustentante.carrera}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* MATRICULA */}
                                                    <TableCell className="py-3.5 text-center font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                                        {item.sustentante.matricula}
                                                    </TableCell>

                                                    {/* MI FUNCION */}
                                                    <TableCell className="py-3.5 text-center">
                                                        {renderFuncionBadge(
                                                            item.rol_docente,
                                                            item.rol_etiqueta,
                                                        )}
                                                    </TableCell>

                                                    {/* VERSION / ENVIO */}
                                                    <TableCell className="py-3.5 text-xs whitespace-nowrap">
                                                        {item.ultima_version ? (
                                                            <div>
                                                                <span className="font-semibold text-foreground block">
                                                                    {
                                                                        item.ultima_version
                                                                            .numero_version
                                                                    }
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    {
                                                                        item.ultima_version
                                                                            .fecha_envio_corta
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground italic text-[11px]">
                                                                Sin enviar
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* ESTADO */}
                                                    <TableCell className="py-3.5 pr-4 text-center">
                                                        {renderEstadoBadge(item.estado)}
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
                                    {revisiones.from || 0}
                                </span>{' '}
                                a{' '}
                                <span className="font-semibold text-foreground">
                                    {revisiones.to || 0}
                                </span>{' '}
                                de{' '}
                                <span className="font-semibold text-foreground">
                                    {revisiones.total}
                                </span>{' '}
                                registros
                            </p>

                            {revisiones.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    {revisiones.links.map((link, idx) => {
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

                    {/* PANEL LATERAL DERECHO DE REVISION */}
                    <DrawerRevision
                        open={drawerOpen}
                        onClose={handleCloseDrawer}
                        revision={selectedRevision}
                    />
                </div>
            </div>
        </>
    );
}

// Breadcrumbs para la barra superior
RevisionesDocenteIndex.layout = {
    breadcrumbs: [
        {
            title: 'Docente',
            href: '/docente/dashboard',
        },
        {
            title: 'Revisiones',
            href: '/docente/revisiones',
        },
    ],
};

