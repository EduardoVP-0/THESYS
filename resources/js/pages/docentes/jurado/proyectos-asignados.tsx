import { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    X,
    Calendar,
    Hash,
    GraduationCap,
    UserCheck,
    Scale,
    Eye,
    Check,
    BookOpen,
    AlertTriangle,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

// ─── Tipos provenientes del backend (JuradoDocenteController) ───
interface ProyectoJuradoItem {
    id_jurado_proyecto: number;
    id_proyecto: number;
    titulo: string;
    resumen: string;
    sustentante: string;
    iniciales: string;
    matricula: string;
    email: string;
    carrera: string;
    asesor: string;
    cargo: 'Presidente' | 'Secretario' | 'Vocal' | 'Suplente 1' | 'Suplente 2' | string;
    estado_aceptacion: 'Pendiente' | 'Aceptado' | 'Rechazado';
    fecha_asignacion: string;
    fecha_examen: string | null;
    fecha_examen_raw: string | null;
    sede_examen: string | null;
    documento_pdf: string | null;
    url_documento: string | null;
    expirado_por_fecha: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedProyectosJurado {
    data: ProyectoJuradoItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface JuradoStats {
    total: number;
    pendientes: number;
    aceptados: number;
    rechazados: number;
    con_fecha: number;
}

interface Props {
    proyectos: PaginatedProyectosJurado;
    stats: JuradoStats;
    filters: {
        search?: string;
        estado?: string;
    };
}

export default function ProyectosAsignados({
    proyectos,
    stats = { total: 0, pendientes: 0, aceptados: 0, rechazados: 0, con_fecha: 0 },
    filters = {},
}: Props) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);
    const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoJuradoItem | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'todos');
    const [comentarios, setComentarios] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4500);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    // Sincronizar la card lateral cuando llegan datos actualizados desde Laravel
    useEffect(() => {
        if (proyectoSeleccionado && proyectos?.data) {
            const actualizado = proyectos.data.find(
                (p) => p.id_jurado_proyecto === proyectoSeleccionado.id_jurado_proyecto
            );
            if (actualizado) {
                setProyectoSeleccionado(actualizado);
            }
        }
    }, [proyectos?.data]);

    useEffect(() => {
        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, []);

    // Consulta a Laravel con filtros y estado de carga para activar el Skeleton
    const handleFilter = (newSearch = search, newEstado = estadoFilter) => {
        router.get(
            '/docente/jurado/proyectos-asignados',
            {
                search: newSearch.trim() !== '' ? newSearch : undefined,
                estado: newEstado !== 'todos' ? newEstado : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['proyectos', 'stats', 'filters'],
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            handleFilter(value, estadoFilter);
        }, 350);
    };

    const handleResetFilters = () => {
        setSearch('');
        setEstadoFilter('todos');
        handleFilter('', 'todos');
    };

    const handleSeleccionarProyecto = (proyecto: ProyectoJuradoItem) => {
        setProyectoSeleccionado(proyecto);
        setComentarios('');
    };

    // Determina si la fecha del examen ya se cumplió (o ya pasó)
    const esExamenVencido = (proyecto: ProyectoJuradoItem | null): boolean => {
        if (!proyecto || !proyecto.fecha_examen_raw) return false;
        const hoyStr = new Date().toISOString().split('T')[0];
        return proyecto.fecha_examen_raw <= hoyStr;
    };

    // Reglas de negocio para habilitar/bloquear los botones de Aceptar y Rechazar
    const obtenerEstadoBotones = (proyecto: ProyectoJuradoItem | null) => {
        if (!proyecto) {
            return {
                bloquearAceptar: true,
                bloquearRechazar: true,
                mostrarAlertaAutoRechazo: false,
                motivoBloqueo: null,
            };
        }

        const yaLlegoExamen = esExamenVencido(proyecto);
        const fueAutoRechazado = Boolean(proyecto.expirado_por_fecha);

        if (fueAutoRechazado) {
            return {
                bloquearAceptar: true,
                bloquearRechazar: true,
                mostrarAlertaAutoRechazo: true,
                motivoBloqueo: 'Este proyecto fue rechazado automáticamente al alcanzar la fecha del examen profesional.',
            };
        }

        if (proyecto.estado_aceptacion === 'Rechazado') {
            return {
                bloquearAceptar: true,
                bloquearRechazar: true,
                mostrarAlertaAutoRechazo: false,
                motivoBloqueo: 'Has rechazado formalmente esta designación de jurado.',
            };
        }

        if (proyecto.estado_aceptacion === 'Aceptado') {
            if (yaLlegoExamen) {
                return {
                    bloquearAceptar: true,
                    bloquearRechazar: true,
                    mostrarAlertaAutoRechazo: false,
                    motivoBloqueo: 'El examen profesional ha llegado a su fecha programada. Ya no es posible modificar la aceptación.',
                };
            }

            return {
                bloquearAceptar: true,
                bloquearRechazar: false,
                mostrarAlertaAutoRechazo: false,
                motivoBloqueo: null,
            };
        }

        if (yaLlegoExamen) {
            return {
                bloquearAceptar: true,
                bloquearRechazar: true,
                mostrarAlertaAutoRechazo: true,
                motivoBloqueo: 'La fecha del examen se ha cumplido sin respuesta del sinodal.',
            };
        }

        return {
            bloquearAceptar: false,
            bloquearRechazar: false,
            mostrarAlertaAutoRechazo: false,
            motivoBloqueo: null,
        };
    };

    // Persistir en la base de datos la decisión del docente (Aceptado / Rechazado)
    const handleActualizarAceptacion = (nuevoEstado: 'Aceptado' | 'Rechazado') => {
        if (!proyectoSeleccionado || isProcessingAction) return;

        const accionTexto = nuevoEstado === 'Aceptado' ? 'aceptar el cargo' : 'rechazar la designación';
        if (!confirm(`¿Estás seguro de ${accionTexto} como jurado en este proyecto?`)) {
            return;
        }

        setIsProcessingAction(true);
        router.patch(
            `/docente/jurado/proyectos-asignados/${proyectoSeleccionado.id_jurado_proyecto}/aceptacion`,
            {
                estado_aceptacion: nuevoEstado,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsProcessingAction(false),
            }
        );
    };

    const formatFecha = (fechaStr: string | null) => {
        if (!fechaStr) return 'Sin asignar';
        const fecha = new Date(`${fechaStr}T00:00:00`);
        return fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderEstadoBadge = (estado: ProyectoJuradoItem['estado_aceptacion']) => {
        switch (estado) {
            case 'Pendiente':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Pendiente
                    </span>
                );
            case 'Aceptado':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Aceptado
                    </span>
                );
            case 'Rechazado':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        Rechazado
                    </span>
                );
        }
    };

    const renderCargoBadge = (cargo: string) => {
        const isTitular = cargo === 'Presidente' || cargo === 'Secretario' || cargo === 'Vocal';
        return (
            <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                    isTitular
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                }`}
            >
                {cargo}
            </span>
        );
    };

    return (
        <>
            <Head title="Proyectos Asignados - Jurado" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">
                {/* ALERTAS FLASH */}
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
                            PROYECTOS ASIGNADOS COMO JURADO
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Consulta los proyectos de titulación donde participas como sinodal, revisa la tesis y confirma tu designación.
                        </p>
                    </div>
                </div>

                {/* 5 FICHAS DE MÉTRICAS SUPERIORES */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total asignados</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <FileText className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Por confirmar</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.pendientes}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <Clock className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Aceptados</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.aceptados}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-[#10B981]">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Rechazados</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.rechazados}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                <XCircle className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs rounded-xl bg-card col-span-2 sm:col-span-1">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Examen programado</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.con_fecha}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                <Calendar className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CONTENEDOR GRID: TABLA + CARD LATERAL DEL MISMO ALTO */}
                <div
                    className={`grid gap-4 items-stretch transition-all ${
                        proyectoSeleccionado ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'
                    }`}
                >
                    {/* ─── TARJETA DE LA TABLA PRINCIPAL ─── */}
                    <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden flex flex-col">
                        <CardContent className="p-5 flex-1 flex flex-col gap-4">
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold tracking-tight text-foreground">
                                            Bandeja de Proyectos Asignados
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Haz clic sobre cualquier registro de la tabla para abrir su ficha de detalle a la derecha.
                                        </p>
                                    </div>
                                </div>

                                {/* FILTROS: BUSCAR + ESTADO */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                    <div className="sm:col-span-2 space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground block">
                                            Buscar
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="Título, sustentante, matrícula o cargo..."
                                                value={search}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                className="pl-9 bg-background border-border rounded-lg text-xs placeholder:text-muted-foreground h-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-muted-foreground block">
                                                Estado de aceptación
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
                                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                                <SelectItem value="Aceptado">Aceptado</SelectItem>
                                                <SelectItem value="Rechazado">Rechazado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* TABLA DE PROYECTOS CON SKELETON EN CASO DE CONEXIÓN LENTA */}
                                <div className="rounded-xl border border-border overflow-hidden bg-background">
                                    <Table className="table-fixed min-w-[760px]">
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-b border-border">
                                                <TableHead className="font-semibold text-foreground w-[28%] text-xs">Título del Proyecto</TableHead>
                                                <TableHead className="font-semibold text-foreground w-[18%] text-xs">Sustentante</TableHead>
                                                <TableHead className="font-semibold text-foreground w-[11%] text-center text-xs">Matrícula</TableHead>
                                                <TableHead className="font-semibold text-foreground w-[13%] text-center text-xs">Mi Cargo</TableHead>
                                                <TableHead className="font-semibold text-foreground w-[16%] text-center text-xs">Director / Asesor</TableHead>
                                                <TableHead className="font-semibold text-foreground w-[14%] text-center text-xs">Aceptación</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {isLoading ? (
                                                Array.from({ length: 6 }).map((_, i) => (
                                                    <TableRow key={`skeleton-${i}`} className="border-b border-border">
                                                        {[0, 1, 2, 3, 4, 5].map((c) => (
                                                            <TableCell key={c} className="py-4">
                                                                <div
                                                                    className="h-4 rounded bg-muted animate-pulse mx-auto"
                                                                    style={{ width: `${60 + ((i + c) % 3) * 15}%` }}
                                                                />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : proyectos.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                                                        No se encontraron proyectos asignados con los filtros aplicados.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                proyectos.data.map((proyecto) => {
                                                    const isSelected =
                                                        proyectoSeleccionado?.id_jurado_proyecto === proyecto.id_jurado_proyecto;

                                                    return (
                                                        <TableRow
                                                            key={proyecto.id_jurado_proyecto}
                                                            onClick={() => handleSeleccionarProyecto(proyecto)}
                                                            className={`border-b border-border cursor-pointer transition-colors text-xs ${
                                                                isSelected
                                                                    ? 'bg-accent/30 font-medium'
                                                                    : 'hover:bg-accent/20'
                                                            }`}
                                                        >
                                                            <TableCell className="font-medium text-foreground py-3.5">
                                                                <span className="truncate block" title={proyecto.titulo}>
                                                                    {proyecto.titulo}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground truncate block">
                                                                    {proyecto.carrera}
                                                                </span>
                                                            </TableCell>

                                                            <TableCell className="text-foreground py-3.5">
                                                                <span className="truncate block" title={proyecto.sustentante}>
                                                                    {proyecto.sustentante}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground truncate block">
                                                                    {proyecto.email}
                                                                </span>
                                                            </TableCell>

                                                            <TableCell className="text-center text-muted-foreground font-mono text-[11px] py-3.5">
                                                                {proyecto.matricula}
                                                            </TableCell>

                                                            <TableCell className="text-center py-3.5">
                                                                {renderCargoBadge(proyecto.cargo)}
                                                            </TableCell>

                                                            <TableCell className="text-center text-muted-foreground py-3.5">
                                                                <span className="truncate block max-w-[140px] mx-auto" title={proyecto.asesor}>
                                                                    {proyecto.asesor}
                                                                </span>
                                                            </TableCell>

                                                            <TableCell className="text-center py-3.5">
                                                                {renderEstadoBadge(proyecto.estado_aceptacion)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* PAGINACIÓN DE LARAVEL */}
                            <div className="flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                                <span>
                                    Mostrando <b className="text-foreground">{proyectos.from || 0}</b> a{' '}
                                    <b className="text-foreground">{proyectos.to || 0}</b> de{' '}
                                    <b className="text-foreground">{proyectos.total}</b> registros
                                </span>

                                <div className="flex items-center gap-3">
                                    <p>
                                        Página <span className="font-semibold text-foreground">{proyectos.current_page}</span> de{' '}
                                        <span className="font-semibold text-foreground">{proyectos.last_page}</span>
                                    </p>

                                    <div className="flex items-center gap-1">
                                        {proyectos.links.map((link, index) => {
                                            const isPrev = link.label.includes('Previous') || link.label.includes('pagination.previous');
                                            const isNext = link.label.includes('Next') || link.label.includes('pagination.next');

                                            if (isPrev) {
                                                return (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        onStart={() => setIsLoading(true)}
                                                        onFinish={() => setIsLoading(false)}
                                                        className={`btn btn-xs border border-border bg-background hover:bg-accent/40 text-foreground gap-1 ${
                                                            !link.url ? 'btn-disabled opacity-40 pointer-events-none' : ''
                                                        }`}
                                                        preserveScroll
                                                        preserveState
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
                                                        onStart={() => setIsLoading(true)}
                                                        onFinish={() => setIsLoading(false)}
                                                        className={`btn btn-xs border border-border bg-background hover:bg-accent/40 text-foreground gap-1 ${
                                                            !link.url ? 'btn-disabled opacity-40 pointer-events-none' : ''
                                                        }`}
                                                        preserveScroll
                                                        preserveState
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* ─── CARD LATERAL DE DETALLE (Mismo alto exacto que la tarjeta de la tabla) ─── */}
                    {proyectoSeleccionado && (
                        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col h-full min-h-0 animate-in fade-in-50 duration-200">
                            <div className="p-4 border-b border-border flex items-start gap-3 shrink-0">
                                <div className="size-11 rounded-full bg-accent/40 text-foreground flex items-center justify-center text-sm font-bold shrink-0">
                                    {proyectoSeleccionado.iniciales}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-sm text-foreground truncate" title={proyectoSeleccionado.sustentante}>
                                        {proyectoSeleccionado.sustentante}
                                    </h3>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {proyectoSeleccionado.matricula} · {proyectoSeleccionado.email}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        {renderCargoBadge(proyectoSeleccionado.cargo)}
                                        {renderEstadoBadge(proyectoSeleccionado.estado_aceptacion)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setProyectoSeleccionado(null)}
                                    className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                                    title="Cerrar detalle"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                                <div>
                                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                        Información del proyecto
                                    </h4>
                                    <div className="space-y-2.5">
                                        <div className="flex items-start gap-2">
                                            <BookOpen className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] uppercase text-muted-foreground">Título de tesis</p>
                                                <p className="text-xs font-semibold text-foreground leading-snug">
                                                    {proyectoSeleccionado.titulo}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <GraduationCap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] uppercase text-muted-foreground">Licenciatura / Ingeniería</p>
                                                <p className="text-xs font-medium text-foreground">
                                                    {proyectoSeleccionado.carrera}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <UserCheck className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] uppercase text-muted-foreground">Director de tesis (Asesor)</p>
                                                <p className="text-xs font-medium text-foreground">
                                                    {proyectoSeleccionado.asesor}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div className="flex items-start gap-2">
                                                <Scale className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground">Cargo asignado</p>
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {proyectoSeleccionado.cargo}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <Calendar className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground">Asignación</p>
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {formatFecha(proyectoSeleccionado.fecha_asignacion)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {proyectoSeleccionado.fecha_examen && (
                                            <div className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-start gap-2">
                                                <Hash className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                                                        Programación de Examen
                                                    </p>
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {proyectoSeleccionado.fecha_examen}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {proyectoSeleccionado.sede_examen}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                        Resumen
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border">
                                        {proyectoSeleccionado.resumen}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                        Documento de Tesis
                                    </h4>
                                    {proyectoSeleccionado.documento_pdf && proyectoSeleccionado.url_documento ? (
                                        <div className="rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors overflow-hidden">
                                            <div className="p-3 flex items-center justify-between bg-card">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="size-9 rounded-lg bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                                                        <FileText className="size-4 text-[#EF4444]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-foreground truncate">
                                                            {proyectoSeleccionado.documento_pdf}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Versión disponible · PDF
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={proyectoSeleccionado.url_documento}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-xs border border-border bg-background hover:bg-accent/40 text-foreground gap-1 shrink-0"
                                                >
                                                    <Eye className="size-3.5" />
                                                    Ver PDF
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-center">
                                            <FileText className="size-5 text-muted-foreground mx-auto mb-1 opacity-60" />
                                            <p className="text-xs font-medium text-muted-foreground">
                                                El sustentante aún no cuenta con la versión final cargada.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                        Observaciones o motivo de rechazo
                                    </h4>
                                    <textarea
                                        value={comentarios}
                                        onChange={(e) => setComentarios(e.target.value)}
                                        disabled={
                                            obtenerEstadoBotones(proyectoSeleccionado).bloquearAceptar &&
                                            obtenerEstadoBotones(proyectoSeleccionado).bloquearRechazar
                                        }
                                        placeholder="Añade una nota opcional o indica el motivo en caso de no poder participar como sinodal..."
                                        rows={3}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* ALERTA INSTITUCIONAL SI FUE RECHAZADO EN AUTOMÁTICO POR FECHA LÍMITE */}
                                {obtenerEstadoBotones(proyectoSeleccionado).mostrarAlertaAutoRechazo && (
                                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 flex items-start gap-2.5 text-xs">
                                        <AlertTriangle className="size-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-[11px] uppercase tracking-wide">
                                                Rechazo Automático por Expiración
                                            </p>
                                            <p className="text-[11px] leading-relaxed">
                                                Por motivos de que no has respondido a tiempo antes de la fecha programada del examen, el sistema ha rechazado automáticamente tu participación como sinodal.
                                            </p>
                                            <p className="text-[10px] text-muted-foreground pt-1 border-t border-red-500/20">
                                                Para cualquier aclaración o solicitud extraordinaria, favor de acudir de manera presencial al Departamento de Titulación.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* AVISO INFORMATIVO SI LLEGÓ EL DÍA DEL EXAMEN Y ESTABA ACEPTADO */}
                                {proyectoSeleccionado.estado_aceptacion === 'Aceptado' &&
                                    esExamenVencido(proyectoSeleccionado) && (
                                        <div className="p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 flex items-start gap-2 text-xs">
                                            <Clock className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                                            <p className="text-[11px] leading-snug">
                                                El examen profesional ha alcanzado su fecha oficial. La designación queda cerrada y ya no es posible declinar.
                                            </p>
                                        </div>
                                    )}
                            </div>

                            {(() => {
                                const estadoBtn = obtenerEstadoBotones(proyectoSeleccionado);
                                return (
                                    <div className="p-4 border-t border-border flex flex-col gap-2 shrink-0">
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleActualizarAceptacion('Rechazado')}
                                                disabled={estadoBtn.bloquearRechazar || isProcessingAction}
                                                title={estadoBtn.motivoBloqueo || undefined}
                                                className="flex-1 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <XCircle className="size-3.5" />
                                                Rechazar
                                            </Button>
                                            <Button
                                                onClick={() => handleActualizarAceptacion('Aceptado')}
                                                disabled={estadoBtn.bloquearAceptar || isProcessingAction}
                                                title={estadoBtn.motivoBloqueo || undefined}
                                                className="flex-1 bg-[#10B981] hover:bg-[#0ea371] text-white gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Check className="size-3.5" />
                                                Aceptar Cargo
                                            </Button>
                                        </div>

                                        {estadoBtn.bloquearAceptar && estadoBtn.bloquearRechazar && (
                                            <p className="text-[10px] text-center text-muted-foreground italic">
                                                {estadoBtn.motivoBloqueo}
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ProyectosAsignados.layout = {
    breadcrumbs: [
        { title: 'Portal Docente', href: '/docente/dashboard' },
        { title: 'Proyectos Asignados', href: '/docente/jurado/proyectos-asignados' },
    ],
};
