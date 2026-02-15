import React from 'react';
import { Users, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, FileText, DollarSign } from 'lucide-react';

interface SupplierStatsCardsProps {
    variant?: 'default' | 'inflow';
    // Default View Props
    totalSuppliers?: number;
    totalToCollect?: number;
    totalToPay?: number;

    // Inflow View Props
    totalInflow?: number;
    totalOutflow?: number;
    totalClosingBalance?: number;
    netChange?: number;
    activeSuppliers?: number;

    labels?: {
        suppliers?: string;
        collect?: string;
        pay?: string;
    };
    showSupplierCount?: boolean;
}

const SupplierStatsCards: React.FC<SupplierStatsCardsProps> = ({
    variant = 'default',
    totalSuppliers = 0,
    totalToCollect = 0,
    totalToPay = 0,
    totalInflow = 0,
    totalOutflow = 0,
    totalClosingBalance = 0,
    netChange = 0,
    activeSuppliers = 0,
    labels = {
        suppliers: "All Suppliers",
        collect: "To Collect",
        pay: "To Pay"
    },
    showSupplierCount = true
}) => {

    const formatCurrency = (val: number) => `₹ ${Math.abs(val).toLocaleString('en-IN')}`;

    if (variant === 'inflow') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Inflow */}
                <div className="bg-white dark:bg-neutral-800 border-2 border-blue-100 dark:border-blue-900/30 rounded-xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Inflow</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalInflow)}</span>
                </div>

                {/* Total Outflow */}
                <div className="bg-white dark:bg-neutral-800 border-2 border-rose-100 dark:border-rose-900/30 rounded-xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Total Outflow</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalOutflow)}</span>
                </div>

                {/* Total Closing Balance */}
                <div className="bg-white dark:bg-neutral-800 border-2 border-orange-100 dark:border-orange-900/30 rounded-xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Closing Balance</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalClosingBalance)}</span>
                </div>

                {/* Net Period Change */}
                <div className={`bg-white dark:bg-neutral-800 border-2 rounded-xl p-5 relative overflow-hidden ${netChange >= 0 ? 'border-amber-100 dark:border-amber-900/30' : 'border-emerald-100 dark:border-emerald-900/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign className={`w-4 h-4 ${netChange >= 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${netChange >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Net Change</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(netChange)}</span>
                </div>

                {/* Active Suppliers */}
                <div className="bg-white dark:bg-neutral-800 border-2 border-purple-100 dark:border-purple-900/30 rounded-xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Active Suppliers</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{activeSuppliers}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 ${showSupplierCount ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
            {/* All Suppliers */}
            {showSupplierCount && (
                <div className="bg-white dark:bg-neutral-800 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">{labels.suppliers}</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{totalSuppliers}</span>
                </div>
            )}

            {/* To Collect / Inflow */}
            <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                        <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{labels.collect}</span>
                </div>
                <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalToCollect)}</span>
            </div>

            {/* To Pay / Outflow */}
            <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                        <ArrowUpRight className="w-3 h-3 text-rose-500" />
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">{labels.pay}</span>
                </div>
                <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalToPay)}</span>
            </div>
        </div>
    );
};

export default SupplierStatsCards;
