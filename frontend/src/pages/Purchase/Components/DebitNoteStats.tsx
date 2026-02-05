import React from 'react';
import { FileText, TrendingDown, CheckCircle, Clock } from 'lucide-react';

interface DebitNoteStatsProps {
    totalCount: number;
    totalAmount: number;
    approvedAmount: number;
    pendingCount: number;
}

const DebitNoteStats: React.FC<DebitNoteStatsProps> = ({ totalCount, totalAmount, approvedAmount, pendingCount }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-secondary uppercase tracking-wide">Total Notes</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{totalCount}</p>
                    </div>
                    <div className="p-3 bg-error/10 rounded-xl">
                        <FileText className="w-6 h-6 text-error" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Amount</p>
                        <p className="text-2xl font-bold text-error mt-1">₹{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-error/10 rounded-xl">
                        <TrendingDown className="w-6 h-6 text-error" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-secondary uppercase tracking-wide">Settled Claims</p>
                        <p className="text-2xl font-bold text-success mt-1">₹{approvedAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-success/10 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-secondary uppercase tracking-wide">Sent / Pending</p>
                        <p className="text-2xl font-bold text-warning mt-1">{pendingCount}</p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-xl">
                        <Clock className="w-6 h-6 text-warning" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebitNoteStats;
