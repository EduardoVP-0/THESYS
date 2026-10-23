import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    GraduationCap,
    UserX,
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
    ShieldAlert
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

// Modales del módulo de Alumnos
import { CreateModal } from './create-modal';
import { EditModal } from './edit-modal';
import { ShowModal } from './show-modal';
import { AlumnoData, AlumnoStats, CarreraItem, PaginatedAlumnos } from './types';

interface Props {
    alumnos: PaginatedAlumnos;
    stats: AlumnoStats;
    carreras: CarreraItem[];
    filters: {
        search?: string;
        carrera?: string;
        turno?: string;
        estado?: string;
    };
}

/**
 * VISTA PRINCIPAL: GESTIÓN DE ALUMNOS (SUSTENTANTES)
 * 
 * Implementa el listado completo, métricas clave, filtros avanzados reactivos,
 * paginación y la interacción con los modales de Registro, Edición, Consulta
 * y el Modal automático de Credenciales Generadas.
 */
export default function AlumnosIndex({ alumnos, stats, carreras, filters }: Props) {
    // Obtenemos los mensajes flash de sesión de Laravel
    const { flash } = usePage<{ 
        flash?: { 
            success?: string; 
            error?: string; 
        } 
    }>().props;

    // Estado local para controlar la alerta flash de éxito
    const [showAlert, setShowAlert] = useState(false);

    // Estados para modales
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openShow, setOpenShow] = useState(false);

    // Registros seleccionados para ver/editar
    const [alumnoToShow, setAlumnoToShow] = useState<AlumnoData | null>(null);
    const [alumnoToEdit, setAlumnoToEdit] = useState<AlumnoData | null>(null);

    // Filtros de búsqueda locales
    const [search, setSearch] = useState(filters.search || '');
    const [carreraFilter, setCarreraFilter] = useState(filters.carrera || 'todas');
    const [turnoFilter, setTurnoFilter] = useState(filters.turno || 'todos');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'todos');
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);

    /**
     * EFECTO: Alerta de éxito con temporizador de cierre (4 segundos)
     */
    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    /**
     * Aplica los filtros reactivos enviando petición GET con Inertia
     */
    const handleFilter = (
        newSearch = search,
        newCarrera = carreraFilter,
        newTurno = turnoFilter,
        newEstado = estadoFilter
    ) => {
        router.get(
            '/admin/alumnos',
            {
                search: newSearch,
                carrera: newCarrera,
                turno: newTurno,
                estado: newEstado,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    /**
     * Limpia los filtros y resetea la tabla
     */
    const handleResetFilters = () => {
        setSearch('');
        setCarreraFilter('todas');
        setTurnoFilter('todos');
        setEstadoFilter('todos');
        router.get('/admin/alumnos', {}, { preserveState: true, replace: true });
    };

    /**
     * Alterna el estado de acceso del usuario (Activo / Suspendido)
     */
    const handleToggleStatus = (id: number, estadoActual?: boolean) => {
        const accion = estadoActual ? 'suspender el acceso a' : 'activar el acceso de';
        if (confirm(`¿Estás seguro de que deseas ${accion} este alumno?`)) {
            router.patch(`/admin/alumnos/${id}/toggle-status`, {}, {
                preserveScroll: true,
            });
        }
    };

    /**
     * Asignación visual de badges para el estado académico
     */
    const getBadgeEstadoAcademico = (estado: string) => {
        switch (estado) {
            case 'Activo':
                return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
            case 'Egresado':
            case 'Titulado':
                return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
            case 'Baja temporal':
                return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300';
            case 'Baja definitiva':
                return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <>
            <Head title="Gestión de Alumnos" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">
                {/* ALERTA FLASH DE ÉXITO */}
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

                {/* ENCABEZADO Y BOTÓN DE REGISTRO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            GESTIÓN DE ALUMNOS
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Padrón institucional de alumnos sustentantes y credenciales de titulación.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setOpenCreate(true)}
                            className="bg-background hover:bg-accent/40 text-[#10B981] border-2 border-[#10B981] font-semibold shadow-xs gap-2"
                        >
                            <Plus className="size-4 text-[#10B981]" />
                            Agregar Alumno
                        </Button>
                    </div>
                </div>

                {/* CARDS DE MÉTRICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card: Total Alumnos */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-accent/30 text-foreground">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Alumnos</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Cuentas Activas */}
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

                    {/* Card: Egresados */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-blue-500/15 text-blue-500">
                                    <GraduationCap className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Egresados</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.egresados}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Bajas */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-[#EF4444]/15 text-[#EF4444]">
                                    <UserX className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Bajas Registradas</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.bajas}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* BUSCADOR Y FILTROS INTERACTIVOS */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                        {/* Buscador reactivo */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por nombre, matrícula, CURP o correo..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilter(e.target.value, carreraFilter, turnoFilter, estadoFilter);
                                }}
                                className="pl-9 bg-background border-border rounded-xl text-sm placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Controles de Filtros */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Filtro por Carrera */}
                            <Select
                                value={carreraFilter}
                                onValueChange={(val) => {
                                    setCarreraFilter(val);
                                    handleFilter(search, val, turnoFilter, estadoFilter);
                                }}
                            >
                                <SelectTrigger className="w-full md:w-56 border-border rounded-xl bg-background text-sm text-foreground">
                                    <SelectValue placeholder="Carrera" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="todas">Todas las carreras</SelectItem>
                                    {carreras.map((c) => (
                                        <SelectItem key={c.id_carrera} value={String(c.id_carrera)}>
                                            {c.nombre_carrera}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Botón Filtros Avanzados */}
                            <Button
                                variant="outline"
                                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                                className={`border-border rounded-xl gap-2 font-medium ${
                                    showFiltersPanel ? 'bg-accent/40 border-accent' : 'bg-background text-foreground'
                                }`}
                            >
                                <Filter className="size-4" />
                                Filtros
                            </Button>

                            {/* Botón Limpiar */}
                            {(search || carreraFilter !== 'todas' || turnoFilter !== 'todos' || estadoFilter !== 'todos') && (
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

                    {/* PANEL DE FILTROS AVANZADOS (Turno y Estado Académico) */}
                    {showFiltersPanel && (
                        <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-wrap items-center gap-6 animate-in fade-in-50 duration-200 text-xs">
                            {/* Por Turno */}
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">Turno:</span>
                                {['todos', 'Matutino', 'Vespertino', 'Mixto'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                            setTurnoFilter(t);
                                            handleFilter(search, carreraFilter, t, estadoFilter);
                                        }}
                                        className={`px-3 py-1 rounded-lg border transition-colors ${
                                            turnoFilter === t
                                                ? 'bg-accent border-accent text-foreground font-bold'
                                                : 'bg-background border-border text-foreground hover:bg-accent/40'
                                        }`}
                                    >
                                        {t === 'todos' ? 'Todos' : t}
                                    </button>
                                ))}
                            </div>

                            {/* Por Estado Académico */}
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">Estado Académico:</span>
                                {['todos', 'Activo', 'Egresado', 'Baja temporal', 'Baja definitiva'].map((est) => (
                                    <button
                                        key={est}
                                        type="button"
                                        onClick={() => {
                                            setEstadoFilter(est);
                                            handleFilter(search, carreraFilter, turnoFilter, est);
                                        }}
                                        className={`px-3 py-1 rounded-lg border transition-colors ${
                                            estadoFilter === est
                                                ? 'bg-accent border-accent text-foreground font-bold'
                                                : 'bg-background border-border text-foreground hover:bg-accent/40'
                                        }`}
                                    >
                                        {est === 'todos' ? 'Todos' : est}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* TABLA DE ALUMNOS */}
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-b border-border">
                                <TableHead className="font-semibold text-foreground min-w-[220px]">Alumno</TableHead>
                                <TableHead className="font-semibold text-foreground w-28 text-center">Matrícula</TableHead>
                                <TableHead className="font-semibold text-foreground min-w-[180px]">Carrera</TableHead>
                                <TableHead className="font-semibold text-foreground w-36 text-center">Turno / Generación</TableHead>
                                <TableHead className="font-semibold text-foreground w-32 text-center">Estado Académico</TableHead>
                                <TableHead className="font-semibold text-foreground w-28 text-center">Acceso</TableHead>
                                <TableHead className="text-center font-semibold text-foreground w-36">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {alumnos.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No se encontraron alumnos registrados con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                alumnos.data.map((alumno) => (
                                    <TableRow
                                        key={alumno.id_usuario}
                                        className="border-b border-border hover:bg-accent/20 transition-colors"
                                    >
                                        {/* Alumno (Avatar con iniciales + Nombre completo + Correo) */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-xs shrink-0 border border-[#10B981]/25">
                                                    {alumno.iniciales || 'AL'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground text-sm truncate" title={alumno.nombre_completo}>
                                                        {alumno.nombre_completo || `${alumno.nombre} ${alumno.apellido_p}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate" title={alumno.user?.email}>
                                                        {alumno.user?.email || 'Sin correo'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Matrícula */}
                                        <TableCell className="text-center font-mono font-semibold text-xs text-foreground">
                                            {alumno.matricula}
                                        </TableCell>

                                        {/* Carrera */}
                                        <TableCell className="max-w-[200px]">
                                            <span className="truncate block text-xs font-medium text-foreground" title={alumno.carrera?.nombre_carrera}>
                                                {alumno.carrera?.nombre_carrera || 'No asignada'}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                Turno: {alumno.turno}
                                            </span>
                                        </TableCell>

                                        {/* Turno y Generación */}
                                        <TableCell className="text-center text-xs">
                                            <span className="font-semibold text-foreground">{alumno.turno}</span>
                                            {alumno.generacion && (
                                                <span className="text-[11px] text-muted-foreground block">{alumno.generacion}</span>
                                            )}
                                        </TableCell>

                                        {/* Estado Académico */}
                                        <TableCell className="text-center">
                                            <span className={`badge badge-soft text-[11px] font-semibold px-2.5 py-1 rounded-full ${getBadgeEstadoAcademico(alumno.estado_academico)}`}>
                                                {alumno.estado_academico}
                                            </span>
                                        </TableCell>

                                        {/* Estado de Acceso a la Cuenta */}
                                        <TableCell className="text-center">
                                            {alumno.user?.estado ? (
                                                <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 badge badge-success badge-soft font-semibold text-[11px] px-2 py-0.5">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 badge badge-error badge-soft font-semibold text-[11px] px-2 py-0.5">
                                                    Suspendido
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Ver Detalles */}
                                                <div className="tooltip tooltip-top" data-tip="Ver expediente">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAlumnoToShow(alumno);
                                                            setOpenShow(true);
                                                        }}
                                                        className="btn btn-xs bg-background border border-muted-foreground/40 text-muted-foreground hover:bg-accent/40 btn-square"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </button>
                                                </div>

                                                {/* Editar */}
                                                <div className="tooltip tooltip-top" data-tip="Editar alumno">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAlumnoToEdit(alumno);
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
                                                    data-tip={alumno.user?.estado ? 'Suspender acceso' : 'Activar acceso'}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(alumno.id_usuario, alumno.user?.estado)}
                                                        className={`btn btn-xs bg-background border btn-square hover:bg-accent/40 ${
                                                            alumno.user?.estado
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

                    {/* PAGINACIÓN */}
                    <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-foreground">
                        <p className="text-xs text-muted-foreground">
                            Mostrando <span className="font-semibold text-foreground">{alumnos.from || 0}</span> a{' '}
                            <span className="font-semibold text-foreground">{alumnos.to || 0}</span> de{' '}
                            <span className="font-semibold text-foreground">{alumnos.total}</span> alumnos
                        </p>

                        <div className="flex items-center gap-1">
                            {alumnos.links.map((link, index) => {
                                const isPrevious = link.label.includes('Previous') || link.label.includes('pagination.previous');
                                const isNext = link.label.includes('Next') || link.label.includes('pagination.next');

                                if (isPrevious) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`btn btn-xs border border-border bg-card hover:bg-accent/40 text-foreground gap-1 ${
                                                !link.url ? 'btn-disabled opacity-40' : ''
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
                                            className={`btn btn-xs border border-border bg-card hover:bg-accent/40 text-foreground gap-1 ${
                                                !link.url ? 'btn-disabled opacity-40' : ''
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
                                        className={`btn btn-xs min-w-7 border ${
                                            link.active
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

            {/* MODALES DEL MÓDULO */}
            <CreateModal
                open={openCreate}
                onOpenChange={setOpenCreate}
                carreras={carreras}
            />

            <EditModal
                open={openEdit}
                onOpenChange={setOpenEdit}
                alumno={alumnoToEdit}
                carreras={carreras}
            />

            <ShowModal
                open={openShow}
                onOpenChange={setOpenShow}
                alumno={alumnoToShow}
            />
        </>
    );
}

// Breadcrumbs para la barra superior
AlumnosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Alumnos',
            href: '/admin/alumnos',
        },
    ],
};
