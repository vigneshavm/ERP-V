import React, { useMemo } from 'react';
import { useTransactions, formatCurrency } from '@repo/shared';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';

export const SubscriptionTracker = () => {
    const { transactions, loading } = useTransactions();

    const recurringSubscriptions = useMemo(() => {
        // Filter transactions that are marked as recurring
        const recurring = transactions.filter(t => t.isRecurring);
        
        return recurring.map(t => {
            const nextDue = new Date(t.date);
            nextDue.setMonth(nextDue.getMonth() + 1);
            
            const today = new Date();
            const diffTime = nextDue.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                id: t.id,
                name: t.description || 'Subscription',
                amount: Math.abs(t.amount),
                nextDue: nextDue.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                daysLeft: diffDays,
                status: diffDays < 5 ? 'due' : 'ok'
            };
        });
    }, [transactions]);

    if (loading || recurringSubscriptions.length === 0) return null;

    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl">
                        <RefreshCw className="h-4 w-4" />
                    </span>
                    <h3 className="font-bold">Subscriptions</h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Next 30 Days</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recurringSubscriptions.map((sub) => (
                    <div key={sub.id} className="group p-4 rounded-2xl border border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 hover:border-neutral-200 dark:hover:border-neutral-700 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-sm">
                                    <Calendar className="h-4 w-4 text-neutral-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold truncate max-w-[100px]">{sub.name}</p>
                                    <p className="text-[10px] text-neutral-500 font-medium">Monthly</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                sub.status === 'due' 
                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' 
                                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                                {sub.status === 'due' ? 'Due Soon' : 'Active'}
                            </span>
                        </div>
                        
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-lg font-black tracking-tighter">{formatCurrency(sub.amount)}</p>
                                <p className="text-[10px] text-neutral-500">Next: {sub.nextDue}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-xs font-bold ${sub.status === 'due' ? 'text-amber-500' : 'text-neutral-400'}`}>
                                    {sub.daysLeft}d left
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
