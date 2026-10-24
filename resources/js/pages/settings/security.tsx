import { Form, Head } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { ShieldCheck, KeyRound, Hash, ArrowUp, ArrowDown, Asterisk, Eye, Pencil } from 'lucide-react';

import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
};

// ─── Switch reutilizable ───
function Switch({
    id,
    checked,
    onChange,
}: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            id={id}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
                checked ? 'bg-[#10B981]' : 'bg-muted-foreground/30'
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    // ─── Estados de Políticas de Contraseña ───
    const [longitudMinima, setLongitudMinima] = useState(8);
    const [requiereMayusculas, setRequiereMayusculas] = useState(true);
    const [requiereMinusculas, setRequiereMinusculas] = useState(true);
    const [requiereNumeros, setRequiereNumeros] = useState(true);
    const [requiereEspeciales, setRequiereEspeciales] = useState(true);

    const caracteresEspeciales = '! @ # $ % ^ & * ( ) _ + - = { } [ ] ; : < > , . ? / |';

    const requisitos = [
        `Mínimo ${longitudMinima} caracteres`,
        requiereMayusculas && 'Al menos una mayúscula',
        requiereMinusculas && 'Al menos una minúscula',
        requiereNumeros && 'Al menos un número',
        requiereEspeciales && 'Al menos un carácter especial',
    ].filter(Boolean) as string[];

    return (
        <>
            <Head title="Security settings" />
            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-8 w-full max-w-5xl mx-auto">
                
                {/* ══════════════════════════════════════════
                    SECCIÓN 1: ACTUALIZAR CONTRASEÑA
                ══════════════════════════════════════════ */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-border px-6 py-4 bg-muted/20">
                        <KeyRound className="size-4 text-muted-foreground" />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Actualizar contraseña
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Asegúrate de que tu cuenta utilice una contraseña larga y aleatoria para mantener la seguridad.
                            </p>
                        </div>
                    </div>

                    <Form
                        {...SecurityController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) passwordInput.current?.focus();
                            if (errors.current_password) currentPasswordInput.current?.focus();
                        }}
                        className="space-y-5 p-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password" className="text-sm font-semibold text-foreground">
                                        Contraseña actual <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className="block w-full rounded-xl border-border bg-background text-sm"
                                        autoComplete="current-password"
                                        placeholder="Ingresa tu contraseña actual"
                                    />
                                    <InputError message={errors.current_password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                                        Nueva contraseña <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        className="block w-full rounded-xl border-border bg-background text-sm"
                                        autoComplete="new-password"
                                        placeholder="Ingresa tu nueva contraseña"
                                        passwordrules={props.passwordRules}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation" className="text-sm font-semibold text-foreground">
                                        Confirmar contraseña <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        className="block w-full rounded-xl border-border bg-background text-sm"
                                        autoComplete="new-password"
                                        placeholder="Repite tu nueva contraseña"
                                        passwordrules={props.passwordRules}
                                    />
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        disabled={processing}
                                        data-test="update-password-button"
                                        className="gap-2 rounded-xl border-2 border-[#fdff00] bg-white font-semibold text-black hover:bg-[#fdff00]/10 dark:bg-[#fdff00] dark:text-black dark:hover:bg-[#fdff00]/90 px-6 py-2.5 transition-all shadow-sm"
                                    >
                                        {processing ? 'Guardando...' : 'Guardar contraseña'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* ══════════════════════════════════════════
                    SECCIÓN 2: POLÍTICAS DE CONTRASEÑA
                ══════════════════════════════════════════ */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-border px-6 py-4 bg-muted/20">
                        <ShieldCheck className="size-4 text-muted-foreground" />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Políticas de Contraseña
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Configure los requisitos de seguridad obligatorios para las contraseñas del sistema.
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* ─── Columna izquierda: Longitud y Vista Previa ─── */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="longitud" className="flex items-center gap-2 text-foreground">
                                        <KeyRound className="size-4 text-[#EF4444]" />
                                        <span className="font-semibold text-sm">Longitud mínima de caracteres</span>
                                    </Label>
                                    <Input
                                        id="longitud"
                                        type="number"
                                        min={4}
                                        max={20}
                                        value={longitudMinima}
                                        onChange={(e) => setLongitudMinima(Number(e.target.value) || 4)}
                                        className="w-32 rounded-xl bg-background border-border text-lg font-semibold"
                                    />
                                </div>

                                <div className="rounded-xl bg-muted/30 p-5 flex-1 border border-border/50">
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                        <Eye className="size-4 text-[#EF4444]" />
                                        Vista previa de requisitos
                                    </p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {requisitos.map((r, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <span className="text-[#10B981] font-bold">✓</span>
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-xs text-muted-foreground/70 mt-4 pt-3 border-t border-border/60 break-words">
                                        <b className="text-foreground">Caracteres permitidos:</b> {caracteresEspeciales}
                                    </p>
                                </div>
                            </div>

                            {/* ─── Columna derecha: Switches de validación ─── */}
                            <div className="flex flex-col justify-between gap-3">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors border border-border/40">
                                        <label htmlFor="mayusculas" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer flex-1">
                                            <ArrowUp className="size-4 text-[#EF4444] flex-shrink-0" />
                                            Requerir mayúsculas
                                        </label>
                                        <Switch id="mayusculas" checked={requiereMayusculas} onChange={setRequiereMayusculas} />
                                    </div>

                                    <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors border border-border/40">
                                        <label htmlFor="minusculas" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer flex-1">
                                            <ArrowDown className="size-4 text-[#EF4444] flex-shrink-0" />
                                            Requerir minúsculas
                                        </label>
                                        <Switch id="minusculas" checked={requiereMinusculas} onChange={setRequiereMinusculas} />
                                    </div>

                                    <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors border border-border/40">
                                        <label htmlFor="numeros" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer flex-1">
                                            <Hash className="size-4 text-[#EF4444] flex-shrink-0" />
                                            Requerir números
                                        </label>
                                        <Switch id="numeros" checked={requiereNumeros} onChange={setRequiereNumeros} />
                                    </div>

                                    <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors border border-border/40">
                                        <label htmlFor="especiales" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer flex-1">
                                            <Asterisk className="size-4 text-[#EF4444] flex-shrink-0" />
                                            Requerir caracteres especiales
                                        </label>
                                        <Switch id="especiales" checked={requiereEspeciales} onChange={setRequiereEspeciales} />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Botones de acción para las políticas */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                            <Button type="button" variant="outline" className="rounded-xl border-border text-foreground hover:bg-accent/40">
                                Cancelar
                            </Button>
                            <Button type="button" className="rounded-xl bg-[#EF4444] hover:bg-[#dc2626] text-white font-semibold">
                                Guardar políticas
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
