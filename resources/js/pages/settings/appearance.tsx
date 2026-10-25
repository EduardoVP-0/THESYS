import { Head } from '@inertiajs/react';
import { Check, CheckCircle2, Monitor, Moon, Palette, Paintbrush, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ACCENT_OPTIONS, useAccentColor } from '@/hooks/use-accent-color';
import type { AccentColor } from '@/hooks/use-accent-color';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';

/** Mini maqueta de interfaz usada en cada tarjeta de modo de color */
function ModePreview({ mode }: { mode: Appearance }) {
    const palettes = {
        light: { bg: 'bg-white', side: 'bg-slate-100', bar: 'bg-slate-300', line: 'bg-slate-200' },
        dark: { bg: 'bg-neutral-900', side: 'bg-neutral-800', bar: 'bg-neutral-600', line: 'bg-neutral-700' },
    };

    const renderFrame = (palette: (typeof palettes)['light']) => (
        <div className={cn('flex h-full w-full overflow-hidden', palette.bg)}>
            <div className={cn('w-1/4 space-y-1.5 p-2', palette.side)}>
                <div className={cn('h-1.5 w-full rounded-full', palette.bar)} />
                <div className={cn('h-1.5 w-3/4 rounded-full', palette.line)} />
                <div className={cn('h-1.5 w-2/3 rounded-full', palette.line)} />
            </div>
            <div className="flex-1 space-y-2 p-2.5">
                <div className={cn('h-2 w-1/2 rounded-full', palette.bar)} />
                <div className={cn('h-1.5 w-full rounded-full', palette.line)} />
                <div className={cn('h-1.5 w-5/6 rounded-full', palette.line)} />
                <div className="h-3 w-1/3 rounded-md bg-[#10B981]/80" />
            </div>
        </div>
    );

    if (mode === 'system') {
        return (
            <div className="relative h-full w-full">
                <div className="absolute inset-0">{renderFrame(palettes.light)}</div>
                <div className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">
                    {renderFrame(palettes.dark)}
                </div>
            </div>
        );
    }

    return renderFrame(palettes[mode]);
}

const MODE_OPTIONS: { value: Appearance; label: string; description: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Claro', description: 'Fondo luminoso, ideal para el día.', icon: Sun },
    { value: 'dark', label: 'Oscuro', description: 'Reduce el brillo y el cansancio visual.', icon: Moon },
    { value: 'system', label: 'Sistema', description: 'Se adapta a tu dispositivo.', icon: Monitor },
];

export default function Appearance() {
    const { appearance, updateAppearance } = useAppearance();
    const { accent, updateAccent } = useAccentColor();

    // Selección pendiente: se aplica al presionar "Guardar cambios"
    const [draftMode, setDraftMode] = useState<Appearance>(appearance);
    const [draftAccent, setDraftAccent] = useState<AccentColor>(accent);
    const [saved, setSaved] = useState(false);

    const hasChanges = draftMode !== appearance || draftAccent !== accent;

    useEffect(() => {
        if (!saved) {
            return;
        }

        const timer = setTimeout(() => setSaved(false), 4000);

        return () => clearTimeout(timer);
    }, [saved]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        updateAppearance(draftMode);
        updateAccent(draftAccent);
        setSaved(true);
    };

    const handleReset = () => {
        setDraftMode(appearance);
        setDraftAccent(accent);
    };

    return (
        <>
            <Head title="Apariencia" />

            <h1 className="sr-only">Apariencia</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {saved && (
                    <div className="alert alert-success alert-soft flex animate-in items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 px-4 py-2.5 text-sm text-foreground shadow-xs duration-300 fade-in-50 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
                            <span className="font-medium">Preferencias de apariencia guardadas.</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSaved(false)}
                            className="text-lg leading-none text-muted-foreground hover:text-foreground"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* ─── MODO DE COLOR ─── */}
                <section className="rounded-2xl border border-border bg-card shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                        <Paintbrush className="size-3.5 text-muted-foreground" />
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Modo de color
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Elige cómo se ve el sistema en tu cuenta.
                            </p>
                        </div>
                    </div>

                    <div
                        role="radiogroup"
                        aria-label="Modo de color"
                        className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3"
                    >
                        {MODE_OPTIONS.map(({ value, label, description, icon: Icon }) => {
                            const active = draftMode === value;

                            return (
                                <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => setDraftMode(value)}
                                    className={cn(
                                        'group flex flex-col gap-3 rounded-2xl border bg-card p-3 text-left transition-all',
                                        active
                                            ? 'border-accent ring-2 ring-accent'
                                            : 'border-border hover:border-accent hover:bg-accent/20',
                                    )}
                                >
                                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border">
                                        <ModePreview mode={value} />
                                    </div>
                                    <div className="flex items-start justify-between gap-2 px-1">
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                                <Icon className="size-3.5 text-muted-foreground" />
                                                {label}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                                        </div>
                                        <span
                                            className={cn(
                                                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                                active
                                                    ? 'border-[#10B981] bg-[#10B981] text-white'
                                                    : 'border-border text-transparent',
                                            )}
                                        >
                                            <Check className="size-3" />
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─── COLOR DE ACENTO ─── */}
                <section className="rounded-2xl border border-border bg-card shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                        <Palette className="size-3.5 text-muted-foreground" />
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Color de interfaz
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Define el color de resaltado en tarjetas, filas y botones secundarios (Modo Claro).
                            </p>
                        </div>
                    </div>

                    <div role="radiogroup" aria-label="Color de interfaz" className="flex flex-wrap gap-6 p-5">
                        {ACCENT_OPTIONS.map(({ value, label, swatch }) => {
                            const active = draftAccent === value;

                            return (
                                <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    aria-label={label}
                                    onClick={() => setDraftAccent(value)}
                                    className="group flex flex-col items-center gap-2"
                                >
                                    <span
                                        className={cn(
                                            'flex size-12 items-center justify-center rounded-full border border-border transition-all group-hover:scale-105',
                                            active && 'ring-2 ring-offset-2 ring-offset-card',
                                        )}
                                        style={{
                                            backgroundColor: swatch,
                                            ...(active ? { ['--tw-ring-color' as string]: swatch } : {}),
                                        }}
                                    >
                                        {active && <Check className="size-5 text-foreground" />}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-xs font-medium',
                                            active ? 'text-foreground' : 'text-muted-foreground',
                                        )}
                                    >
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─── ACCIONES ─── */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!hasChanges}
                        onClick={handleReset}
                        className="rounded-xl border-border bg-background text-foreground hover:bg-accent/40"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={!hasChanges}
                        data-test="update-appearance-button"
                        className="gap-2 rounded-xl border-2 border-[#fdff00] bg-white font-semibold text-black hover:bg-[#fdff00]/10 disabled:opacity-50 sm:w-40"
                    >
                        Guardar cambios
                    </Button>
                </div>
            </form>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Apariencia',
            href: editAppearance(),
        },
    ],
};
