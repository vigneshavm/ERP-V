import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
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
import { Layout } from '@/shared/ui/Layout/Layout';

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
    const { user } = useSelector((state: RootState) => state.auth);
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
            <div className="space-y-6 animate-fade-in pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Operational Control</span>
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 tracking-tight">
                            Shift Intelligence
                            <Clock className="w-5 h-5 text-blue-500 fill-blue-500/10 animate-pulse" />
                        </h2>
                        <p className="text-neutral-500 text-sm mt-1 font-medium">Cash accountability &amp; audit trails • {tenant_id}</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95 text-neutral-600 dark:text-neutral-300">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95">
                            <Activity className="w-4 h-4" /> Live Audit
                        </button>
                    </div>
                </div>

                {/* Wings KPI Row */}
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
                    <div className="bg-neutral-900 text-white p-6 rounded-[2rem] shadow-xl shadow-neutral-900/20 relative group overflow-hidden border border-neutral-800 flex flex-col justify-between">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700 w-24 h-24" />
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">Agent Strategy</p>
                            <h3 className="text-xs font-bold leading-relaxed opacity-90">"Audit Madras Terminal-01—Closing late for 3 days with minor shortages."</h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-[9px] text-white/50 font-black uppercase tracking-widest">Behavioral Sync Active</p>
                        </div>
                    </div>
                </div>

                {/* Audit Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Shift Ledger */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 mb-2">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search Shift ID, Cashier or Branch..."
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex bg-white dark:bg-neutral-800 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                {(['ALL', 'OPEN', 'CLOSED'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${statusFilter === status
                                            ? 'bg-neutral-900 text-white shadow-md'
                                            : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredShifts.map(shift => (
                                <div key={shift.shift_id} className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2rem] p-6 shadow-sm group hover:border-blue-500/30 transition-all ${shift.status === 'OPEN' ? 'border-l-4 border-l-blue-500' : ''
                                    }`}>
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${shift.difference < 0 ? 'bg-rose-500/10 text-rose-600' :
                                                        shift.status === 'OPEN' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'
                                                        }`}>
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 tracking-tight">{shift.shift_id}</h4>
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{shift.pos_terminal} • {shift.branch}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.15em] border ${shift.status === 'OPEN'
                                                        ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                                        : 'bg-neutral-50 border-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:border-neutral-700'
                                                        }`}>
                                                        {shift.status}
                                                    </span>
                                                    {shift.difference !== 0 && (
                                                        <span className={`text-[10px] font-black ${shift.difference < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                            {shift.difference < 0 ? 'Shortage' : 'Excess'}: ₹{Math.abs(shift.difference)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Cashier</p>
                                                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" /> {shift.cashier}</p>
                                                </div>
                                                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Opening</p>
                                                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">₹{shift.expected_cash.toLocaleString()}</p>
                                                </div>
                                                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Voids / Disc</p>
                                                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                                                        <span className={shift.void_count > 10 ? 'text-rose-500' : ''}>{shift.void_count}</span>
                                                        <span className="text-neutral-300">•</span>
                                                        <span>₹{shift.discount_total}</span>
                                                    </p>
                                                </div>
                                                <div className={`p-3 rounded-xl border ${shift.difference < 0 ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20' : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-100 dark:border-neutral-800'}`}>
                                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${shift.difference < 0 ? 'text-rose-500' : 'text-neutral-400'}`}>Declared</p>
                                                    <p className={`text-sm font-black tabular-nums ${shift.difference < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                                        {shift.status === 'OPEN' ? '--' : `₹${shift.declared_cash.toLocaleString()}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {shift.recommended_action && (
                                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl flex items-start gap-3 group/advice">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Audit Flag</p>
                                                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed">
                                                            "{shift.recommended_action}"
                                                        </p>
                                                    </div>
                                                    <button className="px-3 py-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-all">
                                                        Audit
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
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Cashier Pulse</h4>
                            <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All</button>
                        </div>

                        {/* Performance Trends */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Hygiene Score</p>
                            <div className="space-y-5">
                                {[
                                    { label: 'Cash Accuracy', score: 98, trend: 'up' },
                                    { label: 'Closing Speed', score: 84, trend: 'down' },
                                    { label: 'Void Discipline', score: 92, trend: 'up' },
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                            <span className="text-neutral-500">{stat.label}</span>
                                            <div className="flex items-center gap-1.5 tabular-nums">
                                                <span>{stat.score}%</span>
                                                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${stat.score > 90 ? 'bg-emerald-500' : stat.score > 85 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                style={{ width: `${stat.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Operational Guard Tip */}
                        <div className="p-6 bg-neutral-100 dark:bg-neutral-800/50 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 flex gap-4">
                            <div className="p-2.5 bg-white dark:bg-neutral-800 text-neutral-400 rounded-xl shrink-0 h-fit border border-neutral-100 dark:border-neutral-700 shadow-sm">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-neutral-500 leading-relaxed font-bold uppercase tracking-wide">
                                <span className="text-neutral-900 dark:text-neutral-200">Tip:</span> Correlate petty cash drops with "Expected Cash" to enforce a <span className="text-neutral-900 dark:text-neutral-200 underline decoration-neutral-300 underline-offset-2">Hard Audit Truth.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ShiftManagementIntelligence;
