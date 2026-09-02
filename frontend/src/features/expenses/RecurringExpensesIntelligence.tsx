import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
import { useRecurringExpenses } from "../../hooks/useRecurringExpenses";
import {
    TrendingDown,
    Zap,
    ShieldAlert,
    Clock,
    ChevronRight,
    Wallet,
    Info,
    Target,
    Activity,
    MoreVertical,
    History,
    FileText,
    Settings,
} from 'lucide-react';
import Layout from "../../components/shared/Layout/index";
import { formatDate } from '../../utils/helpers';

interface AuthState {
    user: any;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const RecurringExpensesIntelligence: React.FC = () => {
    const auth = useSelector((state: RootState & { auth: AuthState }) => state.auth);
    const user = auth.user;
    const { loading, intelligence, recurringExpenses } = useRecurringExpenses();

    const riskColorMap = {
        HIGH: 'text-error bg-error/10 border-error/20',
        MEDIUM: 'text-amber-600 bg-amber-100 border-amber-200',
        LOW: 'text-success bg-success/10 border-success/20',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Zap className="w-12 h-12 text-primary animate-pulse" />
                    <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Running Fixed-Cost Analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-20">
                {/* Wings Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <History className="w-6 h-6 text-primary" />
                            Recurring Obligations Agent
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Cashflow forecasting & profit protection for <span className="font-bold text-primary">{user?.tenantId || 'Organization'}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95">
                            <FileText className="w-4 h-4" /> Policy Audit
                        </button>
                        <button className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-800 shadow-xl transition-all active:scale-95">
                            <Settings className="w-4 h-4" /> Manage Masters
                        </button>
                    </div>
                </div>

                {/* Strategic KPI Rail */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Target Monthly Burn</p>
                        <h3 className="text-2xl font-black tabular-nums">₹{recurringExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</h3>
                        <div className="flex items-center gap-1.5 mt-2 text-neutral-500 font-bold text-[10px] uppercase">
                            <Clock className="w-3.5 h-3.5" /> Next cycle: 1st Feb
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Wallet className="w-16 h-16" />
                        </div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Cash Required (30D)</p>
                        <h3 className="text-2xl font-black tabular-nums text-primary">₹{intelligence.cashRequired30Days.toLocaleString()}</h3>
                        <div className="flex items-center gap-1.5 mt-2 text-neutral-500 font-bold text-[10px] uppercase">
                            <ShieldAlert className="w-3.5 h-3.5 text-warning" /> Reserve needed soon
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Avg Fixed Cost Ratio</p>
                        <h3 className="text-2xl font-black">{Math.round(intelligence.summaryByBranch.reduce((s, b) => s + parseInt(b.cost_ratio), 0) / (intelligence.summaryByBranch.length || 1))}%</h3>
                        <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-900 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '13%' }} />
                        </div>
                    </div>

                    <div className="bg-neutral-900 text-white p-6 rounded-[2rem] shadow-xl border border-neutral-800 relative group overflow-hidden">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Agent Intelligence</p>
                        <h3 className="text-xs font-black italic leading-tight text-neutral-300">
                            {intelligence.upcomingDues.some(d => d.status === 'OVERDUE')
                                ? "Critical: Overdue payments detected in Chennai. Prioritize settlement."
                                : "Predictive Health: Cash flow matches obligations for the next cycle."}
                        </h3>
                    </div>
                </div>

                {/* Workspace split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Branch Viability Tracker */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-neutral-50 dark:border-neutral-800 flex items-center justify-between">
                                <h4 className="text-sm font-black uppercase tracking-widest">Branch Fixed-Cost Viability</h4>
                                <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                    Full Breakdown <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="divide-y divide-neutral-50 dark:divide-neutral-800 text-sm">
                                {intelligence.summaryByBranch.map((branch, idx) => (
                                    <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-sm flex items-center justify-center border font-black ${riskColorMap[branch.risk_level]}`}>
                                                {branch.cost_ratio}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg tracking-tight leading-none">{branch.branch_name}</p>
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                                                    Sales: ₹{branch.monthly_sales.toLocaleString()} <span className="text-neutral-200">|</span> GP: {branch.cost_ratio}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex-1 max-w-xs text-right md:text-left">
                                            <div className="inline-flex items-start gap-2 p-2.5 bg-primary/5 rounded-xl border border-primary/10">
                                                <Target className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-medium leading-relaxed italic text-neutral-600 dark:text-neutral-400">
                                                    "{branch.recommended_action}"
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-2">
                                                <p className="font-black text-sm">₹{branch.total_monthly_fixed_cost.toLocaleString()}</p>
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Monthly Commitment</p>
                                            </div>
                                            <button className="p-2 text-neutral-400 hover:text-primary transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming & Overdue List */}
                        <div className="bg-neutral-900 text-white rounded-[2.5rem] p-8 border border-neutral-800 shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    Active Obligation Queue
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {intelligence.upcomingDues.map((due, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-sm flex items-center justify-between hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${due.status === 'OVERDUE' ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'}`}>
                                                    {due.category_name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{due.category_name}</p>
                                                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{due.vendor}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-black text-sm ${due.status === 'OVERDUE' ? 'text-error' : 'text-neutral-300'}`}>₹{due.amount.toLocaleString()}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">
                                                    {due.status === 'OVERDUE' ? 'OVERDUE' : `Due ${formatDate(due.next_due_date)}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Side Rail */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Anomaly Guard</h4>

                        <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                            <div className="flex items-center gap-3 text-error mb-4">
                                <ShieldAlert className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Utility Spike Detected</span>
                            </div>
                            <p className="text-xs font-bold leading-relaxed mb-4">
                                Electricity bill for "Chennai - OMR" is <span className="text-error underline underline-offset-2">24% higher</span> than historical average.
                            </p>
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl mb-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                    <span>Typical</span>
                                    <span>Current</span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full flex overflow-hidden">
                                    <div className="h-full bg-neutral-400" style={{ width: '70%' }} />
                                    <div className="h-full bg-error" style={{ width: '30%' }} />
                                </div>
                            </div>
                            <button className="w-full py-3 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all">
                                Initiate Audit
                            </button>
                        </div>

                        <div className="bg-primary text-white p-6 rounded-sm shadow-xl shadow-primary/20 relative overflow-hidden group">
                            <TrendingDown className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                            <h4 className="font-black text-lg mb-2">Cost Optimization</h4>
                            <p className="text-[11px] opacity-90 leading-relaxed mb-6 italic">
                                "Moving Internet to a dedicated corporate plan across 3 branches could save ₹4,500/month."
                            </p>
                            <button className="w-full py-3 bg-white text-primary font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-neutral-50 transition-all">
                                View Bundle Options
                            </button>
                        </div>

                        <div className="p-5 rounded-sm border border-neutral-100 bg-neutral-50/50 flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl text-neutral-400 shrink-0 shadow-sm">
                                <Info className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-neutral-500 font-bold leading-relaxed uppercase tracking-tight">
                                Recurring Intelligence ensures <span className="text-neutral-900 italic">Zero-Surprise Month Ends</span> through continuous cashflow anticipation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default RecurringExpensesIntelligence;
