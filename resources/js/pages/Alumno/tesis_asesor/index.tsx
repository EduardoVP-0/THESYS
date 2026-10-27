import { Head } from '@inertiajs/react';

export default function AlumnoTesisAsesorIndex() {
    return (
        <>
            <Head title="Mi Tesis (Director de Tesis)" />

            <div className="flex h-full min-h-screen flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                {/* ENCABEZADO IDÉNTICO AL DE CARRERAS */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            MI TESIS
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gestión de versiones y estatus de evaluación de tesis con tu director asignado.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

// Breadcrumbs para la barra superior
AlumnoTesisAsesorIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Mi Tesis (Director de Tesis)',
            href: '/alumno/tesis-asesor',
        },
    ],
};
