import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    MapPin,
    Pencil,
    Plus,
    Power,
    RotateCcw,
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
import {
    index as sedesIndex,
    toggleStatus as toggleSedeStatus,
} from '@/routes/admin/sedes';
import { CreateModal } from './create-modal';
import { EditModal } from './edit-modal';
import { ShowModal } from './show-modal';
import type { Sede, SedesIndexProps } from './types';

export default function SedesIndex({ sedes, stats, filters }: SedesIndexProps) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;

    const [showAlert, setShowAlert] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [estado, setEstado] = useState(filters.estado ?? 'todos');

    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openShow, setOpenShow] = useState(false);
    const [sedeToEdit, setSedeToEdit] = useState<Sede | null>(null);
    const [sedeToShow, setSedeToShow] = useState<Sede | null>(null);

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
            sedesIndex.url(),
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
            sedesIndex.url(),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleOpenEdit = (sede: Sede) => {
        setSedeToEdit(sede);
        setOpenEdit(true);
    };

    const handleOpenShow = (sede: Sede) => {
        setSedeToShow(sede);
        setOpenShow(true);
    };

    const handleToggleStatus = (sede: Sede) => {
        const accion = sede.estado ? 'dar de baja' : 'activar';

        if (
            confirm(
                `¿Estás seguro de que deseas ${accion} la sede "${sede.nombre_sede}"?`,
            )
        ) {
            router.patch(
                toggleSedeStatus.url(sede.id_sede),
                {},
                { preserveScroll: true },
            );
        }
    };

    return (
        <>
            <Head title="Gestión de Sedes" />

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
                            GESTIÓN DE SEDES
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Administración de los espacios disponibles para
                            programar exámenes profesionales.
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
                            onClick={() => setOpenCreate(true)}
                            className="gap-2 border-2 border-[#10B981] bg-background font-semibold text-[#10B981] shadow-xs hover:bg-[#10B981]/10 hover:text-[#10B981]"
                        >
                            <Plus className="size-4 text-[#10B981]" />
                            Agregar Sede
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-[#10B981]/15 p-2.5 text-[#10B981]">
                                    <MapPin className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Total Sedes
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
                                        Activas
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.activas}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-[#EF4444]/15 p-2.5 text-[#EF4444]">
                                    <XCircle className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Inactivas
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.inactivas}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-accent/30 p-2.5 text-foreground">
                                    <CalendarClock className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Exámenes programados
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.examenes_programados}
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
                            placeholder="Buscar por nombre o dirección..."
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
                            <SelectTrigger className="w-full rounded-xl border-border bg-background text-sm text-foreground md:w-44">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-popover">
                                <SelectItem value="todos">
                                    Todos los estados
                                </SelectItem>
                                <SelectItem value="activa">
                                    Solo activas
                                </SelectItem>
                                <SelectItem value="inactiva">
                                    Solo inactivas
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
                        <Table className="min-w-[900px] table-fixed">
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-b border-border hover:bg-transparent">
                                    <TableHead className="w-[11%] font-semibold text-foreground">
                                        Clave
                                    </TableHead>
                                    <TableHead className="w-[25%] font-semibold text-foreground">
                                        Sede
                                    </TableHead>
                                    <TableHead className="w-[30%] font-semibold text-foreground">
                                        Dirección
                                    </TableHead>
                                    <TableHead className="w-[10%] text-center font-semibold text-foreground">
                                        Exámenes
                                    </TableHead>
                                    <TableHead className="w-[10%] text-center font-semibold text-foreground">
                                        Estado
                                    </TableHead>
                                    <TableHead className="w-[14%] text-center font-semibold text-foreground">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {sedes.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No se encontraron sedes registradas
                                            con los filtros aplicados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sedes.data.map((sede) => (
                                        <TableRow
                                            key={sede.id_sede}
                                            className="border-b border-border transition-colors hover:bg-accent/20"
                                        >
                                            <TableCell className="font-bold text-foreground">
                                                {sede.clave}
                                            </TableCell>

                                            <TableCell className="font-medium text-foreground">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981]">
                                                        <MapPin className="size-4" />
                                                    </div>
                                                    <span
                                                        className="block truncate"
                                                        title={sede.nombre_sede}
                                                    >
                                                        {sede.nombre_sede}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="max-w-[240px] text-muted-foreground">
                                                <span
                                                    className="block truncate text-xs"
                                                    title={
                                                        sede.direccion ??
                                                        'Sin dirección registrada'
                                                    }
                                                >
                                                    {sede.direccion ??
                                                        'Sin dirección registrada'}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <span
                                                    className={`inline-flex min-w-8 justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                        sede.examenes_count > 0
                                                            ? 'border-[#10B981]/20 bg-[#10B981]/10 text-[#0F9F6E] dark:text-[#34D399]'
                                                            : 'border-border bg-muted/50 text-muted-foreground'
                                                    }`}
                                                >
                                                    {sede.examenes_count}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                {sede.estado ? (
                                                    <span className="inline-flex rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2.5 py-1 text-xs font-semibold text-[#0F9F6E] dark:text-[#34D399]">
                                                        Activa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                                                        Inactiva
                                                    </span>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleOpenShow(sede)
                                                        }
                                                        title="Ver detalles"
                                                        className="size-8 border-border bg-background text-muted-foreground hover:bg-accent/40"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleOpenEdit(sede)
                                                        }
                                                        title="Editar sede"
                                                        className="size-8 border-amber-400/70 bg-background text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                sede,
                                                            )
                                                        }
                                                        title={
                                                            sede.estado
                                                                ? 'Dar de baja'
                                                                : 'Activar sede'
                                                        }
                                                        className={`size-8 bg-background ${
                                                            sede.estado
                                                                ? 'border-[#EF4444]/70 text-[#EF4444] hover:bg-red-500/10'
                                                                : 'border-[#10B981]/70 text-[#10B981] hover:bg-[#10B981]/10'
                                                        }`}
                                                    >
                                                        <Power className="size-3.5" />
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
                                {sedes.from ?? 0}
                            </span>{' '}
                            a{' '}
                            <span className="font-semibold text-foreground">
                                {sedes.to ?? 0}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-foreground">
                                {sedes.total}
                            </span>{' '}
                            registros
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={sedes.current_page <= 1}
                                onClick={() =>
                                    handleFilter(
                                        search,
                                        estado,
                                        sedes.current_page - 1,
                                    )
                                }
                                className="h-8 gap-1 border-border bg-background text-xs"
                            >
                                <ChevronLeft className="size-3.5" />
                                Anterior
                            </Button>
                            <span className="min-w-24 text-center text-[11px] font-medium text-muted-foreground">
                                Página {sedes.current_page} de{' '}
                                {Math.max(1, sedes.last_page)}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={sedes.current_page >= sedes.last_page}
                                onClick={() =>
                                    handleFilter(
                                        search,
                                        estado,
                                        sedes.current_page + 1,
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

            <CreateModal open={openCreate} onOpenChange={setOpenCreate} />
            <EditModal
                open={openEdit}
                onOpenChange={setOpenEdit}
                sede={sedeToEdit}
            />
            <ShowModal
                open={openShow}
                onOpenChange={setOpenShow}
                sede={sedeToShow}
            />
        </>
    );
}

SedesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Sedes',
            href: '/admin/sedes',
        },
    ],
};
