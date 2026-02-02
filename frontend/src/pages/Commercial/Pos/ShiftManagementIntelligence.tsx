import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../../redux/store";
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
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                        <Clock className="w-6 h-6 text-primary" />
                        Shift Management Intelligence
                    </h2>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        Cash accountability and cashier auditing for <span className="font-bold text-primary">{tenant_id}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95">
                        <Download className="w-4 h-4" /> Shift Summary Export
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95">
                        <Activity className="w-4 h-4" /> Real-time Audit
                    </button>
                </div>
            </div>

            {/* Wings KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Briefcase className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Active Shifts</p>
                    <h3 className="text-2xl font-black tabular-nums">{summary.active_shifts} <span className="text-xs text-neutral-400 font-bold uppercase tracking-tight not-italic">Terminals</span></h3>
                    <div className="flex items-center gap-1.5 mt-2 text-success">
                        <div className="w-2 h-2 rounded-full bg-success animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest">In-Store Now</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Cash On Hand (Unclosed)</p>
                    <h3 className="text-2xl font-black tabular-nums">₹{(summary.total_float / 1000).toFixed(1)}K</h3>
                    <p className="text-[10px] text-neutral-500 mt-2 font-bold italic underline decoration-neutral-200 uppercase tracking-tighter">Requires Safe Drop</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 w-1 ${summary.critical_shortage > 0 ? 'bg-error' : 'bg-success'}`} />
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Critical Shortages</p>
                    <h3 className={`text-2xl font-black ${summary.critical_shortage > 0 ? 'text-error animate-pulse' : 'text-success'}`}>
                        {summary.critical_shortage} <span className="text-xs text-neutral-400 font-black uppercase tracking-tight not-italic">Alerts</span>
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <ShieldAlert className={`w-3.5 h-3.5 ${summary.critical_shortage > 0 ? 'text-error' : 'text-neutral-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Accountability Check</span>
                    </div>
                </div>

                <div className="bg-neutral-900 text-white p-6 rounded-3xl shadow-xl shadow-neutral-900/20 relative group overflow-hidden border border-neutral-800">
                    <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                    <p className="text-[10px] font-black text-primary-light uppercase tracking-widest mb-1 italic">Agent Strategy</p>
                    <h3 className="text-xs font-black italic leading-tight">"Audit Madras Terminal-01—Closing late for 3 days with minor shortages."</h3>
                    <p className="text-[9px] text-white/50 mt-2 font-black uppercase tracking-widest">Behavioral Sync Active</p>
                </div>
            </div>

            {/* Audit Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Shift Ledger */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search Shift ID, Cashier or Branch..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['ALL', 'OPEN', 'CLOSED'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${statusFilter === status
                                        ? 'bg-primary text-white ring-4 ring-primary/10'
                                        : 'bg-white dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredShifts.map(shift => (
                            <div key={shift.shift_id} className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2.5rem] p-8 shadow-sm group hover:border-primary/40 transition-all ${shift.status === 'OPEN' ? 'border-l-4 border-l-primary' : ''
                                }`}>
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${shift.difference < 0 ? 'bg-error/10 text-error' :
                                                    shift.status === 'OPEN' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                                                    }`}>
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl tracking-tight leading-none">{shift.shift_id}</h4>
                                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{shift.pos_terminal} • {shift.branch}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${shift.status === 'OPEN' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-neutral-100 text-neutral-500'
                                                    }`}>
                                                    Shift {shift.status}
                                                </span>
                                                {shift.difference !== 0 && (
                                                    <span className={`text-[10px] font-black italic ${shift.difference < 0 ? 'text-error' : 'text-success'}`}>
                                                        {shift.difference < 0 ? 'Shortage' : 'Excess'}: ₹{Math.abs(shift.difference)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Cashier Identity</p>
                                                <p className="text-xs font-black flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" /> {shift.cashier}</p>
                                            </div>
                                            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Expected Cash</p>
                                                <p className="text-xs font-black tabular-nums italic">₹{shift.expected_cash.toLocaleString()}</p>
                                            </div>
                                            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Voids / Discounts</p>
                                                <p className="text-xs font-black flex items-center gap-2">
                                                    <span className={shift.void_count > 10 ? 'text-error' : ''}>{shift.void_count} Voids</span>
                                                    <span className="text-neutral-300">•</span>
                                                    <span>₹{shift.discount_total}</span>
                                                </p>
                                            </div>
                                            <div className={`p-4 rounded-2xl border ${shift.difference < 0 ? 'bg-error/5 border-error/10' : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-100'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${shift.difference < 0 ? 'text-error' : 'text-neutral-400'}`}>Declared Cash</p>
                                                <p className={`text-sm font-black italic tabular-nums ${shift.difference < 0 ? 'text-error' : ''}`}>
                                                    {shift.status === 'OPEN' ? '--' : `₹${shift.declared_cash.toLocaleString()}`}
                                                </p>
                                            </div>
                                        </div>

                                        {shift.recommended_action && (
                                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-2xl flex items-start gap-3 group/advice">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-tight mb-1">Audit Recommendation</p>
                                                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold italic leading-tight">
                                                        "{shift.recommended_action}"
                                                    </p>
                                                </div>
                                                <button className="px-4 py-1.5 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-amber-600/20 active:scale-95">
                                                    Start Investigation
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-neutral-50 dark:border-neutral-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-6">
                                        <button className="text-[10px] font-black text-neutral-400 hover:text-primary uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                            <ArrowDownToLine className="w-3.5 h-3.5" /> Cash Drops View
                                        </button>
                                        <button className="text-[10px] font-black text-neutral-400 hover:text-primary uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                            <ArrowUpFromLine className="w-3.5 h-3.5" /> Petty Expenses
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="px-3 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                                            Reprint Z-Report
                                        </button>
                                        <button className="p-2 text-neutral-400 hover:bg-neutral-50 rounded-lg transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Rail: Accountability Stream */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Cashier Performance Radar</h4>

                    {/* Performance Trends */}
                    <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">Enterprize Hygiene Pulse</p>
                        <div className="space-y-6">
                            {[
                                { label: 'Cash Parity', score: 91, trend: 'up' },
                                { label: 'Closing Speed', score: 84, trend: 'down' },
                                { label: 'Void Discipline', score: 96, trend: 'up' },
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                                        <span className="text-neutral-500">{stat.label}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span>{stat.score}%</span>
                                            {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-error" />}
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${stat.score > 90 ? 'bg-success' : stat.score > 80 ? 'bg-primary' : 'bg-amber-500'}`}
                                            style={{ width: `${stat.score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fraud Prevention Feed */}
                    <div className="bg-neutral-900 text-white p-8 rounded-[3rem] border border-neutral-800 relative overflow-hidden group shadow-2xl">
                        <ShieldAlert className="absolute -bottom-10 -right-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 transition-transform duration-[1.5s]" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                                <Target className="w-4 h-4 fill-current" /> High Risk Behavioral Lock
                            </div>

                            <h4 className="text-2xl font-black mb-4 leading-tight tracking-tight">
                                Protect the <br /><span className="text-primary italic underline decoration-primary/30 underline-offset-4">Drawer.</span>
                            </h4>

                            <div className="space-y-4 mb-8">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-primary-light uppercase tracking-widest">Excessive Adjustments</span>
                                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                    </div>
                                    <p className="text-[11px] font-medium text-neutral-400 group-hover:text-white transition-colors leading-relaxed">
                                        Shift-335 (Vijay S.) has recorded 8 manual voids in 2 hours. This is <span className="text-white font-black italic">300% above </span> branch average.
                                    </p>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                Flag For Audit <RefreshCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Operational Guard Tip */}
                    <div className="p-6 bg-neutral-100 dark:bg-neutral-900/50 rounded-[2rem] border border-neutral-200 dark:border-neutral-800/50 flex gap-4">
                        <div className="p-2.5 bg-white dark:bg-neutral-800 text-neutral-400 rounded-2xl shrink-0 h-fit border border-neutral-100 dark:border-neutral-700 shadow-sm">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed font-black uppercase tracking-tight italic">
                            Wings Shift Intelligence automatically correlates petty cash out and cash drops to ensure that your "Expected Cash" is a <span className="text-neutral-900 border-b border-neutral-200">Hard Audit Truth.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftManagementIntelligence;
