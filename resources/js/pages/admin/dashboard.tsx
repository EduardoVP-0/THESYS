import { Head, usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

export default function AdminDashboard() {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="Panel de Administración" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* MENSAJE SEGÚN EL ROL */}
                <div className="rounded-xl border border-sidebar-border/70 p-6 bg-sidebar/50">
                    <h1 className="text-3xl font-bold">
                        {auth.user?.id_rol === 1 && 'Hola Super'}
                        {auth.user?.id_rol === 2 && 'Hola adm'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Conectado como: {auth.user?.name} ({auth.user?.rol?.nombre_rol}) — ID: {auth.user?.id}
                    </p>
                </div>
 
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
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
