import { useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    GraduationCap,
    RefreshCw,
    Search,
    ShieldAlert,
    UserCheck,
    UserX,
    UsersRound,
} from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { sustituir } from '@/routes/admin/asignaciones/jurados';
import type { DocenteJurado, MiembroJurado, ProyectoJurado } from '../types';

interface SustituirJuradoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proyecto: ProyectoJurado | null;
    docentes: DocenteJurado[];
    miembroInicial?: MiembroJurado | null;
}

const CARGOS_TITULARES = ['Presidente', 'Secretario', 'Vocal'];

export function SustituirJuradoModal({
    open,
    onOpenChange,
    proyecto,
    docentes,
    miembroInicial,
}: SustituirJuradoModalProps) {
    const [busquedaDocente, setBusquedaDocente] = useState('');

    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({
        id_jurado_rechazado: '',
        id_suplente_promovido: '',
        id_nuevo_docente: '',
    });

    // Detectar miembros del jurado
    const miembrosJurado = proyecto?.jurado ?? [];

    // Suplentes actuales del proyecto
    const suplentesActuales = useMemo(() => {
        return miembrosJurado.filter(
            (m) => m.cargo === 'Suplente 1' || m.cargo === 'Suplente 2'
        );
    }, [miembrosJurado]);

    // IDs de asesores y sustentantes del proyecto para validaciones
    const advisorIds = useMemo(() => {
        return proyecto?.asesores.map((a) => a.id_usuario) ?? [];
    }, [proyecto]);

    const sustentanteIds = useMemo(() => {
        return proyecto?.sustentantes.map((s) => s.id_usuario) ?? [];
    }, [proyecto]);

    // Al abrir el modal o cambiar miembroInicial/proyecto, preseleccionar
    useEffect(() => {
        if (!open) {
            reset();
            clearErrors();
            setBusquedaDocente('');
            return;
        }

        // Si se especificó un miembro inicial, usarlo
        if (miembroInicial) {
            setData('id_jurado_rechazado', String(miembroInicial.id_jurado_proyecto));
            return;
        }

        // Si hay algún miembro con estado Rechazado, preseleccionarlo
        const primerRechazado = miembrosJurado.find(
            (m) => m.estado_aceptacion.toLowerCase().startsWith('rechaz')
        );

        if (primerRechazado) {
            setData('id_jurado_rechazado', String(primerRechazado.id_jurado_proyecto));
        } else if (miembrosJurado.length > 0) {
            setData('id_jurado_rechazado', String(miembrosJurado[0].id_jurado_proyecto));
        }
    }, [open, miembroInicial, proyecto]);

    const miembroSeleccionado = useMemo(() => {
        return miembrosJurado.find(
            (m) => String(m.id_jurado_proyecto) === data.id_jurado_rechazado
        ) ?? null;
    }, [miembrosJurado, data.id_jurado_rechazado]);

    const esTitular = miembroSeleccionado
        ? CARGOS_TITULARES.includes(miembroSeleccionado.cargo)
        : false;

    // Suplente seleccionado para ascender
    const suplenteSeleccionado = useMemo(() => {
        return suplentesActuales.find(
            (s) => String(s.id_jurado_proyecto) === data.id_suplente_promovido
        ) ?? null;
    }, [suplentesActuales, data.id_suplente_promovido]);

    // Si el titular que rechazó es Presidente, el suplente promovido no puede ser el asesor
    const suplenteEsAsesorParaPresidente = useMemo(() => {
        if (!miembroSeleccionado || miembroSeleccionado.cargo !== 'Presidente') return false;
        if (!suplenteSeleccionado) return false;
        return advisorIds.includes(suplenteSeleccionado.id_usuario);
    }, [miembroSeleccionado, suplenteSeleccionado, advisorIds]);

    // Si es titular y solo hay un suplente elegible o ninguno seleccionado aún, sugerir primero válido
    useEffect(() => {
        if (esTitular && !data.id_suplente_promovido && suplentesActuales.length > 0) {
            const suplenteValido = suplentesActuales.find((s) => {
                if (miembroSeleccionado?.cargo === 'Presidente') {
                    return !advisorIds.includes(s.id_usuario);
                }
                return true;
            });
            if (suplenteValido) {
                setData('id_suplente_promovido', String(suplenteValido.id_jurado_proyecto));
            }
        }
    }, [esTitular, data.id_suplente_promovido, suplentesActuales, miembroSeleccionado, advisorIds]);

    const esReemplazoDirecto = data.id_suplente_promovido === 'directo';

    // Docentes disponibles para ocupar la nueva vacante
    // Excluir a los docentes que ya forman parte del jurado (excepto el que sale) y sustentantes
    const docentesElegibles = useMemo(() => {
        const idsOcupados = miembrosJurado
            .filter((m) => m.id_jurado_proyecto !== miembroSeleccionado?.id_jurado_proyecto)
            .map((m) => m.id_usuario);

        const term = busquedaDocente.trim().toLowerCase();

        return docentes.filter((d) => {
            if (idsOcupados.includes(d.id_usuario)) return false;
            if (sustentanteIds.includes(d.id_usuario)) return false;
            if (
                esTitular &&
                esReemplazoDirecto &&
                miembroSeleccionado?.cargo === 'Presidente' &&
                advisorIds.includes(d.id_usuario)
            ) {
                return false;
            }

            if (!term) return true;

            return (
                d.nombre_completo.toLowerCase().includes(term) ||
                (d.cedula_profesional?.toLowerCase().includes(term) ?? false) ||
                (d.especialidad?.toLowerCase().includes(term) ?? false) ||
                (d.email?.toLowerCase().includes(term) ?? false)
            );
        });
    }, [docentes, miembrosJurado, miembroSeleccionado, sustentanteIds, busquedaDocente, esTitular, esReemplazoDirecto, advisorIds]);

    const canSubmit = useMemo(() => {
        if (!proyecto || !data.id_jurado_rechazado || !data.id_nuevo_docente || processing) {
            return false;
        }
        if (esTitular && !esReemplazoDirecto) {
            if (!data.id_suplente_promovido || suplenteEsAsesorParaPresidente) {
                return false;
            }
        }
        return true;
    }, [proyecto, data, processing, esTitular, esReemplazoDirecto, suplenteEsAsesorParaPresidente]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!canSubmit || !proyecto) return;

        patch(
            sustituir.url({
                proyecto: proyecto.id_proyecto,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    const sustentantesTexto =
        proyecto?.sustentantes.map((s) => s.nombre_completo).join(', ') || 'Sin sustentante';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-card border-border text-foreground p-4 sm:p-6">
                <DialogHeader className="text-left pr-6 sm:pr-8">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                            <RefreshCw className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-lg sm:text-xl font-bold leading-tight">
                                Sustitución de Integrante del Jurado
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Cuando un docente rechaza la designación, uno de los suplentes asume su cargo titular y se selecciona a un nuevo suplente.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {proyecto && (
                    <div className="rounded-xl border border-border bg-muted/20 p-3 sm:p-3.5 text-xs flex flex-col gap-1.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 min-w-0">
                            <span className="font-semibold text-foreground flex items-center gap-1.5 min-w-0">
                                <GraduationCap className="size-3.5 text-[#10B981] shrink-0" />
                                <span className="truncate">Tesista: {sustentantesTexto}</span>
                            </span>
                            {proyecto.sustentantes[0]?.matricula && (
                                <span className="font-mono text-muted-foreground shrink-0 text-[11px]">
                                    Matrícula: {proyecto.sustentantes[0].matricula}
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground line-clamp-2 break-words min-w-0" title={proyecto.titulo}>
                            <span className="font-medium text-foreground">Tesis:</span> {proyecto.titulo}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1 min-w-0">
                    {/* PASO 1: Docente a sustituir */}
                    <div className="grid gap-1.5 min-w-0">
                        <Label htmlFor="id_jurado_rechazado" className="text-xs font-semibold">
                            1. Integrante a sustituir (que rechazó la designación)
                        </Label>
                        <Select
                            value={data.id_jurado_rechazado}
                            onValueChange={(val) => {
                                setData('id_jurado_rechazado', val);
                                clearErrors();
                            }}
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="id_jurado_rechazado"
                                className="h-10 w-full bg-background border-border text-sm min-w-0"
                            >
                                <SelectValue placeholder="Selecciona al integrante que rechazó" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border max-h-60 max-w-[calc(100vw-3rem)]">
                                {miembrosJurado.map((miembro) => {
                                    const esRechazado = miembro.estado_aceptacion
                                        .toLowerCase()
                                        .startsWith('rechaz');
                                    return (
                                        <SelectItem
                                            key={miembro.id_jurado_proyecto}
                                            value={String(miembro.id_jurado_proyecto)}
                                        >
                                            <div className="flex items-center justify-between gap-2 w-full min-w-0">
                                                <span className="font-semibold text-foreground truncate">
                                                    {miembro.cargo}: {miembro.docente.nombre_completo}
                                                </span>
                                                <span
                                                    className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${
                                                        esRechazado
                                                            ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {miembro.estado_aceptacion}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        {errors.id_jurado_rechazado && (
                            <p className="text-[11px] font-medium text-destructive flex items-center gap-1 min-w-0">
                                <AlertCircle className="size-3.5 shrink-0" />
                                <span>{errors.id_jurado_rechazado}</span>
                            </p>
                        )}
                    </div>

                    {/* PASO 2: Si es titular, elegir qué suplente asciende */}
                    {esTitular && miembroSeleccionado && (
                        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5 sm:p-4 flex flex-col gap-3 min-w-0">
                            <div className="min-w-0">
                                <Label htmlFor="id_suplente_promovido" className="text-xs font-semibold text-foreground flex items-center gap-1.5 min-w-0">
                                    <ArrowRight className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span className="truncate">
                                        2. Suplente que asumirá la titularidad ({miembroSeleccionado.cargo})
                                    </span>
                                </Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Elige cuál de los suplentes vigentes pasa a ser {miembroSeleccionado.cargo}.
                                </p>
                            </div>

                            <Select
                                value={data.id_suplente_promovido}
                                onValueChange={(val) => {
                                    setData('id_suplente_promovido', val);
                                    clearErrors('id_suplente_promovido');
                                }}
                                disabled={processing}
                            >
                                <SelectTrigger
                                    id="id_suplente_promovido"
                                    className="h-10 w-full bg-background border-border text-sm min-w-0"
                                >
                                    <SelectValue placeholder="Selecciona al suplente que ascenderá" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border max-h-60 max-w-[calc(100vw-3rem)]">
                                    <SelectItem value="directo">
                                        <span className="font-semibold text-[#10B981] truncate">
                                            Reemplazo directo en {miembroSeleccionado.cargo} (sin mover suplentes)
                                        </span>
                                    </SelectItem>
                                    {suplentesActuales.map((suplente) => {
                                        const esAsesor = advisorIds.includes(suplente.id_usuario);
                                        const noPuedePresidir =
                                            miembroSeleccionado.cargo === 'Presidente' && esAsesor;

                                        return (
                                            <SelectItem
                                                key={suplente.id_jurado_proyecto}
                                                value={String(suplente.id_jurado_proyecto)}
                                                disabled={noPuedePresidir}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-semibold text-foreground truncate">
                                                        Promover a {suplente.cargo}: {suplente.docente.nombre_completo}
                                                    </span>
                                                    {noPuedePresidir && (
                                                        <span className="shrink-0 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                                            (Asesor · No Presidente)
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                            {suplenteEsAsesorParaPresidente && (
                                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-start sm:items-center gap-1.5 min-w-0">
                                    <ShieldAlert className="size-3.5 shrink-0 mt-0.5 sm:mt-0" />
                                    <span>El suplente seleccionado es el Asesor del proyecto y no puede asumir la Presidencia.</span>
                                </p>
                            )}

                            {errors.id_suplente_promovido && (
                                <p className="text-[11px] font-medium text-destructive flex items-center gap-1 min-w-0">
                                    <AlertCircle className="size-3.5 shrink-0" />
                                    <span>{errors.id_suplente_promovido}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* PASO 3: Nuevo docente para cubrir la vacante de suplente */}
                    <div className="grid gap-2 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                            <Label htmlFor="id_nuevo_docente" className="text-xs font-semibold truncate">
                                {esTitular
                                    ? `3. Nuevo docente para cubrir la vacante de ${
                                          suplenteSeleccionado?.cargo || 'Suplente'
                                      }`
                                    : `2. Nuevo docente para cubrir la vacante de ${
                                          miembroSeleccionado?.cargo || 'Suplente'
                                      }`}
                            </Label>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                                {docentesElegibles.length} docentes activos disponibles
                            </span>
                        </div>

                        {/* Buscador de docentes */}
                        <div className="relative w-full min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                type="text"
                                value={busquedaDocente}
                                onChange={(e) => setBusquedaDocente(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                    }
                                }}
                                placeholder="Filtrar por nombre, cédula o especialidad..."
                                className="h-9 w-full bg-background border-border pl-8 text-xs placeholder:text-muted-foreground rounded-lg min-w-0"
                            />
                        </div>

                        <Select
                            value={data.id_nuevo_docente}
                            onValueChange={(val) => {
                                setData('id_nuevo_docente', val);
                                clearErrors('id_nuevo_docente');
                            }}
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="id_nuevo_docente"
                                className="h-10 w-full bg-background border-border text-sm min-w-0"
                            >
                                <SelectValue placeholder="Selecciona al nuevo docente suplente" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border max-h-60 max-w-[calc(100vw-3rem)]">
                                {docentesElegibles.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-muted-foreground">
                                        No se encontraron docentes disponibles con esa búsqueda.
                                    </div>
                                ) : (
                                    docentesElegibles.map((docente) => (
                                        <SelectItem
                                            key={docente.id_usuario}
                                            value={String(docente.id_usuario)}
                                        >
                                            <div className="flex flex-col text-left py-0.5 min-w-0">
                                                <span className="font-semibold text-foreground truncate">
                                                    {docente.nombre_completo}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {docente.especialidad || 'Sin especialidad'}
                                                    {docente.cedula_profesional ? ` · Cédula: ${docente.cedula_profesional}` : ''}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        {errors.id_nuevo_docente && (
                            <p className="text-[11px] font-medium text-destructive flex items-center gap-1 min-w-0">
                                <AlertCircle className="size-3.5 shrink-0" />
                                <span>{errors.id_nuevo_docente}</span>
                            </p>
                        )}
                    </div>

                    <DialogFooter className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2 pt-2 border-t border-border/40">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                            className="border-border text-foreground hover:bg-accent w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="bg-[#10B981] hover:bg-[#0FA875] text-white font-semibold gap-2 w-full sm:w-auto"
                        >
                            {processing ? (
                                <Spinner className="size-4 text-white" />
                            ) : (
                                <RefreshCw className="size-4" />
                            )}
                            {processing ? 'Guardando sustitución...' : 'Confirmar sustitución'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

