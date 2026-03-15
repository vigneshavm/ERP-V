import React, { useState, useEffect } from 'react';
import {
    Target,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    PieChart,
    ChevronRight,
    Zap,
    Scale,
    ShieldCheck,
    AlertTriangle,
    Home,
    Mic,
    Plus,
    Search,
    Filter,
    Calendar as CalendarIcon,
    LayoutDashboard
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ExpenseForm from '@/features/expense-tracking/ui/ExpenseForm';
import { useExpenses } from '@/features/expense-tracking/lib/useExpenses';
import ExpenseCalendar from '@/features/expense-tracking/ui/ExpenseCalendar';
import ExpenseListItem from '@/features/expense-tracking/ui/ExpenseListItem';
import ExperienceInsights from '@/features/expense-tracking/ui/ExperienceInsights';
import api from '@/shared/api/api';

interface MonthlyTrend {
    month: string;
    year: number;
    expense: number;
    income: number;
    budget_utilization: number;
    label: string;
}

interface CategoryBudget {
    category: string;
    amount: number;
    budget: number;
    variance: number;
    variancePercentage: number;
    percentage: string;
    type: 'FIXED' | 'VARIABLE';
    status: 'OVER' | 'UNDER' | 'NONE';
}

interface ReportData {
    report_period: string;
    total_expense: number;
    by_category: CategoryBudget[];
    audit_flags: string[];
    recommendations: string[];
    monthly_trends: MonthlyTrend[];
}

const BudgetTrackerPage: React.FC = () => {
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'budget' | 'calendar' | 'stats'>('budget');
    const { createExpense, expenses } = useExpenses();

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await api.get('/expense-report');
            setReport(res.data);
        } catch (err) {
            toast.error('Failed to fetch budget report');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async (data: any) => {
        try {
            await createExpense(data);
            toast.success('Expense recorded successfully');
            fetchReport();
        } catch (err) {
            toast.error('Failed to record expense');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] bg-[#05070a]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-[6px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-neutral-500 uppercase tracking-[0.3em] animate-pulse">Initializing EXPANAGER...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05070a] text-white p-4 md:p-8 font-sans selection:bg-emerald-500/30">
            <div className="max-w-5xl mx-auto space-y-10 pb-32">

                {/* Top Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronRight className="w-6 h-6 rotate-180" /></button>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-500">EXPANAGER</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Mic className="w-5 h-5 text-neutral-500 hover:text-white cursor-pointer" />
                        <Search className="w-5 h-5 text-neutral-500 hover:text-white cursor-pointer" />
                        <MoreVerticalIcon className="w-5 h-5 text-neutral-500 hover:text-white cursor-pointer" />
                    </div>
                </div>

                {/* Hero Section */}
                <div className="relative overflow-hidden pt-4">
                    <div className="flex flex-col items-center justify-center w-full py-12 text-center">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
                            Get deeper insights into <br className="hidden md:block" /> your data
                        </h1>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2 text-neutral-500 font-bold mb-2">
                            <span className="text-xs uppercase tracking-widest">Monthly Overview</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                        </div>

                        <div className="flex items-end justify-between w-full">
                            <div>
                                <div className="flex items-start gap-1">
                                    <span className="text-3xl font-medium text-neutral-500 mt-2">₹</span>
                                    <h2 className="text-6xl md:text-8xl font-medium tracking-tight tabular-nums expanager-text-gradient">
                                        {report?.total_expense.toLocaleString('en-IN')}
                                    </h2>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <div className="w-24 h-24 bg-neutral-900 rounded-3xl flex items-center justify-center p-4 border border-white/5 shadow-2xl overflow-hidden group">
                                    <div className="bg-amber-600/10 w-full h-full rounded-2xl flex items-center justify-center border border-amber-600/20 group-hover:scale-110 transition-transform">
                                        <Home className="w-10 h-10 text-amber-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex items-center gap-8 mt-10 p-1 bg-white/5 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('budget')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'budget' ? 'bg-emerald-500 text-neutral-950 shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Budget
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'calendar' ? 'bg-emerald-500 text-neutral-950 shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Calendar
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-emerald-500 text-neutral-950 shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Insights
                        </button>
                    </div>
                </div>

                {/* Dynamic Content Based on Tab */}
                {activeTab === 'budget' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
                        {/* Left Side: Recent Transactions & Timeline */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Recent Transactions</h3>
                                <div className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-emerald-500 rotate-180" />
                                    <span className="text-xs font-black tracking-widest text-neutral-500">JUNE 2025</span>
                                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {expenses.slice(0, 10).map((exp, idx) => (
                                    <ExpenseListItem
                                        key={exp.id || idx}
                                        category={exp.category}
                                        amount={exp.amount}
                                        description={exp.description}
                                        date={exp.date}
                                    />
                                ))}
                            </div>

                            {/* Monthly Trend Card (Legacy feel preserved but updated) */}
                            {report?.monthly_trends.slice(0, 1).map((m, idx) => (
                                <div key={idx} className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl mt-12">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-bold tracking-tight">Summary: {m.month}</h3>
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Total Budget</p>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                                                <div className="h-full bg-emerald-500 w-[75%] rounded-full shadow-[0_0_15px_#10b981]" />
                                            </div>
                                            <p className="text-lg font-black tracking-tight">₹{m.expense.toLocaleString()} <span className="text-neutral-600 text-sm font-medium">/ ₹{(m.expense * 1.2).toLocaleString()}</span></p>
                                        </div>
                                        <div className="flex flex-col justify-end items-end">
                                            <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                                <ShieldCheck className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Safe Spend</span>
                                            </div>
                                            <p className="text-[10px] text-neutral-500 text-right font-medium">You are currently 25% under budget</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Side: Category Breakdown & Nudges */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="expanager-glass rounded-[2rem] p-8 expanager-glow-border">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4 fill-emerald-500" /> Intelligence
                                </p>
                                <div className="space-y-6">
                                    {report?.audit_flags.slice(0, 2).map((flag, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <p className="text-xs font-bold leading-relaxed text-neutral-300">"{flag}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-neutral-900 border border-white/5 rounded-[2rem] p-8">
                                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-8">Categories</h3>
                                <div className="space-y-6">
                                    {report?.by_category.slice(0, 5).map((cat, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black tracking-tight uppercase text-neutral-400">{cat.category}</span>
                                                <span className="text-[11px] font-black text-white tabular-nums">₹{cat.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${cat.status === 'OVER' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${cat.percentage}` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'calendar' && (
                    <div className="animate-fade-in">
                        <ExpenseCalendar expenses={expenses} />
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="animate-fade-in">
                        <ExperienceInsights data={report} />
                    </div>
                )}
            </div>

            {/* Floating Navigation / Action */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 px-10 py-6 bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
                <button
                    onClick={() => setActiveTab('budget')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'budget' ? 'text-emerald-500 scale-110' : 'text-neutral-500 opacity-40 hover:opacity-100'}`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Overview</span>
                </button>

                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'calendar' ? 'text-emerald-500 scale-110' : 'text-neutral-500 opacity-40 hover:opacity-100'}`}
                >
                    <CalendarIcon className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Calendar</span>
                </button>

                <button
                    onClick={() => setIsFormOpen(true)}
                    className="w-16 h-16 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-full -mt-20 flex items-center justify-center shadow-[0_10px_40px_-5px_rgba(16,185,129,0.5)] active:scale-95 transition-all outline-none border-[6px] border-[#05070a]"
                >
                    <Plus className="w-8 h-8 stroke-[4]" />
                </button>

                <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'stats' ? 'text-emerald-500 scale-110' : 'text-neutral-500 opacity-40 hover:opacity-100'}`}
                >
                    <PieChart className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Stats</span>
                </button>

                <button className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                    <TrendingUp className="w-5 h-5 text-neutral-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">History</span>
                </button>
            </div>

            <ExpenseForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleCreateExpense}
            />
        </div>
    );
};

const MoreVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
    </svg>
);

export default BudgetTrackerPage;
