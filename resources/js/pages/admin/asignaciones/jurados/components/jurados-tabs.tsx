import { Link } from '@inertiajs/react';
import { ClipboardList, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { consulta, index } from '@/routes/admin/asignaciones/jurados';

export function JuradosTabs() {
    const { isCurrentUrl } = useCurrentUrl();

    const tabs = [
        {
            label: 'Asignar jurado',
            href: index.url(),
            active: !isCurrentUrl(consulta.url()),
            icon: UsersRound,
        },
        {
            label: 'Jurados asignados',
            href: consulta.url(),
            active: isCurrentUrl(consulta.url()),
            icon: ClipboardList,
        },
    ];

    return (
        <div className="flex items-center gap-1 border-b border-border">
            {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            'relative inline-flex items-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4',
                            tab.active
                                ? 'text-[#10B981]'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Icon className="size-4" />
                        {tab.label}
                        {tab.active && (
                            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#10B981]" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
