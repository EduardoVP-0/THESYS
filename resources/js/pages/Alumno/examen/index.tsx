import { Head } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    Hourglass,
    Info,
    Mail,
    MapPin,
    ShieldCheck,
    UserCheck,
    Users,
    XCircle,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface AlumnoInfo {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
    matricula: string;
    carrera: string;
}

interface SustentanteInfo {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
    matricula: string;
}

interface AsesorInfo {
    nombre_completo: string;
    iniciales: string;
    grado_academico: string;
    abreviatura_grado: string;
    email: string | null;
}

interface ProyectoInfo {
    id_proyecto: number;
    titulo: string;
    resumen: string | null;
    estado: string;
    sustentantes: SustentanteInfo[];
    asesores: AsesorInfo[];
}

interface DocenteJurado {
    id_usuario: number;
    nombre_completo: string;
    iniciales: string;
    grado_academico: string;
    abreviatura_grado: string;
    especialidad: string;
    email: string | null;
}

interface JuradoItem {
    id_jurado_proyecto: number;
    cargo: string;
    es_titular: boolean;
    estado_aceptacion: string;
    voto: string | null;
    observaciones: string | null;
    docente: DocenteJurado;
}

interface VotosInfo {
    favor: number;
    contra: number;
    abstencion: number;
    emitidos: number;
    titulares: number;
    resumen: string;
}

interface ExamenInfo {
    id_examen: number;
    fecha: string;
    fecha_iso: string;
    fecha_larga: string;
    hora: string;
    hora_larga: string;
    sede: string;
    sede_direccion: string | null;
    estado_examen: string;
    estado_key: string;
    resultado_final: string | null;
    resultado_key: string | null;
    dias_restantes: number;
    votos: VotosInfo;
}

interface RequisitosInfo {
    director_aprobo: boolean;
    revisores_aprobaron: boolean;
    jurado_completo: boolean;
    jurado_asignados: number;
    revisores_asignados: number;
    listo: boolean;
}

interface Props {
    alumno: AlumnoInfo | null;
    proyecto: ProyectoInfo | null;
    examen: ExamenInfo | null;
    jurado: JuradoItem[];
    requisitos: RequisitosInfo | null;
}

function nombreConGrado(docente: DocenteJurado | AsesorInfo): string {
    return docente.abreviatura_grado
        ? `${docente.abreviatura_grado} ${docente.nombre_completo}`
        : docente.nombre_completo;
}

function AceptacionBadge({ estado }: { estado: string }) {
    if (estado === 'Aceptado') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-3 text-[#10B981]" />
                Confirmado
            </span>
        );
    }

    if (estado === 'Rechazado') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">
                <XCircle className="size-3 text-[#EF4444]" />
                En sustitución
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="size-3 text-[#F59E0B]" />
            Pendiente
        </span>
    );
}

function VotoBadge({ voto }: { voto: string }) {
    const clases =
        voto === 'A favor'
            ? 'border-[#10B981]/30 bg-[#10B981]/15 text-emerald-700 dark:text-emerald-400'
            : voto === 'En contra'
              ? 'border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400'
              : 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400';

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${clases}`}
        >
            Voto: {voto}
        </span>
    );
}

function EstadoExamenBadge({
    estado,
    clave,
}: {
    estado: string;
    clave: string;
}) {
    const clases =
        clave === 'realizado'
            ? 'border-[#10B981]/30 bg-[#10B981]/15 text-emerald-700 dark:text-emerald-400'
            : clave === 'cancelado'
              ? 'border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400'
              : 'border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-400';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${clases}`}
        >
            {estado}
        </span>
    );
}

function VotoChip({
    etiqueta,
    valor,
    tono,
}: {
    etiqueta: string;
    valor: number;
    tono: 'verde' | 'rojo' | 'ambar';
}) {
    const clases = {
        verde: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        rojo: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400',
        ambar: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    }[tono];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${clases}`}
        >
            <span className="text-sm font-bold">{valor}</span>
            {etiqueta}
        </span>
    );
}

function textoCuentaRegresiva(dias: number): string {
    if (dias > 1) {
        return `Faltan ${dias} días`;
    }

    if (dias === 1) {
        return 'Falta 1 día';
    }

    if (dias === 0) {
        return '¡Es hoy!';
    }

    return 'Fecha pasada';
}

export default function MiExamenIndex({
    alumno,
    proyecto,
    examen,
    jurado,
    requisitos,
}: Props) {
    const requisitosList = requisitos
        ? [
              {
                  ok: requisitos.director_aprobo,
                  titulo: 'Tesis aprobada por tu Director de Tesis',
                  detalle: requisitos.director_aprobo
                      ? 'Tu director aprobó la versión más reciente de tu tesis.'
                      : 'Tu director debe aprobar la versión más reciente de tu tesis.',
              },
              {
                  ok: requisitos.revisores_aprobaron,
                  titulo: 'Tesis aprobada por tus 2 revisores',
                  detalle: requisitos.revisores_aprobaron
                      ? 'Ambos revisores aprobaron tu tesis.'
                      : `Revisores asignados: ${requisitos.revisores_asignados} de 2.`,
              },
              {
                  ok: requisitos.jurado_completo,
                  titulo: 'Jurado completo',
                  detalle: requisitos.jurado_completo
                      ? 'Los 5 cargos del jurado están cubiertos.'
                      : `Integrantes asignados: ${requisitos.jurado_asignados} de 5.`,
              },
          ]
        : [];

    return (
        <>
            <Head title="Mis Exámenes" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
                {/* ENCABEZADO INSTITUCIONAL */}
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Mi examen profesional
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                            MIS EXÁMENES
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Consulta la fecha, la hora, la sede y los detalles de
                            tu examen de titulación.
                        </p>
                    </div>

                    {alumno && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-[#B8D4E3]/50 bg-[#B8D4E3]/25 px-3 py-1.5 dark:border-slate-700 dark:bg-[#B8D4E3]/10">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#B8D4E3]/60 text-[11px] font-bold text-slate-800 select-none dark:bg-[#B8D4E3]/20 dark:text-slate-100">
                                {alumno.iniciales}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-foreground">
                                    {alumno.nombre_completo}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {alumno.matricula} · {alumno.carrera}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {!proyecto ? (
                    <Card className="rounded-2xl border-border bg-card shadow-xs">
                        <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                            <FileText className="size-8 text-muted-foreground" />
                            <p className="text-sm font-bold text-foreground">
                                Aún no tienes un proyecto registrado
                            </p>
                            <p className="max-w-md text-xs text-muted-foreground">
                                Cuando tu anteproyecto sea aprobado podrás
                                consultar aquí la programación de tu examen
                                profesional.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {examen ? (
                            <>
                                {/* TARJETA PRINCIPAL: DÍA, HORA Y SEDE */}
                                <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
                                            <div className="border-b border-border bg-[#B8D4E3]/35 p-5 sm:p-6 lg:border-r lg:border-b-0 dark:bg-[#B8D4E3]/10">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        <CalendarDays className="size-4 text-slate-600 dark:text-slate-300" />
                                                        Día del examen
                                                    </span>
                                                    <EstadoExamenBadge
                                                        estado={
                                                            examen.estado_examen
                                                        }
                                                        clave={examen.estado_key}
                                                    />
                                                </div>

                                                <p className="mt-3 text-xl leading-snug font-bold text-foreground sm:text-2xl">
                                                    {examen.fecha_larga}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {examen.fecha}
                                                </p>

                                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold text-foreground">
                                                        <Clock className="size-3.5 text-[#10B981]" />
                                                        {examen.hora_larga}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                                                            examen.dias_restantes >=
                                                            0
                                                                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                                                : 'border-border bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {textoCuentaRegresiva(
                                                            examen.dias_restantes,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        Sede del examen
                                                    </span>
                                                    <p className="mt-1 flex items-start gap-1.5 text-sm font-bold text-foreground">
                                                        <MapPin className="mt-0.5 size-4 shrink-0 text-[#EF4444]" />
                                                        {examen.sede}
                                                    </p>
                                                    {examen.sede_direccion && (
                                                        <p className="mt-1 pl-5 text-xs text-muted-foreground">
                                                            {
                                                                examen.sede_direccion
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            Estado
                                                        </span>
                                                        <p className="mt-1 text-xs font-semibold text-foreground">
                                                            {
                                                                examen.estado_examen
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            Resultado
                                                        </span>
                                                        <p className="mt-1 text-xs font-semibold text-foreground">
                                                            {examen.resultado_final ??
                                                                'Pendiente'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* VEREDICTO DEL JURADO */}
                                {(examen.estado_key === 'realizado' ||
                                    examen.resultado_final !== null ||
                                    examen.votos.emitidos > 0) && (
                                    <Card className="rounded-xl border-border bg-card shadow-xs">
                                        <CardContent className="p-4 sm:p-5">
                                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                                <div className="flex items-start gap-3">
                                                    <div className="shrink-0 rounded-xl bg-emerald-500/10 p-2.5 text-[#10B981]">
                                                        <Award className="size-4" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            Veredicto del jurado
                                                        </span>
                                                        <p className="mt-0.5 text-sm font-bold text-foreground">
                                                            {examen.resultado_final ??
                                                                'Pendiente de veredicto'}
                                                        </p>
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            Votos emitidos:{' '}
                                                            {
                                                                examen.votos
                                                                    .emitidos
                                                            }{' '}
                                                            de{' '}
                                                            {
                                                                examen.votos
                                                                    .titulares
                                                            }{' '}
                                                            miembros titulares.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <VotoChip
                                                        etiqueta="A favor"
                                                        valor={
                                                            examen.votos.favor
                                                        }
                                                        tono="verde"
                                                    />
                                                    <VotoChip
                                                        etiqueta="En contra"
                                                        valor={
                                                            examen.votos.contra
                                                        }
                                                        tono="rojo"
                                                    />
                                                    <VotoChip
                                                        etiqueta="Abstención"
                                                        valor={
                                                            examen.votos
                                                                .abstencion
                                                        }
                                                        tono="ambar"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <>
                                {/* EXAMEN AÚN NO PROGRAMADO */}
                                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
                                    <Hourglass className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                                            Tu examen aún no ha sido programado
                                        </p>
                                        <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-400/90">
                                            La coordinación académica asignará
                                            la fecha, la hora y la sede cuando
                                            tu expediente esté listo. Revisa el
                                            avance de tus requisitos.
                                        </p>
                                    </div>
                                </div>

                                {/* CHECKLIST DE REQUISITOS */}
                                {requisitos && (
                                    <Card className="rounded-2xl border-border bg-card shadow-xs">
                                        <CardContent className="p-5 sm:p-6">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                                        Requisitos previos
                                                    </h2>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        La programación del
                                                        examen depende de estos
                                                        puntos.
                                                    </p>
                                                </div>

                                                {requisitos.listo ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                        <CheckCircle2 className="size-3 text-[#10B981]" />
                                                        Requisitos completos
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                                        <Hourglass className="size-3 text-[#F59E0B]" />
                                                        En proceso
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-4 divide-y divide-border">
                                                {requisitosList.map((item) => (
                                                    <div
                                                        key={item.titulo}
                                                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                                                    >
                                                        {item.ok ? (
                                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                                                        ) : (
                                                            <XCircle className="mt-0.5 size-4 shrink-0 text-[#EF4444]" />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-foreground">
                                                                {item.titulo}
                                                            </p>
                                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                                {item.detalle}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}

                        {/* PROYECTO DE TESIS */}
                        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
                            <CardContent className="p-5 sm:p-6">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0 rounded-xl bg-[#B8D4E3]/40 p-2.5 text-slate-700 dark:bg-[#B8D4E3]/15 dark:text-slate-200">
                                        <FileText className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Proyecto de tesis
                                            </span>
                                            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                {proyecto.estado}
                                            </span>
                                        </div>
                                        <h2 className="mt-1 text-sm font-bold text-foreground sm:text-base">
                                            {proyecto.titulo}
                                        </h2>
                                        {proyecto.resumen && (
                                            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                                                {proyecto.resumen}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Sustentante(s)
                                        </span>
                                        <div className="mt-2 space-y-2">
                                            {proyecto.sustentantes.map(
                                                (sustentante) => (
                                                    <div
                                                        key={
                                                            sustentante.id_usuario
                                                        }
                                                        className="flex items-center gap-2.5"
                                                    >
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#B8D4E3]/45 text-[11px] font-bold text-slate-800 select-none dark:bg-[#B8D4E3]/20 dark:text-slate-100">
                                                            {
                                                                sustentante.iniciales
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">
                                                                {
                                                                    sustentante.nombre_completo
                                                                }
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {
                                                                    sustentante.matricula
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Director(es) de tesis
                                        </span>
                                        <div className="mt-2 space-y-2">
                                            {proyecto.asesores.length > 0 ? (
                                                proyecto.asesores.map(
                                                    (asesor) => (
                                                        <div
                                                            key={
                                                                asesor.nombre_completo
                                                            }
                                                            className="flex items-start gap-2.5"
                                                        >
                                                            <UserCheck className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                                                            <div>
                                                                <p className="text-xs font-semibold text-foreground">
                                                                    {nombreConGrado(
                                                                        asesor,
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {
                                                                        asesor.grado_academico
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    Sin director asignado.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* JURADO EVALUADOR */}
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        Jurado evaluador
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Comité asignado para tu examen
                                        profesional.
                                    </p>
                                </div>

                                {jurado.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8D4E3]/60 bg-[#B8D4E3]/25 px-3 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-[#B8D4E3]/10 dark:text-slate-200">
                                        <Users className="size-3.5" />
                                        {jurado.length} integrantes
                                    </span>
                                )}
                            </div>

                            {jurado.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {jurado.map((miembro) => (
                                        <Card
                                            key={miembro.id_jurado_proyecto}
                                            className="rounded-2xl border-border bg-card shadow-xs transition-colors hover:border-[#B8D4E3] dark:hover:border-slate-700"
                                        >
                                            <CardContent className="p-4 sm:p-5">
                                                <div className="flex items-start gap-3.5">
                                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#B8D4E3]/45 text-sm font-bold text-slate-800 select-none dark:bg-[#B8D4E3]/20 dark:text-slate-100">
                                                        {
                                                            miembro.docente
                                                                .iniciales
                                                        }
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                {miembro.cargo}
                                                            </span>
                                                            <AceptacionBadge
                                                                estado={
                                                                    miembro.estado_aceptacion
                                                                }
                                                            />
                                                            {miembro.voto && (
                                                                <VotoBadge
                                                                    voto={
                                                                        miembro.voto
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <p className="mt-1 text-sm font-bold text-foreground">
                                                            {nombreConGrado(
                                                                miembro.docente,
                                                            )}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {
                                                                miembro.docente
                                                                    .grado_academico
                                                            }
                                                            {miembro.docente
                                                                .especialidad &&
                                                            miembro.docente
                                                                .especialidad !==
                                                                'Sin especialidad registrada'
                                                                ? ` · ${miembro.docente.especialidad}`
                                                                : ''}
                                                        </p>

                                                        {miembro.docente
                                                            .email && (
                                                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <Mail className="size-3" />
                                                                {
                                                                    miembro
                                                                        .docente
                                                                        .email
                                                                }
                                                            </p>
                                                        )}

                                                        {miembro.observaciones && (
                                                            <p className="mt-2 text-[11px] text-muted-foreground italic">
                                                                “
                                                                {
                                                                    miembro.observaciones
                                                                }
                                                                ”
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="rounded-2xl border-border bg-card shadow-xs">
                                    <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                                        <Users className="size-7 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-foreground">
                                            Jurado aún no asignado
                                        </p>
                                        <p className="max-w-md text-xs text-muted-foreground">
                                            La coordinación asignará a los
                                            integrantes del jurado evaluador.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* INDICACIONES PARA EL DÍA DEL EXAMEN */}
                        {examen && (
                            <Card className="rounded-2xl border-border bg-card shadow-xs">
                                <CardContent className="p-5 sm:p-6">
                                    <div className="flex items-center gap-2">
                                        <Info className="size-4 text-slate-600 dark:text-slate-300" />
                                        <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                            Indicaciones para el día del examen
                                        </h2>
                                    </div>

                                    <ul className="mt-3 grid gap-2.5 text-xs text-muted-foreground sm:grid-cols-2">
                                        <li className="flex items-start gap-2">
                                            <Clock className="mt-0.5 size-3.5 shrink-0 text-[#10B981]" />
                                            Preséntate al menos 30 minutos
                                            antes de tu hora programada.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#10B981]" />
                                            Lleva una identificación oficial
                                            vigente con fotografía.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#10B981]" />
                                            Verifica la sede y la dirección
                                            antes de acudir.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <BookOpen className="mt-0.5 size-3.5 shrink-0 text-[#10B981]" />
                                            Conserva tu comprobante de pago y
                                            los ejemplares de tesis que
                                            solicite el jurado.
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
