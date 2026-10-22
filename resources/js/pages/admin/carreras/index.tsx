import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    School,
    CheckCircle2,
    XCircle,
    Users,
    Search,
    Plus,
    Eye,
    Pencil,
    Power,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Download
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

import { CreateModal } from './create-modal';
import { EditModal } from './edit-modal'; 
import { ShowModal } from './show-modal';
import { ExportModal } from './export-modal';

// DEFINICIÓN DE TIPOS (TypeScript)
interface Carrera {
    id_carrera: number;
    clave: string; // Formateada con el Accessor del modelo (ej: CAR-00001)
    nombre_carrera: string;
    descripcion: string | null;
    duracion_semestres: number;
    estado: boolean;
}

interface Stats {
    total: number;
    activas: number;
    inactivas: number;
    alumnos_vigentes: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedCarreras {
    data: Carrera[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    carreras: PaginatedCarreras;
    stats: Stats;
    filters: {
        search?: string;
        estado?: string;
        duracion?: string;
    };
}

export default function CarrerasIndex({ carreras, stats, filters }: Props) {
    // Obtenemos los mensajes flash de sesión de Laravel
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    // Estado local para controlar la visibilidad de la alerta (auto-cierre)
    const [showAlert, setShowAlert] = useState(false);

    /**
     * useEffect que escucha cambios en flash.success.
     * Cada vez que Laravel envía un mensaje de éxito, se muestra la alerta
     * y se configura un setTimeout de 4 segundos para ocultarla automáticamente.
     * El return limpia el timeout si el componente se desmonta antes.
     */
    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    // Estados locales para la barra de búsqueda y filtros
    const [search, setSearch] = useState(filters.search || '');
    const [estado, setEstado] = useState(filters.estado || 'todos');
    const [duracion, setDuracion] = useState(filters.duracion || 'todos');
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);

    // Estados para controlar los modales
    const [openCreate, setOpenCreate] = useState(false);
    const [openExport, setOpenExport] = useState(false);

    /**
     * Aplica los filtros enviando una petición GET a través de Inertia
     */
    const handleFilter = (newSearch = search, newEstado = estado, newDuracion = duracion) => {
        router.get(
            '/admin/carreras',
            {
                search: newSearch,
                estado: newEstado,
                duracion: newDuracion
            },
            {
                preserveState: true,
                replace: true
            }
        );
    };

    // Estado para abrir/cerrar el modal de edición
    const [openEdit, setOpenEdit] = useState(false);

    // Estado para abrir/cerrar el modal de ver detalles
    const [openShow, setOpenShow] = useState(false);

    // Estado para guardar la carrera que se eligió ver
    const [carreraToShow, setCarreraToShow] = useState<Carrera | null>(null);

    // Función auxiliar cuando hagan clic en el botón del ojo
    const handleOpenShow = (carrera: Carrera) => {
        setCarreraToShow(carrera);
        setOpenShow(true);
    };

    // Estado para guardar la carrera que se eligió editar
    const [carreraToEdit, setCarreraToEdit] = useState<Carrera | null>(null);

    // Función auxiliar para cuando hagan clic en el botón de lápiz
    const handleOpenEdit = (carrera: Carrera) => {
        setCarreraToEdit(carrera);
        setOpenEdit(true);
    };

    /**
     * Limpia todos los filtros y resetea la tabla
     */
    const handleResetFilters = () => {
        setSearch('');
        setEstado('todos');
        setDuracion('todos');
        router.get('/admin/carreras', {}, { preserveState: true, replace: true });
    };

    /**
     * Alterna el estado (Activa / Inactiva - Baja lógica) de una carrera
     */
    const handleToggleStatus = (id: number, estadoActual: boolean) => {
        const accion = estadoActual ? 'dar de baja' : 'activar';
        if (confirm(`¿Estás seguro de que deseas ${accion} esta carrera?`)) {
            router.patch(`/admin/carreras/${id}/toggle-status`, {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Gestión de Carreras" />

            {/* 
              bg-background y text-foreground son variables CSS semánticas definidas en app.css
              que cambian automáticamente con el tema (claro/oscuro).
            */}
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">

                {/* Alerta de notificación flash de éxito con auto-cierre */}
                {flash?.success && showAlert && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 text-foreground animate-in fade-in-50 duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        {/* Botón para cerrar la alerta manualmente */}
                        <button onClick={() => setShowAlert(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
                    </div>
                )}

                {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            GESTIÓN DE CARRERAS
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Administración de programas académicos de la Escuela de Tecnologías Digitales Aplicadas.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Botón Agregar: Fondo blanco, borde y texto en verde (#10B981) */}
                        <Button
                            onClick={() => setOpenCreate(true)}
                            className="bg-background hover:bg-accent/40 text-[#10B981] border-2 border-[#10B981] font-semibold shadow-xs gap-2"
                        >
                            <Plus className="size-4 text-[#10B981]" />
                            Agregar Carrera
                        </Button>

                        {/* Botón Exportar */}
                        <Button
                            variant="outline"
                            onClick={() => setOpenExport(true)}
                            className="bg-background border-border text-foreground hover:bg-accent/40 gap-2 font-medium"
                        >
                            <Download className="size-4" />
                            Exportar
                        </Button>
                    </div>
                </div>

                {/* CARDS DE MÉTRICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card: Total Carreras */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-accent/30 text-foreground">
                                    <School className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Carreras</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Activas */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                                    <CheckCircle2 className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Activas</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.activas}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Inactivas */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-[#EF4444]/15 text-[#EF4444]">
                                    <XCircle className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Inactivas</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.inactivas}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Alumnos Vigentes */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-accent/30 text-foreground">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Alumnos Vigentes</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.alumnos_vigentes}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* BARRA DE BÚSQUEDA Y FILTROS INTERACTIVOS */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                        {/* Buscador reactivo */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por nombre, descripción o semestres..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilter(e.target.value, estado, duracion);
                                }}
                                className="pl-9 bg-background border-border rounded-xl text-sm placeholder:text-muted-foreground focus-visible:ring-ring"
                            />
                        </div>

                        {/* Controles y Selector de Estado */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Select
                                value={estado}
                                onValueChange={(val) => {
                                    setEstado(val);
                                    handleFilter(search, val, duracion);
                                }}
                            >
                                <SelectTrigger className="w-full md:w-44 border-border rounded-xl bg-background text-sm text-foreground">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="todos">Todos los estados</SelectItem>
                                    <SelectItem value="activa">Solo vigentes</SelectItem>
                                    <SelectItem value="inactiva">Solo inactivas</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Botón que despliega el panel de filtros avanzados */}
                            <Button
                                variant="outline"
                                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                                className={`border-border rounded-xl gap-2 font-medium ${showFiltersPanel ? 'bg-accent/40 border-accent' : 'bg-background text-foreground'
                                    }`}
                            >
                                <Filter className="size-4" />
                                Filtros
                            </Button>

                            {/* Botón Resetear si hay filtros aplicados */}
                            {(search || estado !== 'todos' || duracion !== 'todos') && (
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

                    {/* Panel desplegable de filtros avanzados (Duración y Semestres) */}
                    {showFiltersPanel && (
                        <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-wrap items-center gap-4 animate-in fade-in-50 duration-200">
                            <span className="text-xs font-semibold text-foreground">Filtrar por Duración:</span>

                            <div className="flex items-center gap-2">
                                {['todos', '6', '8', '9'].map((sem) => (
                                    <button
                                        key={sem}
                                        type="button"
                                        onClick={() => {
                                            setDuracion(sem);
                                            handleFilter(search, estado, sem);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${duracion === sem
                                                ? 'bg-accent border-accent text-foreground font-bold'
                                                : 'bg-background border-border text-foreground hover:bg-accent/40'
                                            }`}
                                    >
                                        {sem === 'todos' ? 'Todas' : `${sem} Semestres`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* TABLA DE CARRERAS (Con control estricto de desbordamiento horizontal) */}
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-b border-border">
                                <TableHead className="font-semibold text-foreground w-32">Clave</TableHead>
                                <TableHead className="text-center font-semibold text-foreground min-w-[180px] max-w-[200px]">Nombre de la Carrera</TableHead>
                                <TableHead className="font-semibold text-foreground min-w-[180px] max-w-[200px]">Descripción</TableHead>
                                <TableHead className="font-semibold text-foreground w-30 text-center">Semestres</TableHead>
                                <TableHead className="font-semibold text-foreground w-30 text-center">Alumnos</TableHead>
                                <TableHead className="font-semibold text-foreground w-28 text-center">Estado</TableHead>
                                <TableHead className="text-center font-semibold text-foreground w-45">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {carreras.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No se encontraron carreras registradas con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                carreras.data.map((carrera) => (
                                    <TableRow
                                        key={carrera.id_carrera}
                                        className="border-b border-border hover:bg-accent/20 transition-colors"
                                    >
                                        {/* Clave formateada (CAR-00001) */}
                                        <TableCell className="font-bold text-foreground">
                                            {carrera.clave}
                                        </TableCell>

                                        {/* Nombre de la carrera con límite de desbordamiento */}
                                        <TableCell className="font-medium text-foreground max-w-[200px]">
                                            <span className="truncate block" title={carrera.nombre_carrera}>
                                                {carrera.nombre_carrera}
                                            </span>
                                        </TableCell>

                                        {/* Descripción con límite de texto */}
                                        <TableCell className="text-muted-foreground max-w-[200px]">
                                            <span className="truncate block text-xs" title={carrera.descripcion || ''}>
                                                {carrera.descripcion || 'Sin descripción registrada'}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-foreground text-center">
                                            {carrera.duracion_semestres}
                                        </TableCell>

                                        <TableCell className="text-foreground font-medium text-center">
                                            0
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {/* Insignia con color Éxito (#10B981) o Error (#EF4444) */}
                                            {carrera.estado ? (
                                                <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 badge badge-success badge-soft font-semibold text-xs px-2.5 py-1">
                                                    Vigente
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 badge badge-error badge-soft font-semibold text-xs px-2.5 py-1">
                                                    Inactivo
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Botones de Acción */}
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Ver: borde y texto en gris */}
                                                <div className="tooltip tooltip-top" data-tip="Ver detalles">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenShow(carrera)}
                                                        className="btn btn-xs bg-background border border-muted-foreground/40 text-muted-foreground hover:bg-accent/40 btn-square"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </button>
                                                </div>

                                                {/* Editar: borde y texto en amarillo */}
                                                <div className="tooltip tooltip-top" data-tip="Editar carrera">
                                                    <button 
                                                    type="button"
                                                    onClick={() => handleOpenEdit(carrera)}
                                                    className="btn btn-xs bg-background border border-[#FFDE21] text-foreground hover:bg-accent/40 btn-square"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>

                                                </div>

                                                {/* Baja: borde y texto en rojo o verde */}
                                                <div
                                                    className="tooltip tooltip-top"
                                                    data-tip={carrera.estado ? 'Dar de baja' : 'Activar carrera'}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(carrera.id_carrera, carrera.estado)}
                                                        className={`btn btn-xs bg-background border btn-square hover:bg-accent/40 ${carrera.estado
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

                    {/* PAGINACIÓN ("Mostrando X de Y registros" y botones de navegación) */}
                    <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-foreground">
                        <p className="text-xs text-muted-foreground">
                            Mostrando <span className="font-semibold text-foreground">{carreras.from || 0}</span> a{' '}
                            <span className="font-semibold text-foreground">{carreras.to || 0}</span> de{' '}
                            <span className="font-semibold text-foreground">{carreras.total}</span> registros
                        </p>

                        <div className="flex items-center gap-1">
                            {carreras.links.map((link, index) => {
                                // Sanitizamos etiquetas que vienen con HTML como &laquo; y &raquo;
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

            {/* Modal para Registrar Carrera */}
            <CreateModal open={openCreate} onOpenChange={setOpenCreate} />
            {/* Modal para Editar Carrera */}
            <EditModal 
                open={openEdit} 
                onOpenChange={setOpenEdit} 
                carrera={carreraToEdit} 
            />

            <ShowModal
                open={openShow}
                onOpenChange={setOpenShow}
                carrera={carreraToShow}
            />

            {/* Modal para Exportar Carreras (CSV, PDF, Word) */}
            <ExportModal open={openExport} onOpenChange={setOpenExport} />
        </>
    );
}

// Breadcrumbs para la barra superior
CarrerasIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Carreras',
            href: '/admin/carreras',
        },
    ],
};
