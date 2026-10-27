import { Link, usePage } from '@inertiajs/react';
import {
    DollarSign,
    FileBadge,
    FilePenLine,
    FolderClosed,
    LayoutGrid,
    MapPin,
    Scale,
    School,
    UserRoundCheck,
    Calendar,
    UsersRound,
    BookOpenCheck,
    BookType,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes/admin';
import type { NavItem } from '@/types';

const ALUMNO_ROLE_ID = 5;

const alumnoNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/alumno/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Mi Anteproyecto',
        href: '/alumno/mi-anteproyecto',
        icon: BookType,
    },
    {
        title: 'Mi Tesis (Director de Tesis)',
        href: '/alumno/mi-tesis',
        icon: FilePenLine,
    },
    {
        title: 'Mi Tesis (Revisores)',
        href: '/alumno/mi-tesis',
        icon: FilePenLine,
    },
    {
        title: 'Mi Jurado',
        href: '/alumno/mi-jurado',
        icon: Scale,
    },
    {
        title: 'Mis Exámenes',
        href: '/alumno/mis-examenes',
        icon: BookOpenCheck,
    },
    {
        title: 'Oficios Oficiales',
        href: '/alumno/oficios-oficiales',
        icon: FileBadge,
    },
    {
        title: 'Pagos',
        href: '/alumno/pagos',
        icon: DollarSign,
    },
    {
        title: 'Mi Expediente',
        href: '/alumno/mi-expediente',
        icon: FolderClosed,
    },
    {
        title: 'Calendario Académico',
        href: '/alumno/calendario-academico',
        icon: Calendar,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },

    {
        title: 'Usuarios',
        icon: UsersRound,
        items: [
            {
                title: 'Administradores',
                href: '/admin/administradores',
            },
            {
                title: 'Docentes',
                href: '/admin/docentes',
            },
            {
                title: 'Alumnos',
                href: '/admin/alumnos',
            },
        ],
    },

    {
        title: 'Carreras',
        href: '/admin/carreras',
        icon: School,
    },

    {
        title: 'Sedes',
        href: '/admin/sedes',
        icon: MapPin,
    },

    {
        title: 'Anteproyectos',
        href: '/admin/anteproyectos',
        icon: FilePenLine,
    },

    {
        title: 'Asignaciones',
        icon: UserRoundCheck,
        items: [
            {
                title: 'Asesor',
                href: '/admin/asignaciones/asesores',
            },
            {
                title: 'Revisor',
                href: '/admin/asignaciones/revisores',
            },
            {
                title: 'Jurado',
                href: '/admin/asignaciones/jurados',
            },
            {
                title: 'Exámenes',
                href: '/admin/asignaciones/examenes',
            },
        ],
    },

    {
        title: 'Expedientes',
        href: '/admin/expedientes',
        icon: FolderClosed,
    },

    {
        title: 'Veredictos',
        href: '/admin/veredictos',
        icon: Scale,
    },

    {
        title: 'Oficios Oficiales',
        href: '/admin/oficios_oficiales',
        icon: FileBadge,
    },

    {
        title: 'Pagos',
        href: '/admin/pagos',
        icon: DollarSign,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as { auth: { user?: { id_rol?: number | string } } };
    const isAlumno = Number(auth.user?.id_rol) === ALUMNO_ROLE_ID;
    const navItems = isAlumno ? alumnoNavItems : adminNavItems;
    const homeHref = isAlumno ? '/alumno/dashboard' : dashboard();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
