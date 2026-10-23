import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    Award,
    Briefcase,
    Search,
    Plus,
    Eye,
    Pencil,
    Power,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Tipos y modales del modulo
import { DocenteData, DocenteFilters, DocenteStats, PaginatedDocentes } from './types';
import { CreateModal } from './create-modal';
import { EditModal } from './edit-modal';
import { ShowModal } from './show-modal';

interface Props {
    docentes: PaginatedDocentes;
    stats: DocenteStats;
    filters: DocenteFilters;
}

/**
 * VISTA PRINCIPAL: GESTION DE DOCENTES
 */
export default function DocentesIndex({ docentes, stats, filters }: Props) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);

    // Modales
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openShow, setOpenShow] = useState(false);

    // Seleccion
    const [docenteToShow, setDocenteToShow] = useState<DocenteData | null>(null);
    const [docenteToEdit, setDocenteToEdit] = useState<DocenteData | null>(null);

    // Filtros locales
    const [search, setSearch] = useState(filters.search || '');
    const [gradoFilter, setGradoFilter] = useState(filters.grado || 'todos');
    const [contratoFilter, setContratoFilter] = useState(filters.contrato || 'todos');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'todos');
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const handleFilter = (
        newSearch = search,
        newGrado = gradoFilter,
        newContrato = contratoFilter,
        newEstado = estadoFilter
    ) => {
        router.get(
            '/admin/docentes',
            {
                search: newSearch,
                grado: newGrado,
                contrato: newContrato,
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
        setGradoFilter('todos');
        setContratoFilter('todos');
        setEstadoFilter('todos');
        router.get('/admin/docentes', {}, { preserveState: true, replace: true });
    };

    const handleToggleStatus = (id: number, estadoActual?: boolean) => {
        const accion = estadoActual ? 'suspender el acceso al' : 'activar el acceso del';
        if (confirm(`¿Estás seguro de que deseas ${accion} docente?`)) {
            router.patch(`/admin/docentes/${id}/toggle-status`, {}, {
                preserveScroll: true,
            });
        }
    };

    const getBadgeGrado = (grado: string) => {
        switch (grado) {
            case 'Doctorado':
                return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300';
            case 'Maestría':
                return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
            case 'Especialidad':
                return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300';
        }
    };

    return (
        <>
            <Head title="Gestión de Docentes" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">
                {/* ALERTA FLASH */}
                {flash?.success && showAlert && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 text-foreground animate-in fade-in-50 duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        <button
                            onClick={() => setShowAlert(false)}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* ENCABEZADO Y ACCIONES */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            GESTIÓN DE DOCENTES
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Registro institucional del cuerpo académico, grados y credenciales de acceso.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setOpenCreate(true)}
                            className="bg-background hover:bg-accent/40 text-[#10B981] border-2 border-[#10B981] font-semibold shadow-xs gap-2"
                        >
                            <Plus className="size-4 text-[#10B981]" />
                            Agregar Docente
                        </Button>
                    </div>
                </div>

                {/* CARDS DE METRICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Docentes */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-accent/30 text-foreground">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Docentes</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activos */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                                    <UserCheck className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Cuentas Activas</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.activos}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Con Posgrado */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                                    <Award className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Con Posgrado</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.posgrado}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tiempo Completo */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                    <Briefcase className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Tiempo Completo</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.tiempo_completo}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* BUSCADOR Y FILTROS */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                        {/* Buscador reactivo */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por nombre, cédula, CURP, especialidad o correo..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilter(e.target.value, gradoFilter, contratoFilter, estadoFilter);
                                }}
                                className="pl-9 bg-background border-border rounded-xl text-sm placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Controles de Filtros */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Filtro por Grado */}
                            <Select
                                value={gradoFilter}
                                onValueChange={(val) => {
                                    setGradoFilter(val);
                                    handleFilter(search, val, contratoFilter, estadoFilter);
                                }}
                            >
                                <SelectTrigger className="w-full md:w-48 border-border rounded-xl bg-background text-sm text-foreground">
                                    <SelectValue placeholder="Grado académico" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="todos">Todos los grados</SelectItem>
                                    <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                                    <SelectItem value="Maestría">Maestría</SelectItem>
                                    <SelectItem value="Doctorado">Doctorado</SelectItem>
                                    <SelectItem value="Especialidad">Especialidad</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Botón Filtros Avanzados */}
                            <Button
                                variant="outline"
                                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                                className={`border-border rounded-xl gap-2 font-medium ${showFiltersPanel ? 'bg-accent/40 border-accent' : 'bg-background text-foreground'
                                    }`}
                            >
                                <Filter className="size-4" />
                                Filtros
                            </Button>

                            {/* Boton Limpiar */}
                            {(search || gradoFilter !== 'todos' || contratoFilter !== 'todos' || estadoFilter !== 'todos') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="text-xs text-muted-foreground hover:text-foreground gap-1"
                                    title="Restablecer filtros"
                                >
                                    <RotateCcw className="size-3" />
                                    Limpiar
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* PANEL DE FILTROS AVANZADOS (Contrato y Estado) */}
                    {showFiltersPanel && (
                        <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-wrap items-center gap-6 animate-in fade-in-50 duration-200 text-xs">
                            {/* Por Contrato */}
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">Contrato:</span>
                                {['todos', 'Tiempo completo', 'Medio tiempo', 'Por horas', 'Interino'].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setContratoFilter(c);
                                            handleFilter(search, gradoFilter, c, estadoFilter);
                                        }}
                                        className={`px-3 py-1 rounded-lg border transition-colors ${contratoFilter === c
                                                ? 'bg-accent border-accent text-foreground font-bold'
                                                : 'bg-background border-border text-foreground hover:bg-accent/40'
                                            }`}
                                    >
                                        {c === 'todos' ? 'Todos' : c}
                                    </button>
                                ))}
                            </div>

                            {/* Por Estado de Cuenta */}
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">Estado de Cuenta:</span>
                                {[
                                    { label: 'Todos', value: 'todos' },
                                    { label: 'Activo', value: 'activo' },
                                    { label: 'Suspendido', value: 'suspendido' },
                                ].map((est) => (
                                    <button
                                        key={est.value}
                                        type="button"
                                        onClick={() => {
                                            setEstadoFilter(est.value);
                                            handleFilter(search, gradoFilter, contratoFilter, est.value);
                                        }}
                                        className={`px-3 py-1 rounded-lg border transition-colors ${estadoFilter === est.value
                                                ? 'bg-accent border-accent text-foreground font-bold'
                                                : 'bg-background border-border text-foreground hover:bg-accent/40'
                                            }`}
                                    >
                                        {est.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* TABLA DE DOCENTES */}
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
                    <Table className="table-fixed min-w-[900px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-b border-border">
                                <TableHead className="font-semibold text-foreground w-[24%]">Docente</TableHead>
                                <TableHead className="font-semibold text-foreground w-[10%] text-center">Cédula</TableHead>
                                <TableHead className="font-semibold text-foreground w-[19%]">Especialidad</TableHead>
                                <TableHead className="font-semibold text-foreground w-[11%] text-center">Grado</TableHead>
                                <TableHead className="font-semibold text-foreground w-[12%] text-center">Contrato</TableHead>
                                <TableHead className="font-semibold text-foreground w-[11%] text-center">Acceso</TableHead>
                                <TableHead className="text-center font-semibold text-foreground w-[13%]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {docentes.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No se encontraron docentes registrados con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                docentes.data.map((docente) => (
                                    <TableRow
                                        key={docente.id_usuario}
                                        className="border-b border-border hover:bg-accent/20 transition-colors"
                                    >
                                        {/* Docente */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-xs shrink-0 border border-[#10B981]/25">
                                                    {docente.iniciales || 'DC'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground text-sm truncate" title={docente.nombre_completo}>
                                                        {docente.nombre_completo || `${docente.nombre} ${docente.apellido_p}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate" title={docente.user?.email}>
                                                        {docente.user?.email || 'Sin correo'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Cedula */}
                                        <TableCell className="text-center font-mono font-semibold text-xs text-foreground">
                                            {docente.cedula_profesional}
                                        </TableCell>

                                        {/* Especialidad */}
                                        <TableCell className="max-w-[200px]">
                                            <span className="truncate block text-xs font-medium text-foreground" title={docente.especialidad}>
                                                {docente.especialidad}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground font-mono">
                                                CURP: {docente.curp}
                                            </span>
                                        </TableCell>

                                        {/* Grado Academico */}
                                        <TableCell className="text-center">
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getBadgeGrado(docente.grado_academico)}`}>
                                                {docente.grado_academico}
                                            </span>
                                        </TableCell>

                                        {/* Tipo de Contrato */}
                                        <TableCell className="text-center text-xs text-muted-foreground">
                                            <span className="px-2 py-0.5 rounded bg-muted/60 font-medium">
                                                {docente.tipo_contrato}
                                            </span>
                                        </TableCell>

                                        {/* Acceso */}
                                        <TableCell className="text-center">
                                            {docente.user?.estado ? (
                                                <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 font-semibold text-[11px] px-2 py-0.5 rounded">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-semibold text-[11px] px-2 py-0.5 rounded">
                                                    Suspendido
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Ver Expediente */}
                                                <div className="tooltip tooltip-top" data-tip="Ver expediente">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDocenteToShow(docente);
                                                            setOpenShow(true);
                                                        }}
                                                        className="btn btn-xs bg-background border border-muted-foreground/40 text-muted-foreground hover:bg-accent/40 btn-square"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </button>
                                                </div>

                                                {/* Editar */}
                                                <div className="tooltip tooltip-top" data-tip="Editar docente">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDocenteToEdit(docente);
                                                            setOpenEdit(true);
                                                        }}
                                                        className="btn btn-xs bg-background border border-[#FFDE21] text-foreground hover:bg-accent/40 btn-square"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </button>
                                                </div>

                                                {/* Alternar Acceso */}
                                                <div
                                                    className="tooltip tooltip-top"
                                                    data-tip={docente.user?.estado ? 'Suspender acceso' : 'Activar acceso'}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(docente.id_usuario, docente.user?.estado)}
                                                        className={`btn btn-xs bg-background border btn-square hover:bg-accent/40 ${docente.user?.estado
                                                                ? 'border-[#EF4444] text-[#EF4444]'
                                                                : 'border-[#10B981] text-[#10B981]'
                                                            }`}
                                                    >
                                                        <Power className="size-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* PAGINACION */}
                    <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-foreground">
                        <p className="text-xs text-muted-foreground">
                            Mostrando <span className="font-semibold text-foreground">{docentes.from || 0}</span> a{' '}
                            <span className="font-semibold text-foreground">{docentes.to || 0}</span> de{' '}
                            <span className="font-semibold text-foreground">{docentes.total}</span> docentes
                        </p>

                        <div className="flex items-center gap-1">
                            {docentes.links.map((link, index) => {
                                const isPrevious = link.label.includes('Previous') || link.label.includes('pagination.previous');
                                const isNext = link.label.includes('Next') || link.label.includes('pagination.next');

                                if (isPrevious) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`btn btn-xs border border-border bg-card hover:bg-accent/40 text-foreground gap-1 ${!link.url ? 'btn-disabled opacity-40' : ''
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
                                            className={`btn btn-xs border border-border bg-card hover:bg-accent/40 text-foreground gap-1 ${!link.url ? 'btn-disabled opacity-40' : ''
                                                }`}
                                            preserveScroll
                                        >
                                            Siguiente
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    );
                                }

                                return (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`btn btn-xs min-w-7 border ${link.active
                                                ? 'bg-accent border-accent text-foreground font-bold'
                                                : 'bg-card border-border text-foreground hover:bg-accent/40'
                                            } ${!link.url ? 'btn-disabled opacity-40' : ''}`}
                                        preserveScroll
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALES DEL MODULO */}
            <CreateModal
                open={openCreate}
                onOpenChange={setOpenCreate}
            />

            <EditModal
                open={openEdit}
                onOpenChange={setOpenEdit}
                docente={docenteToEdit}
            />

            <ShowModal
                open={openShow}
                onOpenChange={setOpenShow}
                docente={docenteToShow}
            />
        </>
    );
}

// Breadcrumbs para la barra superior
DocentesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Docentes',
            href: '/admin/docentes',
        },
    ],
};
