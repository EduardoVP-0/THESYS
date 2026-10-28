import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpenText,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    GraduationCap,
    ReceiptText,
    ScrollText,
    Search,
    UserRoundCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    filters: {
        search?: string;
        tipo?: string;
    };
}

const CATALOGO = [
    {
        nombre: 'Registro de Titulación',
        descripcion: 'Formato inicial con datos del egresado, opción de titulación y tema.',
        Icon: GraduationCap,
    },
    {
        nombre: 'Asignación de Asesor',
        descripcion: 'Oficios para la designación formal de directores y revisores.',
        Icon: BookOpenText,
    },
    {
        nombre: 'Liberación de Tesis',
        descripcion: 'Documento o dictamen del asesor que aprueba el trabajo final.',
        Icon: UserRoundCheck,
    },
    {
        nombre: 'Votos del Jurado',
        descripcion: 'Dictámenes por escrito emitidos por el comité evaluador.',
        Icon: ReceiptText,
    },
    {
        nombre: 'Certificados Académicos',
        descripcion: 'Certificado de estudios profesionales y carta de pasante.',
        Icon: ScrollText,
    },
    {
        nombre: 'Constancias Administrativas',
        descripcion: 'Servicio social, carta de buena conducta y oficios de no adeudo.',
        Icon: ClipboardList,
    },
    {
        nombre: 'Autorización de Examen',
        descripcion: 'Trámite oficial y comprobantes de pago que habilitan la defensa.',
        Icon: CalendarCheck,
    },
    {
        nombre: 'Acta de Evaluación',
        descripcion: 'Documento oficial final emitido tras la deliberación del jurado.',
        Icon: ScrollText,
    },
];

export default function AlumnoOficiosIndex({ oficios, filters }: Props) {
    const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(filters.tipo || null);
    const [oficioSeleccionado, setOficioSeleccionado] = useState<Oficio | null>(null);
    const [query, setQuery] = useState(filters.search || '');

    // Estado de carga de la tabla (para mostrar skeleton)
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Función que consulta a Laravel en la ruta del alumno
    const handleFilter = (newTipo = tipoSeleccionado, newSearch = query) => {
        router.get(
            '/alumno/oficios_oficiales',
            {
                tipo: newTipo || undefined,
                search: newSearch || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['oficios', 'filters'],
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
            handleFilter(tipoSeleccionado, value);
        }, 350);
    };

    useEffect(() => {
        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, []);

    // Sincronizar oficio seleccionado cuando cambie la información en la lista
    useEffect(() => {
        if (oficioSeleccionado) {
            const actualizado = oficios.data.find(
                (o) => o.id_oficio_oficial === oficioSeleccionado.id_oficio_oficial
            );
            if (actualizado) {
                setOficioSeleccionado(actualizado);
            }
        }
    }, [oficios.data]);

    const handleSeleccionarTarjeta = (nombre: string) => {
        const nuevoTipo = tipoSeleccionado === nombre ? null : nombre;
        setTipoSeleccionado(nuevoTipo);
        setOficioSeleccionado(null);
        handleFilter(nuevoTipo, query);
    };

    return (
        <>
            <Head title="Oficios Oficiales" />

            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                {/* ENCABEZADO (Sin botón de Agregar) */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            OFICIOS OFICIALES
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Consulta y descarga de formatos y oficios oficiales del proceso de titulación
                        </p>
                    </div>
                </div>

                {/* CATÁLOGO DE TARJETAS */}
                <section className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {CATALOGO.map(({ nombre, descripcion, Icon }) => {
                            const activa = tipoSeleccionado === nombre;

                            return (
                                <button
                                    key={nombre}
                                    type="button"
                                    onClick={() => handleSeleccionarTarjeta(nombre)}
                                    className={`card cursor-pointer border text-left transition-all ${
                                        activa
                                            ? 'border-accent bg-accent/40 ring-2 ring-accent/40'
                                            : 'border-border bg-card hover:border-accent hover:bg-accent/20'
                                    }`}
                                >
                                    <div className="card-body gap-2 p-4">
                                        <div className="mb-1 flex items-center justify-start gap-x-2">
                                            <div className="rounded-lg bg-accent/30 p-2 text-foreground">
                                                <Icon className="size-4" />
                                            </div>
                                            <h3 className="text-sm leading-tight font-semibold text-foreground">
                                                {nombre}
                                            </h3>
                                        </div>
                                        <p className="text-xs leading-snug text-muted-foreground">
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
                                Selecciona un trámite para ver los oficios disponibles.
                            </p>
                        </div>
                    </div>
                </section>

                {/* TABLA + PANEL (solo si hay tarjeta seleccionada) */}
                {tipoSeleccionado && (
                    <section className="flex flex-col gap-4">
                        <div>
                            <h2 className="mt-1 text-xl font-bold text-foreground">
                                {tipoSeleccionado}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {oficios.total} oficio(s) disponible(s).
                            </p>
                        </div>

                        <div
                            className={`grid items-stretch gap-4 transition-all ${
                                oficioSeleccionado
                                    ? 'grid-cols-1 lg:grid-cols-[1fr_400px]'
                                    : 'grid-cols-1'
                            }`}
                        >
                            {/* ─── TABLA ─── */}
                            <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                <div>
                                    <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row">
                                        <div className="relative flex-1">
                                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={query}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                placeholder="Buscar nombre del oficio..."
                                                className="border-border bg-background pl-9 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/30">
                                                <tr className="border-b border-border">
                                                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                                                        Nombre del archivo
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                                                        Registrado por
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                                                        Fecha de publicación
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                                                        Estado
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isLoading ? (
                                                    Array.from({ length: 6 }).map((_, i) => (
                                                        <tr
                                                            key={`skeleton-${i}`}
                                                            className="border-b border-border"
                                                        >
                                                            {[0, 1, 2, 3].map((c) => (
                                                                <td key={c} className="px-4 py-4">
                                                                    <div
                                                                        className="h-4 animate-pulse rounded bg-muted"
                                                                        style={{
                                                                            width: `${60 + ((i + c) % 3) * 15}%`,
                                                                        }}
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))
                                                ) : oficios.data.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={4}
                                                            className="py-10 text-center text-muted-foreground"
                                                        >
                                                            No hay oficios registrados en esta categoría.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    oficios.data.map((o) => (
                                                        <tr
                                                            key={o.id_oficio_oficial}
                                                            onClick={() => setOficioSeleccionado(o)}
                                                            className={`cursor-pointer border-b border-border transition-colors ${
                                                                oficioSeleccionado?.id_oficio_oficial ===
                                                                o.id_oficio_oficial
                                                                    ? 'bg-accent/30'
                                                                    : 'hover:bg-accent/20'
                                                            }`}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="min-w-0">
                                                                        <p className="truncate font-semibold text-foreground">
                                                                            {o.nombre_oficio}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {o.usuario_registro
                                                                        ? o.usuario_registro.name
                                                                        : 'Administrador'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                                                                {new Date(
                                                                    o.created_at
                                                                ).toLocaleDateString('es-MX', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                                <span className="badge badge-success badge-soft bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                                                    Activo
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* PAGINACIÓN NATIVA DE LARAVEL */}
                                <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-card p-4 text-xs text-muted-foreground sm:flex-row">
                                    <span>
                                        Mostrando{' '}
                                        <b className="text-foreground">{oficios.from || 0}</b> a{' '}
                                        <b className="text-foreground">{oficios.to || 0}</b> de{' '}
                                        <b className="text-foreground">{oficios.total}</b> registros
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {oficios.links.map((link, index) => {
                                            const isPrevious =
                                                link.label.includes('Previous') ||
                                                link.label.includes('pagination.previous');
                                            const isNext =
                                                link.label.includes('Next') ||
                                                link.label.includes('pagination.next');

                                            if (isPrevious) {
                                                return (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`btn btn-xs gap-1 border border-border bg-card text-foreground hover:bg-accent/40 ${
                                                            !link.url
                                                                ? 'btn-disabled opacity-40'
                                                                : ''
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
                                                        className={`btn btn-xs gap-1 border border-border bg-card text-foreground hover:bg-accent/40 ${
                                                            !link.url
                                                                ? 'btn-disabled opacity-40'
                                                                : ''
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
                                                            ? 'border-accent bg-accent font-bold text-foreground'
                                                            : 'border-border bg-card text-foreground hover:bg-accent/40'
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

                            {/* ─── PANEL LATERAL (Solo vista previa + Ver Archivo Completo) ─── */}
                            {oficioSeleccionado && (
                                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                    {/* Vista previa del archivo (página 1) */}
                                    <div className="flex min-h-[380px] flex-1 flex-col p-3">
                                        <div className="relative w-full flex-1 overflow-hidden rounded-lg border border-border bg-muted/10 shadow-inner">
                                            <iframe
                                                key={`${oficioSeleccionado.id_oficio_oficial}-${oficioSeleccionado.url_archivo}`}
                                                src={`${oficioSeleccionado.url_archivo}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                                title={oficioSeleccionado.nombre_oficio}
                                                className="h-full min-h-[360px] w-full border-none bg-white dark:bg-card"
                                            />
                                        </div>
                                        <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-muted-foreground">
                                            <span
                                                className="max-w-[200px] truncate font-medium text-foreground"
                                                title={oficioSeleccionado.nombre_oficio}
                                            >
                                                {oficioSeleccionado.nombre_oficio}
                                            </span>
                                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                Vista previa (Pág. 1)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer acciones: Únicamente Ver Archivo Completo */}
                                    <div className="flex shrink-0 flex-col gap-2 border-t border-border p-4">
                                        <Button
                                            asChild
                                            className="w-full gap-1.5 bg-[#2D2D2D] text-xs font-semibold text-white hover:bg-[#2D2D2D]/90"
                                        >
                                            <a
                                                href={oficioSeleccionado.url_archivo}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Eye className="size-3.5" />
                                                Ver Archivo Completo
                                            </a>
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

AlumnoOficiosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Oficios Oficiales',
            href: '/alumno/oficios_oficiales',
        },
    ],
};
