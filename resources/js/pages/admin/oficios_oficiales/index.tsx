import { Head } from '@inertiajs/react';

export default function CarrerasIndex() {
    return (
        <>
            <Head title="Carreras" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-white min-h-screen">
                <h1 className="text-2xl font-bold text-[#000000]">HOLA</h1>
            </div>
        </>
    );
}

// Breadcrumbs para la barra superior (se mantiene igual)
CarrerasIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/dashboard',
        },
        {
            title: 'Oficios Oficiales',
            href: '/admin/oficios_oficiales',
        },
    ],
};
