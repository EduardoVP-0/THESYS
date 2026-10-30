import {
    ChevronLeft,
    ChevronRight,
    Info,
    Search,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import type { DocenteJurado } from '../types';

const PAGE_SIZE = 5;

interface DocentesTableProps {
    docentes: DocenteJurado[];
    selectedSlots: Record<number, string>;
    advisorIds: number[];
    sustentanteIds: number[];
}

export function DocentesTable({
    docentes,
    selectedSlots,
    advisorIds,
    sustentanteIds,
}: DocentesTableProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const filteredDocentes = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (term === '') {
            return docentes;
        }

        return docentes.filter((docente) => {
            return [
                docente.nombre_completo,
                docente.email ?? '',
                docente.cedula_profesional ?? '',
                docente.especialidad ?? '',
                docente.grado_academico ?? '',
            ].some((value) => value.toLowerCase().includes(term));
        });
    }, [docentes, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredDocentes.length / PAGE_SIZE),
    );

    useEffect(() => {
        setPage(1);
    }, [search, docentes]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const pageStart = (page - 1) * PAGE_SIZE;
    const pageItems = filteredDocentes.slice(pageStart, pageStart + PAGE_SIZE);

    const rangoInicio = filteredDocentes.length === 0 ? 0 : pageStart + 1;
    const rangoFin = Math.min(pageStart + PAGE_SIZE, filteredDocentes.length);

    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#10B981]/15 p-2.5 text-[#10B981]">
                        <UsersRound className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-full bg-[#10B981]/15 text-[10px] font-bold text-[#10B981]">
                                2
                            </span>
                            <h2 className="text-lg font-bold text-foreground">
                                Docentes disponibles
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Busca y revisa los docentes activos que pueden
                            integrar el jurado.
                        </p>
                    </div>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                            }
                        }}
                        placeholder="Buscar por nombre, cédula, correo o especialidad..."
                        className="h-10 rounded-xl border-border bg-background pl-9 text-sm placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="overflow-x-auto">
                    <Table className="min-w-[900px] table-fixed">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[26%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Docente
                                </TableHead>
                                <TableHead className="w-[14%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Cédula profesional
                                </TableHead>
                                <TableHead className="w-[18%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Correo
                                </TableHead>
                                <TableHead className="w-[22%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Especialidad
                                </TableHead>
                                <TableHead className="w-[20%] px-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                                    Selección
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {pageItems.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                                    >
                                        No hay docentes activos que coincidan
                                        con la búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageItems.map((docente) => {
                                    const cargoSeleccionado =
                                        selectedSlots[docente.id_usuario];
                                    const esAsesor = advisorIds.includes(
                                        docente.id_usuario,
                                    );
                                    const esSustentante =
                                        sustentanteIds.includes(
                                            docente.id_usuario,
                                        );

                                    return (
                                        <TableRow
                                            key={docente.id_usuario}
                                            className={
                                                cargoSeleccionado
                                                    ? 'bg-[#10B981]/5 hover:bg-[#10B981]/10'
                                                    : 'hover:bg-accent/20'
                                            }
                                        >
                                            <TableCell className="px-4 py-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#10B981]/25 bg-[#10B981]/15 text-xs font-bold text-[#10B981]">
                                                        {docente.iniciales ||
                                                            'DC'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p
                                                            className="truncate text-sm font-bold text-foreground"
                                                            title={
                                                                docente.nombre_completo
                                                            }
                                                        >
                                                            {
                                                                docente.nombre_completo
                                                            }
                                                        </p>
                                                        <p className="truncate text-[11px] text-muted-foreground">
                                                            {docente.grado_academico ??
                                                                'Sin grado registrado'}
                                                            {docente.tipo_contrato
                                                                ? ` · ${docente.tipo_contrato}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                                                {docente.cedula_profesional ??
                                                    'No registrada'}
                                            </TableCell>

                                            <TableCell className="max-w-[220px] px-4 py-3">
                                                <span
                                                    className="block truncate text-xs text-muted-foreground"
                                                    title={
                                                        docente.email ??
                                                        'Sin correo registrado'
                                                    }
                                                >
                                                    {docente.email ??
                                                        'Sin correo registrado'}
                                                </span>
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <span
                                                    className="block truncate text-xs font-medium text-foreground"
                                                    title={
                                                        docente.especialidad ??
                                                        'Sin especialidad registrada'
                                                    }
                                                >
                                                    {docente.especialidad ??
                                                        'Sin especialidad registrada'}
                                                </span>
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                {cargoSeleccionado ? (
                                                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2.5 py-1 text-[10px] font-semibold text-[#0F9F6E] dark:text-[#34D399] whitespace-nowrap">
                                                        <span className="size-1.5 rounded-full bg-[#10B981]" />
                                                        Seleccionado ·{' '}
                                                        {cargoSeleccionado}
                                                    </span>
                                                ) : esSustentante ? (
                                                    <span className="inline-flex w-fit items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                                                        No elegible (Sustentante)
                                                    </span>
                                                ) : esAsesor ? (
                                                    <span
                                                        className="inline-flex w-fit items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap"
                                                        title="Docente asignado como Director/Asesor de esta tesis. Puede ser Secretario, Vocal o Suplente, pero no puede ser Presidente."
                                                    >
                                                        Director de tesis · No Presidente
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                                                        Disponible
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/10 px-4 py-3 sm:flex-row">
                    <p className="text-[11px] text-muted-foreground">
                        Mostrando {rangoInicio}–{rangoFin} de{' '}
                        {filteredDocentes.length} docentes
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() =>
                                setPage((current) => Math.max(1, current - 1))
                            }
                            className="h-8 gap-1 border-border bg-background text-xs"
                        >
                            <ChevronLeft className="size-3.5" />
                            Anterior
                        </Button>
                        <span className="min-w-24 text-center text-[11px] font-medium text-muted-foreground">
                            Página {page} de {totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage((current) =>
                                    Math.min(totalPages, current + 1),
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

            <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0 text-[#10B981]" />
                Los docentes se acomodan por cargo en la estructura oficial del
                jurado. El asesor del proyecto puede integrarlo, pero nunca como
                presidente.
            </p>
        </section>
    );
}
