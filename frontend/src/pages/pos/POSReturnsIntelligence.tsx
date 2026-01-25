import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import {
    RotateCcw,
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
    Clock,
    RefreshCcw,
    Scale,
    Link,
    Unlink,
    TrendingUp,
    Briefcase,
    Package,
    ShieldCheck,
    ChevronRight,
    UserCircle,
} from 'lucide-react';

// --- Types ---

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type RefundMode = 'CASH' | 'ONLINE' | 'STORE_CREDIT';

interface ReturnTransaction {
    id: string;
    original_order_id: string;
    date: string;
    branch: string;
    items: { sku: string; qty: number; price: number; batch: string }[];
    refund_amount: number;
    refund_mode: RefundMode;
    original_mode: RefundMode;
    issue?: string;
    risk_level: RiskLevel;
    processed_by: string;
}

// --- Component ---

const POSReturnsIntelligence: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');

    // --- Intelligence Engine ---

    const returns: ReturnTransaction[] = useMemo(() => [
        {
            id: 'RET-2034',
            original_order_id: 'ORD-8850',
            date: '2026-01-11 11:20',
            branch: 'Chennai Main',
            items: [{ sku: 'SHIRT-RED-XL', qty: 1, price: 1500, batch: 'B104' }],
            refund_amount: 1800,
            refund_mode: 'CASH',
            original_mode: 'ONLINE',
            issue: 'Refund higher than original sale (Delta: ₹300)',
            risk_level: 'HIGH',
            processed_by: 'Madhan K.'
        },
        {
            id: 'RET-2035',
            original_order_id: 'ORD-8892',
            date: '2026-01-11 12:45',
            branch: 'Coimbatore Store',
            items: [{ sku: 'JEAN-BLUE-32', qty: 1, price: 2200, batch: 'B99' }],
            refund_amount: 2200,
            refund_mode: 'CASH',
            original_mode: 'ONLINE',
            issue: 'Cash refund issued for Online payment',
            risk_level: 'CRITICAL',
            processed_by: 'Manikandan V.'
        },
        {
            id: 'RET-2036',
            original_order_id: 'ORD-8901',
            date: '2026-01-11 14:05',
            branch: 'Chennai Main',
            items: [{ sku: 'SOCKS-PRO-3', qty: 2, price: 400, batch: 'EXPIRED_BCH' }],
            refund_amount: 800,
            refund_mode: 'STORE_CREDIT',
            original_mode: 'CASH',
            issue: 'Expired item returned to sellable stock',
            risk_level: 'MEDIUM',
            processed_by: 'Madhan K.'
        },
        {
            id: 'RET-2037',
            original_order_id: 'ORD-8910',
            date: '2026-01-11 16:30',
            branch: 'Madurai Godown',
            items: [{ sku: 'CAP-SPORT-01', qty: 1, price: 550, batch: 'B201' }],
            refund_amount: 550,
            refund_mode: 'ONLINE',
            original_mode: 'ONLINE',
            risk_level: 'LOW',
            processed_by: 'Sales Exec'
        }
    ], []);

    const summary = useMemo(() => {
        const total_returns = 48; // Simulated
        const refund_val = 72000;
        const critical_risk = returns.filter(r => r.risk_level === 'CRITICAL').length;
        const cash_leak = returns.filter(r => r.refund_mode === 'CASH' && r.original_mode === 'ONLINE').length;
        return { total_returns, refund_val, critical_risk, cash_leak };
    }, [returns]);

    const filteredReturns = returns.filter(r => {
        const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.issue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.processed_by.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'ALL' || r.risk_level === riskFilter;
        return matchesSearch && matchesRisk;
    });

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                        <RotateCcw className="w-6 h-6 text-primary" />
                        POS Returns Intelligence
                    </h2>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        Leakage prevention and stock synchronization for <span className="font-bold text-primary">{tenant_id}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95">
                        <Download className="w-4 h-4" /> Export Audit Report
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95">
                        <ShieldCheck className="w-4 h-4" /> Run Integrity Scan
                    </button>
                </div>
            </div>

            {/* Wings KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                        <Scale className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Refund Volume</p>
                    <h3 className="text-2xl font-black tabular-nums">₹{(summary.refund_val / 1000).toFixed(1)}K <span className="text-xs text-neutral-400 font-bold uppercase tracking-tight not-italic">Today</span></h3>
                    <div className="flex items-center gap-1.5 mt-2 text-error">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-black">+12% vs avg</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Critical Anomalies</p>
                    <h3 className="text-2xl font-black text-error animate-pulse">{summary.critical_risk} <span className="text-xs text-neutral-400 font-bold uppercase tracking-tight not-italic">Alerts</span></h3>
                    <p className="text-[10px] text-neutral-500 mt-2 font-bold italic underline decoration-neutral-200">Requires Owner Approval</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Cash Leakage Risk</p>
                    <h3 className="text-2xl font-black text-amber-600 italic">High <span className="text-xs text-neutral-400 font-black uppercase tracking-tight not-italic">{summary.cash_leak} instances</span></h3>
                    <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Digital-to-Cash Swap</span>
                    </div>
                </div>

                <div className="bg-primary text-white p-6 rounded-3xl shadow-xl shadow-primary/20 relative group overflow-hidden">
                    <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700" />
                    <p className="text-[10px] font-black text-primary-light uppercase tracking-widest mb-1 italic">Agent Strategy</p>
                    <h3 className="text-xs font-black leading-tight">"Freeze Shift #12 at Coimbatore (Pattern of excessive cash refunds detected)."</h3>
                    <p className="text-[9px] text-white/60 mt-2 font-black uppercase tracking-tighter">AI Prevention Active</p>
                </div>
            </div>

            {/* Intelligence Ledger Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Audit Grid */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search Return ID or Processors..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
                                <button
                                    key={level}
                                    onClick={() => setRiskFilter(level)}
                                    className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${riskFilter === level
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-white dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredReturns.map(ret => (
                            <div key={ret.id} className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2.5rem] p-8 shadow-sm group hover:border-primary/40 transition-all ${ret.risk_level === 'CRITICAL' ? 'border-l-4 border-l-error' :
                                ret.risk_level === 'HIGH' ? 'border-l-4 border-l-amber-500' : 'opacity-80 grayscale-[0.3]'
                                }`}>
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-2xl ${ret.risk_level === 'CRITICAL' ? 'bg-error/10 text-error' :
                                                    ret.risk_level === 'HIGH' ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-400'
                                                    }`}>
                                                    <RotateCcw className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg tracking-tight leading-none">{ret.id}</h4>
                                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">Original Bill: {ret.original_order_id}</span>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${ret.risk_level === 'CRITICAL' ? 'bg-error text-white shadow-lg shadow-error/20' :
                                                ret.risk_level === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-success/10 text-success'
                                                }`}>
                                                {ret.risk_level} Risk
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Branch Edge</p>
                                                <p className="text-xs font-black truncate">{ret.branch}</p>
                                            </div>
                                            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Refund Flow</p>
                                                <p className="text-xs font-black flex items-center gap-1">
                                                    {ret.original_mode} <ChevronRight className="w-3 h-3 text-neutral-300" /> {ret.refund_mode}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Processed By</p>
                                                <p className="text-xs font-black flex items-center gap-1.5 line-clamp-1"><UserCircle className="w-3 h-3" /> {ret.processed_by}</p>
                                            </div>
                                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Refund Value</p>
                                                <p className="text-sm font-black italic tabular-nums text-primary">₹{ret.refund_amount.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {ret.issue && (
                                            <div className="p-4 bg-error/5 border border-error/10 rounded-2xl flex items-start gap-3 group/advice">
                                                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-black text-error uppercase tracking-tight mb-1">{ret.issue}</p>
                                                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold italic leading-tight">
                                                        "System detected parity mismatch. Proceed only after verifying physical item and original invoice."
                                                    </p>
                                                </div>
                                                <button className="px-4 py-1.5 bg-error text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md shadow-error/20">
                                                    Audit Now
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-neutral-50 dark:border-neutral-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-6">
                                        <button className="text-[10px] font-black text-neutral-400 hover:text-primary uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                            <ArrowRightLeft className="w-3.5 h-3.5" /> Physical Stock Check
                                        </button>
                                        <button className="text-[10px] font-black text-neutral-400 hover:text-primary uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                            <Scale className="w-3.5 h-3.5" /> original bill view
                                        </button>
                                    </div>
                                    <button className="p-2 text-neutral-400 hover:bg-neutral-50 rounded-lg transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Rail: Strategic Governance */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Governance Sentinel</h4>

                    {/* Return Guards */}
                    <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6 underline decoration-neutral-100 underline-offset-8">Active Policy Guard</p>
                        <div className="space-y-4">
                            {[
                                { name: 'Original Price Enforce', status: true },
                                { name: 'Batch Traceability', status: true },
                                { name: 'Digital-to-Digital ONLY', status: false },
                                { name: 'Manager Key Required', status: true },
                            ].map((policy, i) => (
                                <div key={i} className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                    <span className="text-[10px] font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-300">{policy.name}</span>
                                    {policy.status ? (
                                        <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Return Leak Stream */}
                    <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] border border-neutral-800 relative overflow-hidden group shadow-2xl">
                        <ShieldAlert className="absolute -bottom-10 -right-10 w-48 h-48 text-error opacity-5 group-hover:scale-110 transition-transform duration-[1.5s]" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-error/20 border border-error/30 rounded-full text-error text-[9px] font-black uppercase tracking-[0.2em] mb-6 animate-pulse">
                                <Target className="w-4 h-4 fill-current" /> High Risk Leak Stream
                            </div>

                            <h4 className="text-2xl font-black mb-4 leading-tight tracking-tight">
                                Protect your <span className="text-error italic">Cash Flow.</span>
                            </h4>

                            <div className="space-y-4 mb-8">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-error uppercase tracking-widest">Abuse Detected</span>
                                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                    </div>
                                    <p className="text-[11px] font-medium text-neutral-400 group-hover:text-white transition-colors leading-relaxed">
                                        Cashier <span className="text-white font-black">Manikandan V.</span> processed a cash refund for an online sale (RET-2035). This bypasses payment gateway reversals.
                                    </p>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-error text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-error/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                Flag Transaction <Zap className="w-4 h-4 fill-current" />
                            </button>
                        </div>
                    </div>

                    {/* Operational Tip */}
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex gap-4 backdrop-blur-sm">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-2xl shrink-0 h-fit">
                            <Info className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-relaxed font-black uppercase tracking-tight italic">
                            Returns are the #1 source of operational leakage. Wings Agent uses <span className="text-primary underline underline-offset-4 decoration-primary/20">Payment Trail Validation</span> to ensure refunds only go back to where they came from.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSReturnsIntelligence;
