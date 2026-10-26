import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Eye,
    Plus,
    RotateCcw,
    Scale,
    Search,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as examenesIndex } from '@/routes/admin/asignaciones/examenes';
import { index as veredictosIndex } from '@/routes/admin/veredictos';
import { DetalleVeredictoModal } from './detalle-veredicto-modal';
import { RegistrarVeredictoModal } from './registrar-veredicto-modal';
import { VeredictoBadge } from './status-badge';
import type { Veredicto, VeredictosIndexProps } from './types';

export default function VeredictosIndex({
    veredictos,
    proyectos,
    stats,
    filters,
    votos,
}: VeredictosIndexProps) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [estado, setEstado] = useState(filters.estado ?? 'todos');

    const [openRegistrar, setOpenRegistrar] = useState(false);
    const [openDetalle, setOpenDetalle] = useState(false);
    const [proyectoSeleccionado, setProyectoSeleccionado] =
        useState<Veredicto | null>(null);
    const [veredictoDetalle, setVeredictoDetalle] =
        useState<Veredicto | null>(null);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);

            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    const handleFilter = (
        newSearch = search,
        newEstado = estado,
        page?: number,
    ) => {
        router.get(
            veredictosIndex.url(),
            {
                search: newSearch || undefined,
                estado: newEstado === 'todos' ? undefined : newEstado,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setEstado('todos');
        router.get(
            veredictosIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const abrirRegistrar = (veredicto: Veredicto | null = null) => {
        setProyectoSeleccionado(veredicto);
        setOpenRegistrar(true);
    };

    const abrirDetalle = (veredicto: Veredicto) => {
        setVeredictoDetalle(veredicto);
        setOpenDetalle(true);
    };

    const registrarDesdeDetalle = (veredicto: Veredicto) => {
        setOpenDetalle(false);
        setVeredictoDetalle(null);
        abrirRegistrar(veredicto);
    };

    return (
        <>
            <Head title="Gestión de Veredictos" />

            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                {flash?.success && showAlert && (
                    <div className="alert flex animate-in items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 alert-soft px-4 py-2.5 text-sm alert-success text-foreground shadow-xs duration-300 fade-in-50 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAlert(false)}
                            className="text-lg leading-none text-muted-foreground hover:text-foreground"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {flash?.error && showAlert && (
                    <div className="alert flex animate-in items-center justify-between border-l-4 border-l-[#EF4444] bg-red-50 alert-soft px-4 py-2.5 text-sm alert-error text-foreground shadow-xs duration-300 fade-in-50 dark:bg-red-950/30">
                        <div className="flex items-center gap-2">
                            <XCircle className="size-4 text-[#EF4444]" />
                            <span className="font-medium">{flash.error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAlert(false)}
                            className="text-lg leading-none text-muted-foreground hover:text-foreground"
                        >
                            &times;
                        </button>
                    </div>
                )}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            GESTIÓN DE VEREDICTOS
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Registra y consulta los resultados de los exámenes
                            profesionales.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                            asChild
                            variant="outline"
                            className="gap-2 border-border bg-background font-medium text-foreground hover:bg-accent/40"
                        >
                            <Link href={examenesIndex.url()}>
                                <CalendarClock className="size-4" />
                                Programar examen
                            </Link>
                        </Button>
                        <Button
                            onClick={() => abrirRegistrar()}
                            disabled={proyectos.length === 0}
                            title={
                                proyectos.length === 0
                                    ? 'Primero programa un examen profesional'
                                    : undefined
                            }
                            className="gap-2 border-2 border-[#10B981] bg-background font-semibold text-[#10B981] shadow-xs hover:bg-[#10B981]/10 hover:text-[#10B981] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="size-4 text-[#10B981]" />
                            Registrar veredicto
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-[#10B981]/15 p-2.5 text-[#10B981]">
                                    <Scale className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Total veredictos
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.total}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-[#10B981]/15 p-2.5 text-[#10B981]">
                                    <CheckCircle2 className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Aprobados
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.aprobados}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-amber-500/15 p-2.5 text-amber-500">
                                    <AlertTriangle className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Con observaciones
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.observaciones}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-500/15 p-2.5 text-blue-500">
                                    <Clock3 className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Por resolver
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.por_resolver}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar por estudiante, título o matrícula..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                handleFilter(event.target.value, estado);
                            }}
                            className="rounded-xl border-border bg-background pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-ring"
                        />
                    </div>

                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <Select
                            value={estado}
                            onValueChange={(value) => {
                                setEstado(value);
                                handleFilter(search, value);
                            }}
                        >
                            <SelectTrigger className="w-full rounded-xl border-border bg-background text-sm text-foreground md:w-52">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-popover">
                                <SelectItem value="todos">
                                    Todos los estados
                                </SelectItem>
                                <SelectItem value="aprobado">
                                    Aprobados
                                </SelectItem>
                                <SelectItem value="observaciones">
                                    Con observaciones
                                </SelectItem>
                                <SelectItem value="revision">
                                    En revisión
                                </SelectItem>
                                <SelectItem value="pendiente">
                                    Pendientes
                                </SelectItem>
                                <SelectItem value="rechazado">
                                    Rechazados
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {(search || estado !== 'todos') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                                title="Restablecer filtros"
                            >
                                <RotateCcw className="size-3" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[1000px] table-fixed">
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-b border-border hover:bg-transparent">
                                    <TableHead className="w-[22%] font-semibold text-foreground">
                                        Estudiante
                                    </TableHead>
                                    <TableHead className="w-[31%] font-semibold text-foreground">
                                        Título de tesis
                                    </TableHead>
                                    <TableHead className="w-[12%] font-semibold text-foreground">
                                        Fecha
                                    </TableHead>
                                    <TableHead className="w-[10%] text-center font-semibold text-foreground">
                                        Voto
                                    </TableHead>
                                    <TableHead className="w-[13%] text-center font-semibold text-foreground">
                                        Estado
                                    </TableHead>
                                    <TableHead className="w-[12%] text-center font-semibold text-foreground">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {veredictos.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-12 text-center"
                                        >
                                            <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                                                <Scale className="size-8 text-muted-foreground/50" />
                                                <p className="font-medium text-foreground">
                                                    No se encontraron veredictos
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {proyectos.length === 0
                                                        ? 'Programa un examen profesional para comenzar a registrar veredictos.'
                                                        : 'Ajusta los filtros de búsqueda para consultar otros resultados.'}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    veredictos.data.map((veredicto) => (
                                        <TableRow
                                            key={veredicto.id_examen}
                                            className="border-b border-border transition-colors hover:bg-accent/20"
                                        >
                                            <TableCell>
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#10B981]/15 text-xs font-bold text-[#10B981]">
                                                        {
                                                            veredicto.estudiante
                                                                .iniciales
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p
                                                            className="truncate text-sm font-semibold text-foreground"
                                                            title={
                                                                veredicto
                                                                    .estudiante
                                                                    .nombre_completo
                                                            }
                                                        >
                                                            {
                                                                veredicto
                                                                    .estudiante
                                                                    .nombre_completo
                                                            }
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {
                                                                veredicto
                                                                    .estudiante
                                                                    .matricula
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <p
                                                    className="line-clamp-2 text-sm font-medium text-foreground"
                                                    title={veredicto.titulo}
                                                >
                                                    {veredicto.titulo}
                                                </p>
                                            </TableCell>

                                            <TableCell>
                                                <p className="text-sm font-medium text-foreground">
                                                    {veredicto.fecha}
                                                </p>
                                                <p
                                                    className="truncate text-[11px] text-muted-foreground"
                                                    title={`${veredicto.hora} · ${
                                                        veredicto.sede ??
                                                        'Sin sede'
                                                    }`}
                                                >
                                                    {veredicto.hora} ·{' '}
                                                    {veredicto.sede ??
                                                        'Sin sede'}
                                                </p>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                {veredicto.votos.emitidos ===
                                                0 ? (
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        Pendiente
                                                    </span>
                                                ) : (
                                                    <>
                                                        <p className="text-base font-bold">
                                                            <span className="text-[#0F9F6E] dark:text-[#34D399]">
                                                                {
                                                                    veredicto
                                                                        .votos
                                                                        .favor
                                                                }
                                                            </span>
                                                            <span className="mx-1 text-muted-foreground">
                                                                —
                                                            </span>
                                                            <span
                                                                className={
                                                                    veredicto
                                                                        .votos
                                                                        .contra >
                                                                    0
                                                                        ? 'text-red-500'
                                                                        : 'text-muted-foreground'
                                                                }
                                                            >
                                                                {
                                                                    veredicto
                                                                        .votos
                                                                        .contra
                                                                }
                                                            </span>
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {
                                                                veredicto.votos
                                                                    .emitidos
                                                            }{' '}
                                                            de{' '}
                                                            {
                                                                veredicto.votos
                                                                    .titulares
                                                            }{' '}
                                                            votos
                                                        </p>
                                                    </>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <VeredictoBadge
                                                    estado={veredicto.estado}
                                                    estadoKey={
                                                        veredicto.estado_key
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            abrirDetalle(
                                                                veredicto,
                                                            )
                                                        }
                                                        title="Ver detalle del veredicto"
                                                        className="size-8 border-border bg-background text-muted-foreground hover:bg-accent/40"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            abrirRegistrar(
                                                                veredicto,
                                                            )
                                                        }
                                                        disabled={
                                                            !veredicto.puede_registrar
                                                        }
                                                        title="Registrar o actualizar veredicto"
                                                        className="size-8 border-[#10B981]/70 bg-background text-[#10B981] hover:bg-[#10B981]/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <Plus className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-card p-4 text-sm text-foreground sm:flex-row">
                        <p className="text-xs text-muted-foreground">
                            Mostrando{' '}
                            <span className="font-semibold text-foreground">
                                {veredictos.from ?? 0}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-foreground">
                                {veredictos.to ?? 0}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-foreground">
                                {veredictos.total}
                            </span>{' '}
                            registros
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={veredictos.current_page <= 1}
                                onClick={() =>
                                    handleFilter(
                                        search,
                                        estado,
                                        veredictos.current_page - 1,
                                    )
                                }
                                className="h-8 gap-1 border-border bg-background text-xs"
                            >
                                <ChevronLeft className="size-3.5" />
                                Anterior
                            </Button>
                            <span className="min-w-24 text-center text-[11px] font-medium text-muted-foreground">
                                Página {veredictos.current_page} de{' '}
                                {Math.max(1, veredictos.last_page)}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                    veredictos.current_page >=
                                    veredictos.last_page
                                }
                                onClick={() =>
                                    handleFilter(
                                        search,
                                        estado,
                                        veredictos.current_page + 1,
                                    )
                                }
                                className="h-8 gap-1 border-border bg-background text-xs"
                            >
                                Siguiente
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <RegistrarVeredictoModal
                open={openRegistrar}
                onOpenChange={(isOpen) => {
                    setOpenRegistrar(isOpen);

                    if (!isOpen) {
                        setProyectoSeleccionado(null);
                    }
                }}
                proyectos={proyectos}
                votos={votos}
                proyectoInicial={proyectoSeleccionado}
            />
            <DetalleVeredictoModal
                open={openDetalle}
                onOpenChange={setOpenDetalle}
                veredicto={veredictoDetalle}
                onRegistrar={registrarDesdeDetalle}
            />
        </>
    );
}

VeredictosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Veredictos',
            href: '/admin/veredictos',
        },
    ],
};
