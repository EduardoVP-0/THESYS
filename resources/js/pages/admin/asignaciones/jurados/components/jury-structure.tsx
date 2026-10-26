import { Scale, ShieldAlert } from 'lucide-react';
import { JURY_SLOTS } from '../constants';
import type { DocenteJurado, JurySlotKey, MiembroJurado } from '../types';
import { JurySlotCard } from './jury-slot-card';

interface JuryStructureProps {
    docentes: DocenteJurado[];
    values: Record<JurySlotKey, string>;
    existingJury: MiembroJurado[];
    advisorIds: number[];
    sustentanteIds: number[];
    readOnly: boolean;
    disabled: boolean;
    processing: boolean;
    errors: Partial<Record<JurySlotKey, string>>;
    onChange: (key: JurySlotKey, value: string) => void;
}

export function JuryStructure({
    docentes,
    values,
    existingJury,
    advisorIds,
    sustentanteIds,
    readOnly,
    disabled,
    processing,
    errors,
    onChange,
}: JuryStructureProps) {
    const selectedValues = Object.values(values).filter(
        (value) => value !== '',
    );
    const asignados = selectedValues.length;
    const porcentaje = (asignados / JURY_SLOTS.length) * 100;

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#10B981]/15 p-2.5 text-[#10B981]">
                        <Scale className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-full bg-[#10B981]/15 text-[10px] font-bold text-[#10B981]">
                                3
                            </span>
                            <h2 className="text-lg font-bold text-foreground">
                                Estructura oficial del jurado
                            </h2>
                        </div>
                        <p className="max-w-2xl text-xs text-muted-foreground">
                            Cinco personas distintas. El sustentante no puede
                            integrar el jurado y el asesor asignado no puede
                            presidirlo.
                        </p>
                    </div>
                </div>

                <div className="w-full sm:w-44">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                        <span>Puestos asignados</span>
                        <span className="text-foreground">
                            {asignados}/{JURY_SLOTS.length}
                        </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-[#10B981] transition-all"
                            style={{ width: `${porcentaje}%` }}
                        />
                    </div>
                </div>
            </div>

            {readOnly && (
                <p className="flex items-start gap-2 rounded-lg border border-[#10B981]/20 bg-[#10B981]/5 px-3 py-2.5 text-[11px] text-muted-foreground">
                    <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-[#10B981]" />
                    La estructura de este jurado ya fue registrada. Puedes
                    consultar los cargos y su estado de aceptación, pero no
                    modificarlos desde esta vista.
                </p>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {JURY_SLOTS.map((slot) => (
                    <JurySlotCard
                        key={slot.key}
                        slot={slot}
                        docentes={docentes}
                        value={values[slot.key]}
                        selectedValues={selectedValues}
                        existingMember={existingJury.find(
                            (miembro) => miembro.cargo === slot.cargo,
                        )}
                        advisorIds={advisorIds}
                        sustentanteIds={sustentanteIds}
                        readOnly={readOnly}
                        disabled={disabled}
                        processing={processing}
                        error={errors[slot.key]}
                        onChange={onChange}
                    />
                ))}
            </div>
        </section>
    );
}
