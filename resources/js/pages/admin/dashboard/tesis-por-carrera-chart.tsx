import type { TesisCarreraItem } from './types';

interface TesisPorCarreraChartProps {
    data: TesisCarreraItem[];
}

export function TesisPorCarreraChart({ data }: TesisPorCarreraChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted-foreground">
                Aún no hay tesis vinculadas a carreras.
            </div>
        );
    }

    const max = Math.max(...data.map((item) => item.total), 1);

    return (
        <div className="space-y-4">
            {data.map((item) => (
                <div
                    key={item.carrera}
                    className="grid grid-cols-[minmax(70px,110px)_1fr_28px] items-center gap-2"
                >
                    <span
                        className="truncate text-xs font-medium text-muted-foreground"
                        title={item.carrera}
                    >
                        {item.carrera}
                    </span>
                    <div className="h-5 overflow-hidden rounded-full bg-muted/40">
                        <div
                            className="h-full rounded-full bg-[#10B981] transition-all duration-500"
                            style={{
                                width: `${Math.max(
                                    (item.total / max) * 100,
                                    item.total > 0 ? 4 : 0,
                                )}%`,
                            }}
                        />
                    </div>
                    <span className="text-right text-xs font-semibold text-foreground">
                        {item.total}
                    </span>
                </div>
            ))}
        </div>
    );
}
