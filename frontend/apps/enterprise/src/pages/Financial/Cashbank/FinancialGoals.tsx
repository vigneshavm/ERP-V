import React, { useState } from 'react';
import {
    Target,
    Plus,
    X,
    ChevronRight,
    Home,
    TrendingUp,
    Anchor,
    Palmtree,
    Car,
    Edit3
} from 'lucide-react';

const FinancialGoals: React.FC = () => {
    const [showAddGoal, setShowAddGoal] = useState(false);

    const goals = [
        {
            id: 1,
            name: 'Buy A Boat',
            type: 'Expense Goal',
            current: 100122,
            target: 800000,
            dueDate: '31 Aug 2025',
            startDate: '21 May 2025',
            icon: Anchor
        },
        {
            id: 2,
            name: 'Vacation',
            type: 'Savings Goal',
            current: 65000,
            target: 100000,
            dueDate: '24 May 2025',
            startDate: '24 May 2025',
            icon: Palmtree
        },
        {
            id: 3,
            name: 'Car Loan',
            type: 'Expense Goal',
            current: 4000,
            target: 100000,
            dueDate: 'Today',
            startDate: 'Today',
            icon: Car
        }
    ];

    return (
        <div className="page-shell p-4 md:p-8 font-sans pb-32">
                <div className="max-w-2xl mx-auto space-y-10">

                    {/* Navigation Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-[var(--erp-bg-sunken)] rounded-full transition-colors"><ChevronRight className="w-6 h-6 rotate-180" /></button>
                            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400">Goals</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Edit3 className="w-5 h-5 text-neutral-400" />
                        </div>
                    </div>

                    {/* Hero Section */}
                    <div className="text-center py-6">
                        <h2 className="text-3xl font-black tracking-tight leading-tight">
                            Stay on top of your<br />
                            <span className="text-emerald-500">Goals and Loans</span>
                        </h2>
                    </div>

                    {/* Goal Cards */}
                    <div className="space-y-4">
                        {goals.map((goal) => {
                            const progress = Math.round((goal.current / goal.target) * 100);
                            const dailyTarget = Math.round((goal.target - goal.current) / 62); // Hardcoded days for mockup match

                            return (
                                <div key={goal.id} className="bg-[var(--erp-bg)]/60 border border-default rounded-[2rem] p-6 backdrop-blur-xl hover:border-default transition-all">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-default bg-[var(--erp-card)]">
                                                <goal.icon className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold tracking-tight">{goal.name}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{goal.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black tracking-tight tabular-nums">
                                                ₹{goal.current.toLocaleString('en-IN')}
                                                <span className="text-[10px] text-neutral-500 font-bold ml-1">/₹{goal.target.toLocaleString('en-IN')}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                            <span>{goal.startDate}</span>
                                            <span>{goal.dueDate}</span>
                                        </div>
                                        <div className="h-4 bg-[var(--erp-card)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-neutral-600 rounded-full transition-all duration-1000 flex items-center justify-end pr-2 text-[8px] font-black"
                                                style={{ width: `${progress}%` }}
                                            >
                                                {progress}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Nudge */}
                                    <p className="text-xs font-bold text-neutral-400">
                                        Save ₹{dailyTarget.toLocaleString('en-IN')}/day in the next 62 days.
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Floating FAB for Goals */}
                    <div className="fixed bottom-24 right-8 z-50">
                        <button
                            onClick={() => setShowAddGoal(true)}
                            className="w-14 h-14 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-emerald-500/30 shadow-2xl transition-all active:scale-95"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>

                    {/* App-Style Navigation Footer */}
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-10 px-10 py-6 bg-[var(--erp-bg)]/80 backdrop-blur-2xl border border-default rounded-[2.5rem] shadow-2xl z-50">
                        <button className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                            <Home className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Overview</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                            <TrendingUp className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Loans</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 opacity-100 text-emerald-500">
                            <Target className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Goals</span>
                        </button>
                    </div>
                </div>
            </div>
    );
};

export default FinancialGoals;
