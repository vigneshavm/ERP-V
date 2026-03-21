import React from 'react';
import { TrendingUp, FileText, Clock } from 'lucide-react';

interface LedgerData {
    openingBalance: number;
    closingBalance: number;
    totals: {
        credit: number;
        debit: number;
    };
}

interface SupplierLedgerSummaryProps {
    data: LedgerData;
}

const SupplierLedgerSummary: React.FC<SupplierLedgerSummaryProps> = ({ data }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Opening Balance */}
            <div className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] border border-default dark:border-default p-5 rounded-2xl flex flex-col justify-between min-h-[120px] relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/20 dark:bg-neutral-700/30 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-all" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-muted dark:text-neutral-400" />
                        <span className="text-xs font-bold text-muted dark:text-neutral-400 uppercase tracking-wide">Opening Balance</span>
                    </div>
                    <span className="text-3xl font-black text-main">{formatCurrency(data.openingBalance)}</span>
                </div>
            </div>

            {/* Total Debit (Payments) */}
            <div className="bg-[#F8FFF9] dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-between min-h-[120px] relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-all" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <FileText className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Total Debit</span>
                    </div>
                    <span className="text-3xl font-black text-main">{formatCurrency(data.totals.debit)}</span>
                </div>
            </div>

            {/* Total Credit (Bills) */}
            <div className="bg-[#FFF8F8] dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-5 rounded-2xl flex flex-col justify-between min-h-[120px] relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-all" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <FileText className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Total Credit</span>
                    </div>
                    <span className="text-3xl font-black text-main">{formatCurrency(data.totals.credit)}</span>
                </div>
            </div>

            {/* Closing Balance */}
            <div className="bg-[#E8F2FF]/30 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl flex flex-col justify-between min-h-[120px] relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-all" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">Closing Balance</span>
                    </div>
                    <span className="text-3xl font-black text-main">{formatCurrency(data.closingBalance)}</span>
                </div>
            </div>
        </div>
    );
};

export default SupplierLedgerSummary;
