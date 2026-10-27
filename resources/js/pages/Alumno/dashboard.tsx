import { Head, usePage } from '@inertiajs/react';
import { FileText, GraduationCap, Info } from 'lucide-react';

export default function AlumnoDashboard() {
    const { auth } = usePage().props as { auth: { user?: { name?: string } } };

    return (
        <>
            <Head title="Mi panel" />

            <div className="flex h-full flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        MI PANEL
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Bienvenido{auth.user?.name ? `, ${auth.user.name}` : ''}.
                        Aquí podrás dar seguimiento a tu proceso de titulación.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
                        <div className="rounded-lg bg-blue-500/15 p-2 text-blue-600 dark:text-blue-400">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Anteproyecto
                            </p>
                            <p className="font-semibold">Próximamente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
                        <div className="rounded-lg bg-[#10B981]/15 p-2 text-[#10B981]">
                            <GraduationCap className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Estado de titulación
                            </p>
                            <p className="font-semibold">Próximamente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
                        <div className="rounded-lg bg-amber-500/15 p-2 text-amber-600 dark:text-amber-400">
                            <Info className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Avisos
                            </p>
                            <p className="font-semibold">Próximamente</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AlumnoDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Dashboard',
            href: '/alumno/dashboard',
        },
    ],
};
