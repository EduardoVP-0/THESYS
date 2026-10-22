import { Link } from '@inertiajs/react';
import { BookOpen, DollarSign, FileBadge, FilePenLine, FolderClosed, FolderGit2, LayoutGrid, Scale, School, UserRoundCheck, UsersRound } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
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
                href: '/admin/administradores'
            },
            {
                title: 'Docentes',
                href: '/admin/docentes'
            },
            {
                title: 'Estudiantes',
                href: '/admin/estudiantes'
            },
        ]
    },

    {
        title: 'Carreras',
        href: '/admin/carreras',
        icon: School
    },

    {
        title: 'Anteproyectos',
        href: '/anteproyectos',
        icon: FilePenLine
    },

    {
        title: 'Asignaciones',
        icon: UserRoundCheck,
        items: [
            {
                title: 'Asesor',
                href: '/asignaciones/asesores',
            },
            {
                title: 'Revisor',
                href: '/asignaciones/revisiones',
            },
            {
                title: 'Jurado',
                href: '/asignaciones/jurados',
            },
            {
                title: 'Examenes',
                href: '/asignaciones/examenes',
            },
        ],
    },

    {
        title: 'Expedientes',
        href: '/expedientes',
        icon: FolderClosed
    },

    {
        title: 'Veredictos',
        href: '/veredictos',
        icon: Scale
    },

    {
        title: 'Oficios Oficiales',
        href: '/admin/oficios_oficiales',
        icon: FileBadge
    },

    {
        title: 'Pagos',
        href: '/pagos',
        icon: DollarSign
    },
];



export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
