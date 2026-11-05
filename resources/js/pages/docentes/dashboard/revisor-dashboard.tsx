import { CheckCircle2, ClipboardCheck, Clock, FilePenLine } from 'lucide-react';
import type { DashboardRol } from './types';
import { RoleDashboard } from './components/role-dashboard';

const ICONOS_REVISOR = {
    total: ClipboardCheck,
    pendientes: Clock,
    con_cambios: FilePenLine,
    aprobados: CheckCircle2,
};

export function RevisorDashboard({ dashboard }: { dashboard: DashboardRol }) {
    return <RoleDashboard dashboard={dashboard} iconos={ICONOS_REVISOR} />;
}
