import { Head } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AsesorDashboard } from './dashboard/asesor-dashboard';
import { JuradoDashboard } from './dashboard/jurado-dashboard';
import { RevisorDashboard } from './dashboard/revisor-dashboard';
import { RoleSelector } from './dashboard/role-selector';
import type { DashboardDocenteProps, RolDashboard } from './dashboard/types';

export default function DocenteDashboard({
    nombre,
    saludo,
    fecha_larga,
    roles_disponibles,
    vista_inicial,
    dashboards,
}: DashboardDocenteProps) {
    const [vista, setVista] = useState<RolDashboard | null>(vista_inicial);
    const rolActivo =
        roles_disponibles.find((rol) => rol.clave === vista) ??
        roles_disponibles[0] ??
        null;
    const dashboard = rolActivo ? dashboards[rolActivo.clave] : undefined;

    return (
        <>
            <Head title="Dashboard docente" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 text-foreground md:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {fecha_larga}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {saludo}, {nombre}
                        </h1>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            {rolActivo
                                ? rolActivo.descripcion
                                : 'Bienvenido a tu portal docente.'}
                        </p>
                    </div>

                    {rolActivo && (
                        <RoleSelector
                            roles={roles_disponibles}
                            value={rolActivo.clave}
                            onChange={(nuevoRol) => setVista(nuevoRol)}
                        />
                    )}
                </header>

                {dashboard && rolActivo ? (
                    <div key={rolActivo.clave}>
                        {rolActivo.clave === 'asesor' && (
                            <AsesorDashboard dashboard={dashboard} />
                        )}
                        {rolActivo.clave === 'revisor' && (
                            <RevisorDashboard dashboard={dashboard} />
                        )}
                        {rolActivo.clave === 'jurado' && (
                            <JuradoDashboard dashboard={dashboard} />
                        )}
                    </div>
                ) : (
                    <Card className="gap-0 rounded-xl border-dashed border-border bg-card py-0 shadow-xs">
                        <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                            <div className="rounded-full bg-muted p-3 text-muted-foreground">
                                <CalendarDays className="size-6" />
                            </div>
                            <h2 className="text-base font-bold text-foreground">
                                Aún no tienes funciones asignadas
                            </h2>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Cuando la coordinación te asigne como Asesor,
                                Revisor o Jurado, aquí aparecerá el resumen de
                                tus proyectos y actividades.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

DocenteDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Docente',
            href: '/docente/dashboard',
        },
        {
            title: 'Dashboard',
            href: '/docente/dashboard',
        },
    ],
};
