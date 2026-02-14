import React from 'react';
import { Users, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface SupplierStatsCardsProps {
    totalSuppliers?: number;
    totalToCollect: number;
    totalToPay: number; // or totalOutflow for the report
    labels?: {
        suppliers?: string;
        collect?: string;
        pay?: string;
        payIcon?: React.ReactNode;
    };
    showSupplierCount?: boolean;
}

const SupplierStatsCards: React.FC<SupplierStatsCardsProps> = ({
    totalSuppliers = 0,
    totalToCollect,
    totalToPay,
    labels = {
        suppliers: "All Suppliers",
        collect: "To Collect",
        pay: "To Pay"
    },
    showSupplierCount = true
}) => {
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
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹ {totalToCollect.toLocaleString('en-IN')}</span>
            </div>

            {/* To Pay / Outflow */}
            <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                        <ArrowUpRight className="w-3 h-3 text-rose-500" />
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">{labels.pay}</span>
                </div>
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹ {totalToPay.toLocaleString('en-IN')}</span>
            </div>
        </div>
    );
};

export default SupplierStatsCards;
