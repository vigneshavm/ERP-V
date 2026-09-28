import React from 'react';

interface Entry {
    name?: string | number;
    value?: number | string;
    color?: string;
    dataKey?: string | number;
}

/**
 * Tooltip content for every report chart: the label, then one row per series (colour dot + name in text ink +
 * exact value). Pass as <Tooltip content={<ReportChartTooltip format={…} />} />.
 */
export const ReportChartTooltip: React.FC<{
    active?: boolean;
    payload?: Entry[];
    label?: string | number;
    /** Exact value formatter, e.g. v => formatCurrency(v, { fractionDigits: 0 }). */
    format: (value: number, dataKey?: string) => string;
    /** Optional label formatter (e.g. a date). */
    formatLabel?: (label: string | number) => string;
}> = ({ active, payload, label, format, formatLabel }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2 text-xs">
            {label !== undefined && (
                <p className="font-bold text-slate-900 dark:text-white mb-1">{formatLabel ? formatLabel(label) : label}</p>
            )}
            {payload.map(p => (
                <p key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} aria-hidden />
                    {payload.length > 1 && <span>{p.name}</span>}
                    <span className="ml-auto pl-3 font-bold tabular-nums text-slate-900 dark:text-white">
                        {format(Number(p.value), p.dataKey !== undefined ? String(p.dataKey) : undefined)}
                    </span>
                </p>
            ))}
        </div>
    );
};
