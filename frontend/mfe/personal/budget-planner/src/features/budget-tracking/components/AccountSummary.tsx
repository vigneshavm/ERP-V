import React from 'react';
import { useAccounts } from '@repo/shared';
import { MetricCard } from '@repo/ui';
import { Wallet, Landmark, CreditCard } from 'lucide-react';

export const AccountSummary = () => {
    const { accounts, loading } = useAccounts();

    if (loading || accounts.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black tracking-tight">Your Accounts</h2>
                    <p className="text-sm text-neutral-500 font-medium">Manage and track your balances</p>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">Total Wealth</p>
                    <p className="text-xl font-black italic tracking-tighter">
                        ₹{accounts.reduce((sum, acc) => sum + acc.currentBalance, 0).toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((acc) => {
                    let Icon = Wallet;
                    let color = 'primary';
                    
                    if (acc.accountType === 'Savings' || acc.accountType === 'OD') {
                        Icon = Landmark;
                        color = 'emerald';
                    } else if (acc.accountType === 'CC' || acc.accountType === 'Loan') {
                        Icon = CreditCard;
                        color = 'rose';
                    }

                    return (
                        <MetricCard
                            key={acc.id}
                            title={`${acc.bankName} • ${acc.accountType}`}
                            value={`₹${acc.currentBalance.toLocaleString('en-IN')}`}
                            icon={Icon}
                            color={color}
                            compact
                            subtext={acc.isActive ? 'Active & Synced' : 'Inactive'}
                            trend={acc.currentBalance > 0 ? 'up' : 'down'}
                        />
                    );
                })}
            </div>
        </div>
    );
};
