import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { JurySlotDefinition } from '../constants';
import type { DocenteJurado, JurySlotKey, MiembroJurado } from '../types';
import { StatusBadge } from './status-badge';

interface JurySlotCardProps {
    slot: JurySlotDefinition;
    docentes: DocenteJurado[];
    value: string;
    selectedValues: string[];
    existingMember?: MiembroJurado;
    advisorIds: number[];
    sustentanteIds: number[];
    readOnly: boolean;
    disabled: boolean;
    processing: boolean;
    error?: string;
    onChange: (key: JurySlotKey, value: string) => void;
}

export function JurySlotCard({
    slot,
    docentes,
    value,
    selectedValues,
    existingMember,
    advisorIds,
    sustentanteIds,
    readOnly,
    disabled,
    processing,
    error,
    onChange,
}: JurySlotCardProps) {
    const opciones = [...docentes];

    if (
        existingMember &&
        !opciones.some(
            (docente) => docente.id_usuario === existingMember.id_usuario,
        )
    ) {
        opciones.push({
            id_usuario: existingMember.id_usuario,
            nombre_completo: existingMember.docente.nombre_completo,
            iniciales: existingMember.docente.iniciales,
            email: existingMember.docente.email,
            cedula_profesional: null,
            especialidad: null,
            grado_academico: null,
            tipo_contrato: null,
        });
    }

    const docenteSeleccionado =
        opciones.find((docente) => String(docente.id_usuario) === value) ??
        null;

    const isDisabled = disabled || processing || readOnly;

    return (
        <div
            className={cn(
                'rounded-xl border bg-card p-4 transition-colors',
                value ? 'border-[#10B981]/35' : 'border-border',
                error && 'border-destructive/50',
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-bold text-foreground">
                        {slot.cargo}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {slot.key === 'presidente'
                            ? 'No puede ser el asesor del proyecto'
                            : 'Integrante titular del jurado'}
                    </p>
                </div>

                {readOnly && existingMember ? (
                    <StatusBadge
                        estado={existingMember.estado_aceptacion}
                        dot
                    />
                ) : value ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0F9F6E] dark:text-[#34D399]">
                        <span className="size-1.5 rounded-full bg-[#10B981]" />
                        Seleccionado
                    </span>
                ) : (
                    <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Sin asignar
                    </span>
                )}
            </div>

            <div className="mt-3 grid gap-1.5">
                <Label
                    htmlFor={`jurado-${slot.key}`}
                    className="text-[11px] font-semibold text-muted-foreground"
                >
                    Docente para {slot.cargo}
                </Label>
                <Select
                    value={value}
                    onValueChange={(newValue) => onChange(slot.key, newValue)}
                    disabled={isDisabled}
                >
                    <SelectTrigger
                        id={`jurado-${slot.key}`}
                        aria-invalid={Boolean(error)}
                        className="h-9 w-full border-border bg-background text-sm"
                    >
                        <SelectValue
                            placeholder={
                                readOnly
                                    ? 'Sin integrante registrado'
                                    : 'Selecciona un docente'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover">
                        {opciones.map((docente) => {
                            const optionValue = String(docente.id_usuario);
                            const esAsesor = advisorIds.includes(
                                docente.id_usuario,
                            );
                            const esSustentante = sustentanteIds.includes(
                                docente.id_usuario,
                            );
                            const asignadoEnOtroCargo =
                                selectedValues.includes(optionValue) &&
                                optionValue !== value;

                            const esPresidenteNoPermitido =
                                slot.key === 'presidente' &&
                                (esAsesor || esSustentante);

                            const optionDisabled =
                                asignadoEnOtroCargo ||
                                esSustentante ||
                                esPresidenteNoPermitido;

                            const sufijo = esSustentante
                                ? ' · Sustentante'
                                : slot.key === 'presidente' && esAsesor
                                  ? ' · Asesor (no permitido)'
                                  : asignadoEnOtroCargo
                                    ? ' · Ya asignado'
                                    : '';

                            return (
                                <SelectItem
                                    key={docente.id_usuario}
                                    value={optionValue}
                                    disabled={optionDisabled}
                                >
                                    {docente.nombre_completo}
                                    {sufijo}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>

                {error && (
                    <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                        <AlertCircle className="size-3.5" />
                        {error}
                    </p>
                )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
                <p className="min-w-0 truncate text-[11px] text-muted-foreground">
                    {docenteSeleccionado ? (
                        <>
                            Seleccionado:{' '}
                            <span className="font-semibold text-foreground">
                                {docenteSeleccionado.nombre_completo}
                            </span>
                        </>
                    ) : (
                        'Seleccionado: Nadie'
                    )}
                </p>

                <div className="flex shrink-0 items-center gap-2">
                    {!readOnly && value && (
                        <button
                            type="button"
                            onClick={() => onChange(slot.key, '')}
                            className="text-[10px] font-semibold text-muted-foreground transition-colors hover:text-red-500"
                        >
                            Quitar
                        </button>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                        {readOnly && existingMember
                            ? existingMember.estado_aceptacion
                            : 'Pendiente al confirmar'}
                    </span>
                </div>
            </div>
        </div>
    );
}
