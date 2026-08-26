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
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";

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
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Financial Goals"
                    description="Stay on top of your long-term fiscal targets and institutional milestones."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance', link: '/finance' },
                        { label: 'Goals' }
                    ]}
                    actions={
                        <button
                            onClick={() => setShowAddGoal(true)}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:bg-emerald-700 transition-all uppercase tracking-widest"
                        >
                            <Plus className="w-5 h-5" /> Initialize New Goal
                        </button>
                    }
                />

                <div className="space-y-10">
                    {/* Hero Section */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-[3rem] border border-neutral-200 dark:border-neutral-800 p-12 text-center">
                        <h2 className="text-4xl font-black tracking-tight leading-tight text-neutral-900 dark:text-white">
                            Stay on top of your<br />
                            <span className="text-success">Goals and Loans</span>
                        </h2>
                    </div>

                    {/* Goal Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map((goal) => {
                            const progress = Math.round((goal.current / goal.target) * 100);
                            const dailyTarget = Math.round((goal.target - goal.current) / 62);

                            return (
                                <div key={goal.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all shadow-sm group">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-sm flex items-center justify-center border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 group-hover:scale-110 transition-transform">
                                                <goal.icon className="w-7 h-7 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white uppercase tracking-tight">{goal.name}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{goal.type}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Registry Position</p>
                                                <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">
                                                    ₹{goal.current.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Objective</p>
                                                <p className="text-sm font-black text-neutral-500">₹{goal.target.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000 flex items-center justify-end pr-2 text-[8px] font-black"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                                <span>{goal.startDate}</span>
                                                <span className="text-primary">{progress}% Accomplished</span>
                                                <span>{goal.dueDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Nudge */}
                                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-relaxed">
                                            Required Allocation:<br/>
                                            <span className="text-success text-xs">₹{dailyTarget.toLocaleString('en-IN')}/day</span> for 62 days.
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

export default FinancialGoals;
