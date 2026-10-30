import { Head } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { useState } from 'react';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const features = [
    {
        icon: '🎓',
        title: 'Estudiantes',
        desc: 'Registra tu anteproyecto, sube avances y documentos, y da seguimiento a cada etapa de tu proceso de titulación.',
    },
    {
        icon: '🏛️',
        title: 'Administrativos',
        desc: 'Gestiona solicitudes, asigna asesores y revisores, y supervisa el progreso general de todos los proyectos.',
    },
    {
        icon: '📋',
        title: 'Asesores',
        desc: 'Revisa avances de tus asesorados, emite observaciones y aprueba versiones de documentos en un solo lugar.',
    },
];

function EyeOpenIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    );
}

function EyeClosedIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
            <line x1="2" x2="22" y1="2" y2="22"/>
        </svg>
    );
}

function MailIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
    );
}

function LockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" x2="3" y1="12" y2="12"/>
        </svg>
    );
}

export default function Login({ status, canResetPassword }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Iniciar Sesión — THESYS" />

            <div className="tl-wrapper">

                {/* ══════════════════════════════════
                    PANEL IZQUIERDO — Formulario
                ══════════════════════════════════ */}
                <div className="tl-left">
                    {/* Círculos decorativos (mismos que derecha) */}
                    <div className="tl-circle tl-lc1" />
                    <div className="tl-circle tl-lc2" />

                    <div className="tl-left-inner">

                        {/* Logo */}
                        <div className="tl-logo-bar">
                            <div className="tl-logo-icon">T</div>
                            <div className="tl-logo-text">
                                <span className="tl-logo-name">THESYS</span>
                                <span className="tl-logo-sub">Gestión Académica</span>
                            </div>
                        </div>

                        {/* Tarjeta del formulario */}
                        <div className="tl-card">
                            <div className="tl-card-header">
                                <h1 className="tl-card-title">Bienvenido de vuelta</h1>
                                <p className="tl-card-subtitle">
                                    Ingresa tus credenciales para acceder al sistema
                                </p>
                            </div>

                            {status && (
                                <div className="tl-alert-success">{status}</div>
                            )}

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="tl-form"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {/* ── Email ── */}
                                        <div className="tl-field">
                                            <label htmlFor="email" className="tl-label">
                                                Correo electrónico
                                            </label>
                                            <div className="tl-input-wrap">
                                                <span className="tl-icon-left">
                                                    <MailIcon />
                                                </span>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    placeholder="usuario@unach.mx"
                                                    className="tl-input"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* ── Contraseña ── */}
                                        <div className="tl-field">
                                            <label htmlFor="password" className="tl-label">
                                                Contraseña
                                            </label>
                                            <div className="tl-input-wrap">
                                                <span className="tl-icon-left">
                                                    <LockIcon />
                                                </span>
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="••••••••"
                                                    className="tl-input"
                                                />
                                                <button
                                                    type="button"
                                                    className="tl-eye-btn"
                                                    onClick={() => setShowPassword(v => !v)}
                                                    tabIndex={-1}
                                                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                                >
                                                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} />
                                            {/* ¿Olvidaste? — abajo derecha del input */}
                                            {canResetPassword && (
                                                <div className="tl-forgot-wrap">
                                                    <TextLink href={request()} className="tl-forgot" tabIndex={5}>
                                                        ¿Olvidaste tu contraseña?
                                                    </TextLink>
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Recordar sesión ── */}
                                        <div className="tl-remember">
                                            <Checkbox id="remember" name="remember" tabIndex={3} />
                                            <label htmlFor="remember" className="tl-remember-label">
                                                Recordar mi sesión
                                            </label>
                                        </div>

                                        {/* ── Botón ── */}
                                        <button
                                            type="submit"
                                            className="tl-btn"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing
                                                ? <><Spinner /> Verificando...</>
                                                : <>Iniciar Sesión <ArrowIcon /></>
                                            }
                                        </button>

                                        {/* Seguridad */}
                                        <p className="tl-security">
                                            <ShieldIcon />
                                            Conexión segura y encriptada
                                        </p>
                                    </>
                                )}
                            </Form>
                        </div>

                        {/* Footer */}
                        <p className="tl-footer">
                            THESYS © 2026 — Todos los derechos reservados
                        </p>
                    </div>
                </div>

                {/* ══════════════════════════════════
                    PANEL DERECHO — Info del sistema
                ══════════════════════════════════ */}
                <div className="tl-right">
                    <div className="tl-circle tl-rc1" />
                    <div className="tl-circle tl-rc2" />
                    <div className="tl-circle tl-rc3" />

                    <div className="tl-right-inner">
                        <div className="tl-right-header">
                            <span className="tl-badge">Sistema Institucional</span>
                            <h2 className="tl-right-title">
                                Gestión de proyectos de<br />titulación y tesis
                            </h2>
                            <p className="tl-right-desc">
                                Plataforma oficial de la Escuela de Tecnologías Digitales
                                Aplicadas, Campus I — UNACH. Centraliza el registro de
                                anteproyectos, el seguimiento de avances, el control de
                                versiones de documentos y la comunicación entre todos los
                                actores del proceso de titulación.
                            </p>
                        </div>

                        <div className="tl-features">
                            {features.map((f) => (
                                <div key={f.title} className="tl-feature-card">
                                    <div className="tl-feature-icon">{f.icon}</div>
                                    <div className="tl-feature-content">
                                        <h3 className="tl-feature-title">{f.title}</h3>
                                        <p className="tl-feature-desc">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="tl-right-footer">
                            <span className="tl-dot" />
                            Benemérita Universidad Autónoma de Chiapas
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                /* ─── Wrapper ─── */
                .tl-wrapper {
                    font-family: 'DM Sans', sans-serif;
                    display: flex;
                    height: 100dvh;
                    width: 100%;
                    overflow: hidden;
                    /* ⭐ UN SOLO FONDO PARA TODA LA PANTALLA (CON CAPA OSCURA) */
                    background-image: 
                        linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)),
                        url('/storage/login/unnamed.webp');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                }

                /* ══════════════════════════════
                   PANEL IZQUIERDO
                ══════════════════════════════ */
                .tl-left {
                    width: 540px;
                    min-width: 540px;
                    background: transparent; /* sin fondo propio */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 36px 44px;
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                }

                /* Círculos decorativos izquierda */
                .tl-lc1 { width: 300px; height: 300px; bottom: -80px; right: -80px; }
                .tl-lc2 { width: 180px; height: 180px; top: -50px; left: -50px; }

                .tl-left-inner {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 420px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 28px;
                }

                /* Logo */
                .tl-logo-bar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                }

                .tl-logo-icon {
                    width: 44px;
                    height: 44px;
                    background: #b8d4e3;
                    border-radius: 13px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    font-weight: 800;
                    color: #1e3a4f;
                    flex-shrink: 0;
                    box-shadow: 0 4px 14px rgba(184,212,227,0.4);
                }

                .tl-logo-text {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.2;
                }

                .tl-logo-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: 1.5px;
                }

                .tl-logo-sub {
                    font-size: 10px;
                    color: rgba(255,255,255,0.5);
                    font-weight: 500;
                }

                /* ── Tarjeta del formulario ── */
                .tl-card {
                    background: #ffffff;
                    border-radius: 28px;
                    padding: 44px 40px;
                    width: 100%;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.35);
                    display: flex;
                    flex-direction: column;
                    gap: 22px;
                }

                .tl-card-header {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    text-align: center;
                }

                .tl-card-title {
                    font-size: 26px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .tl-card-subtitle {
                    font-size: 13px;
                    color: #6b7280;
                }

                /* Alert */
                .tl-alert-success {
                    background: #d1fae5;
                    color: #065f46;
                    padding: 11px 14px;
                    border-radius: 10px;
                    font-size: 13px;
                    border: 1px solid #6ee7b7;
                    text-align: center;
                }

                /* Formulario */
                .tl-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .tl-field {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }

                .tl-label {
                    font-size: 13.5px;
                    font-weight: 500;
                    color: #374151;
                }

                /* Input con ícono */
                .tl-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }

                .tl-icon-left {
                    position: absolute;
                    left: 13px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    pointer-events: none;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 17px;
                    height: 17px;
                }

                .tl-input {
                    width: 100% !important;
                    height: 48px !important;
                    padding-left: 42px !important;
                    padding-right: 44px !important;
                    border-radius: 12px !important;
                    border: 1.5px solid #e5e7eb !important;
                    font-size: 14px !important;
                    font-family: 'DM Sans', sans-serif !important;
                    background: #f9fafb !important;
                    color: #111827 !important;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s !important;
                    outline: none !important;
                }

                .tl-input::placeholder { color: #c4cdd6 !important; }

                .tl-input:focus {
                    border-color: #b8d4e3 !important;
                    box-shadow: 0 0 0 3px rgba(184,212,227,0.3) !important;
                    background: #fff !important;
                }

                /* Botón ojo contraseña */
                .tl-eye-btn {
                    position: absolute;
                    right: 13px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #9ca3af;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2px;
                    z-index: 2;
                    transition: color 0.2s;
                    height: 17px;
                    width: 17px;
                }
                .tl-eye-btn:hover { color: #4a90b8; }

                /* ¿Olvidaste? abajo derecha */
                .tl-forgot-wrap {
                    display: flex;
                    justify-content: flex-end;
                }

                .tl-forgot {
                    font-size: 12.5px;
                    color: #4a90b8;
                    text-decoration: none;
                    font-weight: 500;
                    font-family: 'DM Sans', sans-serif;
                }
                .tl-forgot:hover { text-decoration: underline; }

                /* Recordar */
                .tl-remember {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .tl-remember-label {
                    font-size: 13.5px;
                    color: #4b5563;
                    cursor: pointer;
                }

                /* Botón principal */
                .tl-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    height: 48px;
                    border-radius: 40px;
                    background: #b8d4e3;
                    color: #1e3a4f;
                    font-size: 15px;
                    font-weight: 600;
                    font-family: 'DM Sans', sans-serif;
                    border: none;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
                    margin-top: 4px;
                }

                .tl-btn:hover:not(:disabled) {
                    background: #9dc4d8;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(184,212,227,0.55);
                }

                .tl-btn:disabled { opacity: 0.65; cursor: not-allowed; }

                /* Seguridad */
                .tl-security {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    font-size: 11.5px;
                    color: #b0b8c4;
                }

                /* Footer izq */
                .tl-footer {
                    font-size: 11px;
                    color: rgba(255,255,255,0.3);
                    text-align: center;
                    width: 100%;
                }

                /* ══════════════════════════════
                   PANEL DERECHO
                ══════════════════════════════ */
                .tl-right {
                    flex: 1;
                    background: transparent; /* sin fondo propio */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 56px 64px;
                    position: relative;
                    overflow: hidden;
                    /* sin border-left = sin linea divisora */
                }

                /* Círculos decorativos */
                .tl-circle {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(184,212,227,0.06);
                }
                .tl-rc1 { width: 420px; height: 420px; top: -130px; right: -110px; }
                .tl-rc2 { width: 270px; height: 270px; bottom: -90px; left: -70px; }
                .tl-rc3 { width: 180px; height: 180px; top: 48%; left: 32%; background: rgba(184,212,227,0.04); }

                .tl-right-inner {
                    position: relative;
                    z-index: 1;
                    max-width: 520px;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .tl-right-header {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .tl-badge {
                    display: inline-flex;
                    align-items: center;
                    background: rgba(184,212,227,0.15);
                    color: #b8d4e3;
                    border: 1px solid rgba(184,212,227,0.25);
                    border-radius: 20px;
                    padding: 5px 14px;
                    font-size: 11.5px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    width: fit-content;
                }

                .tl-right-title {
                    font-size: 30px;
                    font-weight: 700;
                    color: #fff;
                    line-height: 1.3;
                }

                .tl-right-desc {
                    font-size: 14px;
                    color: rgba(255,255,255,0.62);
                    line-height: 1.75;
                }

                /* Feature cards */
                .tl-features {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .tl-feature-card {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(184,212,227,0.12);
                    border-radius: 14px;
                    padding: 16px 20px;
                    transition: background 0.2s, border-color 0.2s;
                }

                .tl-feature-card:hover {
                    background: rgba(255,255,255,0.09);
                    border-color: rgba(184,212,227,0.25);
                }

                .tl-feature-icon {
                    font-size: 22px;
                    width: 46px;
                    height: 46px;
                    min-width: 46px;
                    background: rgba(184,212,227,0.12);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .tl-feature-content {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .tl-feature-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #b8d4e3;
                }

                .tl-feature-desc {
                    font-size: 13px;
                    color: rgba(255,255,255,0.58);
                    line-height: 1.55;
                }

                .tl-right-footer {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: rgba(255,255,255,0.28);
                    border-top: 1px solid rgba(255,255,255,0.07);
                    padding-top: 18px;
                }

                .tl-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #b8d4e3;
                    opacity: 0.4;
                    flex-shrink: 0;
                }

                /* ─── Responsive ─── */
                @media (max-width: 1024px) {
                    .tl-right { display: none; }
                    .tl-left { width: 100%; min-width: 0; }
                }

                @media (max-width: 480px) {
                    .tl-left { padding: 28px 20px; }
                    .tl-card { padding: 32px 24px; border-radius: 20px; }
                    .tl-card-title { font-size: 22px; }
                }
            `}</style>
        </>
    );
}

Login.layout = undefined;
