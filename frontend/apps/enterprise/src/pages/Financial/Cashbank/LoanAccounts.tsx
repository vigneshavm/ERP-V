import React, { useState } from 'react';
import Layout from "../../../components/shared/Layout";
import {
    TrendingDown,
    TrendingUp,
    Plus,
    X,
    ChevronRight,
    Mic,
    Search,
    Home,
    TrendingUp as TrendingUpIcon,
    PieChart,
    Car,
    Gift,
    User,
    Calendar,
    ArrowRight,
    Edit3,
    Target
} from 'lucide-react';
import { Loan } from './types';

const LoanAccounts: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'all' | 'borrowed' | 'lent'>('all');
    const [showAddLoan, setShowAddLoan] = useState(false);

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
            <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8 font-sans selection:bg-rose-500/30 pb-32">
                <div className="max-w-2xl mx-auto space-y-10">

                    {/* Navigation Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronRight className="w-6 h-6 rotate-180" /></button>
                            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400">Loans</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Edit3 className="w-5 h-5 text-neutral-400" />
                        </div>
                    </div>

                    {/* Hero Section - "You owe 39,975" */}
                    <div className="text-center space-y-2 py-6">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">You owe</p>
                        <h2 className="text-5xl font-black text-rose-500 tracking-tight tabular-nums">
                            ₹{totalOwe.toLocaleString('en-IN')}
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/5">
                        {(['all', 'borrowed', 'lent'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${selectedTab === tab ? 'text-emerald-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                {tab}
                                {selectedTab === tab && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Loan Cards */}
                    <div className="space-y-4">
                        {filteredLoans.map((loan) => {
                            const isBorrowed = loan.loanType === 'borrowed';
                            const progress = Math.round(((loan.loanAmount - loan.balanceRemaining) / loan.loanAmount) * 100);
                            const dailyPaydown = Math.round(loan.balanceRemaining / 365); // Simplified calculation

                            return (
                                <div key={loan.id} className="bg-neutral-900/60 border border-white/5 rounded-[2rem] p-6 backdrop-blur-xl group hover:border-white/10 transition-all">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 ${isBorrowed ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                {isBorrowed ? <Car className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold tracking-tight">{loan.lenderName}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{loan.loanType}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black tracking-tight tabular-nums">
                                                ₹{loan.balanceRemaining.toLocaleString('en-IN')}
                                                <span className="text-[10px] text-neutral-500 font-bold ml-1">/₹{loan.loanAmount.toLocaleString('en-IN')}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                            <span>Today</span>
                                            <span>30 Jun 2026</span>
                                        </div>
                                        <div className="h-4 bg-neutral-800 rounded-full overflow-hidden relative">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-2 text-[8px] font-black ${isBorrowed ? 'bg-fuchsia-500/30' : 'bg-rose-500/50 text-white'}`}
                                                style={{ width: `${progress}%` }}
                                            >
                                                {progress}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Nudge */}
                                    <p className="text-xs font-bold text-neutral-400">
                                        {isBorrowed ? `Pay ₹${dailyPaydown}/day` : `Receive ₹${dailyPaydown}/day`} in the next 365 days.
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Floating FAB for Loans */}
                    <div className="fixed bottom-24 right-8 z-50">
                        <button
                            onClick={() => setShowAddLoan(true)}
                            className="w-14 h-14 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-emerald-500/30 shadow-2xl transition-all active:scale-95"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>

                    {/* App-Style Navigation Footer */}
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-10 px-10 py-6 bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl z-50">
                        <button className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                            <Home className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Overview</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 opacity-100 text-emerald-500">
                            <TrendingUp className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Loans</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                            <Target className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Goals</span>
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LoanAccounts;

