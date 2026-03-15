import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import { useExpenseReports } from "@/features/expense-tracking/lib/useExpenseReports";
import {
    BarChart3,
    PieChart,
    TrendingUp,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Building2,
    Calendar,
    Download,
    Filter,
    ArrowRight,
    Zap,
    Scale,
    FileText,
    Activity,
    Target,
    Users,
    MousePointer2,
    ArrowUpRight,
    Search,
    ChevronDown,
    Info,
} from 'lucide-react';
import Layout from "@/shared/ui/Layout";

interface AuthState {
    user: any;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const ExpenseReportsIntelligence: React.FC = () => {
    const auth = useSelector((state: RootState & { auth: AuthState }) => state.auth);
    const user = auth.user;
    const { report, loading } = useExpenseReports();

    const riskColor = (risk: string) => risk === 'HIGH' ? 'text-error bg-error/10 border-error/20' : 'text-success bg-success/10 border-success/20';

    if (loading || !report) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-primary animate-pulse" />
                    <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Compiling Financial Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-20">
                {/* Report Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            Expense Reports Intelligence
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Auditable insights for <span className="font-black text-primary">{report.report_period}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95">
                            <Download className="w-4 h-4" /> Export PDF
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                            <Filter className="w-4 h-4" /> Filters
                        </button>
                    </div>
                </div>

                {/* Top KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute -bottom-2 -right-2 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Scale className="w-20 h-20" />
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Gross Burn</p>
                        <h3 className="text-2xl font-black tabular-nums">₹{report.total_expense.toLocaleString()}</h3>
                        <div className="flex items-center gap-1.5 mt-2 text-error font-bold text-[10px] uppercase">
                            <TrendingUp className="w-3.5 h-3.5" /> +8% vs Prev Period
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Fixed Cost Ratio</p>
                        <h3 className="text-2xl font-black">{Math.round((report.by_category.filter(c => c.type === 'FIXED').reduce((s, c) => s + c.amount, 0) / report.total_expense) * 100)}%</h3>
                        <p className="text-[10px] text-neutral-500 mt-2 font-bold uppercase tracking-tight">Focusing on scalability</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative border-l-4 border-l-error">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Audit Flags</p>
                        <h3 className="text-2xl font-black text-error">{report.audit_flags.length} ACTIVE</h3>
                        <div className="flex items-center gap-1.5 mt-2 text-neutral-500 font-bold text-[10px] uppercase">
                            <ShieldAlert className="w-3.5 h-3.5 text-error" /> Compliance Required
                        </div>
                    </div>

                    <div className="bg-neutral-900 text-white p-6 rounded-[2rem] shadow-xl border border-neutral-800 relative group overflow-hidden">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Financial Advice</p>
                        <h3 className="text-xs font-black italic leading-tight text-neutral-300">
                            "Your Variable expenses represent 39% of burn. Focus on optimizing courier contracts."
                        </h3>
                    </div>
                </div>

                {/* Data Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Visual Breakdowns */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-sm font-black uppercase tracking-widest">Category Distribution (Pareto)</h4>
                                <span className="text-[10px] font-medium text-neutral-400 italic">Top 80% contributors highlighted</span>
                            </div>
                            <div className="space-y-6">
                                {report.by_category.map((cat, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black tracking-tight">{cat.category}</span>
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest ${cat.type === 'FIXED' ? 'bg-neutral-100 text-neutral-500' : 'bg-primary/10 text-primary'}`}>
                                                    {cat.type}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black italic mr-3">₹{cat.amount.toLocaleString()}</span>
                                                <span className="text-[10px] font-black text-neutral-400 tabular-nums">{cat.percentage}</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2 bg-neutral-50 dark:bg-neutral-900 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${cat.type === 'FIXED' ? 'bg-neutral-300' : 'bg-primary'}`}
                                                style={{ width: cat.percentage }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Branch Risk comparison */}
                            <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-neutral-50 dark:border-neutral-800 flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Branch Scrutiny</h4>
                                    <Building2 className="w-4 h-4 text-neutral-300" />
                                </div>
                                <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {report.by_branch.map((branch, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                                            <div>
                                                <p className="text-xs font-black tracking-tight">{branch.branch}</p>
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter">₹{branch.amount.toLocaleString()} Allocated</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${riskColor(branch.risk)}`}>
                                                {branch.risk} RISK
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment audit */}
                            <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-neutral-50 dark:border-neutral-800 flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Payment Mode Audit</h4>
                                    <Target className="w-4 h-4 text-neutral-300" />
                                </div>
                                <div className="p-6 space-y-4">
                                    {report.by_payment_mode.map((mode, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${mode.mode === 'CASH' ? 'bg-error' : 'bg-primary'}`} />
                                                <span className="text-xs font-black uppercase tracking-widest text-neutral-500">{mode.mode}</span>
                                            </div>
                                            <span className="text-xs font-black italic">₹{mode.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t border-neutral-100 flex items-center gap-2 text-[10px] font-bold text-neutral-400 italic">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>Imbalance detected in CASH-to-BANK ratio.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Audit Guard Rail */}
                    <div className="space-y-6">
                        <div className="bg-error text-white p-8 rounded-[2.5rem] shadow-xl shadow-error/20 relative overflow-hidden group">
                            <ShieldAlert className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                            <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                                Audit Sentinel
                            </h4>
                            <div className="space-y-4 relative z-10">
                                {report.audit_flags.map((flag, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs font-bold leading-relaxed border-l-2 border-white/30 pl-3">
                                        {flag}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Zap className="w-5 h-5 text-primary" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Agent Recommendation</h4>
                            </div>
                            <div className="space-y-4">
                                {report.recommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-start gap-3 group">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                                            <CheckCircle2 className="w-3 h-3 group-hover:text-white transition-colors" />
                                        </div>
                                        <p className="text-[11px] font-medium leading-relaxed italic text-neutral-600 dark:text-neutral-400">
                                            "{rec}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                Apply Optimized Policies
                            </button>
                        </div>

                        <div className="p-6 rounded-3xl bg-neutral-900 text-white relative overflow-hidden">
                            <Activity className="absolute top-0 right-0 p-4 opacity-10" />
                            <h5 className="text-[9px] font-black uppercase tracking-widest text-primary mb-2">Compliance Rating</h5>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black tracking-tighter">B+</span>
                                <span className="text-[10px] font-bold text-neutral-500 mb-1">Wings Standard</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ExpenseReportsIntelligence;
