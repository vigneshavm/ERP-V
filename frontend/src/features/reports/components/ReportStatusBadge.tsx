import React from 'react';

export type ReportDisplayStatus = 'live' | 'validation' | 'coming-soon' | 'no-data' | 'error';

const STATUS: Record<ReportDisplayStatus, { label: string; dot: string; chip: string; title: string }> = {
    'live': {
        label: 'Live data', dot: 'bg-emerald-500',
        chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40',
        title: "Real, reconciled data from your shop's records",
    },
    'validation': {
        label: 'Data validation', dot: 'bg-amber-500',
        chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40',
        title: 'Connected to real data; figures are still being reconciled',
    },
    'coming-soon': {
        label: 'Coming soon', dot: 'bg-slate-400',
        chip: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        title: "Not connected to your shop's data yet",
    },
    'no-data': {
        label: 'No data', dot: 'bg-slate-400',
        chip: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        title: 'No records for the selected period or filters',
    },
    'error': {
        label: 'Error', dot: 'bg-rose-500',
        chip: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40',
        title: 'The report data could not be loaded',
    },
};

export const ReportStatusBadge: React.FC<{ status: ReportDisplayStatus }> = ({ status }) => {
    const s = STATUS[status];
    return (
        <span
            role="status"
            title={s.title}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${s.chip}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden />
            {s.label}
        </span>
    );
};
