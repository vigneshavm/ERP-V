import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '../../redux/slices/uiSlice';
import { AppView } from '../../types/common';
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import {
    TrendingUp, TrendingDown, Zap, RefreshCw, AlertTriangle,
    CheckCircle2, CreditCard, Building2, Landmark, FileText,
    ArrowUpRight, ArrowDownRight, Activity, ChevronRight,
    Clock, CircleDollarSign, BarChart3, Layers, Bot,
    CalendarClock, ShieldCheck, ReceiptText, Banknote, X,
    CircleCheck, CircleAlert, Info, Search, Filter
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Types
 ───────────────────────────────────────────── */
interface Agent {
    id: string;
    name: string;
    tagline: string;
    icon: React.ReactNode;
    color: string;
    accentColor: string;
    glowColor: string;
    workflow: string;
    capabilities: string[];
    tab?: AppView;
}

interface KPI {
    label: string;
    value: string;
    sub: string;
    trend: 'up' | 'down' | 'neutral';
    delta: string;
    icon: React.ReactNode;
    color: string;
}

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'ok';
    title: string;
    body: string;
    time: string;
}

interface LoanBar {
    name: string;
    emi: number;
    pending: number;
    principal: number;
    health: 'good' | 'risk' | 'critical';
}

/* ─────────────────────────────────────────────
   Mock data generators
 ───────────────────────────────────────────── */
const mockCashFlow = [42, 38, 55, 50, 61, 57, 70, 66, 74, 71, 82, 78];
const mockExpenses = [30, 33, 29, 35, 32, 40, 37, 42, 39, 45, 41, 48];

const AGENTS: Agent[] = [
    {
        id: 'cash-flow',
        name: 'Cash Flow Agent',
        tagline: 'Analyzes net cash position, compares periods & flags anomalies',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'from-emerald-500 to-teal-500',
        accentColor: 'text-emerald-400',
        glowColor: 'shadow-emerald-500/30',
        workflow: 'finance-cash-flow',
        capabilities: ['Net Cash Computation', 'Period Comparison', 'Anomaly Detection', 'PDC Projection'],
        tab: 'CASH_ACCOUNTS',
    },
    {
        id: 'loan-emi',
        name: 'Loan & EMI Agent',
        tagline: 'Tracks active loans, EMI schedules & bank balance sufficiency',
        icon: <Banknote className="w-6 h-6" />,
        color: 'from-violet-500 to-purple-600',
        accentColor: 'text-violet-400',
        glowColor: 'shadow-violet-500/30',
        workflow: 'finance-loan-emi',
        capabilities: ['EMI Schedule', 'Missed Payment Alerts', 'Balance Validation', 'Loan Health Score'],
    },
    {
        id: 'reconciliation',
        name: 'Reconciliation Agent',
        tagline: 'Matches bank statements against ERP transactions automatically',
        icon: <ShieldCheck className="w-6 h-6" />,
        color: 'from-blue-500 to-cyan-500',
        accentColor: 'text-blue-400',
        glowColor: 'shadow-blue-500/30',
        workflow: 'finance-reconciliation',
        capabilities: ['Statement Matching', 'Unmatched Item Detection', 'Bulk Reconcile', 'Reconciliation %'],
        tab: 'BANK_RECONCILIATION',
    },
    {
        id: 'bill-approval',
        name: 'Bill Approval Agent',
        tagline: 'Ages outstanding bills, validates funds & recommends payments',
        icon: <ReceiptText className="w-6 h-6" />,
        color: 'from-orange-500 to-amber-500',
        accentColor: 'text-orange-400',
        glowColor: 'shadow-orange-500/30',
        workflow: 'finance-bill-approval',
        capabilities: ['Bill Aging (0-90+ days)', 'Priority Ranking', 'Feasibility Check', 'Penalty Detection'],
        tab: 'PURCHASE_BILLS',
    },
    {
        id: 'day-end',
        name: 'Day-End Agent',
        tagline: 'Reconciles daily cash, PDCs & closing balance automatically',
        icon: <CalendarClock className="w-6 h-6" />,
        color: 'from-rose-500 to-pink-600',
        accentColor: 'text-rose-400',
        glowColor: 'shadow-rose-500/30',
        workflow: 'finance-day-end',
        capabilities: ['Cash In / Out Summary', 'PDC Clearance Check', 'Discrepancy Alerts', 'Day-End Save'],
        tab: 'CASH_ACCOUNTS',
    },
];

const KPIS: KPI[] = [
    {
        label: 'Total Bank Balance',
        value: '₹12,48,550',
        sub: 'Across 3 accounts',
        trend: 'up',
        delta: '+4.2%',
        icon: <Landmark className="w-5 h-5" />,
        color: 'text-emerald-500',
    },
    {
        label: "Today's Cash In",
        value: '₹87,200',
        sub: 'vs ₹64,300 yesterday',
        trend: 'up',
        delta: '+35.6%',
        icon: <ArrowUpRight className="w-5 h-5" />,
        color: 'text-sky-500',
    },
    {
        label: "Today's Cash Out",
        value: '₹41,800',
        sub: 'vs ₹38,100 yesterday',
        trend: 'down',
        delta: '+9.7%',
        icon: <ArrowDownRight className="w-5 h-5" />,
        color: 'text-rose-500',
    },
    {
        label: 'Active Loans',
        value: '3',
        sub: 'EMI due in 4 days',
        trend: 'neutral',
        delta: '₹42,000 / mo',
        icon: <CreditCard className="w-5 h-5" />,
        color: 'text-violet-500',
    },
    {
        label: 'Unreconciled Items',
        value: '12',
        sub: '3 critical (>7 days)',
        trend: 'down',
        delta: 'Action needed',
        icon: <Activity className="w-5 h-5" />,
        color: 'text-orange-500',
    },
    {
        label: 'Bills Overdue',
        value: '5',
        sub: '₹1,24,000 total',
        trend: 'down',
        delta: '2 at risk of penalty',
        icon: <FileText className="w-5 h-5" />,
        color: 'text-amber-500',
    },
];

const ALERTS: Alert[] = [
    { id: '1', type: 'critical', title: 'Low Balance — HDFC Current', body: 'Effective balance ₹8,200 — EMI of ₹18,500 due in 4 days.', time: '2 min ago' },
    { id: '2', type: 'critical', title: 'Bill Overdue 67 Days', body: 'Sharma Traders ₹34,000 — Penalty kicks in after 90 days.', time: '1 hr ago' },
    { id: '3', type: 'warning', title: 'Unmatched Bank Credit', body: '₹15,000 credit on Feb 28 — no matching ERP transaction found.', time: '3 hrs ago' },
    { id: '4', type: 'warning', title: 'EMI Overdue — Business Loan', body: 'Loan "HDFC Business Loan" missed Feb payment. ₹21,000 overdue.', time: '1 day ago' },
    { id: '5', type: 'ok', title: 'Day End Saved', body: 'Yesterday\'s reconciliation saved. Discrepancy: ₹0.', time: '1 day ago' },
    { id: '6', type: 'ok', title: 'PDC Cleared — Axis Bank', body: 'Cheque #004421 ₹12,000 cleared successfully.', time: '2 days ago' },
];

const LOANS: LoanBar[] = [
    { name: 'HDFC Business Loan', emi: 21000, pending: 8_40_000, principal: 15_00_000, health: 'risk' },
    { name: 'SBI Working Capital', emi: 14500, pending: 3_20_000, principal: 5_00_000, health: 'good' },
    { name: 'ICICI Equipment Loan', emi: 6800, pending: 68_000, principal: 2_40_000, health: 'critical' },
];

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

/* ─────────────────────────────────────────────
   Sub-components
 ───────────────────────────────────────────── */
const AlertIcon: React.FC<{ type: Alert['type'] }> = ({ type }) => {
    if (type === 'critical') return <CircleAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    return <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
};

const HealthBadge: React.FC<{ health: LoanBar['health'] }> = ({ health }) => {
    const map = {
        good: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
        risk: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        critical: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    };
    return (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${map[health]}`}>
            {health}
        </span>
    );
};

/* ─────────────────────────────────────────────
   Agent Detail Drawer
 ───────────────────────────────────────────── */
const AgentDrawer: React.FC<{ agent: Agent | null; onClose: () => void; onNavigate: (tab: AppView) => void }> = ({
    agent, onClose, onNavigate
}) => {
    if (!agent) return null;
    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative h-full w-full max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-8 bg-gradient-to-br ${agent.color} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
                    <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 backdrop-blur-sm">
                            {agent.icon}
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{agent.name}</h2>
                        <p className="text-white/80 text-sm mt-1 font-medium italic">{agent.tagline}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Core Capabilities</p>
                        <ul className="space-y-3">
                            {agent.capabilities.map(c => (
                                <li key={c} className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400 font-bold italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Intelligence Protocol</p>
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 font-mono text-xs text-neutral-500 border border-neutral-200 dark:border-neutral-700 italic">
                            withskills/_agents/workflows/{agent.workflow}.md
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Operational Logic</p>
                        <div className="space-y-4">
                            {['Fetch live data from treasury nodes', 'Analyze via capital allocation rules', 'Generate prioritized fiscal recommendations', 'Execute movements on your approval'].map((step, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-400 shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">{i + 1}</div>
                                    <p className="text-sm text-neutral-500 font-bold italic leading-relaxed">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                    {agent.tab && (
                        <button
                            onClick={() => { onNavigate(agent.tab!); onClose(); }}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl`}
                        >
                            <Zap className="w-4 h-4 fill-current" />
                            Launch Intelligence Unit
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                    >
                        Close Command
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Main Dashboard
 ───────────────────────────────────────────── */
const FinanceAgentDashboard: React.FC = () => {
    const dispatch = useDispatch();
    const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => { setRefreshing(false); setLastRefreshed(new Date()); }, 1200);
    };

    const navigateTo = (tab: AppView) => dispatch(setActiveTab(tab));

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Finance Agent Command"
                    description={`Autonomous treasury surveillance active. Last pulse: ${lastRefreshed.toLocaleTimeString()}`}
                    breadcrumbs={[{ label: 'Home', link: '/dashboard' }, { label: 'Finance' }, { label: 'Agents' }]}
                    actions={
                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                                <Search className="w-4 h-4" /> Global Audit
                            </button>
                            <button
                                onClick={handleRefresh}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Sync Nodes
                            </button>
                        </div>
                    }
                />

                {/* KPI Pulse Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    {KPIS.map((kpi, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-800 p-5 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
                            <div className={`${kpi.color} mb-3 opacity-80`}>{kpi.icon}</div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <p className="text-xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums leading-none">{kpi.value}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                                {kpi.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
                                {kpi.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                                <span className={`text-[10px] font-black uppercase tracking-tight ${kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-rose-500' : 'text-neutral-500'}`}>
                                    {kpi.delta}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main Intel Grids ──── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart & Flow Analysis */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Temporal Cash Flow — 12M Audit</p>
                                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter mt-1 italic">
                                    ₹45,750 <span className="text-sm font-bold text-emerald-500 ml-2">▲ Net Surplus</span>
                                </h3>
                            </div>
                            <BarChart3 className="w-6 h-6 text-neutral-300 dark:text-neutral-700" />
                        </div>
                        
                        <div className="flex items-end gap-2 h-32 mb-6">
                            {mockCashFlow.map((v, i) => {
                                const exp = mockExpenses[i];
                                const barH = (v / 100) * 100;
                                const expH = (exp / 100) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group" title={`Inflow: ₹${v}k / Outflow: ₹${exp}k`}>
                                        <div className="w-full relative flex flex-col-reverse bg-neutral-100 dark:bg-neutral-900/50 rounded-t-lg overflow-hidden" style={{ height: 100 }}>
                                            <div className="w-full bg-primary/20 group-hover:bg-primary/40 transition-all duration-500" style={{ height: `${barH}%` }} />
                                            <div className="absolute bottom-0 w-full bg-rose-500/20 group-hover:bg-rose-500/40 transition-all duration-500" style={{ height: `${expH}%` }} />
                                        </div>
                                        <span className="text-[9px] font-black text-neutral-400">
                                            {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="flex gap-6 pt-4 border-t border-neutral-50 dark:border-neutral-700/50">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                                <div className="w-2.5 h-2.5 rounded-sm bg-primary/40" /> Liquidity Inflow
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                                <div className="w-2.5 h-2.5 rounded-sm bg-rose-500/40" /> Operational Burn
                            </div>
                        </div>
                    </div>

                    {/* Live Anomaly Feed */}
                    <div className="bg-neutral-950 text-white p-8 rounded-[3rem] border border-neutral-800 shadow-2xl flex flex-col relative overflow-hidden group">
                        <Zap className="absolute -top-10 -right-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 transition duration-1000" />
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <Activity className="w-4 h-4 animate-pulse" /> Live Anomaly Stream
                                </p>
                                <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                                    {ALERTS.filter(a => a.type !== 'ok').length} CRITICAL
                                </span>
                            </div>
                            
                            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {ALERTS.map(alert => (
                                    <div key={alert.id} className="flex gap-4 group/item">
                                        <div className="mt-1">
                                            <AlertIcon type={alert.type} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-white leading-tight group-hover/item:text-primary transition-colors cursor-default">{alert.title}</p>
                                            <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed italic">{alert.body}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Clock className="w-3 h-3 text-neutral-600" />
                                                <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{alert.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Active Agents Grid ──── */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Deployed Intelligence Units</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                        {AGENTS.map((agent) => (
                            <button
                                key={agent.id}
                                onClick={() => setActiveAgent(agent)}
                                className="group relative bg-white dark:bg-neutral-800 p-6 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 text-left overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl active:scale-95"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-all duration-500`} />
                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-white mb-4 shadow-lg ${agent.glowColor} group-hover:scale-110 transition-transform`}>
                                        {agent.icon}
                                    </div>
                                    <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{agent.name}</p>
                                    <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed italic font-medium">{agent.tagline}</p>
                                    <div className={`flex items-center gap-1.5 mt-5 ${agent.accentColor} text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all`}>
                                        Execute <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Secondary Analysis ──── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Loan Health Dashboard */}
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Capital Liability Surveillance
                            </p>
                            <Layers className="w-5 h-5 text-neutral-200 dark:text-neutral-700" />
                        </div>
                        <div className="space-y-8">
                            {LOANS.map((loan, i) => {
                                const paidPct = ((loan.principal - loan.pending) / loan.principal) * 100;
                                return (
                                    <div key={i} className="group">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{loan.name}</p>
                                            <HealthBadge health={loan.health} />
                                        </div>
                                        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${loan.health === 'good' ? 'bg-emerald-500' : loan.health === 'risk' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                style={{ width: `${paidPct}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase">{paidPct.toFixed(1)}% REPAID</span>
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest tabular-nums italic">PENDING: ₹{fmt(loan.pending)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setActiveAgent(AGENTS.find(a => a.id === 'loan-emi')!)}
                            className="mt-10 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 bg-violet-50 dark:bg-violet-900/10 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all border border-violet-100 dark:border-violet-800/50"
                        >
                            Review Detailed Schedules →
                        </button>
                    </div>

                    {/* Bill Approval Queue */}
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                <ReceiptText className="w-4 h-4" /> Pending Disbursement Queue
                            </p>
                            <Filter className="w-5 h-5 text-neutral-200 dark:text-neutral-700" />
                        </div>
                        <div className="space-y-4">
                            {[
                                { supplier: 'Sharma Traders', amount: '₹34,000', age: '67 days', action: 'Pay Now', actionColor: 'text-rose-600 bg-rose-50' },
                                { supplier: 'Patel Wholesale', amount: '₹18,500', age: '45 days', action: 'Pay Now', actionColor: 'text-amber-600 bg-amber-50' },
                                { supplier: 'Raj Distributors', amount: '₹52,000', age: '28 days', action: 'Schedule', actionColor: 'text-sky-600 bg-sky-50' },
                                { supplier: 'Metro Supplies', amount: '₹9,800', age: '15 days', action: 'Defer', actionColor: 'text-neutral-500 bg-neutral-100' },
                            ].map((bill, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-neutral-50 dark:border-neutral-700/50 last:border-0 group">
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{bill.supplier}</p>
                                        <p className="text-[10px] text-neutral-400 font-bold mt-0.5">{bill.amount} · <span className="text-neutral-500">{bill.age} overdue</span></p>
                                    </div>
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shrink-0 ml-2 ${bill.actionColor} dark:bg-neutral-900 dark:text-neutral-400`}>
                                        {bill.action}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigateTo('PURCHASE_BILLS')}
                            className="mt-10 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 hover:bg-primary/10 transition-all border border-primary/10"
                        >
                            Launch Payments Gateway →
                        </button>
                    </div>
                </div>

                {/* Intelligence Advisory */}
                <div className="bg-neutral-900 dark:bg-neutral-100 p-8 rounded-[3rem] shadow-2xl flex items-center gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white dark:text-neutral-900 uppercase tracking-widest">Autonomous Intelligence Unit Active</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold mt-1 italic leading-relaxed">
                            Command Engine: <span className="text-primary underline underline-offset-4">antigravity-v2</span> · 
                            Protocols: cash-flow, loan-emi, bank-reconcile, disbursement-approval
                        </p>
                    </div>
                    <Info className="w-5 h-5 text-neutral-600 hidden md:block" />
                </div>
            </div>

            {/* Agent Detail Drawer */}
            {activeAgent && (
                <AgentDrawer
                    agent={activeAgent}
                    onClose={() => setActiveAgent(null)}
                    onNavigate={navigateTo}
                />
            )}
        </Layout>
    );
};

export default FinanceAgentDashboard;
