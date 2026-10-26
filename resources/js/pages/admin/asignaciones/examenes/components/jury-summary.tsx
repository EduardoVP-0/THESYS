import { Scale, ShieldCheck } from 'lucide-react';
import {
    estadoAceptacionClasses,
    JURY_CARGOS,
    obtenerMiembroPorCargo,
} from '../utils';
import type { MiembroJuradoExamen } from '../types';

interface JurySummaryProps {
    jurado: MiembroJuradoExamen[];
    completo: boolean;
}

export function JurySummary({ jurado, completo }: JurySummaryProps) {
    return (
        <section className="mt-5 rounded-lg border border-border bg-muted/10 p-3.5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <div className="rounded-md bg-[#10B981]/15 p-1.5 text-[#10B981]">
                        <Scale className="size-4" />
                    </div>
                    <div>
                        <p className="text-xs font-bold tracking-wide text-foreground uppercase">
                            Jurado asignado
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            Titulares y suplentes que evaluarán el examen.
                        </p>
                    </div>
                </div>

                <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                        completo
                            ? 'border-[#10B981]/20 bg-[#10B981]/10 text-[#0F9F6E] dark:text-[#34D399]'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    }`}
                >
                    {completo ? (
                        <ShieldCheck className="size-3" />
                    ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                    )}
                    {jurado.length}/5 · {completo ? 'Completo' : 'Incompleto'}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {JURY_CARGOS.map((cargo) => {
                    const miembro = obtenerMiembroPorCargo(jurado, cargo);

                    return (
                        <div
                            key={cargo}
                            className="rounded-lg border border-border bg-card p-2.5"
                        >
                            <div className="flex items-center justify-between gap-1.5">
                                <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                                    {cargo}
                                </p>
                                {miembro && (
                                    <span
                                        className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${estadoAceptacionClasses(
                                            miembro.estado_aceptacion,
                                        )}`}
                                    >
                                        {miembro.estado_aceptacion}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 flex min-w-0 items-center gap-2">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#10B981]/25 bg-[#10B981]/15 text-[9px] font-bold text-[#10B981]">
                                    {miembro?.docente.iniciales ?? '—'}
                                </div>
                                <p
                                    className={`min-w-0 truncate text-[11px] font-semibold ${
                                        miembro
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                    }`}
                                    title={
                                        miembro?.docente.nombre_completo ??
                                        'Sin asignar'
                                    }
                                >
                                    {miembro?.docente.nombre_completo ??
                                        'Sin asignar'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
