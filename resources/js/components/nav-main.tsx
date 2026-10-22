import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    // Si tiene sub-elementos, renderiza el desplegable:
                    if (item.items && item.items.length > 0) {
                        const hasActiveSub = item.items.some((sub) => isCurrentUrl(sub.href));

                        // Cuando está contraído: submenú flotante hacia la derecha
                        if (isCollapsed) {
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <SidebarMenuButton
                                                isActive={hasActiveSub}
                                                className="cursor-pointer"
                                            >
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            side="right"
                                            align="start"
                                            sideOffset={8}
                                            className="min-w-48 shadow-md"
                                        >
                                            <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                {item.title}
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {item.items.map((subItem) => {
                                                const active = isCurrentUrl(subItem.href);
                                                return (
                                                    <DropdownMenuItem
                                                        key={subItem.title}
                                                        asChild
                                                        className={active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
                                                    >
                                                        <Link href={subItem.href} prefetch className="w-full cursor-pointer">
                                                            {subItem.title}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </SidebarMenuItem>
                            );
                        }

                        // Cuando está expandido: acordeón vertical idéntico al original
                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={hasActiveSub}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={{ children: item.title }}>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild isActive={isCurrentUrl(subItem.href)}>
                                                        <Link href={subItem.href} prefetch>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    // Si es un item normal directo:
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={item.href ? isCurrentUrl(item.href) : false}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href!} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
