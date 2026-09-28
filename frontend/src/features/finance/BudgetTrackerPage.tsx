import React, { useState } from 'react';
import {
    PieChart,
    ChevronRight,
    Zap,
    ShieldCheck,
    Plus,
    Search,
    Calendar as CalendarIcon,
    LayoutDashboard
} from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import ExpenseForm from '../../components/Finance/ExpenseForm';
import { useExpenses } from '../../hooks/useExpenses';
import { useExpenseReports } from '../../hooks/useExpenseReports';
import { formatCurrency } from '../../utils/formatters';
import ExpenseCalendar from '../../components/Finance/ExpenseCalendar';
import ExpenseListItem from '../../components/Finance/ExpenseListItem';
import ExperienceInsights from '../../components/Finance/ExperienceInsights';

const BudgetTrackerPage: React.FC = () => {
    // Same endpoint and hook as Expense Reports; this page used to call /api/expense-report
    // (singular, no such route) with bare axios, so the report never loaded.
    const { report, loading, error, refetch: fetchReport } = useExpenseReports();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'budget' | 'calendar' | 'stats'>('budget');
    const { createExpense, expenses } = useExpenses();

    const handleCreateExpense = async (data: any) => {
        try {
            await createExpense(data);
            toast.success('Expense recorded successfully');
            fetchReport();
        } catch {
            toast.error('Failed to record expense');
        }
    };

    if (!loading && error) {
        return (
            <Layout>
                <div role="alert" className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                    <p className="text-sm font-black text-error">Could not load the budget report.</p>
                    <button onClick={() => fetchReport()} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest">Retry</button>
                </div>
            </Layout>
        );
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                    <div className="w-16 h-16 border-[6px] border-success/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing EXPANAGER...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Budget Surveillance"
                    description="Deconstruct institutional expenditure and optimize fiscal allocation."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance', link: '/finance' },
                        { label: 'Budget' }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-slate-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                                <Search className="w-4 h-4" /> Deep Search
                            </button>
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="px-6 py-2.5 bg-success text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:bg-success/90 transition active:scale-95 uppercase tracking-widest"
                            >
                                <Plus className="w-5 h-5" /> Record Expense
                            </button>
                        </div>
                    }
                />

                <div className="space-y-10">
                    {/* Hero KPI Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-12 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-4">
                                    <span>Aggregate Burn</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-400">₹</span>
                                    <h2 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                        {report?.total_expense.toLocaleString('en-IN')}
                                    </h2>
                                </div>
                                <p className="text-sm font-bold text-slate-500 italic">Fiscal Period: {report?.report_period}</p>
                            </div>
                            
                            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-sm">
                                {[
                                    { id: 'budget', label: 'Surveillance', icon: LayoutDashboard },
                                    { id: 'calendar', label: 'Temporal', icon: CalendarIcon },
                                    { id: 'stats', label: 'Intelligence', icon: PieChart }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id 
                                            ? 'bg-white dark:bg-slate-700 text-success shadow-md scale-105' 
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Content */}
                    {activeTab === 'budget' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Left Side: Transactions */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Transaction Ledger</h3>
                                    <div className="flex items-center gap-4 text-success">
                                        <ChevronRight className="w-4 h-4 rotate-180 cursor-pointer" />
                                        <span className="text-[10px] font-black tracking-widest uppercase">{report?.report_period}</span>
                                        <ChevronRight className="w-4 h-4 cursor-pointer" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {expenses.slice(0, 8).map((exp, idx) => (
                                        <ExpenseListItem
                                            key={exp.id || idx}
                                            category={exp.category}
                                            amount={exp.amount}
                                            description={exp.description}
                                            date={exp.date}
                                        />
                                    ))}
                                </div>

                                {/* Monthly Trend Card */}
                                {report?.monthly_trends.slice(0, 1).map((m, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Consolidated Summary: {m.month}</h3>
                                            <span className="px-4 py-1.5 bg-success/10 text-success dark:text-success rounded-full text-[10px] font-black uppercase tracking-widest">Active Monitoring</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Budget Utilization</p>
                                                {m.budget_utilization !== null && (
                                                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${m.budget_utilization > 100 ? 'bg-danger' : 'bg-success'}`}
                                                            style={{ width: `${Math.min(m.budget_utilization, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                                    {formatCurrency(m.expense, { fractionDigits: 0 })}
                                                    <span className="text-slate-400 text-sm font-bold ml-2">/ {m.budget === null ? '—' : formatCurrency(m.budget, { fractionDigits: 0 })}</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-col justify-center items-end text-right">
                                                <div className="flex items-center gap-2 text-success dark:text-success mb-2">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Budget Status</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed max-w-[200px]">
                                                    {m.budget_utilization === null
                                                        ? 'No category budgets are set, so there is nothing to compare against.'
                                                        : m.budget_utilization <= 100
                                                            ? `You have used ${m.budget_utilization}% of this month's budget.`
                                                            : `You are ${m.budget_utilization - 100}% over this month's budget.`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right Side: Intelligence & Categories */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-slate-950 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                                    <Zap className="absolute -top-6 -right-6 w-24 h-24 text-success opacity-10 group-hover:scale-125 transition duration-1000" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-success mb-6 flex items-center gap-2">
                                        <Zap className="w-4 h-4 fill-emerald-500" /> Insights
                                    </p>
                                    <div className="space-y-6">
                                        {report?.audit_flags.slice(0, 3).map((flag, i) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-success shrink-0 shadow-[0_0_10px_rgb(var(--color-success))]" />
                                                <p className="text-xs font-bold leading-relaxed text-slate-400 italic">"{flag}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-10">By category</h3>
                                    <div className="space-y-8">
                                        {report?.by_category.slice(0, 5).map((cat, i) => (
                                            <div key={i} className="space-y-3 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{cat.category}</span>
                                                    <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">₹{cat.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${cat.status === 'OVER' ? 'bg-danger' : 'bg-success shadow-lg shadow-emerald-500/20'}`}
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
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <ExpenseCalendar expenses={expenses} />
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <ExperienceInsights data={report} />
                        </div>
                    )}
                </div>
            </div>

            <ExpenseForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleCreateExpense}
            />
        </Layout>
    );
};

export default BudgetTrackerPage;
