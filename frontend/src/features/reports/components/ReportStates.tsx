import React from 'react';
import { AlertTriangle, Clock3, SearchX } from 'lucide-react';
import { ReportKpiSkeleton } from './ReportKpiGrid';

const panel = 'bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm';

/** The one loading state: KPI ×4, chart and table skeletons. No "Loading…"/"Initializing…" text. */
export const ReportLoading: React.FC = () => (
    <div className="space-y-4" aria-busy="true" aria-label="Loading report">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => <ReportKpiSkeleton key={i} />)}
        </div>
        <div className={`${panel} p-5 animate-pulse`} aria-hidden>
            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700 rounded" />
            <div className="h-72 mt-4 bg-slate-50 dark:bg-slate-700/40 rounded" />
        </div>
        <div className={`${panel} p-5 animate-pulse space-y-3`} aria-hidden>
            <div className="h-3 w-40 bg-slate-100 dark:bg-slate-700 rounded" />
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-8 bg-slate-50 dark:bg-slate-700/40 rounded" />)}
        </div>
    </div>
);

export const ReportEmpty: React.FC<{ onClearFilters?: () => void }> = ({ onClearFilters }) => (
    <div className={`${panel} py-16 px-6 text-center`}>
        <SearchX className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" aria-hidden />
        <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No data found</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">There are no records for the selected period or filters.</p>
        {onClearFilters && (
            <button type="button" onClick={onClearFilters} className="mt-4 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-primary hover:bg-slate-50 dark:hover:bg-slate-700">
                Clear filters
            </button>
        )}
    </div>
);

/** Never falls back to sample data: the report shows this until the data loads. */
export const ReportError: React.FC<{ message?: string | null; onRetry?: () => void }> = ({ message, onRetry }) => (
    <div className="py-16 px-6 text-center bg-danger/60 dark:bg-danger-soft border border-danger-line dark:border-danger/30 rounded-sm" role="alert">
        <AlertTriangle className="w-10 h-10 mx-auto text-danger" aria-hidden />
        <p className="mt-3 text-sm font-bold text-danger dark:text-danger">Unable to load report</p>
        <p className="mt-1 text-xs text-danger/80 dark:text-danger/80">We couldn't retrieve the report data.{message ? ` (${message})` : ''}</p>
        {onRetry && (
            <button type="button" onClick={onRetry} className="mt-4 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-danger-line dark:border-danger/40 text-xs font-bold text-danger dark:text-danger hover:bg-danger-soft dark:hover:bg-slate-700">
                Try again
            </button>
        )}
    </div>
);

export const ReportComingSoon: React.FC<{ title: string }> = ({ title }) => (
    <div className={`${panel} py-20 px-6 text-center border-dashed`}>
        <Clock3 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" aria-hidden />
        <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Coming soon</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{title} has not been connected to your shop's data yet, so no figures are shown.</p>
    </div>
);
