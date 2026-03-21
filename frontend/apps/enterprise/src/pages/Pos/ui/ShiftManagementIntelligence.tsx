import { useAuthStore } from '@repo/shared';
import React, { useState, useMemo } from 'react';
import { RootState } from "@/app/store/store";
import {
    Clock,
    Search,
    Filter,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
    History,
    FileText,
    Zap,
    Download,
    CreditCard,
    Smartphone,
    ArrowRightLeft,
    AlertTriangle,
    Info,
    Calendar,
    Wallet,
    Target,
    MoreVertical,
    RefreshCcw,
    Scale,
    TrendingUp,
    Briefcase,
    ShieldCheck,
    ChevronRight,
    UserCircle,
    ArrowDownToLine,
    ArrowUpFromLine,
    Activity,
    TrendingDown,
} from 'lucide-react';

import MetricCard from '@/shared/ui/Feedback/MetricCard';
import Layout from '@/shared/ui/Layout/Layout';
import PageShell from '@/shared/ui/Layout/PageShell';

// --- Types ---

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ShiftStatus = 'OPEN' | 'CLOSED';

interface ShiftAudit {
    shift_id: string;
    branch: string;
    cashier: string;
    pos_terminal: string;
    opening_cash: number;
    expected_cash: number;
    declared_cash: number;
    difference: number;
    status: ShiftStatus;
    risk_level: RiskLevel;
    recommended_action?: string;
    void_count: number;
    discount_total: number;
}

// --- Component ---

const ShiftManagementIntelligence: React.FC = () => {
    const {  user  } = useAuthStore();
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ShiftStatus | 'ALL'>('ALL');

    // --- Intelligence Engine ---

    const shifts: ShiftAudit[] = useMemo(() => [
        {
            shift_id: 'SHIFT-332',
            branch: 'Chennai Main',
            cashier: 'Arun M.',
            pos_terminal: 'POS-01',
            opening_cash: 5000,
            expected_cash: 128500,
            declared_cash: 126800,
            difference: -1700,
            status: 'CLOSED',
            risk_level: 'HIGH',
            recommended_action: 'Audit last 10 refunds and discount overrides',
            void_count: 12,
            discount_total: 8500
        },
        {
            shift_id: 'SHIFT-333',
            branch: 'Coimbatore Store',
            cashier: 'Suresh K.',
            pos_terminal: 'POS-02',
            opening_cash: 2000,
            expected_cash: 45600,
            declared_cash: 45600,
            difference: 0,
            status: 'CLOSED',
            risk_level: 'LOW',
            void_count: 2,
            discount_total: 1200
        },
        {
            shift_id: 'SHIFT-334',
            branch: 'Chennai Main',
            cashier: 'Priya R.',
            pos_terminal: 'POS-04',
            opening_cash: 3000,
            expected_cash: 82400,
            declared_cash: 82450,
            difference: 50,
            status: 'CLOSED',
            risk_level: 'LOW',
            void_count: 0,
            discount_total: 500
        },
        {
            shift_id: 'SHIFT-335',
            branch: 'Madurai Godown',
            cashier: 'Vijay S.',
            pos_terminal: 'POS-01',
            opening_cash: 1500,
            expected_cash: 12000,
            declared_cash: 0,
            difference: 0,
            status: 'OPEN',
            risk_level: 'MEDIUM',
            void_count: 8,
            discount_total: 4500
        }
    ], []);

    const summary = useMemo(() => {
        const active_shifts = shifts.filter(s => s.status === 'OPEN').length;
        const total_float = shifts.reduce((acc, s) => acc + (s.status === 'OPEN' ? s.expected_cash : 0), 0);
        const critical_shortage = shifts.filter(s => s.difference < -1000).length;
        const hygiene_score = 92; // Simulated
        return { active_shifts, total_float, critical_shortage, hygiene_score };
    }, [shifts]);

    const filteredShifts = shifts.filter(s => {
        const matchesSearch = s.shift_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.branch.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Operational Control</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Shift Surveillance</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Shift Intelligence <Clock className="w-8 h-8 text-blue-500 fill-blue-500/10 animate-pulse" />
                        </h2>
                        <p className="text-sm text-neutral-500 mt-2 font-medium flex items-center gap-2 italic">
                            Cash accountability and audit trails for <span className="text-blue-500 font-bold">{tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 erp-card rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-[var(--erp-bg-sunken)] transition-all active:scale-95 border-none">
                            <Download className="w-4 h-4 text-blue-500" /> Export Shift Log
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:opacity-90 transition-all active:scale-95">
                            <Activity className="w-4 h-4" /> Live Audit
                        </button>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Active Terminals"
                        value={summary.active_shifts}
                        subtext="Currently Online"
                        icon={Briefcase}
                        color="emerald"
                        trend="up"
                    />
                    <MetricCard
                        title="Cash Float"
                        value={`₹${(summary.total_float / 1000).toFixed(1)}K`}
                        subtext="Unsecured Cash"
                        icon={Wallet}
                        color="amber"
                        trend="neutral"
                    />
                    <MetricCard
                        title="Critical Alerts"
                        value={summary.critical_shortage}
                        subtext="Shortages Detected"
                        icon={ShieldAlert}
                        color="rose"
                        trend={summary.critical_shortage > 0 ? "down" : "neutral"}
                    />
                    <div className="bg-neutral-900 text-main p-8 rounded-[2.5rem] shadow-xl shadow-neutral-900/20 relative group overflow-hidden border border-neutral-800 flex flex-col justify-between">
                        <Zap className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700 w-24 h-24 text-blue-400" />
                        <div>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-[0.2em] rounded-md mb-4 inline-block italic">Agent Strategy</span>
                            <h3 className="text-sm font-black leading-relaxed mt-2 italic shadow-sm opacity-90">"Audit Madras Terminal-01—Closing late for 3 days with minor shortages."</h3>
                        </div>
                        <div className="mt-6 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Behavioral Sync Active</p>
                        </div>
                    </div>
                </div>

                {/* Audit Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Shift Ledger */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search Shift ID, Cashier or Branch..."
                                    className="w-full pl-12 pr-6 py-4 erp-card border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner bg-white dark:bg-neutral-900 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex bg-[var(--erp-bg-sunken)] dark:bg-neutral-800 p-1.5 rounded-2xl border border-default dark:border-neutral-700">
                                {(['ALL', 'OPEN', 'CLOSED'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${statusFilter === status
                                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-main shadow-md border border-default dark:border-neutral-700'
                                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {filteredShifts.map(shift => (
                                <div key={shift.shift_id} className={`erp-card rounded-[2.5rem] p-8 shadow-sm group hover:border-blue-500/30 transition-all border-none ${shift.status === 'OPEN' ? 'ring-1 ring-blue-500/20 bg-blue-500/[0.02]' : ''
                                    }`}>
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                        <div className="flex-1 space-y-8 w-full">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 ${shift.difference < 0 ? 'bg-rose-500/10 text-rose-600' :
                                                        shift.status === 'OPEN' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'
                                                        }`}>
                                                        <Clock className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-xl text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">{shift.shift_id}</h4>
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{shift.pos_terminal} • {shift.branch}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border ${shift.status === 'OPEN'
                                                        ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                                        : 'bg-[var(--erp-bg-sunken)] border-default text-neutral-500 dark:bg-neutral-800 dark:border-neutral-700'
                                                        }`}>
                                                        {shift.status}
                                                    </span>
                                                    {shift.difference !== 0 && (
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${shift.difference < 0 ? 'text-rose-500 bg-rose-500/5' : 'text-emerald-500 bg-emerald-500/5'}`}>
                                                            {shift.difference < 0 ? '📉 Shortage' : '📈 Excess'}: ₹{Math.abs(shift.difference).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl border border-default dark:border-neutral-800 transition-colors group-hover:bg-white dark:group-hover:bg-neutral-900">
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Cashier</p>
                                                    <p className="text-sm font-black text-neutral-700 dark:text-neutral-300 flex items-center gap-2"><UserCircle className="w-4 h-4 text-blue-500/70" /> {shift.cashier}</p>
                                                </div>
                                                <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl border border-default dark:border-neutral-800 transition-colors group-hover:bg-white dark:group-hover:bg-neutral-900">
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Expected</p>
                                                    <p className="text-sm font-black text-neutral-700 dark:text-neutral-300 tabular-nums italic">₹{shift.expected_cash.toLocaleString()}</p>
                                                </div>
                                                <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl border border-default dark:border-neutral-800 transition-colors group-hover:bg-white dark:group-hover:bg-neutral-900">
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Voids / Disc</p>
                                                    <p className="text-sm font-black text-neutral-700 dark:text-neutral-300 flex items-center gap-2 tabular-nums">
                                                        <span className={shift.void_count > 10 ? 'text-rose-500' : ''}>{shift.void_count}</span>
                                                        <span className="text-neutral-200 dark:text-neutral-800">/</span>
                                                        <span className="text-primary-light">₹{shift.discount_total.toLocaleString()}</span>
                                                    </p>
                                                </div>
                                                <div className={`p-4 rounded-2xl border transition-all ${shift.difference < 0 ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20' : 'bg-neutral-900 dark:bg-neutral-950 border-neutral-800 group-hover:shadow-lg'}`}>
                                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${shift.difference < 0 ? 'text-rose-500' : 'text-neutral-500'}`}>Declared</p>
                                                    <p className={`text-base font-black tabular-nums italic ${shift.difference < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-white'}`}>
                                                        {shift.status === 'OPEN' ? '--' : `₹${shift.declared_cash.toLocaleString()}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {shift.recommended_action && (
                                                <div className="p-5 bg-amber-500/[0.03] dark:bg-amber-500/[0.02] border border-amber-500/10 rounded-[1.5rem] flex items-start gap-4 group/advice group-hover:bg-amber-500/[0.06] transition-all">
                                                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                                        <AlertTriangle className="w-5 h-5 animate-bounce-slow" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1.5">Audit Intervention Strategy</p>
                                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed italic">
                                                            "{shift.recommended_action}"
                                                        </p>
                                                    </div>
                                                    <button className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all">
                                                        Start Detailed Audit
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Rail: Accountability Stream */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Cashier Pulse</h4>
                            <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline decoration-blue-500/30 underline-offset-4">View Full Analytics</button>
                        </div>

                        {/* Performance Trends */}
                        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-8">Hygiene Scorecards</p>
                            <div className="space-y-8">
                                {[
                                    { label: 'Cash Accuracy', score: 98, trend: 'up' },
                                    { label: 'Closing Speed', score: 84, trend: 'down' },
                                    { label: 'Void Discipline', score: 92, trend: 'up' },
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                                            <span className="text-neutral-500">{stat.label}</span>
                                            <div className="flex items-center gap-2 tabular-nums">
                                                <span className="text-neutral-900 dark:text-neutral-200">{stat.score}%</span>
                                                {stat.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                                            </div>
                                        </div>
                                        <div className="w-full h-2 bg-[var(--erp-bg-sunken)] dark:bg-neutral-900 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${stat.score > 90 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : stat.score > 85 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'}`}
                                                style={{ width: `${stat.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Operational Guard Tip */}
                        <div className="p-8 bg-blue-500/[0.02] dark:bg-blue-500/[0.012] rounded-[2.5rem] border border-blue-500/10 flex gap-5 group hover:bg-blue-500/[0.04] transition-all">
                            <div className="p-3 bg-white dark:bg-neutral-900 text-neutral-400 rounded-2xl shrink-0 h-fit border border-default dark:border-neutral-800 shadow-sm group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6 text-blue-500/70" />
                            </div>
                            <p className="text-[11px] text-neutral-500 leading-relaxed font-bold uppercase tracking-wide italic">
                                <span className="text-neutral-900 dark:text-neutral-200">Guard Strategy:</span> Correlate petty cash drops with "Expected Cash" to enforce a <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-4 font-black">Hard Audit Truth.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </PageShell>
        </Layout>
    );
};

export default ShiftManagementIntelligence;
