import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from "@/app/providers/NavigationContext";
import { AppView } from "@repo/shared";
import {
    TrendingUp, TrendingDown, Zap, RefreshCw, AlertTriangle,
    CheckCircle2, CreditCard, Building2, Landmark, FileText,
    ArrowUpRight, ArrowDownRight, Activity, ChevronRight,
    Clock, CircleDollarSign, BarChart3, Layers, Bot,
    CalendarClock, ShieldCheck, ReceiptText, Banknote, X,
    CircleCheck, CircleAlert, Info
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
   Sparkline (pure SVG)
───────────────────────────────────────────── */
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({
    data, color, height = 40
}) => {
    if (!data.length) return null;
    const w = 120, h = height;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
            <polyline points={pts} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts.split(' ').pop()!.split(',')[0]} cy={pts.split(' ').pop()!.split(',')[1]} r="3" fill={color} />
        </svg>
    );
};

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
        color: 'text-emerald-400',
    },
    {
        label: "Today's Cash In",
        value: '₹87,200',
        sub: 'vs ₹64,300 yesterday',
        trend: 'up',
        delta: '+35.6%',
        icon: <ArrowUpRight className="w-5 h-5" />,
        color: 'text-sky-400',
    },
    {
        label: "Today's Cash Out",
        value: '₹41,800',
        sub: 'vs ₹38,100 yesterday',
        trend: 'down',
        delta: '+9.7%',
        icon: <ArrowDownRight className="w-5 h-5" />,
        color: 'text-rose-400',
    },
    {
        label: 'Active Loans',
        value: '3',
        sub: 'EMI due in 4 days',
        trend: 'neutral',
        delta: '₹42,000 / mo',
        icon: <CreditCard className="w-5 h-5" />,
        color: 'text-violet-400',
    },
    {
        label: 'Unreconciled Items',
        value: '12',
        sub: '3 critical (>7 days)',
        trend: 'down',
        delta: 'Action needed',
        icon: <Activity className="w-5 h-5" />,
        color: 'text-orange-400',
    },
    {
        label: 'Bills Overdue',
        value: '5',
        sub: '₹1,24,000 total',
        trend: 'down',
        delta: '2 at risk of penalty',
        icon: <FileText className="w-5 h-5" />,
        color: 'text-amber-400',
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
    if (type === 'critical') return <CircleAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
    return <CircleCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
};

const HealthBadge: React.FC<{ health: LoanBar['health'] }> = ({ health }) => {
    const map = {
        good: 'bg-emerald-900/60 text-emerald-400 border-emerald-700',
        risk: 'bg-amber-900/60 text-amber-400 border-amber-700',
        critical: 'bg-rose-900/60 text-rose-400 border-rose-700',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[health]}`}>
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
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div
                className="relative h-full w-full max-w-md bg-[#0f1117] border-l border-white/10 shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)' }}
            >
                {/* Header */}
                <div className={`p-6 bg-gradient-to-br ${agent.color} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-3 backdrop-blur-sm">
                            {agent.icon}
                        </div>
                        <h2 className="text-xl font-bold text-white">{agent.name}</h2>
                        <p className="text-white/80 text-sm mt-1">{agent.tagline}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Capabilities</p>
                        <ul className="space-y-2">
                            {agent.capabilities.map(c => (
                                <li key={c} className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Workflow File</p>
                        <div className="bg-white/5 rounded-xl p-3 font-mono text-xs text-slate-400 border border-white/10">
                            withskills/_agents/workflows/{agent.workflow}.md
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">How It Works</p>
                        <div className="space-y-2">
                            {['Fetch live data from finance APIs', 'Analyze using business rules', 'Generate prioritized recommendations', 'Execute actions on your approval'].map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">{i + 1}</div>
                                    <p className="text-sm text-slate-400">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 space-y-3">
                    {agent.tab && (
                        <button
                            onClick={() => { onNavigate(agent.tab!); onClose(); }}
                            className={`w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${agent.color} hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                        >
                            <Zap className="w-4 h-4" />
                            Open in ERP Module
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl font-bold text-sm text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        Close
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
    const { navigate } = useNavigation();
    const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const [pulseIndex, setPulseIndex] = useState(0);

    // Cycle agent pulse every 4 seconds for animated effect
    useEffect(() => {
        const t = setInterval(() => setPulseIndex(p => (p + 1) % AGENTS.length), 4000);
        return () => clearInterval(t);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => { setRefreshing(false); setLastRefreshed(new Date()); }, 1200);
    };

    const navigateTo = (tab: AppView) => navigate(tab);

    return (
        <div className="min-h-screen bg-[#09090f] text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {/* Inject keyframe */}
            <style>{`
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes pulse-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.1); } 50% { box-shadow: 0 0 0 8px rgba(255,255,255,0); } }
                .agent-ring { animation: pulse-ring 2s infinite; }
                .glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); }
                .kpi-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15); }
                .agent-card:hover { transform: translateY(-3px); }
                .kpi-card, .agent-card { transition: all 0.25s ease; }
            `}</style>

            {/* ── Header ─────────────────────────────── */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Finance Agent Command</h1>
                            <p className="text-xs text-slate-500">
                                Last refreshed {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="px-6 pb-8 space-y-6">
                {/* ── KPI Strip ──────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {KPIS.map((kpi, i) => (
                        <div key={i} className="kpi-card glass rounded-2xl p-4 cursor-default">
                            <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                            <p className="text-lg font-bold text-white mt-1 leading-none">{kpi.value}</p>
                            <div className="flex items-center gap-1 mt-1">
                                {kpi.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
                                {kpi.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-rose-400" />}
                                <span className={`text-[10px] font-semibold ${kpi.trend === 'up' ? 'text-emerald-400' : kpi.trend === 'down' ? 'text-rose-400' : 'text-slate-500'}`}>
                                    {kpi.delta}
                                </span>
                            </div>
                            <p className="text-[9px] text-slate-600 mt-0.5">{kpi.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Cash Flow Chart + Anomaly Feed ──── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Chart */}
                    <div className="lg:col-span-2 glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cash Flow — Last 12 Months</p>
                                <p className="text-2xl font-bold text-white mt-0.5">₹45,750 <span className="text-sm font-normal text-emerald-400">net this month</span></p>
                            </div>
                            <BarChart3 className="w-5 h-5 text-slate-600" />
                        </div>
                        {/* Bar chart */}
                        <div className="flex items-end gap-1.5 h-24">
                            {mockCashFlow.map((v, i) => {
                                const exp = mockExpenses[i];
                                const net = v - exp;
                                const barH = (v / 100) * 80 + 10;
                                const expH = (exp / 100) * 80 + 10;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group" title={`In: ₹${v}k / Out: ₹${exp}k`}>
                                        <div className="w-full relative flex flex-col-reverse" style={{ height: 80 }}>
                                            <div
                                                className="w-full rounded-t bg-emerald-500/40 group-hover:bg-emerald-500/70 transition-colors"
                                                style={{ height: barH }}
                                            />
                                            <div
                                                className="absolute bottom-0 w-full rounded-t bg-rose-500/30 group-hover:bg-rose-500/50 transition-colors"
                                                style={{ height: expH }}
                                            />
                                        </div>
                                        <span className="text-[8px] text-slate-600">
                                            {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-4 mt-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/50" />Cash In
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <div className="w-2.5 h-2.5 rounded-sm bg-rose-500/40" />Cash Out
                            </div>
                        </div>
                    </div>

                    {/* Anomaly Feed */}
                    <div className="glass rounded-2xl p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Anomalies</p>
                            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                                {ALERTS.filter(a => a.type !== 'ok').length} active
                            </span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 200 }}>
                            {ALERTS.map(alert => (
                                <div key={alert.id} className="flex gap-2">
                                    <AlertIcon type={alert.type} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-white leading-snug truncate">{alert.title}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{alert.body}</p>
                                        <p className="text-[9px] text-slate-600 mt-0.5 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />{alert.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Agent Cards ─────────────────────── */}
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Active Finance Agents</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                        {AGENTS.map((agent, idx) => (
                            <button
                                key={agent.id}
                                onClick={() => setActiveAgent(agent)}
                                className={`agent-card glass rounded-2xl p-5 text-left relative overflow-hidden group cursor-pointer ${idx === pulseIndex ? 'agent-ring' : ''}`}
                            >
                                {/* Gradient glow BG */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`} />
                                <div className="relative z-10">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-white mb-3 shadow-lg ${agent.glowColor}`}>
                                        {agent.icon}
                                    </div>
                                    <p className="text-sm font-bold text-white">{agent.name}</p>
                                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{agent.tagline}</p>
                                    <div className={`flex items-center gap-1 mt-3 ${agent.accentColor} text-[10px] font-semibold`}>
                                        View workflow <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Loan Health + Bill Queue ─────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Loan Health */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loan Health Monitor</p>
                            <Layers className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="space-y-5">
                            {LOANS.map((loan, i) => {
                                const paidPct = ((loan.principal - loan.pending) / loan.principal) * 100;
                                const barColor = loan.health === 'good' ? '#10b981' : loan.health === 'risk' ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-sm font-semibold text-white truncate max-w-[60%]">{loan.name}</p>
                                            <HealthBadge health={loan.health} />
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${paidPct}%`, background: barColor }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-slate-500">{paidPct.toFixed(1)}% paid</span>
                                            <span className="text-[10px] text-slate-500">₹{fmt(loan.pending)} pending · EMI ₹{fmt(loan.emi)}/mo</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setActiveAgent(AGENTS.find(a => a.id === 'loan-emi')!)}
                            className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors border border-violet-500/20"
                        >
                            Open Loan EMI Agent →
                        </button>
                    </div>

                    {/* Bill Queue */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bill Approval Queue</p>
                            <ReceiptText className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="space-y-2">
                            {[
                                { supplier: 'Sharma Traders', amount: '₹34,000', age: '67 days', action: 'Pay Now', actionColor: 'text-rose-400 bg-rose-500/10' },
                                { supplier: 'Patel Wholesale', amount: '₹18,500', age: '45 days', action: 'Pay Now', actionColor: 'text-amber-400 bg-amber-500/10' },
                                { supplier: 'Raj Distributors', amount: '₹52,000', age: '28 days', action: 'Schedule', actionColor: 'text-sky-400 bg-sky-500/10' },
                                { supplier: 'Metro Supplies', amount: '₹9,800', age: '15 days', action: 'Defer', actionColor: 'text-slate-400 bg-white/5' },
                                { supplier: 'Global Foods', amount: '₹10,200', age: '8 days', action: 'Defer', actionColor: 'text-slate-400 bg-white/5' },
                            ].map((bill, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">{bill.supplier}</p>
                                        <p className="text-[10px] text-slate-500">{bill.amount} · {bill.age} old</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${bill.actionColor}`}>
                                        {bill.action}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigateTo('PURCHASE_BILLS')}
                            className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-colors border border-orange-500/20"
                        >
                            Open Bills Module →
                        </button>
                    </div>
                </div>

                {/* ── Footer ribbon ───────────────────── */}
                <div className="glass rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-white">Finance Agent powered by Antigravity Skill Engine</p>
                        <p className="text-[10px] text-slate-500 truncate">
                            Skill: <span className="text-indigo-400">finance-agent</span> ·
                            Workflows: cash-flow, loan-emi, reconciliation, bill-approval, day-end
                        </p>
                    </div>
                    <Info className="w-4 h-4 text-slate-600 shrink-0 ml-auto" />
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
        </div>
    );
};

export default FinanceAgentDashboard;

