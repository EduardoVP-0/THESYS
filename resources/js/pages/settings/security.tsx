import { Form, Head, useForm, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Asterisk, Check, CheckCircle2, Eye, Hash, KeyRound, ShieldCheck, X } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/security';
import type { Auth } from '@/types';

export type PoliticasPassword = {
    longitud_minima: number;
    requiere_mayuscula: boolean;
    requiere_minuscula: boolean;
    requiere_numero: boolean;
    requiere_especiales: boolean;
    caracteres_especiales: string;
};

type Props = {
    passwordRules: string;
    isSuperAdmin?: boolean;
    politicas?: PoliticasPassword;
};

// ─── Switch reutilizable ───
function Switch({
    id,
    checked,
    onChange,
    disabled = false,
}: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            id={id}
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                disabled ? 'cursor-not-allowed opacity-50' : ''
            } ${checked ? 'bg-[#10B981]' : 'bg-muted-foreground/30'}`}
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
    const { auth, flash } = usePage<{ auth?: Auth; flash?: { success?: string; error?: string } }>().props;

    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    // Estado local para la contraseña nueva (para evaluar requisitos y fuerza en tiempo real)
    const [newPassword, setNewPassword] = useState('');

    // Alerta flash local de éxito con autocierre
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    // Determinar si es SuperAdmin (id_rol = 1)
    const esSuperadmin = props.isSuperAdmin ?? Number(auth?.user?.id_rol) === 1;

    // Políticas activas enviadas desde la base de datos
    const politicasActivas: PoliticasPassword = props.politicas ?? {
        longitud_minima: 8,
        requiere_mayuscula: true,
        requiere_minuscula: true,
        requiere_numero: true,
        requiere_especiales: true,
        caracteres_especiales: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };

    // ─── Formulario de Políticas de Contraseña (Solo SuperAdmin) ───
    const policyForm = useForm({
        longitud_minima: politicasActivas.longitud_minima,
        requiere_mayuscula: politicasActivas.requiere_mayuscula,
        requiere_minuscula: politicasActivas.requiere_minuscula,
        requiere_numero: politicasActivas.requiere_numero,
        requiere_especiales: politicasActivas.requiere_especiales,
        caracteres_especiales: politicasActivas.caracteres_especiales,
    });

    const handleSavePolicy: FormEventHandler = (e) => {
        e.preventDefault();
        policyForm.put('/settings/security/policy', {
            preserveScroll: true,
        });
    };

    // ─── Validación en tiempo real de especificaciones según las políticas ───
    const caracteresEscapados = (politicasActivas.caracteres_especiales || '').replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        '\\$&',
    );
    const regexEspecial = new RegExp(`[${caracteresEscapados || '!@#$%^&*()_+-=[]{}|;:,.<>?'}]`);

    const especificaciones = [
        {
            id: 'longitud',
            label: `Mínimo ${politicasActivas.longitud_minima} caracteres`,
            cumple: newPassword.length >= politicasActivas.longitud_minima,
            activo: true,
        },
        {
            id: 'mayuscula',
            label: 'Al menos una letra mayúscula (A-Z)',
            cumple: /[A-Z]/.test(newPassword),
            activo: politicasActivas.requiere_mayuscula,
        },
        {
            id: 'minuscula',
            label: 'Al menos una letra minúscula (a-z)',
            cumple: /[a-z]/.test(newPassword),
            activo: politicasActivas.requiere_minuscula,
        },
        {
            id: 'numero',
            label: 'Al menos un número (0-9)',
            cumple: /[0-9]/.test(newPassword),
            activo: politicasActivas.requiere_numero,
        },
        {
            id: 'especial',
            label: 'Al menos un carácter especial',
            cumple: regexEspecial.test(newPassword),
            activo: politicasActivas.requiere_especiales,
        },
    ].filter((item) => item.activo);

    const totalActivas = especificaciones.length;
    const cumplidas = especificaciones.filter((e) => e.cumple).length;

    // ─── Nivel de seguridad de la contraseña ───
    let nivelSeguridad = {
        score: 0,
        texto: 'Sin ingresar',
        colorTexto: 'text-muted-foreground',
        colorBarra: 'bg-muted-foreground/30',
    };

    if (newPassword.length > 0) {
        const ratio = totalActivas > 0 ? cumplidas / totalActivas : 0;
        const esLarga = newPassword.length >= politicasActivas.longitud_minima + 4;

        if (ratio === 1) {
            if (esLarga) {
                nivelSeguridad = {
                    score: 4,
                    texto: 'Excelente / Muy fuerte',
                    colorTexto: 'text-[#10B981]',
                    colorBarra: 'bg-[#10B981]',
                };
            } else {
                nivelSeguridad = {
                    score: 3,
                    texto: 'Fuerte',
                    colorTexto: 'text-[#10B981]',
                    colorBarra: 'bg-[#10B981]',
                };
            }
        } else if (ratio >= 0.6) {
            nivelSeguridad = {
                score: 2,
                texto: 'Media',
                colorTexto: 'text-[#F59E0B]',
                colorBarra: 'bg-[#F59E0B]',
            };
        } else {
            nivelSeguridad = {
                score: 1,
                texto: 'Débil',
                colorTexto: 'text-[#EF4444]',
                colorBarra: 'bg-[#EF4444]',
            };
        }
    }

    // Vista previa dinámica para el panel de configuración de políticas
    const requisitosPreview = [
        `Mínimo ${policyForm.data.longitud_minima} caracteres`,
        policyForm.data.requiere_mayuscula && 'Al menos una mayúscula',
        policyForm.data.requiere_minuscula && 'Al menos una minúscula',
        policyForm.data.requiere_numero && 'Al menos un número',
        policyForm.data.requiere_especiales && 'Al menos un carácter especial',
    ].filter(Boolean) as string[];

    return (
        <>
            <Head title="Seguridad de la cuenta" />
            <h1 className="sr-only">Seguridad de la cuenta</h1>

            <div className="mx-auto w-full max-w-5xl space-y-8">
                {/* Alerta Flash de Éxito con auto-cierre */}
                {flash?.success && showAlert && (
                    <div className="alert alert-success alert-soft shadow-xs flex animate-in items-center justify-between border-l-4 border-l-[#10B981] bg-emerald-50 px-4 py-2.5 text-sm text-foreground duration-300 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#10B981]" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAlert(false)}
                            className="text-lg leading-none text-muted-foreground hover:text-foreground"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    SECCIÓN 1: ACTUALIZAR CONTRASEÑA
                ══════════════════════════════════════════ */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-6 py-4">
                        <KeyRound className="size-4 text-muted-foreground" />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Actualizar contraseña
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Asegúrate de que tu cuenta utilice una contraseña segura y aleatoria.
                            </p>
                        </div>
                    </div>

                    <Form
                        {...SecurityController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onSuccess={() => setNewPassword('')}
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
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <InputError message={errors.password} />

                                    {/* ─── Nivel de seguridad y especificaciones de contraseña ─── */}
                                    <div className="mt-2 space-y-3.5 rounded-xl border border-border/70 bg-muted/20 p-4 transition-all">
                                        {/* Barra de seguridad */}
                                        <div>
                                            <div className="mb-2 flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                                                    Nivel de seguridad de contraseña:
                                                </span>
                                                <span
                                                    className={cn(
                                                        'font-bold transition-colors',
                                                        nivelSeguridad.colorTexto,
                                                    )}
                                                >
                                                    {nivelSeguridad.texto}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {[1, 2, 3, 4].map((step) => (
                                                    <div
                                                        key={step}
                                                        className={cn(
                                                            'h-1.5 rounded-full transition-all duration-300',
                                                            step <= nivelSeguridad.score
                                                                ? nivelSeguridad.colorBarra
                                                                : 'bg-muted-foreground/20',
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Especificaciones obligatorias según la configuración */}
                                        <div className="border-t border-border/50 pt-3">
                                            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Especificaciones que debe tener la contraseña:
                                            </p>
                                            <ul className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                                {especificaciones.map((item) => (
                                                    <li
                                                        key={item.id}
                                                        className={cn(
                                                            'flex items-center gap-2 transition-colors duration-200',
                                                            item.cumple
                                                                ? 'font-medium text-[#10B981]'
                                                                : newPassword.length > 0
                                                                  ? 'text-muted-foreground'
                                                                  : 'text-muted-foreground/80',
                                                        )}
                                                    >
                                                        {item.cumple ? (
                                                            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#10B981]/15 text-[#10B981]">
                                                                <Check className="size-3 stroke-[2.5]" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted-foreground/15 text-muted-foreground/60">
                                                                <div className="size-1.5 rounded-full bg-muted-foreground/50" />
                                                            </div>
                                                        )}
                                                        <span>{item.label}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-sm font-semibold text-foreground"
                                    >
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
                                        className="gap-2 rounded-xl border-2 border-[#fdff00] bg-white px-6 py-2.5 font-semibold text-black shadow-sm transition-all hover:bg-[#fdff00]/10 dark:bg-[#fdff00] dark:text-black dark:hover:bg-[#fdff00]/90"
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
                    (Visibilidad exclusiva para SuperAdmin)
                ══════════════════════════════════════════ */}
                {esSuperadmin && (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-6 py-4">
                            <ShieldCheck className="size-4 text-muted-foreground" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Políticas de Contraseña
                                    </h3>
                                    <span className="rounded-full border border-accent bg-accent/30 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                        SuperAdmin
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Configure los requisitos de seguridad obligatorios para las contraseñas de todos los
                                    usuarios en el sistema.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSavePolicy} className="p-6">
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                {/* ─── Columna izquierda: Longitud y Vista Previa ─── */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="longitud" className="flex items-center gap-2 text-foreground">
                                            <KeyRound className="size-4 text-[#EF4444]" />
                                            <span className="text-sm font-semibold">Longitud mínima de caracteres</span>
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="longitud"
                                                type="number"
                                                min={4}
                                                max={32}
                                                value={policyForm.data.longitud_minima}
                                                onChange={(e) =>
                                                    policyForm.setData('longitud_minima', Number(e.target.value) || 4)
                                                }
                                                className="w-32 rounded-xl border-border bg-background text-lg font-semibold"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                (Mínimo 4, máximo 32 caracteres)
                                            </span>
                                        </div>
                                        {policyForm.errors.longitud_minima && (
                                            <p className="text-xs text-[#EF4444]">
                                                {policyForm.errors.longitud_minima}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex-1 rounded-xl border border-border/50 bg-muted/30 p-5">
                                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <Eye className="size-4 text-[#EF4444]" />
                                            Vista previa de requisitos activos
                                        </p>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {requisitosPreview.map((r, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <span className="font-bold text-[#10B981]">✓</span>
                                                    <span>{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="mt-4 break-words border-t border-border/60 pt-3 text-xs text-muted-foreground/70">
                                            <b className="text-foreground">Caracteres permitidos:</b>{' '}
                                            {policyForm.data.caracteres_especiales}
                                        </p>
                                    </div>
                                </div>

                                {/* ─── Columna derecha: Switches de validación ─── */}
                                <div className="flex flex-col justify-between gap-3">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/30">
                                            <label
                                                htmlFor="mayusculas"
                                                className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                                            >
                                                <ArrowUp className="size-4 shrink-0 text-[#EF4444]" />
                                                Requerir mayúsculas (A-Z)
                                            </label>
                                            <Switch
                                                id="mayusculas"
                                                checked={policyForm.data.requiere_mayuscula}
                                                onChange={(v) => policyForm.setData('requiere_mayuscula', v)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/30">
                                            <label
                                                htmlFor="minusculas"
                                                className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                                            >
                                                <ArrowDown className="size-4 shrink-0 text-[#EF4444]" />
                                                Requerir minúsculas (a-z)
                                            </label>
                                            <Switch
                                                id="minusculas"
                                                checked={policyForm.data.requiere_minuscula}
                                                onChange={(v) => policyForm.setData('requiere_minuscula', v)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/30">
                                            <label
                                                htmlFor="numeros"
                                                className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                                            >
                                                <Hash className="size-4 shrink-0 text-[#EF4444]" />
                                                Requerir números (0-9)
                                            </label>
                                            <Switch
                                                id="numeros"
                                                checked={policyForm.data.requiere_numero}
                                                onChange={(v) => policyForm.setData('requiere_numero', v)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/30">
                                            <label
                                                htmlFor="especiales"
                                                className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                                            >
                                                <Asterisk className="size-4 shrink-0 text-[#EF4444]" />
                                                Requerir caracteres especiales
                                            </label>
                                            <Switch
                                                id="especiales"
                                                checked={policyForm.data.requiere_especiales}
                                                onChange={(v) => policyForm.setData('requiere_especiales', v)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción para las políticas */}
                            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={policyForm.processing || !policyForm.isDirty}
                                    onClick={() => policyForm.reset()}
                                    className="rounded-xl border-border text-foreground hover:bg-accent/40"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={policyForm.processing || !policyForm.isDirty}
                                    className="gap-2 rounded-xl bg-[#EF4444] font-semibold text-white hover:bg-[#dc2626] disabled:opacity-50"
                                >
                                    {policyForm.processing && <span className="loading loading-spinner loading-xs" />}
                                    {policyForm.processing ? 'Guardando políticas...' : 'Guardar políticas'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
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
