import { useState } from 'react';
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
    ArrowUpDown
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ExportImportModal } from './export-import-modal';

// --------------------------------------------------------------------------
// DEFINICIÓN DE TIPOS (TypeScript)
// --------------------------------------------------------------------------
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

    // Estados locales para la barra de búsqueda y filtros
    const [search, setSearch] = useState(filters.search || '');
    const [estado, setEstado] = useState(filters.estado || 'todos');
    const [duracion, setDuracion] = useState(filters.duracion || 'todos');
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);

    // Estados para controlar los modales
    const [openCreate, setOpenCreate] = useState(false);
    const [openExportImport, setOpenExportImport] = useState(false);

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

    /**
     * Manejo de selección múltiple con checkboxes
     */
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedRows(carreras.data.map((c) => c.id_carrera));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    return (
        <>
            <Head title="Gestión de Carreras" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-white min-h-screen">
                
                {/* Alerta de notificación flash de éxito (con colores de éxito del PDF: #10B981) */}
                {flash?.success && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 text-[#2D2D2D]">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                    </div>
                )}

                {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#000000]">
                            GESTIÓN DE CARRERAS
                        </h1>
                        <p className="text-sm text-[#2D2D2D] mt-1">
                            Administración de programas académicos de la Escuela de Tecnologías Digitales Aplicadas.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Botón Agregar: Fondo blanco, borde y texto en verde (#10B981) según PDF */}
                        <Button 
                            onClick={() => setOpenCreate(true)}
                            className="bg-white hover:bg-[#B8D4E3]/20 text-[#10B981] border-2 border-[#10B981] font-semibold shadow-xs gap-2"
                        >
                            <Plus className="size-4 text-[#10B981]" />
                            Agregar Carrera
                        </Button>

                        {/* Botón Exportar / Importar: Fondo blanco, borde gris (#D1D5DB) según PDF */}
                        <Button 
                            variant="outline" 
                            onClick={() => setOpenExportImport(true)} 
                            className="bg-white border-[#D1D5DB] text-[#2D2D2D] hover:bg-[#B8D4E3]/20 gap-2 font-medium"
                        >
                            <ArrowUpDown className="size-4 text-[#2D2D2D]" />
                            Exportar / Importar
                        </Button>
                    </div>
                </div>

                {/* CARDS DE MÉTRICAS (Colores del PDF: Fondo blanco, borde #D1D5DB, iconos en #B8D4E3/#2D2D2D/#10B981/#EF4444) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card: Total Carreras */}
                    <Card className="border-[#D1D5DB] shadow-xs rounded-xl bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-[#B8D4E3]/30 text-[#2D2D2D]">
                                    <School className="size-5 text-[#2D2D2D]" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-[#2D2D2D]/70">Total Carreras</p>
                                    <h3 className="text-2xl font-bold text-[#000000]">{stats.total}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Activas (Verde #10B981 del PDF) */}
                    <Card className="border-[#D1D5DB] shadow-xs rounded-xl bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                                    <CheckCircle2 className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-[#2D2D2D]/70">Activas</p>
                                    <h3 className="text-2xl font-bold text-[#000000]">{stats.activas}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Inactivas (Rojo #EF4444 del PDF) */}
                    <Card className="border-[#D1D5DB] shadow-xs rounded-xl bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-[#EF4444]/15 text-[#EF4444]">
                                    <XCircle className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-[#2D2D2D]/70">Inactivas</p>
                                    <h3 className="text-2xl font-bold text-[#000000]">{stats.inactivas}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Alumnos Vigentes */}
                    <Card className="border-[#D1D5DB] shadow-xs rounded-xl bg-white">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-[#B8D4E3]/30 text-[#2D2D2D]">
                                    <Users className="size-5 text-[#2D2D2D]" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-[#2D2D2D]/70">Alumnos Vigentes</p>
                                    <h3 className="text-2xl font-bold text-[#000000]">{stats.alumnos_vigentes}</h3>
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
                            <Input
                                type="text"
                                placeholder="Buscar por nombre, descripción o semestres..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilter(e.target.value, estado, duracion);
                                }}
                                className="pl-9 bg-white border-[#D1D5DB] rounded-xl text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#B8D4E3]"
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
                                <SelectTrigger className="w-full md:w-44 border-[#D1D5DB] rounded-xl bg-white text-sm text-[#2D2D2D]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-[#D1D5DB]">
                                    <SelectItem value="todos">Todos los estados</SelectItem>
                                    <SelectItem value="activa">Solo vigentes</SelectItem>
                                    <SelectItem value="inactiva">Solo inactivas</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Botón que despliega el panel de filtros avanzados */}
                            <Button 
                                variant="outline" 
                                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                                className={`border-[#D1D5DB] rounded-xl gap-2 font-medium ${
                                    showFiltersPanel ? 'bg-[#B8D4E3]/20 border-[#B8D4E3]' : 'bg-white text-[#2D2D2D]'
                                }`}
                            >
                                <Filter className="size-4 text-[#2D2D2D]" />
                                Filtros
                            </Button>

                            {/* Botón Resetear si hay filtros aplicados */}
                            {(search || estado !== 'todos' || duracion !== 'todos') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="text-xs text-[#2D2D2D]/70 hover:text-[#000000] gap-1"
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
                        <div className="p-4 bg-neutral-50/70 border border-[#D1D5DB] rounded-xl flex flex-wrap items-center gap-4 animate-in fade-in-50 duration-200">
                            <span className="text-xs font-semibold text-[#2D2D2D]">Filtrar por Duración:</span>
                            
                            <div className="flex items-center gap-2">
                                {['todos', '6', '8', '9'].map((sem) => (
                                    <button
                                        key={sem}
                                        type="button"
                                        onClick={() => {
                                            setDuracion(sem);
                                            handleFilter(search, estado, sem);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                            duracion === sem
                                                ? 'bg-[#B8D4E3] border-[#B8D4E3] text-[#2D2D2D] font-bold'
                                                : 'bg-white border-[#D1D5DB] text-[#2D2D2D] hover:bg-[#B8D4E3]/20'
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
                <div className="rounded-xl border border-[#D1D5DB] overflow-hidden bg-white shadow-xs">
                    <Table>
                        <TableHeader className="bg-neutral-50/70">
                            <TableRow className="border-b border-[#D1D5DB]">
                                <TableHead className="w-12 text-center">
                                    <Checkbox
                                        checked={
                                            carreras.data.length > 0 && selectedRows.length === carreras.data.length
                                        }
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="font-semibold text-[#2D2D2D] w-32">Clave</TableHead>
                                <TableHead className="text-centerfont-semibold text-[#2D2D2D] min-w-[180px] max-w-[200px]">Nombre de la Carrera</TableHead>
                                <TableHead className="font-semibold text-[#2D2D2D] min-w-[180px] max-w-[200px]">Descripción</TableHead>
                                <TableHead className="font-semibold text-[#2D2D2D] w-30 text-center">Semestres</TableHead>
                                <TableHead className="font-semibold text-[#2D2D2D] w-30 text-center">Alumnos</TableHead>
                                <TableHead className="font-semibold text-[#2D2D2D] w-28 text-center">Estado</TableHead>
                                <TableHead className="text-center font-semibold text-[#2D2D2D] w-45">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {carreras.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-[#9CA3AF]">
                                        No se encontraron carreras registradas con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                carreras.data.map((carrera) => (
                                    <TableRow 
                                        key={carrera.id_carrera} 
                                        className="border-b border-[#D1D5DB] hover:bg-[#B8D4E3]/20 transition-colors"
                                    >
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={selectedRows.includes(carrera.id_carrera)}
                                                onCheckedChange={() => handleSelectRow(carrera.id_carrera)}
                                            />
                                        </TableCell>

                                        {/* Clave formateada (CAR-00001) */}
                                        <TableCell className="font-bold text-[#000000]">
                                            {carrera.clave}
                                        </TableCell>

                                        {/* Nombre de la carrera con límite de desbordamiento */}
                                        <TableCell className="font-medium text-[#2D2D2D] max-w-[200px]">
                                            <span className="truncate block" title={carrera.nombre_carrera}>
                                                {carrera.nombre_carrera}
                                            </span>
                                        </TableCell>

                                        {/* Descripción con límite de texto */}
                                        <TableCell className="text-[#2D2D2D] max-w-[200px]">
                                            <span className="truncate block text-xs text-[#2D2D2D]/80" title={carrera.descripcion || ''}>
                                                {carrera.descripcion || 'Sin descripción registrada'}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-[#2D2D2D] text-center">
                                            {carrera.duracion_semestres}
                                        </TableCell>

                                        <TableCell className="text-[#2D2D2D] font-medium text-center">
                                            0
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {/* Insignia con color Éxito (#10B981) o Error (#EF4444) del PDF */}
                                            {carrera.estado ? (
                                                <span className="bg-green-100 text-black badge badge-success badge-soft font-semibold text-xs px-2.5 py-1">
                                                    Vigente
                                                </span>
                                            ) : (
                                                <span className="bg-red-500 text-white badge badge-error badge-soft font-semibold text-xs px-2.5 py-1">
                                                    Inactivo
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Botones de Acción con los colores exactos del PDF (Página 6) */}
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Ver: borde y texto en gris (#6B7280) */}
                                                <div className="tooltip tooltip-top" data-tip="Ver detalles">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleOpenShow(carrera)}
                                                        className="btn btn-xs bg-white border border-[#6B7280] text-[#6B7280] hover:bg-[#B8D4E3]/20 btn-square"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </button>
                                                </div>

                                                {/* Editar: borde y texto en azul primario (#B8D4E3) con texto #2D2D2D */}
                                                <div className="tooltip tooltip-top" data-tip="Editar carrera">
                                                    <button 
                                                    type="button"
                                                    onClick={() => handleOpenEdit(carrera)} // <-- Aquí abres el modal con esa carrera
                                                    className="btn btn-xs bg-white border border-[#FFDE21] text-[#2D2D2D] hover:bg-[#B8D4E3]/20 btn-square"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>

                                                </div>

                                                {/* Baja: borde y texto en rojo (#EF4444) */}
                                                <div 
                                                    className="tooltip tooltip-top" 
                                                    data-tip={carrera.estado ? 'Dar de baja' : 'Activar carrera'}
                                                >
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleToggleStatus(carrera.id_carrera, carrera.estado)}
                                                        className={`btn btn-xs bg-white border btn-square hover:bg-[#B8D4E3]/20 ${
                                                            carrera.estado 
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

                    {/* PAGINACIÓN INSTITUCIONAL ("Mostrando X de Y registros" y botones de navegación) */}
                    <div className="p-4 border-t border-[#D1D5DB] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#2D2D2D]">
                        <p className="text-xs text-[#2D2D2D]/80">
                            Mostrando <span className="font-semibold text-[#000000]">{carreras.from || 0}</span> a{' '}
                            <span className="font-semibold text-[#000000]">{carreras.to || 0}</span> de{' '}
                            <span className="font-semibold text-[#000000]">{carreras.total}</span> registros
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
                                            className={`btn btn-xs border border-[#D1D5DB] bg-white hover:bg-[#B8D4E3]/20 text-[#2D2D2D] gap-1 ${
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
                                            className={`btn btn-xs border border-[#D1D5DB] bg-white hover:bg-[#B8D4E3]/20 text-[#2D2D2D] gap-1 ${
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
                                                ? 'bg-[#B8D4E3] border-[#B8D4E3] text-[#2D2D2D] font-bold'
                                                : 'bg-white border-[#D1D5DB] text-[#2D2D2D] hover:bg-[#B8D4E3]/20'
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

            {/* Modal para Exportar / Importar Carreras (CSV y PDF) */}
            <ExportImportModal open={openExportImport} onOpenChange={setOpenExportImport} />
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
