import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Eye,
    FileText,
    Mail,
    MoreHorizontal,
    Scale,
    UserCheck,
    Users,
    XCircle,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    MiJuradoProyectoData,
    SinodalItem,
} from './types';
import { ShowModal } from './show-modal';

interface Props {
    proyecto: MiJuradoProyectoData | null;
}

export default function MiJuradoIndex({ proyecto }: Props) {
    const [selectedSinodal, setSelectedSinodal] = useState<SinodalItem | null>(null);
    const [showModalOpen, setShowModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const jurados = proyecto?.jurados ?? [];
    const tieneJurado = Boolean(proyecto?.tiene_jurado && jurados.length > 0);

    const handleOpenDetail = (sinodal: SinodalItem) => {
        setSelectedSinodal(sinodal);
        setShowModalOpen(true);
    };

    const handleCopyEmail = async (sinodal: SinodalItem) => {
        if (!sinodal.docente.email) return;
        try {
            await navigator.clipboard.writeText(sinodal.docente.email);
            setCopiedId(sinodal.id_jurado_proyecto);
            setTimeout(() => {
                setCopiedId((prev) =>
                    prev === sinodal.id_jurado_proyecto ? null : prev,
                );
            }, 2200);
        } catch {
            // Fallback silencioso
        }
    };

    const renderEstadoAceptacionBadge = (estado: string) => {
        switch (estado) {
            case 'Aceptado':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10B981]/15 text-emerald-700 dark:text-emerald-400 border border-[#10B981]/30">
                        <CheckCircle2 className="size-3 text-[#10B981]" />
                        Confirmado
                    </span>
                );
            case 'Rechazado':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
                        <XCircle className="size-3 text-[#EF4444]" />
                        En sustitución
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="size-3 text-[#F59E0B]" />
                        Pendiente
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Mi Jurado" />

            <div className="flex flex-col gap-5 p-4 md:p-6 max-w-6xl mx-auto w-full">
                {/* ENCABEZADO INSTITUCIONAL */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                            Mi comité evaluador
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                            MI JURADO
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Integrantes del comité asignados para tu evaluación de examen de defensa de tesis.
                        </p>
                    </div>

                    {tieneJurado && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                            <Users className="size-4 text-[#10B981]" />
                            <span>{jurados.length} Jurados asignados</span>
                        </div>
                    )}
                </div>

                {/* RESUMEN COMPACTO DEL PROYECTO Y DIRECTOR DE TESIS */}
                {proyecto && (
                    <Card className="border-border shadow-xs rounded-xl bg-card overflow-hidden">
                        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="p-2.5 rounded-xl bg-[#B8D4E3]/40 dark:bg-[#B8D4E3]/15 text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                                    <FileText className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                        Proyecto de Tesis Registrado
                                    </span>
                                    <h2 className="text-sm font-bold text-foreground line-clamp-2 mt-0.5">
                                        {proyecto.titulo}
                                    </h2>
                                </div>
                            </div>

                            {proyecto.asesor && (
                                <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-border md:pl-5 shrink-0">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-[#10B981] shrink-0">
                                        <UserCheck className="size-4" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                            Director de Tesis (Asesor)
                                        </span>
                                        <p className="text-xs font-bold text-foreground">
                                            {proyecto.asesor.abreviatura_grado
                                                ? `${proyecto.asesor.abreviatura_grado} `
                                                : ''}
                                            {proyecto.asesor.nombre_completo}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* GRID DE TARJETAS DEL COMITE (ESTILO BORRADOR + INSTITUCIONAL) */}
                {tieneJurado ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jurados.map((sinodal) => {
                            const { docente } = sinodal;
                            const nombreFormateado = docente.abreviatura_grado
                                ? `${docente.abreviatura_grado} ${docente.nombre_completo}`
                                : docente.nombre_completo;
                            const isCopied = copiedId === sinodal.id_jurado_proyecto;

                            return (
                                <Card
                                    key={sinodal.id_jurado_proyecto}
                                    className="border-border shadow-xs rounded-2xl bg-card hover:border-[#B8D4E3] dark:hover:border-slate-700 transition-colors"
                                >
                                    <CardContent className="p-5 sm:p-6">
                                        <div className="flex items-start gap-4">
                                            {/* AVATAR CIRCULAR CON INICIALES */}
                                            <div className="size-13 rounded-full bg-[#B8D4E3]/45 dark:bg-[#B8D4E3]/20 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-base shrink-0 select-none">
                                                {docente.iniciales}
                                            </div>

                                            {/* INFORMACION RESUMIDA DEL SINODAL */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            {sinodal.cargo}
                                                        </span>
                                                        {renderEstadoAceptacionBadge(
                                                            sinodal.estado_aceptacion,
                                                        )}
                                                    </div>

                                                    {/* MENU DE 3 PUNTITOS (...) */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 -mr-1.5 -mt-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                                                aria-label={`Opciones para ${nombreFormateado}`}
                                                            >
                                                                <MoreHorizontal className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-56"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleOpenDetail(sinodal)
                                                                }
                                                                className="text-xs cursor-pointer gap-2"
                                                            >
                                                                <Eye className="size-3.5 text-muted-foreground" />
                                                                Ver ficha del jurado
                                                            </DropdownMenuItem>

                                                            {docente.email && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleCopyEmail(sinodal)
                                                                    }
                                                                    className="text-xs cursor-pointer gap-2"
                                                                >
                                                                    {isCopied ? (
                                                                        <Check className="size-3.5 text-[#10B981]" />
                                                                    ) : (
                                                                        <Copy className="size-3.5 text-muted-foreground" />
                                                                    )}
                                                                    {isCopied
                                                                        ? 'Correo copiado'
                                                                        : 'Copiar correo institucional'}
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* NOMBRE COMPLETO CON GRADO ACADEMICO */}
                                                <h3
                                                    onClick={() => handleOpenDetail(sinodal)}
                                                    className="text-base font-bold text-foreground mt-0.5 cursor-pointer hover:text-[#10B981] transition-colors truncate"
                                                    title={nombreFormateado}
                                                >
                                                    {nombreFormateado}
                                                </h3>

                                                {/* ESPECIALIDAD */}
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {docente.especialidad}
                                                </p>

                                                {/* CORREO INSTITUCIONAL */}
                                                <div className="mt-3 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                                                        <Mail className="size-3.5 shrink-0 text-muted-foreground/80" />
                                                        <span className="truncate">
                                                            {docente.email ||
                                                                'Sin correo registrado'}
                                                        </span>
                                                    </div>

                                                    {isCopied && (
                                                        <span className="text-[10px] font-semibold text-[#10B981] shrink-0">
                                                            ¡Copiado!
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    /* ESTADO VACIO CUANDO AUN NO TIENE JURADO ASIGNADO */
                    <Card className="border-border shadow-xs rounded-2xl bg-card">
                        <CardContent className="p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                            <div className="size-12 rounded-full bg-[#B8D4E3]/35 dark:bg-[#B8D4E3]/15 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                                <Scale className="size-6" />
                            </div>
                            <h3 className="text-base font-bold text-foreground">
                                Comité de jurado aún por asignar
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {proyecto
                                    ? 'La coordinación académica aún no ha registrado la conformación del jurado evaluador para tu proyecto de tesis. En cuanto sean designados tus sinodales titulares y suplentes, aparecerán en este módulo.'
                                    : 'Para contar con un comité de jurado asignado, primero debes registrar y obtener la aprobación de tu propuesta en el módulo de Mi Anteproyecto.'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* MODAL DE VISTA DETALLADA DEL SINODAL EN ARCHIVO SEPARADO */}
            <ShowModal
                open={showModalOpen}
                onOpenChange={setShowModalOpen}
                sinodal={selectedSinodal}
            />
        </>
    );
}

// Breadcrumbs para la barra superior
MiJuradoIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Mi Jurado',
            href: '/alumno/mi-jurado',
        },
    ],
};

