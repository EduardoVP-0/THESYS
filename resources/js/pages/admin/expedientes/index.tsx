import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    FolderClosed,
    FolderOpen,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    ExternalLink,
    Files,
    FileCheck,
    XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    CarreraItem,
    ExpedientesPagination,
    ExpedienteStats,
    ExpedienteFilters,
} from './types';

interface Props {
    expedientes: ExpedientesPagination;
    carreras: CarreraItem[];
    stats: ExpedienteStats;
    filters: ExpedienteFilters;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ExpedientesIndex({
    expedientes,
    carreras,
    stats,
    filters,
    flash,
}: Props) {
    const [showAlert, setShowAlert] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [carrera, setCarrera] = useState(filters.carrera || 'todas');
    const [estado, setEstado] = useState(filters.estado || 'todos');
    const [perPage, setPerPage] = useState(String(filters.per_page || 5));

    // Flash alert auto-dismiss
    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    const applyFilters = (
        newSearch = search,
        newCarrera = carrera,
        newEstado = estado,
        newPerPage = perPage
    ) => {
        router.get(
            '/admin/expedientes',
            {
                search: newSearch,
                carrera: newCarrera,
                estado: newEstado,
                per_page: newPerPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(search, carrera, estado, perPage);
    };

    const handleClearFilters = () => {
        setSearch('');
        setCarrera('todas');
        setEstado('todos');
        setPerPage('5');
        router.get(
            '/admin/expedientes',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const getEstadoBadge = (estadoProyecto?: string) => {
        switch (estadoProyecto) {
            case 'Aprobado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="size-3" />
                        Aprobado
                    </span>
                );
            case 'En revisión':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                        <Clock className="size-3" />
                        En revisión
                    </span>
                );
            case 'Con cambios':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <AlertCircle className="size-3" />
                        Con cambios
                    </span>
                );
            case 'Borrador':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                        Borrador
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted/60 text-muted-foreground border border-border/50">
                        Sin anteproyecto
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Expedientes Digitales" />

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

                {/* ENCABEZADO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            EXPEDIENTES DIGITALES
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Consulta y seguimiento documental de titulación por cada sustentante.
                        </p>
                    </div>
                </div>

                {/* 4 FICHAS DE METRICAS SUPERIORES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {/* Total expedientes */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Expedientes Totales</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Sustentantes registrados</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <FolderClosed className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Con Proyecto */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Con Anteproyecto</p>
                                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                    {stats.con_proyecto}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Propuestas iniciadas</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <FileText className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* En Revision */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">En Revisión</p>
                                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                    {stats.en_revision}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">En proceso evaluativo por administración</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aprobados */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Aprobados</p>
                                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {stats.aprobados}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Documentos aprobados por administración</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <FileCheck className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* TABLA PRINCIPAL: REPOSITORIO DE EXPEDIENTES */}
                <Card className="border-border shadow-xs rounded-xl bg-card">
                    {/* Barra de Controles: Buscador y Filtros */}
                    <div className="p-4 sm:p-5 border-b border-border space-y-3.5">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            {/* Buscador */}
                            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por sustentante, matrícula, tema de tesis..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 bg-background border-border text-xs sm:text-sm h-10 w-full"
                                />
                            </form>

                            {/* Filtros */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Filtro Carrera */}
                                <div className="flex items-center gap-1.5">
                                    <GraduationCap className="size-4 text-muted-foreground hidden sm:inline" />
                                    <select
                                        value={carrera}
                                        onChange={(e) => {
                                            setCarrera(e.target.value);
                                            applyFilters(search, e.target.value, estado, perPage);
                                        }}
                                        className="bg-background border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[200px] truncate"
                                    >
                                        <option value="todas">Todas las carreras</option>
                                        {carreras.map((c) => (
                                            <option key={c.id_carrera} value={String(c.id_carrera)}>
                                                {c.nombre_carrera}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro Estado */}
                                <div className="flex items-center gap-1.5">
                                    <Filter className="size-4 text-muted-foreground hidden sm:inline" />
                                    <select
                                        value={estado}
                                        onChange={(e) => {
                                            setEstado(e.target.value);
                                            applyFilters(search, carrera, e.target.value, perPage);
                                        }}
                                        className="bg-background border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        <option value="todos">Todos los estados</option>
                                        <option value="Aprobado">Aprobado</option>
                                        <option value="En revisión">En revisión</option>
                                        <option value="Con cambios">Con cambios</option>
                                        <option value="Borrador">Borrador</option>
                                        <option value="sin_anteproyecto">Sin anteproyecto</option>
                                    </select>
                                </div>

                                {(search || carrera !== 'todas' || estado !== 'todos') && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <RotateCcw className="size-3.5 mr-1" />
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                        Sustentante
                                    </TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                        Carrera
                                    </TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                        Tema de Tesis
                                    </TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3">
                                        Expediente Documental
                                    </TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 text-right">
                                        Expediente
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expedientes.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="p-3 rounded-full bg-muted text-muted-foreground">
                                                    <FolderClosed className="size-8" />
                                                </div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    No se encontraron expedientes
                                                </p>
                                                <p className="text-xs text-muted-foreground max-w-sm">
                                                    Intenta ajustar los términos de búsqueda o los filtros seleccionados.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleClearFilters}
                                                    className="mt-2 text-xs"
                                                >
                                                    Restablecer filtros
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    expedientes.data.map((item) => (
                                        <TableRow
                                            key={item.id_usuario}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            {/* SUSTENTANTE */}
                                            <TableCell className="py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {item.iniciales}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/admin/expedientes/${item.id_usuario}`}
                                                            className="text-xs sm:text-sm font-bold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate block"
                                                        >
                                                            {item.nombre_completo}
                                                        </Link>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Matrícula: {item.matricula}
                                                            {item.email ? ` • ${item.email}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* CARRERA */}
                                            <TableCell className="py-3.5">
                                                <span className="text-xs font-medium text-foreground block max-w-[170px] truncate" title={item.carrera}>
                                                    {item.carrera}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {item.estado_academico}
                                                </span>
                                            </TableCell>

                                            {/* TEMA DE TESIS Y ESTADO */}
                                            <TableCell className="py-3.5">
                                                {item.proyecto ? (
                                                    <div className="space-y-1 max-w-[240px]">
                                                        <p className="text-xs font-semibold text-foreground truncate" title={item.proyecto.titulo}>
                                                            {item.proyecto.titulo}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {getEstadoBadge(item.proyecto.estado)}
                                                            {item.proyecto.asesor && (
                                                                <span className="text-[10px] text-muted-foreground truncate" title={`Asesor: ${item.proyecto.asesor.nombre_completo}`}>
                                                                    • {item.proyecto.asesor.nombre_completo}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Sin propuesta registrada
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* EXPEDIENTE DOCUMENTAL */}
                                            <TableCell className="py-3.5">
                                                <div className="space-y-1">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-semibold text-foreground">
                                                        <Files className="size-3.5 text-muted-foreground" />
                                                        {item.total_documentos} archivo(s)
                                                    </span>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {item.proyecto?.versiones_count || 0} vers. • {item.total_oficios} oficio(s)
                                                    </p>
                                                </div>
                                            </TableCell>

                                            {/* ACCION: VER EXPEDIENTE DIGITAL */}
                                            <TableCell className="py-3.5 text-right">
                                                <Link
                                                    href={`/admin/expedientes/${item.id_usuario}`}
                                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-600/50 cursor-pointer transition-all shadow-xs"
                                                >
                                                    <FolderClosed className="size-3.5" />
                                                    Expediente
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* BARRA DE PAGINACION */}
                    <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span>
                                Mostrando {expedientes.from || 0} a {expedientes.to || 0} de {expedientes.total} expedientes
                            </span>
                            <span className="hidden sm:inline">&bull;</span>
                            <div className="hidden sm:flex items-center gap-1.5">
                                <span>Mostrar:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(e.target.value);
                                        applyFilters(search, carrera, estado, e.target.value);
                                    }}
                                    className="bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground cursor-pointer"
                                >
                                    <option value="5">5 por pág.</option>
                                    <option value="10">10 por pág.</option>
                                    <option value="15">15 por pág.</option>
                                    <option value="20">20 por pág.</option>
                                </select>
                            </div>
                        </div>

                        {/* Botones de navegacion */}
                        <div className="flex items-center gap-1">
                            {expedientes.links.map((link, idx) => {
                                if (link.label.includes('Previous') || link.label.includes('Anterior')) {
                                    return (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                            className="h-8 px-2 text-xs cursor-pointer"
                                        >
                                            <ChevronLeft className="size-3.5" />
                                        </Button>
                                    );
                                }

                                if (link.label.includes('Next') || link.label.includes('Siguiente')) {
                                    return (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                            className="h-8 px-2 text-xs cursor-pointer"
                                        >
                                            <ChevronRight className="size-3.5" />
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                        className={`h-8 w-8 p-0 text-xs cursor-pointer ${
                                            link.active ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                                        }`}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

// Breadcrumbs para el layout
ExpedientesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Expedientes',
            href: '/admin/expedientes',
        },
    ],
};
