import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import Layout from "@/shared/ui/Layout";
import {
    ArrowRightLeft,
    Search,
    AlertCircle,
    ShieldAlert,
    Zap,
    Download,
    ChevronRight,
    Building2,
    MoreVertical,
    TrendingUp,
    Plus,
    Clock,
    Info,
    Smartphone,
    ArrowUpRight,
    Lock,
    Unlock,
} from 'lucide-react';

// --- Types ---

type TransferStatus = 'INITIATED' | 'COMPLETED' | 'FAILED' | 'REJECTED';
type LiquidityHealth = 'EXCESS' | 'STABLE' | 'LOW' | 'CRITICAL';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface BranchLiquidity {
    id: string;
    branch_name: string;
    cash_holding: number;
    bank_holding: number;
    daily_burn: number;
    health: LiquidityHealth;
}

interface FundTransfer {
    id: string;
    from_branch: string;
    to_branch: string;
    amount: number;
    date: string;
    status: TransferStatus;
    initiated_by: string;
    approved_by?: string;
    risk_level: RiskLevel;
    issue?: string;
}

const FundTransfer: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'MAP' | 'TRANSFERS' | 'ADVISOR'>('MAP');

    // --- Intelligence Engine ---

    const branches: BranchLiquidity[] = useMemo(() => [
        { id: 'BR-01', branch_name: 'Chennai Retail Main', cash_holding: 850000, bank_holding: 2200000, daily_burn: 45000, health: 'EXCESS' },
        { id: 'BR-02', branch_name: 'Madurai Warehouse', cash_holding: 120000, bank_holding: 450000, daily_burn: 38000, health: 'STABLE' },
        { id: 'BR-03', branch_name: 'Coimbatore Store', cash_holding: 15000, bank_holding: 65000, daily_burn: 25000, health: 'CRITICAL' },
        { id: 'BR-04', branch_name: 'Trichy Outlet', cash_holding: 85000, bank_holding: 125000, daily_burn: 22000, health: 'LOW' }
    ], []);

    const transfers: FundTransfer[] = useMemo(() => [
        { id: 'FT-101', from_branch: 'Chennai Main', to_branch: 'Coimbatore', amount: 300000, date: '2026-01-11 14:15', status: 'COMPLETED', initiated_by: 'Madhan K.', approved_by: 'Admin', risk_level: 'LOW' },
        { id: 'FT-102', from_branch: 'Coimbatore', to_branch: 'Chennai Main', amount: 750000, date: '2026-01-11 16:30', status: 'INITIATED', initiated_by: 'Sales Exec', risk_level: 'HIGH', issue: 'Destination branch already has excess funds' },
        { id: 'FT-103', from_branch: 'Madurai WH', to_branch: 'Trichy Outlet', amount: 50000, date: '2026-01-11 10:05', status: 'FAILED', initiated_by: 'Manikandan V.', risk_level: 'MEDIUM', issue: 'Insufficient balance in source' },
        { id: 'FT-104', from_branch: 'Chennai Main', to_branch: 'Madurai WH', amount: 200000, date: '2026-01-11 09:20', status: 'COMPLETED', initiated_by: 'Madhan K.', approved_by: 'Admin', risk_level: 'LOW' },
        { id: 'FT-105', from_branch: 'Chennai Main', to_branch: 'Chennai Main', amount: 150000, date: '2026-01-10 18:45', status: 'REJECTED', initiated_by: 'Madhan K.', risk_level: 'CRITICAL', issue: 'Round-trip/Circular transfer detected' },
    ], []);

    // Helper metrics
    const totals = useMemo(() => {
        const totalCash = branches.reduce((acc, b) => acc + b.cash_holding + b.bank_holding, 0);
        const criticalCount = branches.filter(b => b.health === 'CRITICAL').length;
        const failedCount = transfers.filter(t => t.status === 'FAILED').length;
        return { totalCash, criticalCount, failedCount };
    }, [branches, transfers]);

    const filteredBranches = branches.filter(b => b.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <ArrowRightLeft className="w-6 h-6 text-primary" />
                            Fund Transfer Intelligence
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Inter-branch liquidity optimization for <span className="font-bold text-primary">{typeof tenant_id === 'object' && tenant_id !== null ? (tenant_id as any).name : tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm active:scale-95 transition">
                            <Download className="w-4 h-4" /> Export Ledger
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95">
                            <Plus className="w-4 h-4" /> Initiate Transfer
                        </button>
                    </div>
                </div>

                {/* Strategic KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total System Liquidity</p>
                        <h3 className="text-2xl font-black">₹{(totals.totalCash / 100000).toFixed(2)}L</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="text-xs font-bold text-success">+4% from last week</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Nodes at Risk</p>
                        <h3 className="text-2xl font-black text-error">{totals.criticalCount} <span className="text-xs text-neutral-400 font-bold uppercase">Critical</span></h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <AlertCircle className="w-4 h-4 text-error" />
                            <span className="text-xs font-bold text-error">Rebalancing Required</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Failed Transfers</p>
                        <h3 className="text-2xl font-black text-amber-600">{totals.failedCount} <span className="text-xs text-neutral-400 font-bold uppercase">Today</span></h3>
                        <p className="text-xs text-neutral-500 mt-2 font-medium italic">Audit recommended</p>
                    </div>

                    <div className="bg-primary text-white p-5 rounded-2xl shadow-lg shadow-primary/20 relative overflow-hidden group">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700" />
                        <p className="text-[10px] font-black text-primary-light uppercase tracking-widest mb-1 italic">Agent Strategy</p>
                        <h3 className="text-xs font-bold leading-tight">"Move ₹3.2L from Chennai to Coimbatore now."</h3>
                        <p className="text-[9px] text-white/60 mt-2 font-black uppercase tracking-tighter">AI Fund Flow Rebuild</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-0.5 mt-8 gap-8">
                    <button
                        onClick={() => setViewMode('MAP')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'MAP' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Liquidity Map
                        {viewMode === 'MAP' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('TRANSFERS')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'TRANSFERS' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Transfer Audit Ledger
                        {viewMode === 'TRANSFERS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('ADVISOR')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'ADVISOR' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Rebalancing Strategist
                        <span className="ml-2 px-1.5 py-0.5 bg-primary text-white text-[8px] rounded uppercase">AI Active</span>
                        {viewMode === 'ADVISOR' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Node Rendering */}
                    <div className="lg:col-span-2 space-y-4">
                        {viewMode === 'MAP' && (
                            <>
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Branch Node..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredBranches.map(branch => (
                                        <div key={branch.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl p-6 shadow-sm group hover:border-primary/30 transition-all hover:scale-[1.01]">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-neutral-100 dark:bg-neutral-900 rounded-2xl group-hover:text-primary transition-colors">
                                                        <Building2 className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-neutral-900 dark:text-white leading-tight">{branch.branch_name}</h4>
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">ID: {branch.id}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${branch.health === 'EXCESS' ? 'bg-success/10 text-success' :
                                                    branch.health === 'STABLE' ? 'bg-indigo-50 text-indigo-500' :
                                                        branch.health === 'LOW' ? 'bg-amber-100 text-amber-600' : 'bg-error text-white shadow-lg shadow-error/20'
                                                    }`}>
                                                    {branch.health}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <Smartphone className="w-3 h-3" /> Cash Node
                                                    </p>
                                                    <p className="text-lg font-black italic tabular-nums">₹{branch.cash_holding.toLocaleString()}</p>
                                                </div>
                                                <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" /> Bank Node
                                                    </p>
                                                    <p className="text-lg font-black italic tabular-nums">₹{(branch.bank_holding / 100000).toFixed(1)}L</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                                    <span>Survival Runway</span>
                                                    <span className={branch.health === 'CRITICAL' ? 'text-error font-black' : 'text-neutral-700 font-bold'}>
                                                        {Math.floor((branch.cash_holding + branch.bank_holding) / branch.daily_burn)} Days
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${branch.health === 'EXCESS' ? 'bg-success w-[95%]' :
                                                            branch.health === 'STABLE' ? 'bg-indigo-500 w-[65%]' :
                                                                branch.health === 'LOW' ? 'bg-amber-500 w-[30%]' : 'bg-error w-[15%]'
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                                                <button className="flex-1 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95">
                                                    Initiate Outflow
                                                </button>
                                                <button className="p-2 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 transition active:scale-90">
                                                    <MoreVertical className="w-4 h-4 text-neutral-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {viewMode === 'TRANSFERS' && (
                            <div className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-xs tabular-nums">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="p-5">Direction / Node</th>
                                            <th className="p-5">Amount</th>
                                            <th className="p-5">Risk Scan</th>
                                            <th className="p-5">Status</th>
                                            <th className="p-5 text-right">Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {transfers.map(tx => (
                                            <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
                                                            <ArrowRightLeft className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold flex items-center gap-2">
                                                                {tx.from_branch} <ChevronRight className="w-3 h-3" /> {tx.to_branch}
                                                            </div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5 font-medium uppercase">ID: {tx.id} • {tx.initiated_by}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="text-sm font-black italic">₹{tx.amount.toLocaleString()}</div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${tx.risk_level === 'LOW' ? 'bg-success' :
                                                            tx.risk_level === 'HIGH' ? 'bg-error animate-pulse' : 'bg-amber-500'
                                                            }`} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${tx.risk_level === 'HIGH' ? 'text-error' : 'text-neutral-500'
                                                            }`}>
                                                            {tx.risk_level} Risk
                                                        </span>
                                                    </div>
                                                    {tx.issue && <p className="text-[10px] text-neutral-400 mt-1 max-w-[150px] leading-tight font-medium italic">{tx.issue}</p>}
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                                                        tx.status === 'INITIATED' ? 'bg-primary/10 text-primary' : 'bg-error text-white shadow-sm shadow-error/20'
                                                        }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline hover:scale-105 active:scale-95 transition">
                                                        {tx.status === 'INITIATED' ? 'Approve Now' : 'View Audit'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button className="w-full py-4 bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-500 uppercase tracking-widest hover:text-primary border-t border-neutral-100 dark:border-neutral-800 transition">
                                    Load system-wide archival fund flows
                                </button>
                            </div>
                        )}

                        {viewMode === 'ADVISOR' && (
                            <div className="bg-neutral-900 text-white rounded-[2.5rem] p-10 border border-neutral-800 shadow-2xl relative overflow-hidden group">
                                <Zap className="absolute -bottom-10 -right-10 w-64 h-64 text-primary opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                                <div className="relative z-10 max-w-xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-pulse shadow-sm shadow-primary/20">
                                        <ShieldAlert className="w-4 h-4 fill-current" /> Active Financial Survival Intelligence
                                    </div>
                                    <h3 className="text-4xl font-black mb-6 leading-[1.1] tracking-tight">
                                        Autonomous <br /> <span className="text-primary italic underline decoration-primary/30">Liquidity Rebuild</span>
                                    </h3>

                                    <div className="space-y-6 mb-10">
                                        <div className="flex gap-5 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
                                            <div className="p-4 bg-error/20 text-error rounded-2xl h-fit shadow-inner">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-white mb-2">Critical Node: Coimbatore Store</h4>
                                                <p className="text-sm text-neutral-400 leading-relaxed font-bold italic">
                                                    Available funds (₹80k) will only last <span className="text-error font-black underline">2 more days</span> based on avg daily overhead.
                                                    Failure to rebalance by tomorrow may lead to operational shutdown.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-5 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
                                            <div className="p-4 bg-success/20 text-success rounded-2xl h-fit shadow-inner">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-white mb-2">Optimal Source: Chennai Main</h4>
                                                <p className="text-sm text-neutral-400 leading-relaxed font-bold italic">
                                                    Chennai Main holds ₹30.5L (Excess Liquidity). Moving ₹5L to Coimbatore and ₹2L to Trichy will normalize network stress without impacting Chennai’s performance.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn_exec">
                                        Apply Multi-Node Rebalancing <Zap className="w-4 h-4 fill-current group-hover/btn_exec:animate-bounce" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Rail: Strategic Hub */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">Network Protocols</h4>

                        {/* Transfer Locks Status */}
                        <div className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm shadow-black/5">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">security shields</span>
                                <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-[9px] font-black uppercase shadow-sm">Active</span>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { name: 'Approval Multi-Sig', status: true },
                                    { name: 'Round-Trip Block', status: true },
                                    { name: 'Daily Velocity Limit', status: true },
                                    { name: 'Geofenced Rebalancing', status: false },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-2xl transition hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.name}</span>
                                        {item.status ? <Unlock className="w-3.5 h-3.5 text-success" /> : <Lock className="w-3.5 h-3.5 text-neutral-300 transition hover:text-amber-500" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fraud Intelligence Panel */}
                        <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 relative overflow-hidden group shadow-sm">
                            <ShieldAlert className="absolute -top-4 -right-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                            <h4 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                Alert Stream <div className="w-2 h-2 bg-error rounded-full animate-ping" />
                            </h4>

                            <div className="space-y-4">
                                <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-error/20 hover:border-error transition">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-black uppercase text-error tracking-widest">Abuse Detected</span>
                                        <Clock className="w-3 h-3 text-neutral-400" />
                                    </div>
                                    <p className="text-[11px] font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                                        Possible <span className="text-error font-black italic">Circular Transfer</span> at Chennai Main (FT-105). System blocked movement automatically.
                                    </p>
                                </div>

                                <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-amber-200 hover:border-amber-500 transition">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Anomalous Time</span>
                                        <Clock className="w-3 h-3 text-neutral-400" />
                                    </div>
                                    <p className="text-[11px] font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                                        High value transfer initiated at <span className="text-amber-600 font-black">3:00 AM IST</span>. Manual intervention required.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] text-neutral-500 font-bold leading-relaxed italic">
                                Wings-Grade fund intelligence ensures inter-branch movements are not just tracked, but strategically automated to prevent stock-outs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default FundTransfer;
