import React from 'react';
import { DollarSign, AlertCircle, Clock, Building2, TrendingUp } from 'lucide-react';
import { AgedBill } from '../hooks/useOutstandingPayables';

interface PayablesStatsProps {
    totalPayable: number;
    totalOverdue: number;
    processedBills: AgedBill[];
    dueSoonAmount: number;
    criticalVendorsCount: number;
}

const PayablesStats: React.FC<PayablesStatsProps> = ({
    totalPayable,
    totalOverdue,
    processedBills,
    dueSoonAmount,
    criticalVendorsCount
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                        <DollarSign size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Liability</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <TrendingUp size={12} className="text-emerald-500" /> Across {processedBills.length} pending bills
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-600">
                        <AlertCircle size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Overdue</span>
                </div>
                <div className="text-2xl font-black text-rose-600">₹{totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="mt-2 text-[10px] text-rose-500/80 font-bold uppercase tracking-tighter">Immediate Attention Required</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                        <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due in 7 Days</span>
                </div>
                <div className="text-2xl font-black text-amber-600">₹{dueSoonAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="mt-2 text-[10px] text-slate-400 font-medium italic">Payment run preparation recommended</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                        <Building2 size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Vendors</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">
                    {criticalVendorsCount}
                </div>
                <div className="mt-2 text-[10px] text-slate-400 font-medium">With overdue balances</div>
            </div>
        </div>
    );
};

export default PayablesStats;
