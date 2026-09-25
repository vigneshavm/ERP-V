import React from 'react';
import { RefreshCw } from 'lucide-react';
import Layout from '../../../components/shared/Layout';
import { ReportError, ReportLoading } from '../../reports/components';

/**
 * Frame for the live Finance pages (Overview, Reconciliation, Loans): title, what the figures are based on, a
 * refresh button, and the shared loading / error states. No figures are ever shown without data behind them.
 */
export const FinancePage: React.FC<{
    /** Eyebrow above the title. Default "Finance". */
    section?: string;
    title: string;
    subtitle: string;
    basis?: string;
    actions?: React.ReactNode;
    loading: boolean;
    error: string;
    hasData: boolean;
    onRefresh: () => void;
    children: React.ReactNode;
}> = ({ section = 'Finance', title, subtitle, basis, actions, loading, error, hasData, onRefresh, children }) => (
    <Layout>
        <div className="space-y-5 pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{section}</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>
            {basis && <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{basis}</p>}
            {error ? <ReportError message={error} onRetry={onRefresh} /> : !hasData && loading ? <ReportLoading /> : hasData ? children : null}
        </div>
    </Layout>
);
