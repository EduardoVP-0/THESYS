import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    FolderOpen,
    FileText,
    FileBadge,
    CheckCircle2,
    Clock,
    AlertCircle,
    UserCheck,
    Users,
    CreditCard,
    Eye,
    ChevronDown,
    ChevronRight,
    Mail,
    Hash,
    Info,
    Phone,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlumnoDetalle,
    ProyectoDetalle,
    CarpetasExpediente,
    ResumenExpediente,
} from './types';

interface Props {
    alumno: AlumnoDetalle;
    proyecto: ProyectoDetalle | null;
    carpetas: CarpetasExpediente;
    resumen: ResumenExpediente;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function MiExpedienteIndex({
    alumno,
    proyecto,
    carpetas,
    resumen,
    flash,
}: Props) {
    // Estado de acordeones abiertos (mismo comportamiento que la carpeta de admin)
    const [openFolders, setOpenFolders] = useState({
        anteproyecto: true,
        versiones: false,
        oficios: false,
        comite: false,
        pagos: false,
    });

    const toggleFolder = (key: keyof typeof openFolders) => {
        setOpenFolders((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const getEstadoProyectoBadge = (estado?: string) => {
        switch (estado) {
            case 'Aprobado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="size-3" />
                        Aprobado
                    </span>
                );
            case 'En revisión':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                        <Clock className="size-3" />
                        En revisión
                    </span>
                );
            case 'Con cambios':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <AlertCircle className="size-3" />
                        Con cambios
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        {estado || 'Sin anteproyecto'}
                    </span>
                );
        }
    };

    const revisoresList = proyecto?.revisores || [];
    const totalComite = (proyecto?.asesor ? 1 : 0) + revisoresList.length;

    return (
        <>
            <Head title={`Mi Expediente - ${alumno.nombre_completo}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground min-h-screen">
                {/* ALERTA FLASH */}
                {flash?.success && (
                    <div className="alert alert-success alert-soft shadow-xs py-2.5 px-4 text-sm flex items-center gap-2 border-l-4 border-l-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 text-foreground animate-in fade-in-50 duration-300">
                        <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                )}

                {/* ENCABEZADO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            MI EXPEDIENTE
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Consulta y auditoría tus documentos, comités y versiones
                        </p>
                    </div>
                </div>

                {/* FICHA RESUMEN DEL ALUMNO */}
                <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                    <div className="p-5 sm:p-6 bg-card border-b border-border">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="size-14 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-xl border border-[#10B981]/30 shrink-0">
                                    {alumno.iniciales}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-lg sm:text-xl font-bold text-foreground">
                                            {alumno.nombre_completo}
                                        </h2>
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                                            {alumno.estado_academico}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                                        <span>
                                            Matrícula: <strong className="text-foreground">{alumno.matricula}</strong>
                                        </span>
                                        <span>&bull;</span>
                                        <span>{alumno.carrera}</span>
                                        {alumno.generacion && (
                                            <>
                                                <span>&bull;</span>
                                                <span>Gen. {alumno.generacion}</span>
                                            </>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground flex-wrap">
                                        {alumno.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="size-3" />
                                                {alumno.email}
                                            </span>
                                        )}
                                        {alumno.curp && (
                                            <span className="flex items-center gap-1">
                                                <Hash className="size-3" />
                                                CURP: {alumno.curp}
                                            </span>
                                        )}
                                        {alumno.telefono && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="size-3" />
                                                {alumno.telefono}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Badge de resumen */}
                            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                                <div className="text-left md:text-right">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Documentación en Nube
                                    </p>
                                    <p className="text-lg font-bold text-foreground">
                                        {resumen.total_archivos} archivo(s) disponibles
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <CheckCircle2 className="size-4" />
                                    Expediente sincronizado
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumen del Tema de Tesis Activo */}
                    {proyecto ? (
                        <div className="p-4 sm:p-5 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                                <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                                    Proyecto de Titulación Registrado
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                    {proyecto.titulo}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {getEstadoProyectoBadge(proyecto.estado)}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-muted/20 text-xs text-muted-foreground italic flex items-center gap-2">
                            <Info className="size-4" />
                            El sustentante aún no cuenta con un anteproyecto de titulación registrado.
                        </div>
                    )}
                </Card>

                {/* SECCIONES / CARPETAS DE ARCHIVOS */}
                <div className="space-y-3.5">
                    {/* CARPETA 1: ANTEPROYECTO INICIAL */}
                    <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                        <div
                            onClick={() => toggleFolder('anteproyecto')}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
                        >
                            <div className="flex items-center gap-2.5">
                                {openFolders.anteproyecto ? (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                )}
                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <FileText className="size-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-foreground">
                                    Anteproyecto Inicial / Protocolo
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({carpetas.anteproyecto ? '1 archivo' : '0 archivos'})
                                </span>
                            </div>

                            {carpetas.anteproyecto && (
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                    Enviado: {carpetas.anteproyecto.fecha_envio}
                                </span>
                            )}
                        </div>

                        {openFolders.anteproyecto && (
                            <div className="px-4 pb-4 pt-1 border-t border-border/60">
                                {carpetas.anteproyecto ? (
                                    <div className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                                                <FileText className="size-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-md">
                                                    {carpetas.anteproyecto.nombre_archivo}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Documento PDF oficial del anteproyecto • Estado: {carpetas.anteproyecto.estado}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <a
                                                href={carpetas.anteproyecto.url_visor}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-500/10 cursor-pointer"
                                                >
                                                    <Eye className="size-3.5 mr-1.5" />
                                                    Ver archivo
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-3 italic">
                                        No se ha adjuntado ningún documento de anteproyecto para este sustentante.
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* CARPETA 2: VERSIONES DE TESIS */}
                    <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                        <div
                            onClick={() => toggleFolder('versiones')}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
                        >
                            <div className="flex items-center gap-2.5">
                                {openFolders.versiones ? (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                )}
                                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <FolderOpen className="size-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-foreground">
                                    Versiones y Entregas de Tesis
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({carpetas.versiones_tesis.length} archivo(s))
                                </span>
                            </div>
                        </div>

                        {openFolders.versiones && (
                            <div className="px-4 pb-4 pt-1 border-t border-border/60">
                                {carpetas.versiones_tesis.length > 0 ? (
                                    <div className="space-y-2 mt-2">
                                        {carpetas.versiones_tesis.map((version) => (
                                            <div
                                                key={version.id_version}
                                                className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 font-bold text-xs">
                                                        {version.numero_version}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-md">
                                                            {version.nombre_archivo}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Entregado: {version.fecha}
                                                            {version.comentario ? ` • "${version.comentario}"` : ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                <a
                                                    href={version.url_visor}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="self-end sm:self-auto"
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-500/10 cursor-pointer"
                                                    >
                                                        <Eye className="size-3.5 mr-1.5" />
                                                        Ver archivo
                                                    </Button>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-3 italic">
                                        El alumno aún no ha registrado borradores ni versiones de tesis en el sistema.
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* CARPETA 3: OFICIOS GENERADOS Y DOCUMENTOS OFICIALES */}
                    <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                        <div
                            onClick={() => toggleFolder('oficios')}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
                        >
                            <div className="flex items-center gap-2.5">
                                {openFolders.oficios ? (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                )}
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <FileBadge className="size-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-foreground">
                                    Oficios y Documentos Oficiales
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({carpetas.oficios.length} archivo(s))
                                </span>
                            </div>
                        </div>

                        {openFolders.oficios && (
                            <div className="px-4 pb-4 pt-1 border-t border-border/60">
                                {carpetas.oficios.length > 0 ? (
                                    <div className="space-y-2 mt-2">
                                        {carpetas.oficios.map((oficio) => (
                                            <div
                                                key={oficio.id_oficio}
                                                className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                                        <FileBadge className="size-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-foreground">
                                                            {oficio.tipo_oficio}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground truncate max-w-md">
                                                            {oficio.nombre_archivo} • Registrado el {oficio.fecha}
                                                        </p>
                                                    </div>
                                                </div>

                                                <a
                                                    href={oficio.url_visor}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="self-end sm:self-auto"
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-500/10 cursor-pointer"
                                                    >
                                                        <Eye className="size-3.5 mr-1.5" />
                                                        Ver archivo
                                                    </Button>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-3 italic">
                                        No hay oficios oficiales asociados al expediente de este sustentante.
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* CARPETA 4: COMITE ACADEMICO (Asesor y Revisores Sinodales) */}
                    <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                        <div
                            onClick={() => toggleFolder('comite')}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
                        >
                            <div className="flex items-center gap-2.5">
                                {openFolders.comite ? (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                )}
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Users className="size-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-foreground">
                                    Comité Académico Asignado
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({totalComite} docente(s))
                                </span>
                            </div>
                        </div>

                        {openFolders.comite && (
                            <div className="px-4 pb-4 pt-1 border-t border-border/60 space-y-3 mt-2">
                                {/* Director / Asesor */}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                        Director / Asesor de Tesis
                                    </span>
                                    {proyecto?.asesor ? (
                                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                                    <UserCheck className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-foreground">
                                                        {proyecto.asesor.grado_academico ? `${proyecto.asesor.grado_academico} ` : ''}
                                                        {proyecto.asesor.nombre_completo}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {proyecto.asesor.especialidad || 'Docente Investigador'}
                                                        {proyecto.asesor.email ? ` • ${proyecto.asesor.email}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                                                Asesor Activo
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                                            Sin asesor asignado formalmente en el anteproyecto.
                                        </p>
                                    )}
                                </div>

                                {/* Revisores Sinodales */}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                        Revisores Oficiales
                                    </span>
                                    {revisoresList.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {revisoresList.map((revisor, idx) => (
                                                <div
                                                    key={revisor.id_usuario}
                                                    className="p-3 rounded-lg bg-muted/30 border border-border space-y-1"
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                        Revisor {idx + 1}
                                                    </span>
                                                    <p className="text-xs sm:text-sm font-bold text-foreground mt-1">
                                                        {revisor.grado_academico ? `${revisor.grado_academico} ` : ''}
                                                        {revisor.nombre_completo}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {revisor.especialidad || 'Docente Investigador'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-xs text-muted-foreground">
                                            No se han designado los revisores para este sustentante.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* CARPETA 5: TRAMITES FINANCIEROS Y PAGOS */}
                    <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                        <div
                            onClick={() => toggleFolder('pagos')}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
                        >
                            <div className="flex items-center gap-2.5">
                                {openFolders.pagos ? (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                )}
                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <CreditCard className="size-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-foreground">
                                    Trámites Financieros y Cuotas
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({carpetas.pagos.length} registro(s))
                                </span>
                            </div>
                        </div>

                        {openFolders.pagos && (
                            <div className="px-4 pb-4 pt-1 border-t border-border/60">
                                {carpetas.pagos.length > 0 ? (
                                    <div className="space-y-2 mt-2">
                                        {carpetas.pagos.map((pago) => (
                                            <div
                                                key={pago.id_pago}
                                                className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                            >
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-foreground">
                                                        {pago.concepto}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Monto: ${Number(pago.monto).toFixed(2)} MXN
                                                        {pago.referencia_bancaria ? ` • Ref: ${pago.referencia_bancaria}` : ''}
                                                        {` • ${pago.fecha}`}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold self-start sm:self-auto ${
                                                        pago.estado_validacion === 'Validado'
                                                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                                    }`}
                                                >
                                                    {pago.estado_validacion}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-3 italic">
                                        No se registran trámites de pago para este expediente.
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}

// Breadcrumbs para la barra superior
MiExpedienteIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Mi Expediente',
            href: '/alumno/mi-expediente',
        },
    ],
};

