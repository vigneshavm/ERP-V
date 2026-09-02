import React, { useState } from 'react';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import {
    TrendingDown,
    TrendingUp,
    Plus
} from 'lucide-react';
import { Loan } from './types';

const LoanAccounts: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'all' | 'borrowed' | 'lent'>('all');
    const [_showAddLoan, setShowAddLoan] = useState(false);

    const loans: Loan[] = [
        {
            id: 1,
            lenderName: 'Car Loan',
            loanType: 'borrowed',
            loanAmount: 200000,
            balanceRemaining: 85580,
            interestRate: 10.5,
            emiAmount: 15000,
            tenure: 36,
            paidEMIs: 15,
            status: 'active',
            startDate: '2023-04-01',
            nextEMIDate: '2024-02-01'
        },
        {
            id: 2,
            lenderName: 'To a friend',
            loanType: 'lent',
            loanAmount: 80000,
            balanceRemaining: 5555,
            interestRate: 0,
            emiAmount: 5000,
            tenure: 16,
            paidEMIs: 15,
            status: 'active',
            startDate: '2023-08-01',
            nextEMIDate: '2024-02-01'
        }
    ];

    const totalOwe = loans.filter(l => l.loanType === 'borrowed').reduce((sum, l) => sum + l.balanceRemaining, 0);
    const filteredLoans = selectedTab === 'all' ? loans : loans.filter(l => l.loanType === selectedTab);

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Loan Portfolio"
                    description="Monitor active liabilities and receivables across the enterprise registry."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance', link: '/finance' },
                        { label: 'Loans' }
                    ]}
                    actions={
                        <button
                            onClick={() => setShowAddLoan(true)}
                            className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/25 flex items-center gap-2 hover:bg-primary/90 transition-all uppercase tracking-widest"
                        >
                            <Plus className="w-5 h-5" /> Initialize New Loan
                        </button>
                    }
                />

                <div className="space-y-10">
                    {/* Hero Section */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-[3rem] border border-neutral-200 dark:border-neutral-800 p-12 text-center">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Aggregate Liability Position</p>
                        <h2 className="text-5xl font-black text-danger tracking-tighter tabular-nums">
                            ₹{totalOwe.toLocaleString('en-IN')}
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-sm w-fit">
                        {(['all', 'borrowed', 'lent'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === tab 
                                    ? 'bg-white dark:bg-neutral-700 text-primary shadow-md scale-105' 
                                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Loan Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredLoans.map((loan) => {
                            const isBorrowed = loan.loanType === 'borrowed';
                            const progress = Math.round(((loan.loanAmount - loan.balanceRemaining) / loan.loanAmount) * 100);
                            const dailyPaydown = Math.round(loan.balanceRemaining / 365);

                            return (
                                <div key={loan.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all shadow-sm group">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-sm flex items-center justify-center border border-neutral-100 dark:border-neutral-800 group-hover:scale-110 transition-transform ${isBorrowed ? 'bg-rose-50 dark:bg-rose-900/20 text-danger' : 'bg-emerald-50 dark:bg-emerald-900/20 text-success'}`}>
                                                {isBorrowed ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white uppercase tracking-tight">{loan.lenderName}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{loan.loanType}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 mb-8">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Remaining Balance</p>
                                                <p className={`text-2xl font-black tracking-tighter ${isBorrowed ? 'text-danger' : 'text-success'}`}>
                                                    ₹{loan.balanceRemaining.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Initial Principal</p>
                                                <p className="text-sm font-black text-neutral-500">₹{loan.loanAmount.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${isBorrowed ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                                <span>Inception</span>
                                                <span className={isBorrowed ? 'text-danger' : 'text-success'}>{progress}% Cleared</span>
                                                <span>Settlement</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Nudge */}
                                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-relaxed">
                                            Daily Impact:<br/>
                                            <span className={isBorrowed ? 'text-danger' : 'text-success'}>₹{dailyPaydown.toLocaleString('en-IN')}/day</span> for the next 365 days.
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LoanAccounts;
