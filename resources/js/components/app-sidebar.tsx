import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    DollarSign,
    FileBadge,
    FilePenLine,
    FileText,
    FolderClosed,
    GraduationCap,
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
import type { Auth, NavItem } from '@/types';
import { dashboard } from '@/routes';

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
        href: '/alumno/tesis-asesor',
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
        href: '/alumno/oficios_oficiales',
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
        href: '/admin/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Usuarios',
        icon: UsersRound,
        items: [
            { title: 'Administradores', href: '/admin/administradores' },
            { title: 'Docentes', href: '/admin/docentes' },
            { title: 'Alumnos', href: '/admin/alumnos' },
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
            { title: 'Asesor', href: '/admin/asignaciones/asesores' },
            { title: 'Revisor', href: '/admin/asignaciones/revisores' },
            { title: 'Jurado', href: '/admin/asignaciones/jurados' },
            { title: 'Exámenes', href: '/admin/asignaciones/examenes' },
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
        title: 'Oficios oficiales',
        href: '/admin/oficios_oficiales',
        icon: FileBadge,
    },
    {
        title: 'Pagos',
        href: '/admin/pagos',
        icon: DollarSign,
    },
];

// Sección general del docente (visible para todos: asesor, revisor y jurado)
const docenteNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/docente/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Mis Asesorados',
        href: '/docente/asesorados',
        icon: UsersRound,
    },
    {
        title: 'Revisiones',
        href: '/docente/revisiones',
        icon: ClipboardCheck,
    },
];

// Sección de jurado (solo visible si el docente está asignado en tbljurados_proyectos)
const docenteJuradoNavItems: NavItem[] = [
    {
        title: 'Proyectos Asignados',
        href: '/docente/jurado/proyectos-asignados',
        icon: FolderClosed,
    },
    {
        title: 'Emitir Voto',
        href: '/docente/jurado/emitir-voto',
        icon: Scale,
    },
];

// Calendario al final (visible para todos los docentes)
const docenteFooterNavItems: NavItem[] = [
    {
        title: 'Calendario',
        href: '/docente/calendario',
        icon: CalendarDays,
    },
];

function resolveNavigation(roleId: number): {
    items: NavItem[];
    home: string;
    label: string;
} {
    if (roleId === 4) {
        return {
            items: docenteNavItems,
            home: '/docente/dashboard',
            label: 'Portal docente',
        };
    }

    if (roleId === 5) {
        return {
            items: alumnoNavItems,
            home: '/alumno/dashboard',
            label: 'Mi proceso',
        };
    }

    return {
        items: adminNavItems,
        home: '/admin/dashboard',
        label: 'Administración',
    };
}

export function AppSidebar() {
    const { auth } = usePage().props as {
        auth: {
            user?: { id_rol?: number | string };
            docente?: { es_asesor: boolean; es_revisor: boolean; es_jurado: boolean } | null;
        };
    };
    const roleId = Number(auth.user?.id_rol ?? 0);
    const { items: navItems, home: homeHref } = resolveNavigation(roleId);
    const isDocente = roleId === 4;
    const esJurado = Boolean(auth.docente?.es_jurado);

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
                {isDocente && esJurado && (
                    <NavMain items={docenteJuradoNavItems} label="Jurado de examen" />
                )}
                {isDocente && <NavMain items={docenteFooterNavItems} label="" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
