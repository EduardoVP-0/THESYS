import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    FileText,
    GraduationCap,
    Search,
    RotateCcw,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    UserX,
    Filter,
    X,
    Briefcase,
    ShieldAlert,
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

import { ConfirmModal } from './confirm-modal';
import {
    AlumnoConProyectos,
    AsignacionFilters,
    AsignacionStats,
    DocenteItem,
    PaginatedDocentes,
    ProyectoAprobado,
    formatGradoAcademico,
} from './types';

interface Props {
    alumnos: AlumnoConProyectos[];
    docentes: PaginatedDocentes;
    especialidades: string[];
    stats: AsignacionStats;
    filters: AsignacionFilters;
}

export default function AsignacionRevisoresIndex({
    alumnos = [],
    docentes,
    especialidades = [],
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

    // Seleccion de sustentante y anteproyecto
    const [selectedAlumnoId, setSelectedAlumnoId] = useState<string>('');
    const [selectedProyectoId, setSelectedProyectoId] = useState<string>('');

    // Revisores seleccionados (hasta 2)
    const [selectedRevisores, setSelectedRevisores] = useState<DocenteItem[]>([]);

    // Modal de confirmacion
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Filtros locales para docentes
    const [search, setSearch] = useState(filters.search || '');
    const [disponibilidad, setDisponibilidad] = useState(filters.disponibilidad || 'todos');
    const [especialidad, setEspecialidad] = useState(filters.especialidad || 'todas');
    const [perPage, setPerPage] = useState(String(filters.per_page || 5));

    // Flash alert auto-dismiss
    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    // Alumno y proyecto seleccionados actualmente
    const currentAlumno = alumnos.find((a) => String(a.id_usuario) === selectedAlumnoId) || null;
    const currentProyecto =
        currentAlumno?.proyectos.find((p) => String(p.id_proyecto) === selectedProyectoId) || null;

    // Cuando cambia el alumno, preseleccionar automáticamente su proyecto si solo tiene uno
    const handleAlumnoChange = (id: string) => {
        setSelectedAlumnoId(id);
        const alumno = alumnos.find((a) => String(a.id_usuario) === id);
        if (alumno && alumno.proyectos.length === 1) {
            setSelectedProyectoId(String(alumno.proyectos[0].id_proyecto));
        } else {
            setSelectedProyectoId('');
        }
    };

    // Si cambia el anteproyecto o su asesor, deseleccionar automaticamente a cualquier docente que sea el asesor
    useEffect(() => {
        if (currentProyecto?.asesor) {
            const asesorId = currentProyecto.asesor.id_usuario;
            setSelectedRevisores((prev) => prev.filter((r) => r.id_usuario !== asesorId));
        }
    }, [currentProyecto?.asesor?.id_usuario]);

    // Aplicar filtros al backend
    const applyFilters = (
        newSearch = search,
        newDisp = disponibilidad,
        newEsp = especialidad,
        newPerPage = perPage
    ) => {
        router.get(
            '/admin/asignaciones/revisores',
            {
                search: newSearch,
                disponibilidad: newDisp,
                especialidad: newEsp,
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
        applyFilters(search, disponibilidad, especialidad, perPage);
    };

    const handleClearFilters = () => {
        setSearch('');
        setDisponibilidad('todos');
        setEspecialidad('todas');
        setPerPage('5');
        router.get(
            '/admin/asignaciones/revisores',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    // Verificar si alguno de los revisores elegidos entra en conflicto con el asesor
    const hasConflictAsesor = Boolean(
        currentProyecto?.asesor &&
            selectedRevisores.some((r) => r.id_usuario === currentProyecto.asesor!.id_usuario)
    );

    // Manejo de seleccion de revisor en la tabla
    const handleToggleDocente = (docente: DocenteItem) => {
        // Bloquear si es el asesor del proyecto activo
        if (currentProyecto?.asesor && docente.id_usuario === currentProyecto.asesor.id_usuario) {
            return;
        }

        // Verificar si ya esta seleccionado
        const isSelected = selectedRevisores.some((r) => r.id_usuario === docente.id_usuario);
        if (isSelected) {
            // Quitarlo
            setSelectedRevisores(selectedRevisores.filter((r) => r.id_usuario !== docente.id_usuario));
            return;
        }

        // Si ya hay 2 seleccionados, no permitir mas
        if (selectedRevisores.length >= 2) {
            return;
        }

        // Agregar a la seleccion
        setSelectedRevisores([...selectedRevisores, docente]);
    };

    const handleRemoveRevisor = (idDocente: number) => {
        setSelectedRevisores(selectedRevisores.filter((r) => r.id_usuario !== idDocente));
    };

    // Envio final tras confirmacion en modal
    const handleConfirmSubmit = () => {
        if (!currentProyecto || selectedRevisores.length !== 2 || hasConflictAsesor) {
            return;
        }

        setProcessing(true);
        router.post(
            '/admin/asignaciones/revisores',
            {
                id_proyecto: currentProyecto.id_proyecto,
                revisores: [selectedRevisores[0].id_usuario, selectedRevisores[1].id_usuario],
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmModalOpen(false);
                    setProcessing(false);
                    // Limpiar seleccion de revisores tras exito
                    setSelectedRevisores([]);
                },
                onError: () => {
                    setProcessing(false);
                },
            }
        );
    };

    return (
        <>
            <Head title="Asignar Revisores" />

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
                            ASIGNACIÓN DE REVISORES
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Designación y control de comisiones revisoras para anteproyectos de titulación.
                        </p>
                    </div>
                </div>

                {/* TARJETAS DE METRICAS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total Docentes</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">
                                    {stats.total_docentes}
                                </h3>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <Users className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Disponibles (&lt;5)</p>
                                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {stats.disponibles}
                                </h3>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <UserCheck className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Carga Completa (5)</p>
                                <h3 className="text-2xl font-bold text-red-500 mt-0.5">
                                    {stats.carga_completa}
                                </h3>
                            </div>
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                <UserX className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-xs rounded-xl bg-card">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Listos para Revisores</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">
                                    {alumnos.length}
                                </h3>
                            </div>
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <GraduationCap className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* SECCION PRINCIPAL: SELECTORES DE SUSTENTANTE Y ANTEPROYECTO (Estilo Mockup) */}
                <Card className="border-border shadow-xs rounded-xl bg-card">
                    <CardContent className="p-5 sm:p-6 space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">
                                Asignar asesor / revisores a anteproyecto aprobado
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Completa los datos del sustentante y confirma la asignación académica de los dos revisores.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Selector de Sustentante */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <GraduationCap className="size-3.5 text-muted-foreground" />
                                    Sustentante
                                </label>
                                <Select value={selectedAlumnoId} onValueChange={handleAlumnoChange}>
                                    <SelectTrigger className="w-full bg-background border-border text-xs sm:text-sm h-10">
                                        <SelectValue placeholder="Seleccione un sustentante con anteproyecto y asesor..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {alumnos.length === 0 ? (
                                            <div className="p-3 text-xs text-muted-foreground text-center">
                                                No hay alumnos con anteproyectos aprobados y asesor asignado
                                            </div>
                                        ) : (
                                            alumnos.map((a) => (
                                                <SelectItem key={a.id_usuario} value={String(a.id_usuario)}>
                                                    {a.nombre_completo} - {a.matricula}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Selector de Anteproyecto Aprobado */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <FileText className="size-3.5 text-muted-foreground" />
                                    Anteproyecto aprobado
                                </label>
                                <Select
                                    value={selectedProyectoId}
                                    onValueChange={setSelectedProyectoId}
                                    disabled={!currentAlumno || currentAlumno.proyectos.length === 0}
                                >
                                    <SelectTrigger className="w-full bg-background border-border text-xs sm:text-sm h-10">
                                        <SelectValue
                                            placeholder={
                                                !currentAlumno
                                                    ? 'Primero seleccione un sustentante...'
                                                    : 'Seleccione el anteproyecto aprobado...'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {currentAlumno?.proyectos.map((p) => (
                                            <SelectItem key={p.id_proyecto} value={String(p.id_proyecto)}>
                                                {p.titulo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Ficha informativa del Asesor Asignado (Estilo Mockup) */}
                        {currentProyecto ? (
                            <div className="p-3.5 rounded-lg bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in-50 duration-200">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                        Asesor seleccionado:
                                    </span>
                                    {currentProyecto.asesor ? (
                                        <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                            {formatGradoAcademico(currentProyecto.asesor.grado_academico)
                                                ? `${formatGradoAcademico(currentProyecto.asesor.grado_academico)} `
                                                : ''}
                                            {currentProyecto.asesor.nombre_completo}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                                            Sin asesor registrado en este anteproyecto
                                        </span>
                                    )}
                                </div>

                                {currentProyecto.revisores_actuales && currentProyecto.revisores_actuales.length > 0 && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <span className="font-medium">Revisores previos:</span>
                                        <span className="font-semibold text-foreground">
                                            {currentProyecto.revisores_actuales.map((r) => r.nombre_completo).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="size-4 shrink-0 text-muted-foreground" />
                                <span>Selecciona al sustentante y su anteproyecto para habilitar la asignación de revisores.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* BANDEJA DE PREVISUALIZACION DE REVISORES ELEGIDOS (Slots 1 y 2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Slot 1: Revisor*/}
                    <Card
                        className={`border rounded-xl transition-all shadow-xs ${
                            selectedRevisores[0]
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : 'border-dashed border-border bg-card/60'
                        }`}
                    >
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`size-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                        selectedRevisores[0]
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-muted text-muted-foreground border border-border'
                                    }`}
                                >
                                    1
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Primer Revisor
                                    </p>
                                    {selectedRevisores[0] ? (
                                        <>
                                            <p className="text-sm font-bold text-foreground truncate">
                                                {formatGradoAcademico(selectedRevisores[0].grado_academico)
                                                    ? `${formatGradoAcademico(selectedRevisores[0].grado_academico)} `
                                                    : ''}
                                                {selectedRevisores[0].nombre_completo}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {selectedRevisores[0].especialidad || 'Especialidad general'} • Carga: {selectedRevisores[0].carga_total}/5
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">
                                            Selecciona en la tabla de abajo
                                        </p>
                                    )}
                                </div>
                            </div>

                            {selectedRevisores[0] && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveRevisor(selectedRevisores[0].id_usuario)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-500/10 size-8 p-0 cursor-pointer"
                                    title="Quitar revisor"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Slot 2: Revisor*/}
                    <Card
                        className={`border rounded-xl transition-all shadow-xs ${
                            selectedRevisores[1]
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : 'border-dashed border-border bg-card/60'
                        }`}
                    >
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`size-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                        selectedRevisores[1]
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-muted text-muted-foreground border border-border'
                                    }`}
                                >
                                    2
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Segundo Revisor
                                    </p>
                                    {selectedRevisores[1] ? (
                                        <>
                                            <p className="text-sm font-bold text-foreground truncate">
                                                {formatGradoAcademico(selectedRevisores[1].grado_academico)
                                                    ? `${formatGradoAcademico(selectedRevisores[1].grado_academico)} `
                                                    : ''}
                                                {selectedRevisores[1].nombre_completo}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {selectedRevisores[1].especialidad || 'Especialidad general'} • Carga: {selectedRevisores[1].carga_total}/5
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">
                                            Selecciona en la tabla de abajo
                                        </p>
                                    )}
                                </div>
                            </div>

                            {selectedRevisores[1] && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveRevisor(selectedRevisores[1].id_usuario)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-500/10 size-8 p-0 cursor-pointer"
                                    title="Quitar revisor"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* TABLA DE ASESORES / REVISORES CON BUSCADOR, FILTROS Y PAGINACION */}
                <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                    {/* Cabecera y Controles de Busqueda y Filtros */}
                    <div className="p-5 border-b border-border space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-foreground tracking-tight">
                                    Asesores y Docentes
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Disponibilidad y carga académica actual en proyectos de titulación.
                                </p>
                            </div>

                            {/* Contador de seleccionados */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className="text-xs text-muted-foreground font-medium">
                                    Seleccionados:
                                </span>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        selectedRevisores.length === 2
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-muted text-foreground border border-border'
                                    }`}
                                >
                                    {selectedRevisores.length} / 2 revisores
                                </span>
                            </div>
                        </div>

                        {/* Barra de Filtros y Búsqueda */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                            {/* Buscador */}
                            <form
                                onSubmit={handleSearchSubmit}
                                className="relative lg:col-span-5"
                            >
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por nombre, grado, especialidad o correo..."
                                    className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-background border-border"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            applyFilters('', disponibilidad, especialidad, perPage);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </form>

                            {/* Filtro de Disponibilidad */}
                            <div className="lg:col-span-3">
                                <Select
                                    value={disponibilidad}
                                    onValueChange={(val) => {
                                        setDisponibilidad(val);
                                        applyFilters(search, val, especialidad, perPage);
                                    }}
                                >
                                    <SelectTrigger className="h-9 text-xs bg-background border-border">
                                        <SelectValue placeholder="Disponibilidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los docentes</SelectItem>
                                        <SelectItem value="disponible">Disponibles (&lt;5 proyectos)</SelectItem>
                                        <SelectItem value="completa">Carga completa (5 proyectos)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filtro de Especialidad */}
                            <div className="lg:col-span-3">
                                <Select
                                    value={especialidad}
                                    onValueChange={(val) => {
                                        setEspecialidad(val);
                                        applyFilters(search, disponibilidad, val, perPage);
                                    }}
                                >
                                    <SelectTrigger className="h-9 text-xs bg-background border-border">
                                        <SelectValue placeholder="Especialidad" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        <SelectItem value="todas">Todas las especialidades</SelectItem>
                                        {especialidades.map((esp) => (
                                            <SelectItem key={esp} value={esp}>
                                                {esp}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Botón de limpiar filtros */}
                            <div className="lg:col-span-1 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer w-full justify-center"
                                    title="Restablecer filtros"
                                >
                                    <RotateCcw className="size-3.5 mr-1" />
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Docentes */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="w-[38%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Docente
                                    </TableHead>
                                    <TableHead className="w-[22%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Carga Académica
                                    </TableHead>
                                    <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Disponibilidad
                                    </TableHead>
                                    <TableHead className="w-[20%] text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Acción
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docentes.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">
                                                    No se encontraron docentes con los filtros aplicados
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Intenta cambiar el término de búsqueda o restablecer los filtros.
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
                                    docentes.data.map((docente) => {
                                        const isSelected = selectedRevisores.some(
                                            (r) => r.id_usuario === docente.id_usuario
                                        );

                                        // Validar si es el asesor del proyecto activo
                                        const isCurrentAsesor =
                                            currentProyecto?.asesor?.id_usuario === docente.id_usuario;

                                        // Validar si ya no puede ser elegido por carga completa
                                        const isFull = !docente.disponible && !isSelected;

                                        // Validar si ya hay 2 seleccionados y este no es uno de ellos
                                        const isLimitReached = selectedRevisores.length >= 2 && !isSelected;

                                        return (
                                            <TableRow
                                                key={docente.id_usuario}
                                                className={`transition-colors ${
                                                    isSelected
                                                        ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                                                        : 'hover:bg-muted/30'
                                                }`}
                                            >
                                                {/* DOCENTE */}
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0 border border-border">
                                                            {docente.nombre.charAt(0)}
                                                            {docente.apellido_p.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                                                {formatGradoAcademico(docente.grado_academico)
                                                                    ? `${formatGradoAcademico(docente.grado_academico)} `
                                                                    : ''}
                                                                {docente.nombre_completo}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground truncate">
                                                                {docente.especialidad || 'Docente Investigador'}
                                                                {docente.email ? ` • ${docente.email}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* CARGA ACADEMICA */}
                                                <TableCell className="py-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs font-medium">
                                                            <span className="text-foreground">
                                                                {docente.carga_total} / {docente.max_carga} proyectos
                                                            </span>
                                                        </div>
                                                        {/* Mini barra de progreso */}
                                                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    docente.carga_total >= 5
                                                                        ? 'bg-red-500'
                                                                        : docente.carga_total >= 3
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-emerald-500'
                                                                }`}
                                                                style={{
                                                                    width: `${Math.min(
                                                                        (docente.carga_total / docente.max_carga) * 100,
                                                                        100
                                                                    )}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* DISPONIBILIDAD */}
                                                <TableCell className="py-3">
                                                    {docente.disponible ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Disponible
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
                                                            <span className="size-1.5 rounded-full bg-red-500" />
                                                            Carga completa
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* ACCION (Estilo Mockup) */}
                                                <TableCell className="py-3 text-right">
                                                    {isCurrentAsesor ? (
                                                        <span className="inline-block text-[11px] font-semibold text-muted-foreground px-2.5 py-1 rounded-md bg-muted/70 border border-border">
                                                            Director de tesis
                                                        </span>
                                                    ) : isSelected ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleToggleDocente(docente)}
                                                            className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-all"
                                                        >
                                                            <CheckCircle2 className="size-3.5 mr-1" />
                                                            Seleccionado
                                                        </Button>
                                                    ) : isFull ? (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                            variant="outline"
                                                            className="h-8 px-3 text-xs font-medium text-muted-foreground opacity-60 cursor-not-allowed"
                                                        >
                                                            Carga llena
                                                        </Button>
                                                    ) : isLimitReached ? (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                            variant="outline"
                                                            className="h-8 px-3 text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                                                        >
                                                            Máximo 2
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleToggleDocente(docente)}
                                                            className="h-8 px-3 text-xs font-semibold border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-all"
                                                        >
                                                            Seleccionar
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Barra de Paginacion */}
                    <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span>
                                Mostrando {docentes.from || 0} a {docentes.to || 0} de {docentes.total} docentes
                            </span>
                            <span className="hidden sm:inline">&bull;</span>
                            <div className="hidden sm:flex items-center gap-1.5">
                                <span>Mostrar:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(e.target.value);
                                        applyFilters(search, disponibilidad, especialidad, e.target.value);
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

                        {/* Botones de navegacion de pagina */}
                        <div className="flex items-center gap-1">
                            {docentes.links.map((link, idx) => {
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

                {/* BOTON INFERIOR DE ACCION: CONFIRMAR ASIGNACION (Estilo Mockup) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {(!selectedAlumnoId || !selectedProyectoId) && (
                            <span>* Debe seleccionar al sustentante y su anteproyecto aprobado.</span>
                        )}
                        {selectedAlumnoId && selectedProyectoId && !currentProyecto?.asesor && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                * El anteproyecto requiere tener un Director / Asesor de tesis asignado previamente.
                            </span>
                        )}
                        {hasConflictAsesor && (
                            <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                                <AlertCircle className="size-3.5" />
                                * El Director de tesis no puede ser asignado como revisor de este anteproyecto.
                            </span>
                        )}
                        {selectedAlumnoId && selectedProyectoId && currentProyecto?.asesor && !hasConflictAsesor && selectedRevisores.length < 2 && (
                            <span>* Faltan {2 - selectedRevisores.length} revisor(es) por seleccionar en la tabla.</span>
                        )}
                        {selectedAlumnoId && selectedProyectoId && currentProyecto?.asesor && !hasConflictAsesor && selectedRevisores.length === 2 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="size-3.5" />
                                Listo para oficializar la designación de los 2 revisores.
                            </span>
                        )}
                    </div>

                    <Button
                        size="lg"
                        disabled={
                            !selectedAlumnoId ||
                            !selectedProyectoId ||
                            !currentProyecto?.asesor ||
                            selectedRevisores.length !== 2 ||
                            hasConflictAsesor ||
                            processing
                        }
                        onClick={() => setConfirmModalOpen(true)}
                        className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-[#172554] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold px-8 shadow-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <UserCheck className="size-4 mr-2" />
                        Confirmar asignación
                    </Button>
                </div>
            </div>

            {/* MODAL DE CONFIRMACION */}
            <ConfirmModal
                open={confirmModalOpen}
                onOpenChange={setConfirmModalOpen}
                alumno={currentAlumno}
                proyecto={currentProyecto}
                revisor1={selectedRevisores[0] || null}
                revisor2={selectedRevisores[1] || null}
                onConfirm={handleConfirmSubmit}
                processing={processing}
            />
        </>
    );
}

// Breadcrumbs para la barra superior institucional
AsignacionRevisoresIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Asignaciones',
            href: '/admin/asignaciones/revisores',
        },
        {
            title: 'Revisores',
            href: '/admin/asignaciones/revisores',
        },
    ],
};
