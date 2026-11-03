import { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Search,
    X,
    FileText,
    Eye,
    XCircle,
    Calendar,
    Hash,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Scale,
    GraduationCap,
    Clock,
    ThumbsUp,
    ThumbsDown,
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

// ─── Tipos provenientes del backend (JuradoDocenteController) ───
interface DictamenJuradoItem {
    id_jurado_proyecto: number;
    id_dictamen: number | null;
    sustentante: string;
    iniciales: string;
    matricula: string;
    email: string;
    carrera: string;
    titulo_proyecto: string;
    cargo: 'Presidente' | 'Secretario' | 'Vocal' | 'Suplente 1' | 'Suplente 2' | string;
    es_titular: boolean;
    estado_aceptacion: 'Pendiente' | 'Aceptado' | 'Rechazado';
    fecha_examen: string | null;
    hora_examen: string;
    sede_examen: string;
    tiene_examen: boolean;
    voto: 'A favor' | 'En contra' | 'Pendiente' | string;
    observaciones: string | null;
    fecha_emision: string | null;
    documento_tesis: string | null;
    url_documento: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedDictamenes {
    data: DictamenJuradoItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    dictamenes: PaginatedDictamenes;
    filters: {
        search?: string;
        voto?: string;
    };
}

export default function EmitirVoto({ dictamenes, filters = {} }: Props) {
    const { flash, errors } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
        errors?: Record<string, string>;
    }>().props;

    const [showAlert, setShowAlert] = useState(false);
    const [registroSeleccionado, setRegistroSeleccionado] = useState<DictamenJuradoItem | null>(null);
    const [query, setQuery] = useState(filters.search || '');
    const [votoFiltro, setVotoFiltro] = useState(filters.voto || 'Todos');
    const [observaciones, setObservaciones] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessingVoto, setIsProcessingVoto] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4500);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    // Sincronizar el registro seleccionado cuando se actualiza el listado desde Laravel
    useEffect(() => {
        if (registroSeleccionado && dictamenes?.data) {
            const actualizado = dictamenes.data.find(
                (r) => r.id_jurado_proyecto === registroSeleccionado.id_jurado_proyecto
            );
            if (actualizado) {
                setRegistroSeleccionado(actualizado);
                setObservaciones(actualizado.observaciones || '');
            }
        }
    }, [dictamenes?.data]);

    useEffect(() => {
        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, []);

    // Consulta a Laravel con recarga parcial y Skeleton en caso de internet lento
    const handleFilter = (newSearch = query, newVoto = votoFiltro) => {
        router.get(
            '/docente/jurado/emitir-voto',
            {
                search: newSearch.trim() !== '' ? newSearch : undefined,
                voto: newVoto !== 'Todos' ? newVoto : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['dictamenes', 'filters'],
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const handleSearchChange = (value: string) => {
        setQuery(value);
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            handleFilter(value, votoFiltro);
        }, 350);
    };

    const handleSeleccionarRegistro = (item: DictamenJuradoItem) => {
        setRegistroSeleccionado(item);
        setObservaciones(item.observaciones || '');
    };

    // Guardar el voto en tbldictamenes
    const handleEmitirVoto = (nuevoVoto: 'A favor' | 'En contra') => {
        if (!registroSeleccionado || registroSeleccionado.voto !== 'Pendiente' || isProcessingVoto) {
            return;
        }

        if (nuevoVoto === 'En contra' && !observaciones.trim()) {
            alert('Por favor, redacta en observaciones el motivo del voto en contra.');
            return;
        }

        if (!confirm(`¿Confirmas emitir tu voto "${nuevoVoto}" para ${registroSeleccionado.sustentante}? Esta acción es definitiva.`)) {
            return;
        }

        setIsProcessingVoto(true);
        router.post(
            `/docente/jurado/emitir-voto/${registroSeleccionado.id_jurado_proyecto}`,
            {
                voto: nuevoVoto,
                observaciones: observaciones.trim() || null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsProcessingVoto(false),
            }
        );
    };

    const formatFecha = (fechaStr: string | null) => {
        if (!fechaStr) return 'Fecha por programar';
        const fecha = new Date(`${fechaStr}T00:00:00`);
        return fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const getBadgeStyles = (voto: string) => {
        switch (voto) {
            case 'A favor':
                return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
            case 'En contra':
                return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
            default:
                return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
        }
    };

    return (
        <>
            <Head title="Emitir Voto - Jurado" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">
                {/* Alertas flash de sesión */}
                {flash?.success && showAlert && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 text-foreground animate-in fade-in-50 duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
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
                            <XCircle className="size-4 text-[#EF4444]" />
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
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            EMISIÓN DE VOTOS (DICTAMEN DE JURADO)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Selecciona un examen profesional de la tabla para emitir tu voto deliberativo (A favor o En contra) y registrar tus observaciones.
                        </p>
                    </div>
                </div>

                {/* TABLA + PANEL LATERAL (Con Skeleton para carga lenta) */}
                <section className="flex flex-col gap-4">
                    <div
                        className={`grid gap-4 items-stretch transition-all ${
                            registroSeleccionado ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'
                        }`}
                    >
                        {/* ─── TABLA PRINCIPAL ─── */}
                        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                            <div>
                                {/* Barra de búsqueda y filtro */}
                                <div className="p-4 flex flex-col sm:flex-row gap-2 border-b border-border">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            value={query}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            placeholder="Buscar sustentante, matrícula, proyecto o cargo..."
                                            className="pl-9 bg-background border-border text-sm"
                                        />
                                    </div>
                                    <Select
                                        value={votoFiltro}
                                        onValueChange={(val) => {
                                            setVotoFiltro(val);
                                            handleFilter(query, val);
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-44 border-border bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Todos">Todos los votos</SelectItem>
                                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                                            <SelectItem value="A favor">A favor</SelectItem>
                                            <SelectItem value="En contra">En contra</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Tabla con Skeleton */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr className="border-b border-border">
                                                <th className="text-left font-semibold text-foreground px-4 py-3">
                                                    Sustentante
                                                </th>
                                                <th className="text-left font-semibold text-foreground px-4 py-3">
                                                    Proyecto de Tesis
                                                </th>
                                                <th className="text-center font-semibold text-foreground px-4 py-3">
                                                    Mi Cargo
                                                </th>
                                                <th className="text-left font-semibold text-foreground px-4 py-3">
                                                    Fecha y Sede de Examen
                                                </th>
                                                <th className="text-center font-semibold text-foreground px-4 py-3 w-32">
                                                    Mi Voto
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading ? (
                                                Array.from({ length: 6 }).map((_, i) => (
                                                    <tr key={`skeleton-${i}`} className="border-b border-border">
                                                        {[0, 1, 2, 3, 4].map((c) => (
                                                            <td key={c} className="px-4 py-4">
                                                                <div
                                                                    className="h-4 rounded bg-muted animate-pulse"
                                                                    style={{ width: `${60 + ((i + c) % 3) * 15}%` }}
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : dictamenes.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-10 text-muted-foreground">
                                                        No hay exámenes asignados con estos filtros.
                                                    </td>
                                                </tr>
                                            ) : (
                                                dictamenes.data.map((item) => {
                                                    const isSelected =
                                                        registroSeleccionado?.id_jurado_proyecto === item.id_jurado_proyecto;

                                                    return (
                                                        <tr
                                                            key={item.id_jurado_proyecto}
                                                            onClick={() => handleSeleccionarRegistro(item)}
                                                            className={`border-b border-border cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? 'bg-accent/30'
                                                                    : 'hover:bg-accent/20'
                                                            }`}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <p className="font-semibold text-foreground">
                                                                    {item.sustentante}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground font-mono">
                                                                    {item.matricula}
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-3 max-w-xs">
                                                                <p className="font-medium text-foreground truncate" title={item.titulo_proyecto}>
                                                                    {item.titulo_proyecto}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {item.carrera}
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 whitespace-nowrap">
                                                                    {item.cargo}
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                <p className="text-xs font-semibold text-foreground">
                                                                    {item.fecha_examen
                                                                        ? `${formatFecha(item.fecha_examen)} · ${item.hora_examen}`
                                                                        : 'Fecha por programar'}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {item.sede_examen}
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                <span
                                                                    className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${getBadgeStyles(
                                                                        item.voto
                                                                    )}`}
                                                                >
                                                                    {item.voto}
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

                            {/* PAGINACIÓN NATIVA DE LARAVEL */}
                            <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span>
                                    Mostrando <b className="text-foreground">{dictamenes.from || 0}</b> a{' '}
                                    <b className="text-foreground">{dictamenes.to || 0}</b> de{' '}
                                    <b className="text-foreground">{dictamenes.total}</b> registros
                                </span>

                                <div className="flex items-center gap-1">
                                    {dictamenes.links.map((link, index) => {
                                        const isPrevious = link.label.includes('Previous') || link.label.includes('pagination.previous');
                                        const isNext = link.label.includes('Next') || link.label.includes('pagination.next');

                                        if (isPrevious) {
                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    onStart={() => setIsLoading(true)}
                                                    onFinish={() => setIsLoading(false)}
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
                                                    onStart={() => setIsLoading(true)}
                                                    onFinish={() => setIsLoading(false)}
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
                                                onStart={() => setIsLoading(true)}
                                                onFinish={() => setIsLoading(false)}
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

                        {/* ─── PANEL LATERAL DE DICTAMEN (Misma altura exacta que la tabla) ─── */}
                        {registroSeleccionado && (
                            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full min-h-0 animate-in fade-in-50 duration-200">
                                <div className="p-4 border-b border-border flex items-start gap-3 shrink-0">
                                    <div className="size-12 rounded-full bg-accent/40 text-foreground flex items-center justify-center text-sm font-bold shrink-0">
                                        {registroSeleccionado.iniciales}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-foreground truncate">
                                            {registroSeleccionado.sustentante}
                                        </h3>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {registroSeleccionado.matricula} · {registroSeleccionado.email}
                                        </p>
                                        <span
                                            className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBadgeStyles(
                                                registroSeleccionado.voto
                                            )}`}
                                        >
                                            Voto: {registroSeleccionado.voto}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRegistroSeleccionado(null)}
                                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                            Datos de la defensa y jurado
                                        </h4>
                                        <div className="space-y-2.5">
                                            <div className="flex items-start gap-2">
                                                <Hash className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground">Matrícula</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {registroSeleccionado.matricula}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <FileText className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground">Proyecto de tesis</p>
                                                    <p className="text-xs font-semibold text-foreground leading-snug">
                                                        {registroSeleccionado.titulo_proyecto}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <GraduationCap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground">Carrera</p>
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {registroSeleccionado.carrera}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <Scale className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground">Tu cargo en el jurado</p>
                                                    <p className="text-sm font-bold text-[#10B981]">
                                                        {registroSeleccionado.cargo}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <Calendar className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground">Fecha y hora del examen</p>
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {registroSeleccionado.fecha_examen
                                                            ? `${formatFecha(registroSeleccionado.fecha_examen)} · ${registroSeleccionado.hora_examen}`
                                                            : 'Fecha por programar'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground">Sede asignada</p>
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {registroSeleccionado.sede_examen}
                                                    </p>
                                                </div>
                                            </div>

                                            {registroSeleccionado.fecha_emision && (
                                                <div className="flex items-start gap-2">
                                                    <Clock className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] uppercase text-muted-foreground">Dictamen registrado el</p>
                                                        <p className="text-xs font-semibold text-foreground">
                                                            {formatFecha(registroSeleccionado.fecha_emision)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                            Documento de tesis
                                        </h4>
                                        {registroSeleccionado.documento_tesis && registroSeleccionado.url_documento ? (
                                            <a
                                                href={registroSeleccionado.url_documento}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors overflow-hidden group cursor-pointer"
                                            >
                                                <div className="p-2.5 flex items-center justify-between bg-card">
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <div className="size-9 rounded-full bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                                                            <FileText className="size-4 text-[#EF4444]" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-foreground truncate">
                                                                {registroSeleccionado.documento_tesis}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Versión disponible · PDF
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Eye className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-center">
                                                <FileText className="size-5 text-muted-foreground mx-auto mb-1 opacity-60" />
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    El alumno aún no ha cargado el documento final de tesis.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                            Observaciones del dictamen
                                        </h4>
                                        <textarea
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                            disabled={registroSeleccionado.voto !== 'Pendiente' || isProcessingVoto}
                                            placeholder="Escribe aquí las observaciones, recomendaciones o fundamentación de tu voto para el acta de examen..."
                                            rows={3}
                                            className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        {errors?.observaciones && (
                                            <p className="text-[11px] text-[#EF4444] font-medium mt-1">
                                                {errors.observaciones}
                                            </p>
                                        )}
                                        {registroSeleccionado.voto !== 'Pendiente' && (
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Ya emitiste tu voto definitivo para este examen profesional.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 border-t border-border flex gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleEmitirVoto('En contra')}
                                        disabled={registroSeleccionado.voto !== 'Pendiente' || isProcessingVoto}
                                        title={
                                            registroSeleccionado.voto !== 'Pendiente'
                                                ? 'Ya emitiste tu voto para este proyecto'
                                                : undefined
                                        }
                                        className="flex-1 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ThumbsDown className="size-3.5" />
                                        En contra
                                    </Button>
                                    <Button
                                        onClick={() => handleEmitirVoto('A favor')}
                                        disabled={registroSeleccionado.voto !== 'Pendiente' || isProcessingVoto}
                                        title={
                                            registroSeleccionado.voto !== 'Pendiente'
                                                ? 'Ya emitiste tu voto para este proyecto'
                                                : undefined
                                        }
                                        className="flex-1 bg-[#10B981] hover:bg-[#0ea371] text-white gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ThumbsUp className="size-3.5" />
                                        A favor
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

EmitirVoto.layout = {
    breadcrumbs: [
        { title: 'Portal Docente', href: '/docente/dashboard' },
        { title: 'Emitir Voto', href: '/docente/jurado/emitir-voto' },
    ],
};
