import type { LucideIcon } from 'lucide-react';
import { Activity } from 'lucide-react';
import type { DashboardRol } from '../types';
import { ActivityChart } from './activity-chart';
import { ActivityList } from './activity-list';
import { StatCard } from './stat-card';

interface RoleDashboardProps {
    dashboard: DashboardRol;
    iconos: Record<string, LucideIcon>;
}

export function RoleDashboard({ dashboard, iconos }: RoleDashboardProps) {
    return (
        <div className="flex flex-col gap-4">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.stats.map((stat) => (
                    <StatCard
                        key={stat.clave}
                        stat={stat}
                        icon={iconos[stat.clave] ?? Activity}
                    />
                ))}
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ActivityChart
                    rol={dashboard.clave}
                    grafica={dashboard.grafica}
                />
                <ActivityList
                    lista={dashboard.lista}
                    accion={dashboard.accion}
                />
            </section>
        </div>
    );
}
