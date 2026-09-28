import React from 'react';

export type ReportDisplayStatus = 'live' | 'validation' | 'coming-soon' | 'no-data' | 'error';

const STATUS: Record<ReportDisplayStatus, { label: string; dot: string; chip: string; title: string }> = {
    'live': {
        label: 'Live data', dot: 'bg-success',
        chip: 'bg-success-soft text-success border-success-line dark:bg-success-soft dark:text-success dark:border-success/40',
        title: "Real, reconciled data from your shop's records",
    },
    'validation': {
        label: 'Data validation', dot: 'bg-warning',
        chip: 'bg-warning-soft text-warning border-warning-line dark:bg-warning-soft dark:text-warning dark:border-warning/40',
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
        label: 'Error', dot: 'bg-danger',
        chip: 'bg-danger-soft text-danger border-danger-line dark:bg-danger-soft dark:text-danger dark:border-danger/40',
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
