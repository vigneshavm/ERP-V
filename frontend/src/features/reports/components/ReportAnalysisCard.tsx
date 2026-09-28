import React from 'react';
import { CHART_VARS_CLASS } from './reportChart';

const HEIGHT = { sm: 'h-56', md: 'h-72', lg: 'h-96' } as const;

export interface ReportAnalysisCardProps {
    title: string;
    subtitle?: string;
    /** Controls on the right of the title (metric switcher, etc.). */
    actions?: React.ReactNode;
    /** Legend under the chart. Recharts' own <Legend> also works inside children. */
    legend?: React.ReactNode;
    /** Fixed chart height so cards line up across reports. Default 'md'. */
    height?: keyof typeof HEIGHT;
    /** Rank lists and other non-chart content grow with their content instead of the fixed height. */
    autoHeight?: boolean;
    /** Shown instead of the chart when there is nothing to plot. */
    empty?: boolean;
    children: React.ReactNode;
}

/** One card for every chart or rank list, so title, padding, height and legend match everywhere. */
export const ReportAnalysisCard: React.FC<ReportAnalysisCardProps> = ({
    title, subtitle, actions, legend, height = 'md', autoHeight, empty, children,
}) => (
    <section className={`bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-5 min-w-0 ${CHART_VARS_CLASS}`}>
        <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
        </div>
        <div className={`${autoHeight ? '' : HEIGHT[height]} w-full`}>
            {empty ? (
                <div className="h-full min-h-24 flex items-center justify-center text-xs font-bold text-slate-400">
                    Nothing to show for this period
                </div>
            ) : children}
        </div>
        {legend && !empty && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">{legend}</div>}
    </section>
);

/** Legend entry: coloured dot + label. */
export const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
    <span className="inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        {label}
    </span>
);

/** Two-column grid for secondary analysis (Top Customers + Top Items, …). One column on mobile. */
export const ReportAnalysisGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{children}</div>
);

export interface RankItem {
    label: string;
    value: number;
    /** Formatted value shown at the end of the row. */
    display: string;
}

/**
 * Horizontal rank bars (Top Customers, Top Items, …). Plain HTML rather than a chart library so long
 * names wrap and the numbers stay aligned and readable.
 */
export const ReportRankList: React.FC<{ items: RankItem[] }> = ({ items }) => {
    const max = Math.max(...items.map(i => i.value), 0);
    return (
        <ol className="space-y-2.5">
            {items.map((item, i) => (
                <li key={`${item.label}-${i}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={item.label}>{item.label}</span>
                    <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white text-right">{item.display}</span>
                    <span className="col-span-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden" aria-hidden>
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${max > 0 ? Math.max((item.value / max) * 100, 1) : 0}%` }} />
                    </span>
                </li>
            ))}
        </ol>
    );
};
