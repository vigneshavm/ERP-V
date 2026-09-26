import React from 'react';

export type KpiTone = 'default' | 'positive' | 'negative' | 'warning';

export interface ReportKpi {
    label: string;
    /** Already formatted (formatCurrency(v, { fractionDigits: 0 }), formatNumber, …). */
    value: string;
    /** Supporting line: "4,243 bills", "24 Dec 2025". */
    sub?: string;
    tone?: KpiTone;
    icon?: React.ReactNode;
}

const TONE: Record<KpiTone, string> = {
    default: 'text-slate-900 dark:text-white',
    positive: 'text-success dark:text-success',
    negative: 'text-danger dark:text-danger',
    warning: 'text-warning dark:text-warning',
};

export const ReportKpiCard: React.FC<ReportKpi> = ({ label, value, sub, tone = 'default', icon }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
        <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
            {icon && <span className="text-slate-400 shrink-0" aria-hidden>{icon}</span>}
        </div>
        <p className={`text-2xl font-bold mt-2 tabular-nums truncate ${TONE[tone]}`} title={value}>{value}</p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">{sub}</p>}
    </div>
);

export const ReportKpiSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse" aria-hidden>
        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
        <div className="h-7 w-32 bg-slate-100 dark:bg-slate-700 rounded mt-3" />
        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700 rounded mt-2" />
    </div>
);

/** 4 cards per row on desktop, 2 on tablet, 1 on mobile. */
export const ReportKpiGrid: React.FC<{ items: ReportKpi[]; loading?: boolean }> = ({ items, loading }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
            ? Array.from({ length: Math.max(items.length, 4) }, (_, i) => <ReportKpiSkeleton key={i} />)
            : items.map(kpi => <ReportKpiCard key={kpi.label} {...kpi} />)}
    </div>
);
