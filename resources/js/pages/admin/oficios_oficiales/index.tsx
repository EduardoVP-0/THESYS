import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Search, X, FileText, Download, Check, AlertCircle,
    Eye, Pencil,
    Plus,
    Trash2,
    GraduationCap,
    BookOpenText,
    UserRoundCheck,
    ReceiptText,
    ScrollText,
    ClipboardList,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Modales Crear
import { CreateModal } from './create-modal';

// ─── Tipo real proveniente de la base de datos ───
interface Oficio {
    id_oficio_oficial: number;
    nombre_oficio: string;
    tipo: string;
    url_archivo: string;
    estado: boolean;
    created_at: string;
    id_usuario_registro?: number | null;
    usuario_registro?: {
        id: number;
        name: string;
    } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedOficios {
    data: Oficio[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    oficios: PaginatedOficios;
    pendientesPorTipo: Record<string, number>;
    filters: {
        search?: string;
        estado?: string;
        tipo?: string;
    };
}

const CATALOGO = [
    { nombre: 'Registro de Titulación',      descripcion: 'Formato inicial con datos del egresado, opción de titulación y tema.', Icon: GraduationCap},
    { nombre: 'Asignación de Asesor',        descripcion: 'Oficios para la designación formal de directores y revisores.' , Icon: BookOpenText},
    { nombre: 'Liberación de Tesis',         descripcion: 'Documento o dictamen del asesor que aprueba el trabajo final.', Icon:  UserRoundCheck},
    { nombre: 'Votos del Jurado',            descripcion: 'Dictámenes por escrito emitidos por el comité evaluador.', Icon: ReceiptText},
    { nombre: 'Certificados Académicos',     descripcion: 'Certificado de estudios profesionales y carta de pasante.' , Icon: ScrollText},
    { nombre: 'Constancias Administrativas', descripcion: 'Servicio social, carta de buena conducta y oficios de no adeudo.' , Icon: ClipboardList},
    { nombre: 'Autorización de Examen',      descripcion: 'Trámite oficial y comprobantes de pago que habilitan la defensa.' , Icon: CalendarCheck},
    { nombre: 'Acta de Evaluación',          descripcion: 'Documento oficial final emitido tras la deliberación del jurado.' , Icon: ScrollText},
];

export default function OficiosIndex({ oficios, pendientesPorTipo = {}, filters }: Props) {
    const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(filters.tipo || null);
    const [oficioSeleccionado, setOficioSeleccionado] = useState<Oficio | null>(null);
    const [query, setQuery] = useState(filters.search || '');
    const [estadoFiltro, setEstadoFiltro] = useState(filters.estado || 'Todos');

    // Función que consulta a Laravel igual que en Carreras
    const handleFilter = (newTipo = tipoSeleccionado, newSearch = query, newEstado = estadoFiltro) => {
        router.get(
            '/admin/oficios_oficiales',
            {
                tipo: newTipo || undefined,
                search: newSearch || undefined,
                estado: newEstado !== 'Todos' ? newEstado : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const [openCreate, setOpenCreate] = useState(false);
    
    const handleSeleccionarTarjeta = (nombre: string) => {
        const nuevoTipo = tipoSeleccionado === nombre ? null : nombre;
        setTipoSeleccionado(nuevoTipo);
        setOficioSeleccionado(null);
        handleFilter(nuevoTipo, query, estadoFiltro);
    };

    return (
        <>
            <Head title="Gestión de Oficios Oficiales" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">

                {/* ENCABEZADO */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            GESTIÓN DE OFICIOS OFICIALES
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Administración de oficios oficiales del sistema de titulación
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Botón Agregar: Fondo blanco, borde y texto en verde (#10B981) */}
                        <Button
                            onClick={() => setOpenCreate(true)}
                            className="bg-background hover:bg-accent/40 text-[#10B981] border-2 border-[#10B981] font-semibold shadow-xs gap-2"
                        >
                            <Plus className="size-4 text-[#10B981]" />
                            Agregar Oficio
                        </Button>
                    </div>
                </div>

                {/* CATÁLOGO DE TARJETAS */}
                <section className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {CATALOGO.map(({ nombre, descripcion, Icon }) => {
                            const activa = tipoSeleccionado === nombre;
                            // Conteo agrupado que viene del controlador
                            const pendientes = pendientesPorTipo[nombre] || 0;

                            return (
                                <button
                                    key={nombre}
                                    type="button"
                                    onClick={() => handleSeleccionarTarjeta(nombre)}
                                    className={`card text-left border transition-all cursor-pointer ${
                                        activa
                                            ? 'bg-accent/40 border-accent ring-2 ring-accent/40'
                                            : 'bg-card border-border hover:border-accent hover:bg-accent/20'
                                    }`}
                                >
                                    <div className="card-body p-4 gap-2">
                                        <div className="flex items-center justify-start gap-x-2 mb-1">
                                            <div className="p-2 rounded-lg bg-accent/30 text-foreground">
                                                <Icon className="size-4" />
                                            </div>
                                            <h3 className="font-semibold text-sm text-foreground leading-tight">
                                                {nombre}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-snug">
                                            {descripcion}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Selecciona un trámite para ver los oficios registrados.
                            </p>
                        </div>
                    </div>
                </section>

                {/* TABLA + PANEL (solo si hay tarjeta seleccionada) */}
                {tipoSeleccionado && (
                    <section className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-foreground mt-1">{tipoSeleccionado}</h2>
                            <p className="text-sm text-muted-foreground">
                                {oficios.total} oficio(s) registrado(s).
                            </p>
                        </div>

                        <div className={`grid gap-4 items-stretch transition-all ${
                            oficioSeleccionado ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'
                        }`}>
                            {/* ─── TABLA ─── */}
                            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="p-4 flex flex-col sm:flex-row gap-2 border-b border-border">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            value={query}
                                            onChange={(e) => {
                                                setQuery(e.target.value);
                                                handleFilter(tipoSeleccionado, e.target.value, estadoFiltro);
                                            }}
                                            placeholder="Buscar nombre del oficio..."
                                            className="pl-9 bg-background border-border text-sm"
                                        />
                                    </div>
                                    <Select 
                                        value={estadoFiltro} 
                                        onValueChange={(val) => {
                                            setEstadoFiltro(val);
                                            handleFilter(tipoSeleccionado, query, val);
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-44 border-border bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Todos">Todos</SelectItem>
                                            <SelectItem value="1">Activos</SelectItem>
                                            <SelectItem value="0">Inactivos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr className="border-b border-border">
                                                <th className="text-left font-semibold text-foreground px-4 py-3">Nombre del archivo</th>
                                                <th className="text-left font-semibold text-foreground px-4 py-3">Registrado por</th>
                                                <th className="text-left font-semibold text-foreground px-4 py-3">Fecha de publicacion</th>
                                                <th className="text-left font-semibold text-foreground px-4 py-3">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {oficios.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-10 text-muted-foreground">
                                                        No hay oficios registrados con estos filtros.
                                                    </td>
                                                </tr>
                                            ) : (
                                                oficios.data.map((o) => (
                                                    <tr
                                                        key={o.id_oficio_oficial}
                                                        onClick={() => setOficioSeleccionado(o)}
                                                        className={`border-b border-border cursor-pointer transition-colors ${
                                                            oficioSeleccionado?.id_oficio_oficial === o.id_oficio_oficial
                                                                ? 'bg-accent/30'
                                                                : 'hover:bg-accent/20'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-foreground truncate">
                                                                        {o.nombre_oficio}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs text-muted-foreground">
                                                                {o.usuario_registro ? o.usuario_registro.name : 'Administrador'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                                                            {new Date(o.created_at).toLocaleDateString('es-MX', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                            {o.estado ? (
                                                                <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 badge badge-success badge-soft font-semibold text-xs px-2.5 py-0.5">
                                                                    Activo
                                                                </span>
                                                            ) : (
                                                                <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 badge badge-error badge-soft font-semibold text-xs px-2.5 py-0.5">
                                                                    Inactivo
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                </div>

                                {/* PAGINACIÓN NATIVA DE LARAVEL (Idéntica a Carreras) */}
                                <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                                    <span>
                                        Mostrando <b className="text-foreground">{oficios.from || 0}</b> a{' '}
                                        <b className="text-foreground">{oficios.to || 0}</b> de{' '}
                                        <b className="text-foreground">{oficios.total}</b> registros
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {oficios.links.map((link, index) => {
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
                                                            !link.url ? 'btn-disabled opacity-40' : ''
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
                                                    } ${!link.url ? 'btn-disabled opacity-40' : ''}`}
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
                            {oficioSeleccionado && (
                                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full">

                                    {/* Vista previa del archivo (ocupa todo el alto disponible) */}
                                    <div className="flex-1 p-4 flex">
                                        <div className="flex-1 rounded-lg border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center p-6 text-center min-h-[320px]">
                                            <div className="size-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-3">
                                                <FileText className="size-8 text-[#EF4444]" />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {oficioSeleccionado.nombre_oficio}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Archivo oficial del catálogo
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-3 px-3 py-1 rounded-full bg-muted">
                                                {oficioSeleccionado.url_archivo.split('/').pop() || 'oficio.pdf'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer acciones */}
                                    <div className="p-4 border-t border-border flex flex-col gap-2 flex-shrink-0">
                                        {/* Ver Archivo (ancho completo) */}
                                        <Button
                                            asChild
                                            className="w-full bg-[#2D2D2D] hover:bg-[#2D2D2D]/90 text-white gap-1.5 text-xs font-semibold"
                                        >
                                            <a href={oficioSeleccionado.url_archivo} target="_blank" rel="noopener noreferrer">
                                                <Eye className="size-3.5" />
                                                Ver Archivo
                                            </a>
                                        </Button>

                                        {/* Fila: Eliminar + Actualizar */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    if (confirm('¿Eliminar este oficio?')) {
                                                        setOficioSeleccionado(null);
                                                    }
                                                }}
                                                className="flex-1 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 gap-1.5 text-xs font-semibold"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Eliminar
                                            </Button>
                                            <Button
                                                className="flex-1 bg-[#10B981] hover:bg-[#0ea371] text-white gap-1.5 text-xs font-semibold"
                                            >
                                                <Pencil className="size-3.5" />
                                                Editar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </section>
                )}

            </div>
            <CreateModal 
                open={openCreate} 
                onOpenChange={setOpenCreate} 
            />
        </>
    );
}

OficiosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Oficios Oficiales',
            href: '/admin/oficios_oficiales',
        },
    ],
};
