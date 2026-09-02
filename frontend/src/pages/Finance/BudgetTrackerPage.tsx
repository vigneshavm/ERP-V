import React, { useState, useEffect } from 'react';
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
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import ExpenseForm from '../../components/Finance/ExpenseForm';
import { useExpenses } from '../../hooks/useExpenses';
import ExpenseCalendar from '../../components/Finance/ExpenseCalendar';
import ExpenseListItem from '../../components/Finance/ExpenseListItem';
import ExperienceInsights from '../../components/Finance/ExperienceInsights';

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
            const res = await axios.get('/api/expense-report');
            setReport(res.data);
        } catch {
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
        } catch {
            toast.error('Failed to record expense');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                    <div className="w-16 h-16 border-[6px] border-success/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] animate-pulse">Initializing EXPANAGER...</p>
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
                            <button className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                                <Search className="w-4 h-4" /> Deep Search
                            </button>
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-700 transition active:scale-95 uppercase tracking-widest"
                            >
                                <Plus className="w-5 h-5" /> Record Expense
                            </button>
                        </div>
                    }
                />

                <div className="space-y-10">
                    {/* Hero KPI Section */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-[3rem] border border-neutral-200 dark:border-neutral-800 p-12 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] mb-4">
                                    <span>Aggregate Burn</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-neutral-400">₹</span>
                                    <h2 className="text-7xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">
                                        {report?.total_expense.toLocaleString('en-IN')}
                                    </h2>
                                </div>
                                <p className="text-sm font-bold text-neutral-500 italic">Fiscal Period: {report?.report_period}</p>
                            </div>
                            
                            <div className="flex items-center gap-1.5 p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                                {[
                                    { id: 'budget', label: 'Surveillance', icon: LayoutDashboard },
                                    { id: 'calendar', label: 'Temporal', icon: CalendarIcon },
                                    { id: 'stats', label: 'Intelligence', icon: PieChart }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id 
                                            ? 'bg-white dark:bg-neutral-700 text-success shadow-md scale-105' 
                                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
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
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Transaction Ledger</h3>
                                    <div className="flex items-center gap-4 text-success">
                                        <ChevronRight className="w-4 h-4 rotate-180 cursor-pointer" />
                                        <span className="text-[10px] font-black tracking-widest uppercase">June 2025</span>
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
                                    <div key={idx} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-10 shadow-sm">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Consolidated Summary: {m.month}</h3>
                                            <span className="px-4 py-1.5 bg-success/10 text-emerald-600 dark:text-success rounded-full text-[10px] font-black uppercase tracking-widest">Active Monitoring</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Resource Utilization</p>
                                                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-[75%] rounded-full shadow-lg shadow-emerald-500/20" />
                                                </div>
                                                <p className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
                                                    ₹{m.expense.toLocaleString()} 
                                                    <span className="text-neutral-400 text-sm font-bold ml-2">/ ₹{(m.expense * 1.2).toLocaleString()}</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-col justify-center items-end text-right">
                                                <div className="flex items-center gap-2 text-emerald-600 dark:text-success mb-2">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Operational Safety</span>
                                                </div>
                                                <p className="text-[10px] text-neutral-500 font-bold uppercase leading-relaxed max-w-[200px]">You are currently 25% under the allocated fiscal threshold.</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right Side: Intelligence & Categories */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-neutral-950 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                                    <Zap className="absolute -top-6 -right-6 w-24 h-24 text-success opacity-10 group-hover:scale-125 transition duration-1000" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-success mb-6 flex items-center gap-2">
                                        <Zap className="w-4 h-4 fill-emerald-500" /> Oracle Insights
                                    </p>
                                    <div className="space-y-6">
                                        {report?.audit_flags.slice(0, 3).map((flag, i) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_10px_#10b981]" />
                                                <p className="text-xs font-bold leading-relaxed text-neutral-400 italic">"{flag}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-10 shadow-sm">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-10">Sector Breakdown</h3>
                                    <div className="space-y-8">
                                        {report?.by_category.slice(0, 5).map((cat, i) => (
                                            <div key={i} className="space-y-3 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{cat.category}</span>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white tabular-nums">₹{cat.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${cat.status === 'OVER' ? 'bg-rose-500' : 'bg-emerald-500 shadow-lg shadow-emerald-500/20'}`}
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
