import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
import {
    Wallet,
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
    Target,
    MoreVertical,
    Clock,
    RefreshCcw,
    Scale,
    TrendingUp,
    Briefcase,
    ShieldCheck,
    ChevronRight,
    UserCircle,
    ArrowDownToLine,
    ArrowUpFromLine,
    LayoutDashboard,
    Banknote,
    Lock,
    Unlock,
} from 'lucide-react';

// --- Types ---

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type DrawerStatus = 'OPTIMAL' | 'SHORTAGE' | 'EXCESS' | 'RISK';

interface CashDrawer {
    id: string;
    branch: string;
    terminal: string;
    cashier: string;
    expected_cash: number;
    physical_cash?: number;
    difference: number;
    status: DrawerStatus;
    risk_level: RiskLevel;
    recommended_action?: string;
    last_drop_time: string;
    is_locked: boolean;
}

// --- Component ---

const CashDrawerIntelligence: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'GRID' | 'ANALYTICS'>('GRID');

    // --- Intelligence Engine ---

    const drawers: CashDrawer[] = useMemo(() => [
        {
            id: 'POS1-DrawerA',
            branch: 'Chennai Main',
            terminal: 'TERM-01',
            cashier: 'Arun M.',
            expected_cash: 82400,
            physical_cash: 81000,
            difference: -1400,
            status: 'SHORTAGE',
            risk_level: 'HIGH',
            recommended_action: 'Verify last 3 cash refunds and manual drops',
            last_drop_time: '2026-01-11 10:30',
            is_locked: false
        },
        {
            id: 'POS2-DrawerB',
            branch: 'Coimbatore Store',
            terminal: 'TERM-02',
            cashier: 'Suresh K.',
            expected_cash: 12500,
            physical_cash: 12500,
            difference: 0,
            status: 'OPTIMAL',
            risk_level: 'LOW',
            last_drop_time: '2026-01-11 14:15',
            is_locked: false
        },
        {
            id: 'POS4-DrawerA',
            branch: 'Chennai Main',
            terminal: 'TERM-04',
            cashier: 'Priya R.',
            expected_cash: 245000,
            difference: 0,
            status: 'EXCESS',
            risk_level: 'CRITICAL',
            recommended_action: 'Immediate Cash Drop Required (Threshold > ₹2L Exceeded)',
            last_drop_time: '2026-01-11 09:00',
            is_locked: true
        },
        {
            id: 'POS1-DrawerC',
            branch: 'Madurai Godown',
            terminal: 'TERM-01',
            cashier: 'Vijay S.',
            expected_cash: -850,
            difference: 0,
            status: 'RISK',
            risk_level: 'HIGH',
            recommended_action: 'Investigate Negative Balance (Excess Petty Cash Out?)',
            last_drop_time: '2026-01-11 16:00',
            is_locked: false
        }
    ], []);

    const summary = useMemo(() => {
        const total_in_hand = drawers.reduce((acc, d) => acc + d.expected_cash, 0);
        const critical_count = drawers.filter(d => d.risk_level === 'CRITICAL').length;
        const total_leakage = drawers.reduce((acc, d) => acc + (d.difference < 0 ? Math.abs(d.difference) : 0), 0);
        return { total_in_hand, critical_count, total_leakage };
    }, [drawers]);

    const filteredDrawers = drawers.filter(d =>
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.branch.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                        <Wallet className="w-6 h-6 text-primary" />
                        Cash Drawer Intelligence
                    </h2>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        Physical cash parity and leakage prevention for <span className="font-bold text-primary">{tenant_id}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95">
                        <Download className="w-4 h-4" /> Export Parity Log
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95">
                        <RefreshCcw className="w-4 h-4" /> Recalculate Expected
                    </button>
                </div>
            </div>

            {/* Wings KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Banknote className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Cash in Network</p>
                    <h3 className="text-2xl font-black tabular-nums">₹{(summary.total_in_hand / 1000).toFixed(1)}K</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-success">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Live Terminal Float</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Leakage (Today)</p>
                    <h3 className="text-2xl font-black text-error animate-pulse">₹{summary.total_leakage.toLocaleString()}</h3>
                    <p className="text-[10px] text-neutral-500 mt-2 font-bold italic underline decoration-neutral-200 uppercase tracking-tighter">Physical Mismatch</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 w-1 ${summary.critical_count > 0 ? 'bg-error animate-pulse' : 'bg-success'}`} />
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Security Risks</p>
                    <h3 className={`text-2xl font-black ${summary.critical_count > 0 ? 'text-error animate-pulse' : 'text-success'}`}>
                        {summary.critical_count} <span className="text-xs text-neutral-400 font-black uppercase tracking-tight not-italic">Drawers</span>
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <ShieldAlert className={`w-3.5 h-3.5 ${summary.critical_count > 0 ? 'text-error' : 'text-neutral-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Unrecorded Drops</span>
                    </div>
                </div>

                <div className="bg-neutral-900 text-white p-6 rounded-3xl shadow-xl shadow-neutral-900/20 relative group overflow-hidden border border-neutral-800">
                    <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                    <p className="text-[10px] font-black text-primary-light uppercase tracking-widest mb-1 italic">Agent Strategy</p>
                    <h3 className="text-xs font-black italic leading-tight">"Force Safe Drop for Terminal TERM-04—Balance exceeded risk threshold."</h3>
                    <p className="text-[9px] text-white/50 mt-2 font-black uppercase tracking-widest">Active Protection</p>
                </div>
            </div>

            {/* Drawer Intelligence Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Drawer Grid */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search Drawer ID, Cashier or Branch..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-2xl">
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'GRID' ? 'bg-white dark:bg-neutral-800 shadow-sm text-primary' : 'text-neutral-400'}`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('ANALYTICS')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ANALYTICS' ? 'bg-white dark:bg-neutral-800 shadow-sm text-primary' : 'text-neutral-400'}`}
                            >
                                <TrendingUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDrawers.map(drawer => (
                            <div key={drawer.id} className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2.5rem] p-8 shadow-sm group hover:border-primary/40 transition-all ${drawer.is_locked ? 'bg-neutral-50 dark:bg-neutral-900 grayscale-[0.5]' : ''
                                }`}>
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${drawer.status === 'SHORTAGE' ? 'bg-error/10 text-error' :
                                            drawer.status === 'EXCESS' ? 'bg-amber-100 text-amber-600' :
                                                drawer.status === 'RISK' ? 'bg-error/10 text-error animate-pulse' : 'bg-success/10 text-success'
                                            }`}>
                                            <Wallet className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xl tracking-tight leading-none">{drawer.id}</h4>
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{drawer.branch} • {drawer.terminal}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${drawer.risk_level === 'CRITICAL' ? 'bg-error text-white shadow-lg shadow-error/20' :
                                            drawer.risk_level === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-success/10 text-success'
                                            }`}>
                                            {drawer.status}
                                        </span>
                                        {drawer.is_locked ? <Lock className="w-4 h-4 text-neutral-400" /> : <Unlock className="w-4 h-4 text-success" />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-5 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Expected Float</p>
                                        <p className="text-xl font-black italic tabular-nums">₹{drawer.expected_cash.toLocaleString()}</p>
                                    </div>
                                    <div className={`p-5 rounded-3xl border ${drawer.difference < 0 ? 'bg-error/5 border-error/10' : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-100'}`}>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${drawer.difference < 0 ? 'text-error' : 'text-neutral-400'}`}>Physical Cash</p>
                                        <p className={`text-xl font-black italic tabular-nums ${drawer.difference < 0 ? 'text-error' : ''}`}>
                                            {drawer.physical_cash ? `₹${drawer.physical_cash.toLocaleString()}` : '--'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-black px-1 uppercase tracking-widest">
                                        <span className="flex items-center gap-2 text-neutral-400">
                                            <UserCircle className="w-3.5 h-3.5" /> Assigned: {drawer.cashier}
                                        </span>
                                        <span className="text-neutral-400">
                                            Drop: {drawer.last_drop_time.split(' ')[1]}
                                        </span>
                                    </div>
                                </div>

                                {drawer.recommended_action && (
                                    <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-700/30 rounded-2xl flex items-start gap-3 group/advice">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-tight mb-1">Audit Logic</p>
                                            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold italic leading-tight">
                                                "{drawer.recommended_action}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button className="w-full mt-6 py-4 bg-neutral-900 dark:bg-black text-white text-[11px] font-black uppercase tracking-[0.15em] hover:bg-primary transition-all rounded-2xl shadow-xl shadow-black/10 active:scale-95">
                                    Perform Safe Drop
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Rail: Strategic Hub */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Accountability Sentinel</h4>

                    {/* Leakage Detector */}
                    <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6 underline decoration-primary underline-offset-8">Live Parity Pulse</p>
                        <div className="space-y-8">
                            {[
                                { label: 'Drawer vs POS', status: 'MATCHED', color: 'text-success' },
                                { label: 'Drops vs Bank', status: 'PENDING', color: 'text-amber-600' },
                                { label: 'Petty Out vs Ledger', status: 'MISMATCH', color: 'text-error' },
                            ].map((audit, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                        <span className="text-[11px] font-black uppercase tracking-tight text-neutral-500">{audit.label}</span>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${audit.color}`}>
                                        {audit.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fraud Prevention Core */}
                    <div className="bg-neutral-900 text-white p-10 rounded-[3rem] border border-neutral-800 relative overflow-hidden group shadow-2xl">
                        <ShieldAlert className="absolute -bottom-10 -right-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 transition-transform duration-[1.5s]" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-8">
                                <Target className="w-4 h-4 fill-current" /> Prevention Engine Active
                            </div>

                            <h4 className="text-3xl font-black mb-6 leading-tight tracking-tight">
                                Protect the <br /><span className="text-primary italic underline decoration-primary/30 underline-offset-4">Physical Asset.</span>
                            </h4>

                            <div className="space-y-4 mb-10">
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-primary-light uppercase tracking-widest text-error">Lazy Drop Detected</span>
                                        <Clock className="w-4 h-4 text-neutral-500" />
                                    </div>
                                    <p className="text-[11px] font-medium text-neutral-400 group-hover:text-white transition-colors leading-relaxed">
                                        Terminal <span className="text-white font-black italic">POS-04 (Chennai)</span> has ₹2.45L cash. This exceeds segment safety limit by <span className="text-white font-black italic">₹45K</span>. Drawer auto-locked.
                                    </p>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-primary text-white rounded-3xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                Authorize Emergency Drop <Zap className="w-4 h-4 fill-current" />
                            </button>
                        </div>
                    </div>

                    {/* Strategic Advice */}
                    <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10 flex gap-4 backdrop-blur-sm">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-2xl shrink-0 h-fit">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-relaxed font-black uppercase tracking-tight italic">
                            Wings Drawer Intelligence ensures that cash isn't just a number on a screen, but a <span className="text-primary underline underline-offset-4 decoration-primary/10">Physical Audit Truth</span> that matches your bank deposits exactly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashDrawerIntelligence;
