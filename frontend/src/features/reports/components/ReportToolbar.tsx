import React from 'react';
import { RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { UseReportPeriod } from '../hooks/useReportPeriod';
import { ReportPeriodPicker } from './ReportPeriodPicker';
import { ReportExportButton } from './ReportExportButton';

export interface ReportFiltersConfig {
    /** The report's own filter controls (customer, supplier, rack, …), shown in the filter panel. */
    content: React.ReactNode;
    /** Number of filters currently applied; shown on the Filters button. */
    activeCount: number;
    onClear: () => void;
}

const btn = 'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold disabled:opacity-50';
const btnIdle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700';

/**
 * [Period] [Filters] ··· [Export] [Refresh], identical on every report. The filter panel opens
 * below the toolbar so wide filter forms have room.
 */
export const ReportToolbar: React.FC<{
    period?: UseReportPeriod;
    filters?: ReportFiltersConfig;
    filtersOpen: boolean;
    onToggleFilters: () => void;
    onExport?: () => Promise<void> | void;
    onRefresh?: () => void;
    loading?: boolean;
}> = ({ period, filters, filtersOpen, onToggleFilters, onExport, onRefresh, loading }) => (
    <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
            {period && <ReportPeriodPicker value={period} />}
            {filters && (
                <button
                    type="button"
                    onClick={onToggleFilters}
                    aria-expanded={filtersOpen}
                    className={`${btn} ${filtersOpen || filters.activeCount > 0 ? 'border-[rgb(var(--color-primary)/0.4)] bg-[rgb(var(--color-primary)/0.05)] text-primary' : btnIdle}`}
                >
                    <SlidersHorizontal className="w-4 h-4" aria-hidden />
                    Filters
                    {filters.activeCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[10px] leading-none">{filters.activeCount}</span>
                    )}
                </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
                {onExport && <ReportExportButton onExport={onExport} disabled={loading} />}
                {onRefresh && (
                    <button type="button" onClick={onRefresh} disabled={loading} className={`${btn} ${btnIdle}`} aria-label="Refresh report">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                )}
            </div>
        </div>

        {filters && filtersOpen && (
            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filters</p>
                    {filters.activeCount > 0 && (
                        <button type="button" onClick={filters.onClear} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                            <X className="w-3.5 h-3.5" aria-hidden /> Clear all
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-3 items-end">{filters.content}</div>
            </div>
        )}
    </div>
);
