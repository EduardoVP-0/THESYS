import { BookOpen, CheckCircle2, Clock, FilePenLine } from 'lucide-react';
import type { DashboardRol } from './types';
import { RoleDashboard } from './components/role-dashboard';

const ICONOS_ASESOR = {
    total: BookOpen,
    en_revision: Clock,
    con_cambios: FilePenLine,
    aprobados: CheckCircle2,
};

export function AsesorDashboard({ dashboard }: { dashboard: DashboardRol }) {
    return <RoleDashboard dashboard={dashboard} iconos={ICONOS_ASESOR} />;
}
