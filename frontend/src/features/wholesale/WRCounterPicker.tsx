import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { useBranchResolver } from '../../hooks/useBranchResolver';

/**
 * Wholesale/Retail (WR) Billing: counter/session picker.
 *
 * The legacy WRSalesLogin screen this replaces was a WR-specific login/session step. This app
 * already has real authentication, so there's no separate login here -- instead this is a
 * lightweight "which counter are you billing from" step shown after normal app login, mirroring
 * POS's own session picker in spirit. It reuses useBranchResolver (already used by POS/GRN)
 * rather than inventing a separate "counter" concept -- each branch doubles as a WR counter.
 * The choice is forwarded to WR Sales Entry as a query param (no new redux slice needed for a
 * single string that only that next screen reads) and stamped onto the invoice as
 * Invoice.counterName (see IInvoice.ts).
 */
const WRCounterPicker: React.FC = () => {
    const navigate = useNavigate();
    const { branches, loading } = useBranchResolver();

    const selectCounter = (counterId: string, counterName: string) => {
        navigate(`/wholesale/sales/new?counterId=${encodeURIComponent(counterId)}&counterName=${encodeURIComponent(counterName)}`);
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Wholesale/Retail Billing"
                    description="Select a counter to start a wholesale billing session"
                />

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-neutral-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading counters...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {branches.map(branch => (
                            <button
                                key={branch.id}
                                onClick={() => selectCounter(branch.id, branch.name)}
                                className="group flex items-center gap-4 p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-primary hover:shadow-md transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-neutral-900 dark:text-white truncate">{branch.name}</p>
                                    <p className="text-xs text-neutral-400 truncate">{branch.code}{branch.address ? ` · ${branch.address}` : ''}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </button>
                        ))}
                        {branches.length === 0 && (
                            <div className="col-span-full py-12 text-center text-neutral-400">
                                No counters/branches configured yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default WRCounterPicker;
