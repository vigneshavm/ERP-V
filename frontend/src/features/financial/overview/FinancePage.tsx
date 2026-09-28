import React from 'react';
import { RefreshCw } from 'lucide-react';
import Layout from '../../../components/shared/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { Button } from '@/components/shared';
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
            <PageHeader
                title={title}
                description={subtitle}
                breadcrumbs={[{ label: section }]}
                actions={
                    <>
                        {actions}
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
                            onClick={onRefresh}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                    </>
                }
            />
            {basis && <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{basis}</p>}
            {error ? <ReportError message={error} onRetry={onRefresh} /> : !hasData && loading ? <ReportLoading /> : hasData ? children : null}
        </div>
    </Layout>
);
