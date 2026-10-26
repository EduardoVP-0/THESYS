import { Head, router } from '@inertiajs/react';
import {
    CalendarClock,
    CheckCircle2,
    FileText,
    RefreshCw,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarioDefensas } from './calendario-defensas';
import { EstadoTesisChart } from './estado-tesis-chart';
import { GenerarReporte } from './generar-reporte';
import { KpiCard } from './kpi-card';
import { TesisPorCarreraChart } from './tesis-por-carrera-chart';
import { UltimasTesis } from './ultimas-tesis';
import type { DashboardProps } from './types';

export default function DashboardIndex({
    stats,
    estadoTesis,
    totalTesis,
    tesisPorCarrera,
    ultimasTesis,
    todasTesis,
    defensasCalendario,
    fechaActual,
}: DashboardProps) {
    const actualizar = () => {
        router.reload();
    };

    return (
        <>
            <Head title="Panel de control" />

            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            PANEL DE CONTROL
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Resumen general del proceso de titulación.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                            Hoy: {fechaActual}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={actualizar}
                            className="gap-2 border-border bg-background font-medium text-foreground hover:bg-accent/40"
                        >
                            <RefreshCw className="size-4" />
                            Actualizar
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        title="Tesis en proceso"
                        value={stats.tesis_en_proceso}
                        icon={FileText}
                        trend={stats.tesis_en_proceso_tendencia}
                        showTrend
                        iconClassName="bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    />
                    <KpiCard
                        title="Tesis aprobadas"
                        value={stats.tesis_aprobadas}
                        icon={CheckCircle2}
                        trend={stats.tesis_aprobadas_tendencia}
                        showTrend
                        iconClassName="bg-[#10B981]/15 text-[#10B981]"
                    />
                    <KpiCard
                        title="Estudiantes"
                        value={stats.estudiantes_activos}
                        icon={Users}
                        hint="Activos en el sistema"
                        iconClassName="bg-accent/30 text-foreground"
                    />
                    <KpiCard
                        title="Próximas defensas"
                        value={stats.proximas_defensas}
                        icon={CalendarClock}
                        hint="En los próximos 30 días"
                        iconClassName="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-xs">
                        <h2 className="text-base font-bold text-foreground">
                            Estado de tesis
                        </h2>
                        <div className="mt-4 flex-1">
                            <EstadoTesisChart
                                data={estadoTesis}
                                total={totalTesis}
                            />
                        </div>
                    </div>

                    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-xs">
                        <h2 className="text-base font-bold text-foreground">
                            Tesis por carreras
                        </h2>
                        <div className="mt-4 flex-1">
                            <TesisPorCarreraChart data={tesisPorCarrera} />
                        </div>
                    </div>

                    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-xs">
                        <h2 className="text-base font-bold text-foreground">
                            Calendario
                        </h2>
                        <div className="mt-4 flex-1">
                            <CalendarioDefensas defensas={defensasCalendario} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <UltimasTesis
                            tesis={ultimasTesis}
                            todasTesis={todasTesis}
                            total={totalTesis}
                        />
                    </div>
                    <GenerarReporte tesis={ultimasTesis} total={totalTesis} />
                </div>
            </div>
        </>
    );
}

DashboardIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
        },
    ],
};
