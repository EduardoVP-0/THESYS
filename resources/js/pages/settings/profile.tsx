import { Form, Head, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    BookOpen,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck2,
    GraduationCap,
    IdCard,
    Mail,
    MapPin,
    Pencil,
    Phone,
    ShieldCheck,
    User as UserIcon,
    UserPlus,
    XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

/** Registro de la tabla `tbladministradores` */
type Administrador = {
    id_usuario: number;
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    telefono: string | null;
    area: string;
    estado: boolean;
    nombre_completo: string;
    iniciales: string;
    created_at: string | null;
    usuario_registro?: { id: number; name: string } | null;
};

/** Registro de la tabla `tblalumnos` */
type Alumno = {
    id_usuario: number;
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    matricula: string;
    curp: string | null;
    telefono: string | null;
    turno: string | null;
    generacion: string | null;
    estado_academico: string | null;
    nombre_completo: string;
    iniciales: string;
    fecha_ingreso: string | null;
    created_at: string | null;
    carrera?: { id_carrera: number; nombre_carrera: string; clave: string } | null;
    usuario_registro?: { id: number; name: string } | null;
};

type PageProps = {
    auth: Auth;
    administrador: Administrador | null;
    alumno: Alumno | null;
};

const formatearFecha = (fecha?: string | null): string => {
    if (!fecha) {
        return 'Sin registro';
    }

    return new Date(fecha).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

/** Fila de dato de solo lectura (mismo estilo que el panel lateral de Pagos) */
function DatoItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
    return (
        <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
                <div className="truncate text-sm font-semibold text-foreground">{children}</div>
            </div>
        </div>
    );
}

export default function Profile() {
    const { auth, administrador, alumno } = usePage<PageProps>().props;
    const user = auth.user;

    const rol = (user.rol as { nombre_rol?: string } | null | undefined)?.nombre_rol ?? 'Sin rol asignado';
    const estaActivo = Boolean(user.estado ?? true);
    /** Superadmin (id_rol = 1) */
    const esSuperadmin = Number(user.id_rol) === 1;
    /** Alumno (id_rol = 5) */
    const esAlumno = Number(user.id_rol) === 5;

    const nombreMostrado = alumno?.nombre_completo || administrador?.nombre_completo || user.name;
    const iniciales =
        alumno?.iniciales ||
        administrador?.iniciales ||
        user.name
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase();

    return (
        <>
            <Head title="Mi perfil" />

            <h1 className="sr-only">Mi perfil</h1>

            <div className="space-y-6">
                {/* ─── ENCABEZADO DEL PERFIL ─── */}
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent/40 text-lg font-bold text-foreground">
                        {iniciales}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-bold text-foreground">{nombreMostrado}</h2>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-accent bg-accent/30 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                                <ShieldCheck className="size-3" />
                                {rol}
                            </span>
                            {estaActivo ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                    <CheckCircle2 className="size-3" />
                                    Activo
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                    <XCircle className="size-3" />
                                    Suspendido
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── SUPERADMIN: máxima autoridad del sistema ─── */}
                {esSuperadmin && (
                    <section className="flex items-start gap-3 rounded-xl border border-accent bg-accent/20 p-5 shadow-xs">
                        <div className="shrink-0 rounded-full bg-accent/40 p-2.5 text-foreground">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Cuenta de Superadministrador</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Máxima autoridad del sistema. Tiene control total sobre la aplicación, la gestión de
                                administradores, coordinadores y la configuración general.
                            </p>
                        </div>
                    </section>
                )}

                {/* ─── EXPEDIENTE ACADÉMICO DEL ALUMNO (Rol 5) ─── */}
                {esAlumno && (
                    <section className="rounded-xl border border-border bg-card shadow-xs">
                        <div className="border-b border-border px-5 py-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Información académica del alumno
                            </h3>
                        </div>

                        {!alumno && (
                            <div className="mx-5 mt-4 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-300">
                                Esta cuenta no tiene un expediente de alumno registrado en el sistema, por lo que algunos datos
                                académicos no están disponibles.
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <DatoItem icon={<UserIcon className="size-3.5" />} label="Nombre completo">
                                    {alumno?.nombre_completo || user.name}
                                </DatoItem>
                            </div>
                            <DatoItem icon={<IdCard className="size-3.5" />} label="Matrícula">
                                {alumno?.matricula || (
                                    <span className="font-normal text-muted-foreground">Sin matrícula</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<GraduationCap className="size-3.5" />} label="Carrera">
                                {alumno?.carrera?.nombre_carrera || (
                                    <span className="font-normal text-muted-foreground">No asignada</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<FileCheck2 className="size-3.5" />} label="CURP">
                                {alumno?.curp || (
                                    <span className="font-normal text-muted-foreground">No registrado</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<Phone className="size-3.5" />} label="Número telefónico">
                                {alumno?.telefono || (
                                    <span className="font-normal text-muted-foreground">No registrado</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<BookOpen className="size-3.5" />} label="Generación">
                                {alumno?.generacion || (
                                    <span className="font-normal text-muted-foreground">No especificada</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<Clock className="size-3.5" />} label="Turno">
                                {alumno?.turno || (
                                    <span className="font-normal text-muted-foreground">No especificado</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<UserPlus className="size-3.5" />} label="Registrado por">
                                {alumno?.usuario_registro?.name || (
                                    <span className="font-normal text-muted-foreground">Sistema</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<Calendar className="size-3.5" />} label="Fecha de ingreso">
                                {formatearFecha(alumno?.fecha_ingreso ?? alumno?.created_at ?? user.created_at)}
                            </DatoItem>
                        </div>
                    </section>
                )}

                {/* ─── INFORMACIÓN DEL ADMINISTRADOR (Roles 2 y 3) ─── */}
                {!esSuperadmin && !esAlumno && (
                    <section className="rounded-xl border border-border bg-card shadow-xs">
                        <div className="border-b border-border px-5 py-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Información del administrador
                            </h3>
                        </div>

                        {!administrador && (
                            <div className="mx-5 mt-4 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-300">
                                Esta cuenta no tiene un expediente de administrador registrado, por lo que algunos datos
                                no están disponibles.
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <DatoItem icon={<UserIcon className="size-3.5" />} label="Nombre completo">
                                    {administrador?.nombre_completo || user.name}
                                </DatoItem>
                            </div>
                            <DatoItem icon={<Phone className="size-3.5" />} label="Número telefónico">
                                {administrador?.telefono || (
                                    <span className="font-normal text-muted-foreground">No registrado</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<Briefcase className="size-3.5" />} label="Área">
                                {administrador?.area || (
                                    <span className="font-normal text-muted-foreground">No registrada</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<UserPlus className="size-3.5" />} label="Registrado por">
                                {administrador?.usuario_registro?.name || (
                                    <span className="font-normal text-muted-foreground">Sistema</span>
                                )}
                            </DatoItem>
                            <DatoItem icon={<Calendar className="size-3.5" />} label="Fecha de alta">
                                {formatearFecha(administrador?.created_at ?? user.created_at)}
                            </DatoItem>
                        </div>
                    </section>
                )}

                {/* ─── INFORMACIÓN DE LA CUENTA ─── */}
                <section className="rounded-xl border border-border bg-card shadow-xs">
                    <div className="border-b border-border px-5 py-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Información de la cuenta
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                        <DatoItem icon={<ShieldCheck className="size-3.5" />} label="Rol">
                            {rol}
                        </DatoItem>
                        <DatoItem icon={<Mail className="size-3.5" />} label="Correo institucional">
                            {user.email}
                        </DatoItem>
                        <DatoItem icon={<BadgeCheck className="size-3.5" />} label="Verificación de correo">
                            {user.email_verified_at ? (
                                <span className="text-[#10B981]">Verificado</span>
                            ) : (
                                <span className="text-[#EF4444]">Sin verificar</span>
                            )}
                        </DatoItem>
                        <DatoItem icon={<Calendar className="size-3.5" />} label="Miembro desde">
                            {formatearFecha(user.created_at)}
                        </DatoItem>
                    </div>
                </section>

                {/* ─── EDITAR DATOS DE ACCESO (funcionalidad original) ─── */}
                <section className="rounded-xl border border-border bg-card shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                        <Pencil className="size-3.5 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Editar datos de acceso
                        </h3>
                    </div>

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-4 p-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                                        Nombre de usuario <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        className={`block w-full rounded-xl border-border bg-background text-sm ${
                                            errors.name ? 'border-[#EF4444]' : ''
                                        }`}
                                        defaultValue={user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Nombre completo"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                                        Correo electrónico <span className="text-[#EF4444]">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className={`block w-full rounded-xl border-border bg-background text-sm ${
                                            errors.email ? 'border-[#EF4444]' : ''
                                        }`}
                                        defaultValue={user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="correo@institucion.mx"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="flex justify-end pt-1">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                        className="gap-2 rounded-xl border-2 border-[#fdff00] bg-white font-semibold text-black hover:bg-[#fdff00]/10 sm:w-40"
                                    >
                                        {processing && (
                                            <span className="loading loading-spinner loading-xs text-[#10B981]"></span>
                                        )}
                                        {processing ? 'Guardando...' : 'Guardar cambios'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </section>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Mi perfil',
            href: edit(),
        },
    ],
};
