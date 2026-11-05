import { CalendarClock, CheckCircle2, Clock, Scale } from 'lucide-react';
import type { DashboardRol } from './types';
import { RoleDashboard } from './components/role-dashboard';

const ICONOS_JURADO = {
    total: Scale,
    aceptados: CheckCircle2,
    pendientes: Clock,
    examenes: CalendarClock,
};

export function JuradoDashboard({ dashboard }: { dashboard: DashboardRol }) {
    return <RoleDashboard dashboard={dashboard} iconos={ICONOS_JURADO} />;
}
