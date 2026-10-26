import { PieChart } from 'lucide-react';
import type { EstadoTesisItem } from './types';

interface EstadoTesisChartProps {
    data: EstadoTesisItem[];
    total: number;
}

const SIZE = 180;
const STROKE_WIDTH = 28;

export function EstadoTesisChart({ data, total }: EstadoTesisChartProps) {
    const radius = (SIZE - STROKE_WIDTH) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    if (total === 0) {
        return (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
                <div className="rounded-full bg-[#10B981]/15 p-3 text-[#10B981]">
                    <PieChart className="size-6" />
                </div>
                <p className="text-sm font-medium text-foreground">
                    Aún no hay tesis registradas.
                </p>
                <p className="text-xs text-muted-foreground">
                    Las métricas aparecerán cuando se registren proyectos.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 xl:flex-row">
            <div className="relative size-[180px] shrink-0">
                <svg
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    className="-rotate-90"
                    role="img"
                    aria-label={`Distribución de ${total} tesis por estado`}
                >
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={STROKE_WIDTH}
                        className="text-muted/30"
                    />
                    {data.map((item) => {
                        const length = (item.total / total) * circumference;
                        const offset = -accumulated;
                        accumulated += length;

                        return (
                            <circle
                                key={item.estado}
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={radius}
                                fill="none"
                                stroke={item.color}
                                strokeWidth={STROKE_WIDTH}
                                strokeDasharray={`${length} ${circumference - length}`}
                                strokeDashoffset={offset}
                                strokeLinecap="butt"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl leading-none font-bold text-foreground">
                        {total}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                        Total
                    </span>
                </div>
            </div>

            <div className="w-full space-y-2">
                <ul className="space-y-2.5">
                    {data.map((item) => (
                        <li
                            key={item.estado}
                            className="flex items-center justify-between gap-3 text-sm"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="truncate text-muted-foreground">
                                    {item.estado}
                                </span>
                            </span>
                            <span className="font-semibold text-foreground">
                                {item.total}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
