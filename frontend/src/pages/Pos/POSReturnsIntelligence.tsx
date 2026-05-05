import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import {
    RotateCcw,
    Search,
    Download,
    Zap,
    ShieldAlert,
    Clock,
    RefreshCcw,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Package,
} from 'lucide-react';

import Layout from '../../components/shared/Layout';
import MetricCard from '../../components/shared/UI/MetricCard';

// --- Types ---

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ReturnReason =
    | 'DAMAGED_ITEM'
    | 'WRONG_ITEM'
    | 'CUSTOMER_CHANGED_MIND'
    | 'OVERCHARGE'
    | 'QUALITY_ISSUE'
    | 'CASHIER_ERROR';

interface POSReturn {
    id: string;
    original_bill: string;
    date: string;
    branch: string;
    terminal: string;
    cashier: string;
    customer?: string;
    amount: number;
    refund_method: 'CASH' | 'ONLINE' | 'CREDIT_NOTE';
    reason: ReturnReason;
    risk_level: RiskLevel;
    approved_by?: string;
    flags: string[];
}

// --- Helpers ---

const RISK_COLORS: Record<RiskLevel, string> = {
    CRITICAL: 'bg-error text-white shadow-lg shadow-error/20',
    HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    MEDIUM: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    LOW: 'bg-success/10 text-success',
};

const REASON_LABELS: Record<ReturnReason, string> = {
    DAMAGED_ITEM: 'Damaged Item',
    WRONG_ITEM: 'Wrong Item Billed',
    CUSTOMER_CHANGED_MIND: 'Customer Changed Mind',
    OVERCHARGE: 'Overcharge',
    QUALITY_ISSUE: 'Quality Issue',
    CASHIER_ERROR: 'Cashier Error',
};

// --- Component ---

const POSReturnsIntelligence: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'LEDGER' | 'TRENDS'>('LEDGER');
    const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');

    // --- Intelligence Engine (static audit data) ---

    const returns: POSReturn[] = useMemo(() => [
        {
            id: 'RET-1041',
            original_bill: 'POS-8821',
            date: '2026-01-11 09:22',
            branch: 'Chennai Main',
            terminal: 'TERM-02',
            cashier: 'Arun M.',
            customer: 'Rajesh Kumar',
            amount: 1850,
            refund_method: 'CASH',
            reason: 'CASHIER_ERROR',
            risk_level: 'CRITICAL',
            flags: ['NO_MANAGER_APPROVAL', 'CASH_REFUND_ABOVE_₹1000'],
        },
        {
            id: 'RET-1042',
            original_bill: 'POS-8774',
            date: '2026-01-11 10:45',
            branch: 'Coimbatore Store',
            terminal: 'TERM-01',
            cashier: 'Suresh K.',
            amount: 320,
            refund_method: 'CREDIT_NOTE',
            reason: 'DAMAGED_ITEM',
            risk_level: 'LOW',
            approved_by: 'Manager Ravi',
            flags: [],
        },
        {
            id: 'RET-1043',
            original_bill: 'POS-8799',
            date: '2026-01-11 11:10',
            branch: 'Chennai Main',
            terminal: 'TERM-04',
            cashier: 'Priya R.',
            customer: 'Anitha S.',
            amount: 4200,
            refund_method: 'ONLINE',
            reason: 'OVERCHARGE',
            risk_level: 'HIGH',
            flags: ['HIGH_VALUE_REFUND', 'REPEAT_CUSTOMER_RETURN'],
        },
        {
            id: 'RET-1044',
            original_bill: 'POS-8803',
            date: '2026-01-11 13:30',
            branch: 'Madurai Godown',
            terminal: 'TERM-01',
            cashier: 'Vijay S.',
            amount: 780,
            refund_method: 'CASH',
            reason: 'WRONG_ITEM',
            risk_level: 'MEDIUM',
            flags: ['MISSING_RECEIPT_SCAN'],
        },
        {
            id: 'RET-1045',
            original_bill: 'POS-8755',
            date: '2026-01-11 14:52',
            branch: 'Chennai Main',
            terminal: 'TERM-02',
            cashier: 'Arun M.',
            amount: 6500,
            refund_method: 'CASH',
            reason: 'CUSTOMER_CHANGED_MIND',
            risk_level: 'CRITICAL',
            flags: ['CASH_REFUND_ABOVE_₹1000', 'NO_MANAGER_APPROVAL', 'SAME_CASHIER_3_RETURNS_TODAY'],
        },
        {
            id: 'RET-1046',
            original_bill: 'POS-8812',
            date: '2026-01-11 16:05',
            branch: 'Coimbatore Store',
            terminal: 'TERM-01',
            cashier: 'Suresh K.',
            amount: 195,
            refund_method: 'CREDIT_NOTE',
            reason: 'QUALITY_ISSUE',
            risk_level: 'LOW',
            approved_by: 'Manager Ravi',
            flags: [],
        },
    ], []);

    const summary = useMemo(() => {
        const total_refunded = returns.reduce((acc, r) => acc + r.amount, 0);
        const critical_count = returns.filter(r => r.risk_level === 'CRITICAL').length;
        const cash_refunds = returns.filter(r => r.refund_method === 'CASH').reduce((acc, r) => acc + r.amount, 0);
        const return_rate = ((returns.length / 148) * 100).toFixed(1); // 148 = simulated total orders
        return { total_refunded, critical_count, cash_refunds, return_rate };
    }, [returns]);

    const filteredReturns = useMemo(() => returns.filter(r => {
        const matchesSearch =
            r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.original_bill.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'ALL' || r.risk_level === riskFilter;
        return matchesSearch && matchesRisk;
    }), [returns, searchTerm, riskFilter]);

    const reasonBreakdown = useMemo(() => {
        const map: Partial<Record<ReturnReason, number>> = {};
        returns.forEach(r => { map[r.reason] = (map[r.reason] || 0) + 1; });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .map(([reason, count]) => ({ reason: reason as ReturnReason, count, pct: Math.round((count / returns.length) * 100) }));
    }, [returns]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-rose-500/20">
                                Refund Auditor
                            </span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                Return Intelligence
                            </span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight leading-none flex items-center gap-3">
                            POS Returns <RotateCcw className="w-8 h-8 text-rose-500 animate-pulse" />
                        </h2>
                        <p className="text-sm text-neutral-500 mt-2 font-medium italic">
                            Refund risk profiling and return integrity for{' '}
                            <span className="text-rose-500 font-bold not-italic">{tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-neutral-50 transition-all active:scale-95">
                            <Download className="w-4 h-4 text-rose-500" /> Export Refund Log
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95">
                            <RefreshCcw className="w-4 h-4" /> Refresh Engine
                        </button>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Refunded"
                        value={`₹${(summary.total_refunded / 1000).toFixed(1)}K`}
                        subtext="All return methods"
                        icon={RotateCcw}
                        color="rose"
                        trend="down"
                    />
                    <MetricCard
                        title="Cash Refunds"
                        value={`₹${(summary.cash_refunds / 1000).toFixed(1)}K`}
                        subtext="High-risk exposure"
                        icon={AlertCircle}
                        color="amber"
                        trend="down"
                    />
                    <MetricCard
                        title="Critical Flags"
                        value={summary.critical_count}
                        subtext="Unapproved high-value refunds"
                        icon={ShieldAlert}
                        color="rose"
                        trend="down"
                    />
                    <div className="bg-neutral-950 text-white p-6 rounded-[2rem] shadow-xl shadow-neutral-900/20 relative group overflow-hidden border border-neutral-800 flex flex-col justify-between">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700 w-24 h-24" />
                        <div>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 italic">Agent Strategy</p>
                            <h3 className="text-xs font-bold leading-relaxed opacity-90">
                                "Block cash refunds &gt;₹1K without manager OTP at Chennai Main."
                            </h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-[9px] text-white/50 font-black uppercase tracking-widest">Prevention Engine Active</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-0.5 mt-10 gap-10">
                    {(['LEDGER', 'TRENDS'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setViewMode(tab)}
                            className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${viewMode === tab ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-600'}`}
                        >
                            {tab === 'LEDGER' ? 'Return Ledger' : 'Reason Analysis'}
                            {viewMode === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 rounded-t-full" />}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Pane */}
                    <div className="lg:col-span-2 space-y-4">

                        {viewMode === 'LEDGER' && (
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-rose-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search Return ID, Cashier, Branch or Bill..."
                                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex bg-white dark:bg-neutral-800 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setRiskFilter(r)}
                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all ${riskFilter === r ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Return Table */}
                                <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs tabular-nums">
                                        <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-[0.15em]">
                                            <tr>
                                                <th className="p-5">Return / Bill</th>
                                                <th className="p-5">Refund</th>
                                                <th className="p-5">Risk</th>
                                                <th className="p-5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {filteredReturns.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-10 text-center text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                                                        No returns found for the current filters
                                                    </td>
                                                </tr>
                                            ) : filteredReturns.map(ret => (
                                                <tr key={ret.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2 rounded-xl ${ret.risk_level === 'LOW' ? 'bg-success/10 text-success' : ret.risk_level === 'CRITICAL' ? 'bg-error/10 text-error' : 'bg-amber-100 text-amber-600'}`}>
                                                                <RotateCcw className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-sm text-neutral-900 dark:text-white">{ret.id}</div>
                                                                <div className="text-[10px] text-neutral-400 mt-0.5 font-bold uppercase tracking-tight">
                                                                    Bill {ret.original_bill} • {ret.branch} • {ret.cashier}
                                                                </div>
                                                                <div className="text-[9px] text-neutral-400 mt-0.5 font-bold italic">{ret.date}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="font-black text-sm italic">₹{ret.amount.toLocaleString()}</div>
                                                        <div className="text-[10px] text-neutral-400 mt-0.5 font-bold uppercase">
                                                            {ret.refund_method.replace('_', ' ')}
                                                        </div>
                                                        <div className="text-[9px] text-neutral-500 mt-0.5 font-bold">
                                                            {REASON_LABELS[ret.reason]}
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${RISK_COLORS[ret.risk_level]}`}>
                                                            {ret.risk_level}
                                                        </span>
                                                        {ret.flags.length > 0 && (
                                                            <div className="mt-1.5 space-y-0.5">
                                                                {ret.flags.slice(0, 2).map((f, i) => (
                                                                    <p key={i} className="text-[9px] text-error font-black italic truncate max-w-[160px]">
                                                                        • {f.replace(/_/g, ' ')}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <button className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                            Investigate
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {viewMode === 'TRENDS' && (
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="font-black text-lg tracking-tight">Return Reason Breakdown</h3>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">{returns.length} Returns This Period</p>
                                    </div>
                                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    {reasonBreakdown.map(({ reason, count, pct }) => (
                                        <div key={reason} className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                                <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                                                    <Package className="w-3.5 h-3.5 text-neutral-400" />
                                                    {REASON_LABELS[reason]}
                                                </span>
                                                <div className="flex items-center gap-3 tabular-nums text-neutral-500">
                                                    <span>{count} returns</span>
                                                    <span className="text-rose-500 font-black">{pct}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${pct > 40 ? 'bg-error' : pct > 25 ? 'bg-amber-500' : 'bg-rose-400'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-tight italic">
                                        "Cashier Error" and "Customer Changed Mind" refunds with no manager approval are the primary loss vectors. Enforce OTP-gated refund approval for amounts &gt;₹1,000.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Rail */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Fraud Sentinel</h4>

                        {/* Policy Compliance */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">Policy Compliance</p>
                            <div className="space-y-3">
                                {[
                                    { name: 'Manager Approval Gate', status: false },
                                    { name: 'Receipt Scan Mandatory', status: true },
                                    { name: 'Credit Note First Policy', status: true },
                                    { name: 'Same-Day Return Limit', status: false },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                        <span className="text-[11px] font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-300">{item.name}</span>
                                        <div className={`flex items-center gap-1.5 ${item.status ? 'text-success' : 'text-error'}`}>
                                            {item.status
                                                ? <CheckCircle2 className="w-4 h-4" />
                                                : <AlertCircle className="w-4 h-4 animate-pulse" />}
                                            <span className="text-[9px] font-black uppercase">{item.status ? 'Active' : 'Breach'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* High-Risk Alert Stream */}
                        <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 relative overflow-hidden group">
                            <ShieldAlert className="absolute -top-6 -right-6 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                            <h4 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                                Alert Stream <div className="w-2 h-2 bg-error rounded-full animate-ping" />
                            </h4>
                            <div className="space-y-3">
                                {returns.filter(r => r.risk_level === 'CRITICAL').map(r => (
                                    <div key={r.id} className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-error/20 hover:border-error/40 shadow-sm transition-all">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-error">{r.id}</span>
                                            <Clock className="w-3 h-3 text-neutral-400" />
                                        </div>
                                        <p className="text-[11px] font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                                            ₹{r.amount.toLocaleString()} cash refund by <span className="font-black">{r.cashier}</span> — {r.flags[0]?.replace(/_/g, ' ')}
                                        </p>
                                        <button className="mt-2 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline underline-offset-4">
                                            Investigate
                                        </button>
                                    </div>
                                ))}
                                {returns.filter(r => r.risk_level === 'CRITICAL').length === 0 && (
                                    <div className="p-4 text-center">
                                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">No critical alerts</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Insight Tip */}
                        <div className="p-5 bg-rose-500/5 rounded-[1.5rem] border border-rose-500/10 flex gap-4">
                            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl shrink-0 h-fit">
                                <Zap className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-neutral-500 leading-relaxed font-black uppercase tracking-tight italic">
                                Wings Returns Intelligence detects refund fraud patterns in real time, ensuring every return is policy-compliant and loss-minimized.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default POSReturnsIntelligence;
