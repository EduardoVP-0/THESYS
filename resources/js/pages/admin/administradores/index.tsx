import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    ShieldCheck,
    Building2,
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
import {
    AdministradorData,
    AdministradorFilters,
    AdministradorStats,
    PaginatedAdministradores,
    RolData,
    ROLES_ADMIN,
} from './types';
import { CreateModal } from './create-modal';
import { EditModal } from './edit-modal';
import { ShowModal } from './show-modal';

interface Props {
    administradores: PaginatedAdministradores;
    stats: AdministradorStats;
    filters: AdministradorFilters;
    roles: RolData[];
}

/**
 * VISTA PRINCIPAL: GESTION DE ADMINISTRADORES
 */
export default function AdministradoresIndex({ administradores, stats, filters, roles }: Props) {
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
    const [adminToShow, setAdminToShow] = useState<AdministradorData | null>(null);
    const [adminToEdit, setAdminToEdit] = useState<AdministradorData | null>(null);

    // Filtros locales
    const [search, setSearch] = useState(filters.search || '');
    const [rolFilter, setRolFilter] = useState(filters.rol || 'todos');
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
        newRol = rolFilter,
        newEstado = estadoFilter
    ) => {
        router.get(
            '/admin/administradores',
            {
                search: newSearch,
                rol: newRol,
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
        setRolFilter('todos');
        setEstadoFilter('todos');
        router.get('/admin/administradores', {}, { preserveState: true, replace: true });
    };

    const handleToggleStatus = (id: number, estadoActual?: boolean) => {
        const accion = estadoActual ? 'suspender el acceso al' : 'activar el acceso del';
        if (confirm(`¿Estás seguro de que deseas ${accion} administrador?`)) {
            router.patch(`/admin/administradores/${id}/toggle-status`, {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Gestión de Administradores" />

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
                            GESTIÓN DE ADMINISTRADORES
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Control de acceso del personal administrativo, roles y credenciales del sistema.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setOpenCreate(true)}
                            className="bg-background hover:bg-accent/40 text-[#10B981] border-2 border-[#10B981] font-semibold shadow-xs gap-2"
                        >
                            <Plus className="size-4 text-[#10B981]" />
                            Agregar Administrador
                        </Button>
                    </div>
                </div>

                {/* CARDS DE METRICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Administradores */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-accent/30 text-foreground">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Administradores</p>
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

                    {/* Superadmins */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Superadmins</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.superadmins}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coordinación */}
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    <Building2 className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Coordinación</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.coordinacion}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* BUSCADOR Y FILTROS */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                        {/* Buscador reactivo */}
                        <div className="relative w-full md:w-[480px] lg:w-[540px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por nombre, área o correo institucional..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilter(e.target.value, rolFilter, estadoFilter);
                                }}
                                className="pl-9 bg-background border-border rounded-xl text-sm placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Controles de Filtros */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Filtro por Rol */}
                            <Select
                                value={rolFilter}
                                onValueChange={(val) => {
                                    setRolFilter(val);
                                    handleFilter(search, val, estadoFilter);
                                }}
                            >
                                <SelectTrigger className="w-full md:w-48 border-border rounded-xl bg-background text-sm text-foreground">
                                    <SelectValue placeholder="Rol administrativo" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="todos">Todos los roles</SelectItem>
                                    {roles.map((rol) => (
                                        <SelectItem key={rol.id_rol} value={String(rol.id_rol)}>
                                            {rol.nombre_rol}
                                        </SelectItem>
                                    ))}
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
                            {(search || rolFilter !== 'todos' || estadoFilter !== 'todos') && (
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

                    {/* PANEL DE FILTROS AVANZADOS (Estado de cuenta) */}
                    {showFiltersPanel && (
                        <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-wrap items-center gap-6 animate-in fade-in-50 duration-200 text-xs">
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
                                            handleFilter(search, rolFilter, est.value);
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

                {/* TABLA DE ADMINISTRADORES */}
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
                    <Table className="table-fixed min-w-[860px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-b border-border">
                                <TableHead className="font-semibold text-foreground w-[28%]">Administrador</TableHead>
                                <TableHead className="font-semibold text-foreground w-[22%]">Área</TableHead>
                                <TableHead className="font-semibold text-foreground w-[14%] text-center">Rol</TableHead>
                                <TableHead className="font-semibold text-foreground w-[13%] text-center">Teléfono</TableHead>
                                <TableHead className="font-semibold text-foreground w-[11%] text-center">Acceso</TableHead>
                                <TableHead className="text-center font-semibold text-foreground w-[12%]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {administradores.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No se encontraron administradores registrados con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                administradores.data.map((admin) => {
                                    const idRol = admin.user?.id_rol ?? 2;
                                    const rolInfo = ROLES_ADMIN[idRol] ?? { label: 'Admin', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };

                                    return (
                                        <TableRow
                                            key={admin.id_usuario}
                                            className="border-b border-border hover:bg-accent/20 transition-colors"
                                        >
                                            {/* Administrador */}
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-xs shrink-0 border border-[#10B981]/25">
                                                        {admin.iniciales || 'AD'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-foreground text-sm truncate" title={admin.nombre_completo}>
                                                            {admin.nombre_completo || `${admin.nombre} ${admin.apellido_p}`}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate" title={admin.user?.email}>
                                                            {admin.user?.email || 'Sin correo'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Área */}
                                            <TableCell className="max-w-[200px]">
                                                <span className="truncate block text-xs font-medium text-foreground" title={admin.area}>
                                                    {admin.area}
                                                </span>
                                            </TableCell>

                                            {/* Rol */}
                                            <TableCell className="text-center">
                                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${rolInfo.color}`}>
                                                    {rolInfo.label}
                                                </span>
                                            </TableCell>

                                            {/* Teléfono */}
                                            <TableCell className="text-center text-xs text-muted-foreground">
                                                <span className="px-2 py-0.5 rounded bg-muted/60 font-medium">
                                                    {admin.telefono || '—'}
                                                </span>
                                            </TableCell>

                                            {/* Acceso */}
                                            <TableCell className="text-center">
                                                {admin.user?.estado ? (
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
                                                                setAdminToShow(admin);
                                                                setOpenShow(true);
                                                            }}
                                                            className="btn btn-xs bg-background border border-muted-foreground/40 text-muted-foreground hover:bg-accent/40 btn-square"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Editar */}
                                                    <div className="tooltip tooltip-top" data-tip="Editar administrador">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAdminToEdit(admin);
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
                                                        data-tip={admin.user?.estado ? 'Suspender acceso' : 'Activar acceso'}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleStatus(admin.id_usuario, admin.user?.estado)}
                                                            className={`btn btn-xs bg-background border btn-square hover:bg-accent/40 ${admin.user?.estado
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
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* PAGINACION */}
                    <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-foreground">
                        <p className="text-xs text-muted-foreground">
                            Mostrando <span className="font-semibold text-foreground">{administradores.from || 0}</span> a{' '}
                            <span className="font-semibold text-foreground">{administradores.to || 0}</span> de{' '}
                            <span className="font-semibold text-foreground">{administradores.total}</span> administradores
                        </p>

                        <div className="flex items-center gap-1">
                            {administradores.links.map((link, index) => {
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
                roles={roles}
            />

            <EditModal
                open={openEdit}
                onOpenChange={setOpenEdit}
                administrador={adminToEdit}
                roles={roles}
            />

            <ShowModal
                open={openShow}
                onOpenChange={setOpenShow}
                administrador={adminToShow}
            />
        </>
    );
}

// Breadcrumbs para la barra superior
AdministradoresIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Administradores',
            href: '/admin/administradores',
        },
    ],
};
