import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    Clock3,
    Plus,
    UsersRound,
} from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { index } from '@/routes/admin/asignaciones/jurados';
import { ConsultaTable } from './components/consulta-table';
import { JuradosTabs } from './components/jurados-tabs';
import { esEstadoAceptado, esEstadoRechazado } from './jury-utils';
import type { ConsultaJuradosProps } from './types';

/**
 * VISTA DE CONSULTA: JURADOS CONFORMADOS POR PROYECTO DE TESIS
 */
export default function ConsultaJurados({ proyectos }: ConsultaJuradosProps) {
    const stats = useMemo(() => {
        const miembros = proyectos.flatMap((proyecto) => proyecto.jurado);
        const aceptados = miembros.filter((miembro) =>
            esEstadoAceptado(miembro.estado_aceptacion),
        ).length;
        const pendientes = miembros.filter(
            (miembro) =>
                !esEstadoAceptado(miembro.estado_aceptacion) &&
                !esEstadoRechazado(miembro.estado_aceptacion),
        ).length;

        return {
            proyectos: proyectos.length,
            miembros: miembros.length,
            aceptados,
            pendientes,
        };
    }, [proyectos]);

    return (
        <>
            <Head title="Jurados Asignados" />

            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            JURADOS ASIGNADOS
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Consulta las conformaciones de jurado registradas
                            por proyecto de tesis y el estado de aceptación de
                            cada integrante.
                        </p>
                    </div>

                    <Button
                        asChild
                        className="w-full gap-2 bg-[#10B981] font-semibold text-white shadow-xs hover:bg-[#0FA875] sm:w-auto"
                    >
                        <Link href={index.url()}>
                            <Plus className="size-4" />
                            Asignar jurado
                        </Link>
                    </Button>
                </div>

                <JuradosTabs />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-[#10B981]/15 p-2.5 text-[#10B981]">
                                    <UsersRound className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Tesis con jurado
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.proyectos}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-500/15 p-2.5 text-blue-600 dark:text-blue-400">
                                    <ClipboardList className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Miembros registrados
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.miembros}
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
                                        Aceptados
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.aceptados}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border bg-card shadow-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-amber-500/15 p-2.5 text-amber-600 dark:text-amber-400">
                                    <Clock3 className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Pendientes
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {stats.pendientes}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <ConsultaTable proyectos={proyectos} />
            </div>
        </>
    );
}

ConsultaJurados.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Asignaciones',
            href: '/admin/asignaciones/jurados',
        },
        {
            title: 'Jurados asignados',
            href: '/admin/asignaciones/jurados/consulta',
        },
    ],
};
