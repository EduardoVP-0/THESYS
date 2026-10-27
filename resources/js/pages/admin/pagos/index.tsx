import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import {
    GraduationCap,
    FileCheck2,
    ShieldCheck,
    Library,
    Award,
    Search,
    X,
    FileText,
    Eye,
    Check,
    XCircle,
    Calendar,
    Hash,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// ─── Catálogo de conceptos de pago ───
const CONCEPTOS = [
    {
        id: 1,
        nombre: 'Inscripción del tema de tesis',
        descripcion: 'Pago inicial para registrar formalmente el tema o anteproyecto de investigación ante la unidad académica correspondiente.',
        precio: 85.0,
        Icon: GraduationCap,
    },
    {
        id: 2,
        nombre: 'Liberación de tesis y servicio social',
        descripcion: 'Trámite para validar administrativamente que el estudiante ha concluido su servicio social y que su trabajo de tesis ha sido aprobado por los asesores.',
        precio: 85.0,
        Icon: FileCheck2,
    },
    {
        id: 3,
        nombre: 'Autorización de examen profesional',
        descripcion: 'Derecho administrativo que se cubre para que las autoridades académicas validen el expediente completo y den luz verde para continuar con el proceso de evaluación.',
        precio: 115.0,
        Icon: ShieldCheck,
    },
    {
        id: 4,
        nombre: 'Donación a biblioteca, pasante de examen profesional',
        descripcion: 'Aportación institucional requerida a los pasantes como parte de los requisitos previos para poder sustentar su examen.',
        precio: 285.0,
        Icon: Library,
    },
    {
        id: 5,
        nombre: 'Examen profesional',
        descripcion: 'Pago por el derecho a presentar la defensa oral de la tesis ante el jurado asignado y, en caso de aprobar, realizar la toma de protesta pública.',
        precio: 1430.0,
        Icon: Award,
    },
];

// ─── Tipos provenientes de la base de datos ───
interface Alumno {
    id_usuario: number;
    matricula: string;
    nombre: string;
    apellido_p: string;
    apellido_m?: string | null;
}

interface Usuario {
    id: number;
    name: string;
    email: string;
    alumno?: Alumno | null;
}

interface Pago {
    id_pago: number;
    id_usuario: number;
    monto: number;
    concepto: string;
    referencia_bancaria: string | null;
    estado_validacion: 'Pendiente' | 'Validado' | 'Rechazado';
    created_at: string;
    updated_at: string;
    usuario?: Usuario | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedPagos {
    data: Pago[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    pagos: PaginatedPagos;
    pendientesPorConcepto: Record<string, number>;
    filters: {
        concepto?: string;
        search?: string;
        estado?: string;
    };
}

export default function PagosIndex({ pagos, pendientesPorConcepto = {}, filters = {} }: Props) {
    // Obtenemos los mensajes flash de sesión de Laravel
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    // Estado local para la alerta flash con auto-cierre a los 5 segundos
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const [conceptoSeleccionado, setConceptoSeleccionado] = useState<string | null>(filters.concepto || null);
    const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
    const [query, setQuery] = useState(filters.search || '');
    const [estadoFiltro, setEstadoFiltro] = useState(filters.estado || 'Todos');
    const [comentarios, setComentarios] = useState('');

    // Sincronizar el pago seleccionado si se actualiza la lista de pagos en la página actual
    useEffect(() => {
        if (pagoSeleccionado && pagos?.data) {
            const actualizado = pagos.data.find((p) => p.id_pago === pagoSeleccionado.id_pago);
            if (actualizado) {
                setPagoSeleccionado(actualizado);
            }
        }
    }, [pagos?.data]);

    // Estado de carga de la tabla (para mostrar skeleton)
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Función para consultar a Laravel con filtros y paginación (recarga parcial)
    const handleFilter = (newConcepto = conceptoSeleccionado, newSearch = query, newEstado = estadoFiltro) => {
        router.get(
            '/admin/pagos',
            {
                concepto: newConcepto || undefined,
                search: newSearch || undefined,
                estado: newEstado !== 'Todos' ? newEstado : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['pagos', 'filters'],
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    };

    // Búsqueda con debounce para no lanzar una petición por cada tecla
    const handleSearchChange = (value: string) => {
        setQuery(value);
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            handleFilter(conceptoSeleccionado, value, estadoFiltro);
        }, 350);
    };

    useEffect(() => {
        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, []);

    // Obtener nombre del estudiante
    const getNombreEstudiante = (pago: Pago) => {
        if (pago.usuario?.alumno) {
            const { nombre, apellido_p, apellido_m } = pago.usuario.alumno;
            return `${nombre} ${apellido_p} ${apellido_m || ''}`.trim();
        }
        return pago.usuario?.name || 'Estudiante no registrado';
    };

    // Obtener matrícula
    const getMatricula = (pago: Pago) => {
        return pago.usuario?.alumno?.matricula || `USR-${pago.id_usuario}`;
    };

    const handleSeleccionarConcepto = (nombre: string) => {
        const nuevo = conceptoSeleccionado === nombre ? null : nombre;
        setConceptoSeleccionado(nuevo);
        setPagoSeleccionado(null);
        handleFilter(nuevo, query, estadoFiltro);
    };

    const handleSeleccionarPago = (pago: Pago) => {
        setPagoSeleccionado(pago);
    };

    // Validar o Rechazar un pago directamente contra la base de datos
    const handleUpdateEstado = (nuevoEstado: 'Validado' | 'Rechazado') => {
        if (!pagoSeleccionado) return;
        const accion = nuevoEstado === 'Validado' ? 'validar' : 'rechazar';
        if (confirm(`¿Estás seguro de ${accion} este pago?`)) {
            router.patch(
                `/admin/pagos/${pagoSeleccionado.id_pago}/estado`,
                { estado_validacion: nuevoEstado },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setPagoSeleccionado((prev) =>
                            prev ? { ...prev, estado_validacion: nuevoEstado } : null
                        );
                    },
                }
            );
        }
    };

    return (
        <>
            <Head title="Gestión de Pagos" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">

                {/* Alerta de notificación flash de éxito con auto-cierre en 5 segundos */}
                {flash?.success && showAlert && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 text-foreground animate-in fade-in-50 duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        <button onClick={() => setShowAlert(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
                    </div>
                )}

                {/* ENCABEZADO */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            GESTIÓN DE PAGOS
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Administración de pagos del sistema de titulación
                        </p>
                    </div>
                </div>

                {/* CATÁLOGO DE CONCEPTOS */}
                <section className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {CONCEPTOS.map(({ id, nombre, descripcion, precio, Icon }) => {
                            const activa = conceptoSeleccionado === nombre;
                            const pendientes = pendientesPorConcepto[nombre] || 0;

                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => handleSeleccionarConcepto(nombre)}
                                    className={`card text-left border transition-all cursor-pointer ${
                                        activa
                                            ? 'bg-accent/40 border-accent ring-2 ring-accent/40'
                                            : 'bg-card border-border hover:border-accent hover:bg-accent/20'
                                    }`}
                                >
                                    <div className="card-body p-4 gap-2">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="p-2 rounded-lg bg-accent/30 text-foreground">
                                                <Icon className="size-4" />
                                            </div>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                                                pendientes > 0
                                                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-bold'
                                                    : 'text-muted-foreground bg-muted'
                                            }`}>
                                                {pendientes} pago{pendientes === 1 ? '' : 's'}
                                            </span>
                                        </div>

                                        <h3 className="font-semibold text-sm text-foreground leading-tight">
                                            {nombre}
                                        </h3>

                                        <p className="text-xs text-muted-foreground leading-snug">
                                            {descripcion}
                                        </p>

                                        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                                                Precio
                                            </span>
                                            <span className="text-sm font-bold text-[#10B981]">
                                                ${precio.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        <b>Nota:</b> Esta sección solo muestra los conceptos de pago registrados. Los montos, vigencia y requisitos se actualizan únicamente en la configuración del sistema.
                    </p>
                </section>

                {/* TABLA + PANEL (solo si hay concepto seleccionado) */}
                {conceptoSeleccionado && (
                    <section className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-foreground mt-1">
                                {conceptoSeleccionado}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {pagos.total} pago(s) registrado(s).
                            </p>
                        </div>

                        <div className={`grid gap-4 items-stretch transition-all ${
                            pagoSeleccionado ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'
                        }`}>

                            {/* ─── TABLA ─── */}
                            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="p-4 flex flex-col sm:flex-row gap-2 border-b border-border">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input
                                                value={query}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                placeholder="Buscar estudiante o matrícula..."
                                                className="pl-9 bg-background border-border text-sm"
                                            />
                                        </div>
                                        <Select 
                                            value={estadoFiltro} 
                                            onValueChange={(val) => {
                                                setEstadoFiltro(val);
                                                handleFilter(conceptoSeleccionado, query, val);
                                            }}
                                        >
                                            <SelectTrigger className="w-full sm:w-44 border-border bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Todos">Todos</SelectItem>
                                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                                <SelectItem value="Validado">Validado</SelectItem>
                                                <SelectItem value="Rechazado">Rechazado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/30">
                                                <tr className="border-b border-border">
                                                    <th className="text-left font-semibold text-foreground px-4 py-3">Nombre del estudiante</th>
                                                    <th className="text-left font-semibold text-foreground px-4 py-3">Concepto</th>
                                                    <th className="text-left font-semibold text-foreground px-4 py-3">Monto</th>
                                                    <th className="text-center font-semibold text-foreground px-4 py-3 w-32">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isLoading ? (
                                                    Array.from({ length: 6 }).map((_, i) => (
                                                        <tr key={`skeleton-${i}`} className="border-b border-border">
                                                            {[0, 1, 2, 3].map((c) => (
                                                                <td key={c} className="px-4 py-4">
                                                                    <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${60 + ((i + c) % 3) * 15}%` }} />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))
                                                ) : pagos.data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-10 text-muted-foreground">
                                                            No hay pagos registrados con estos filtros.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    pagos.data.map((p) => {
                                                        const nombreEstudiante = getNombreEstudiante(p);
                                                        const matricula = getMatricula(p);
                                                        const isSelected = pagoSeleccionado?.id_pago === p.id_pago;

                                                        return (
                                                            <tr
                                                                key={p.id_pago}
                                                                onClick={() => handleSeleccionarPago(p)}
                                                                className={`border-b border-border cursor-pointer transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-accent/30'
                                                                        : 'hover:bg-accent/20'
                                                                }`}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <p className="font-semibold text-foreground">
                                                                        {nombreEstudiante}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {matricula}
                                                                    </p>
                                                                </td>
                                                                <td className="px-4 py-3 text-foreground">
                                                                    {p.concepto}
                                                                </td>
                                                                <td className="px-4 py-3 font-bold text-foreground">
                                                                    ${p.monto.toFixed(2)}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                                                                        p.estado_validacion === 'Validado'
                                                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                                                            : p.estado_validacion === 'Rechazado'
                                                                            ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                                                                            : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                                                                    }`}>
                                                                        {p.estado_validacion}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* PAGINACIÓN NATIVA DE LARAVEL (Idéntica a Carreras y Oficios) */}
                                <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                                    <span>
                                        Mostrando <b className="text-foreground">{pagos.from || 0}</b> a{' '}
                                        <b className="text-foreground">{pagos.to || 0}</b> de{' '}
                                        <b className="text-foreground">{pagos.total}</b> registros
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {pagos.links.map((link, index) => {
                                            const isPrevious = link.label.includes('Previous') || link.label.includes('pagination.previous');
                                            const isNext = link.label.includes('Next') || link.label.includes('pagination.next');

                                            if (isPrevious) {
                                                return (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`btn btn-xs border border-border bg-card hover:bg-accent/40 text-foreground gap-1 ${
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
                                                        className={`btn btn-xs border border-border bg-card hover:bg-accent/40 text-foreground gap-1 ${
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

                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`btn btn-xs min-w-7 border ${
                                                        link.active
                                                            ? 'bg-accent border-accent text-foreground font-bold'
                                                            : 'bg-card border-border text-foreground hover:bg-accent/40'
                                                    } ${!link.url ? 'btn-disabled opacity-40 pointer-events-none' : ''}`}
                                                    preserveScroll
                                                    preserveState
                                                >
                                                    {link.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>

                            {/* ─── PANEL LATERAL ─── */}
                            {pagoSeleccionado && (
                                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[calc(100vh-8rem)]">

                                    {/* Header */}
                                    <div className="p-4 border-b border-border flex items-start gap-3 flex-shrink-0">
                                        <div className="size-12 rounded-full bg-accent/40 text-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {getNombreEstudiante(pagoSeleccionado)
                                                .split(' ')
                                                .slice(0, 2)
                                                .map((n) => n[0])
                                                .join('')}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-foreground truncate">
                                                {getNombreEstudiante(pagoSeleccionado)}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {getMatricula(pagoSeleccionado)}
                                            </p>
                                            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                pagoSeleccionado.estado_validacion === 'Validado'
                                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                                    : pagoSeleccionado.estado_validacion === 'Rechazado'
                                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                                            }`}>
                                                {pagoSeleccionado.estado_validacion}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPagoSeleccionado(null)}
                                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>

                                    {/* Body con scroll interno */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

                                        {/* Información del pago */}
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                Información del pago
                                            </h4>
                                            <div className="space-y-2.5">
                                                <div className="flex items-start gap-2">
                                                    <Hash className="size-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] uppercase text-muted-foreground">Matrícula</p>
                                                        <p className="text-sm font-semibold text-foreground">{getMatricula(pagoSeleccionado)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <FileText className="size-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] uppercase text-muted-foreground">Concepto</p>
                                                        <p className="text-sm font-semibold text-foreground">{pagoSeleccionado.concepto}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <span className="text-[10px] text-muted-foreground font-bold w-3.5 text-center mt-1">$</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] uppercase text-muted-foreground">Monto</p>
                                                        <p className="text-lg font-bold text-[#10B981]">${pagoSeleccionado.monto.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <Calendar className="size-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] uppercase text-muted-foreground">Fecha del pago</p>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {new Date(pagoSeleccionado.created_at).toLocaleDateString('es-MX', {
                                                                day: '2-digit', month: 'long', year: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vista del recibo */}
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                Vista del recibo
                                            </h4>
                                            <a
                                                href={`/storage/comprobantes/${pagoSeleccionado.referencia_bancaria || 'comprobante'}.pdf`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors overflow-hidden group"
                                                title="Abrir comprobante en nueva ventana"
                                            >
                                                {/* Placeholder del PDF */}
                                                <div className="aspect-[3/4] bg-white dark:bg-card flex flex-col items-center justify-center p-4 border-b border-border">
                                                    <div className="size-14 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-3">
                                                        <FileText className="size-7 text-[#EF4444]" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-foreground text-center">
                                                        Comprobante de pago
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1 text-center px-4">
                                                        Haz clic para abrir en nueva ventana
                                                    </p>
                                                </div>
                                                {/* Nombre del archivo */}
                                                <div className="p-2.5 flex items-center justify-between bg-card">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-foreground truncate">
                                                            {pagoSeleccionado.referencia_bancaria || 'comprobante'}.pdf
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Documento oficial
                                                        </p>
                                                    </div>
                                                    <Eye className="size-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                                                </div>
                                            </a>
                                        </div>

                                        {/* Comentarios */}
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                Comentarios
                                            </h4>
                                            <textarea
                                                value={comentarios}
                                                onChange={(e) => setComentarios(e.target.value)}
                                                placeholder="Añade una nota interna sobre este pago..."
                                                rows={3}
                                                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Footer fijo: botones para validar o rechazar */}
                                    <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleUpdateEstado('Rechazado')}
                                            disabled={pagoSeleccionado.estado_validacion === 'Rechazado'}
                                            className="flex-1 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 gap-1.5 text-xs font-semibold disabled:opacity-50"
                                        >
                                            <XCircle className="size-3.5" />
                                            Rechazar Pago
                                        </Button>
                                        <Button
                                            onClick={() => handleUpdateEstado('Validado')}
                                            disabled={pagoSeleccionado.estado_validacion === 'Validado'}
                                            className="flex-1 bg-[#10B981] hover:bg-[#0ea371] text-white gap-1.5 text-xs font-semibold disabled:opacity-50"
                                        >
                                            <Check className="size-3.5" />
                                            Validar Pago
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </section>
                )}

            </div>
        </>
    );
}

PagosIndex.layout = {
    breadcrumbs: [
        { title: 'Inicio', href: '/admin/dashboard' },
        { title: 'Pagos', href: '/admin/pagos' },
    ],
};
