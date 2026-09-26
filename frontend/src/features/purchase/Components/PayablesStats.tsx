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
            <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-success" />
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-success-soft dark:bg-success-soft rounded-lg text-success">
                        <DollarSign size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Liability</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <TrendingUp size={12} className="text-success" /> Across {processedBills.length} pending bills
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-danger" />
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-danger-soft dark:bg-danger-soft rounded-lg text-danger">
                        <AlertCircle size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Overdue</span>
                </div>
                <div className="text-2xl font-black text-danger">₹{totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="mt-2 text-[10px] text-danger/80 font-bold uppercase tracking-tighter">Immediate Attention Required</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-warning-soft dark:bg-warning-soft rounded-lg text-warning">
                        <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due in 7 Days</span>
                </div>
                <div className="text-2xl font-black text-warning">₹{dueSoonAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="mt-2 text-[10px] text-slate-400 font-medium italic">Payment run preparation recommended</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-primary-soft dark:bg-primary-soft rounded-lg text-primary">
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
