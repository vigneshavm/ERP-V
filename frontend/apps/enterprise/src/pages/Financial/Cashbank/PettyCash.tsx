import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import Layout from "../../../components/shared/Layout";
import {
    CircleDollarSign,
    Search,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
    History,
    FileWarning,
    Receipt,
    Zap,
    Download,
    Eye,
    ChevronRight,
    UserCircle2,
    Building2,
    MoreVertical,
    TrendingDown,
    Plus,
    Clock,
    Info,
} from 'lucide-react';

// --- Types ---

type PettyStatus = 'HEALTHY' | 'LOW_BALANCE' | 'LIMIT_EXCEEDED' | 'AUDIT_REQUIRED';
type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface PettyCashFund {
    id: string;
    name: string;
    branch: string;
    custodian: string;
    opening_balance: number;
    current_balance: number;
    daily_limit: number;
    status: PettyStatus;
    burn_rate_daily: number;
    replenishment_source: string;
}

interface PettyTransaction {
    id: string;
    date: string;
    amount: number;
    type: 'IN' | 'OUT';
    category: string;
    description: string;
    custodian: string;
    receipt: boolean;
    violation?: string;
}

interface PettyAlert {
    fund_id: string;
    issue: string;
    risk_level: RiskLevel;
}

const PettyCash: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'FUNDS' | 'LEDGER' | 'AUDIT'>('FUNDS');

    // --- Intelligence Engine ---

    const funds: PettyCashFund[] = useMemo(() => [
        {
            id: 'F-001',
            name: 'Chennai Retail - Main Petty',
            branch: 'CHENNAI_OMR',
            custodian: 'Madhan K.',
            opening_balance: 10000,
            current_balance: 1800,
            daily_limit: 2000,
            status: 'LOW_BALANCE',
            burn_rate_daily: 450,
            replenishment_source: 'HDFC Current'
        },
        {
            id: 'F-002',
            name: 'Madurai Godown Operational',
            branch: 'MADURAI_NORTH',
            custodian: 'Manikandan V.',
            opening_balance: 5000,
            current_balance: 4200,
            daily_limit: 1000,
            status: 'HEALTHY',
            burn_rate_daily: 120,
            replenishment_source: 'Main Cash'
        },
        {
            id: 'F-003',
            name: 'HQ Administrative Fund',
            branch: 'CORPORATE',
            custodian: 'Sarah J.',
            opening_balance: 25000,
            current_balance: 12500,
            daily_limit: 5000,
            status: 'AUDIT_REQUIRED',
            burn_rate_daily: 1200,
            replenishment_source: 'ICICI Current'
        }
    ], []);

    const recentTransactions: PettyTransaction[] = useMemo(() => [
        { id: 'T-998', date: '2026-01-11 16:45', amount: 450, type: 'OUT', category: 'Travel', description: 'Auto fare to TNVAT office', custodian: 'Madhan K.', receipt: true },
        { id: 'T-999', date: '2026-01-11 15:20', amount: 1500, type: 'OUT', category: 'Repairs', description: 'AC Filter cleaning', custodian: 'Madhan K.', receipt: false, violation: 'MISSING_RECEIPT' },
        { id: 'T-1000', date: '2026-01-11 14:10', amount: 120, type: 'OUT', category: 'Tea/Snacks', description: 'Tea for guests', custodian: 'Madhan K.', receipt: true },
        { id: 'T-1001', date: '2026-01-11 11:30', amount: 200, type: 'OUT', category: 'Stationery', description: 'A4 Paper bundle', custodian: 'Sarah J.', receipt: true },
        { id: 'T-1002', date: '2026-01-11 10:05', amount: 500, type: 'OUT', category: 'Repairs', description: 'Door handle fix', custodian: 'Sarah J.', receipt: false, violation: 'MISSING_RECEIPT' },
        { id: 'T-1003', date: '2026-01-10 17:30', amount: 2100, type: 'OUT', category: 'Fuel', description: 'Generator diesel', custodian: 'Madhan K.', receipt: true, violation: 'DAILY_LIMIT_EXCEEDED' },
    ], []);

    const alerts: PettyAlert[] = useMemo(() => [
        { fund_id: 'F-001', issue: '3 expenses without receipts in last 2 days', risk_level: 'HIGH' },
        { fund_id: 'F-003', issue: 'Abnormal withdrawal frequency detected', risk_level: 'MEDIUM' },
        { fund_id: 'F-001', issue: 'Daily limit exceeded by ₹100 yesterday', risk_level: 'LOW' }
    ], []);

    // Filter Logic
    const filteredFunds = useMemo(() => {
        return funds.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.branch.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [funds, searchTerm]);

    const metrics = useMemo(() => {
        const totalOut = recentTransactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0);
        const violations = recentTransactions.filter(t => t.violation).length;
        return {
            totalOperationalSpend: totalOut,
            activeFunds: funds.length,
            violationRate: Math.round((violations / recentTransactions.length) * 100),
            savingsAgentAdvice: 'Consolidate stationery buys to monthly for 15% discount.'
        };
    }, [recentTransactions, funds]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-12">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <CircleDollarSign className="w-6 h-6 text-primary" />
                            Petty Cash Intelligence
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Operational spend control and leak detection for <span className="font-bold text-primary">{typeof tenant_id === 'object' && tenant_id !== null ? (tenant_id as any).name : tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95">
                            <Download className="w-4 h-4" /> Export Audit
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95">
                            <Plus className="w-4 h-4" /> Add Multi-Spend Entry
                        </button>
                    </div>
                </div>

                {/* Strategic KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Receipt className="w-16 h-16" />
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Weekly Ops Spend</p>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white">₹{metrics.totalOperationalSpend.toLocaleString()}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingDown className="w-4 h-4 text-success" />
                            <span className="text-xs font-bold text-success">-12% from last week</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Active Funds</p>
                        <h3 className="text-2xl font-black">{metrics.activeFunds} <span className="text-xs text-neutral-400 font-bold uppercase">across branches</span></h3>
                        <p className="text-xs text-neutral-500 mt-2 font-medium italic">All custodians active</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Leakage Rate</p>
                        <h3 className="text-2xl font-black text-error">{metrics.violationRate}%</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <AlertCircle className="w-4 h-4 text-error" />
                            <span className="text-xs font-bold text-error">Audit recommended</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 italic">Agent Strategy</p>
                        <p className="text-[11px] font-bold text-primary italic leading-tight mt-1">
                            "{metrics.savingsAgentAdvice}"
                        </p>
                        <p className="text-[9px] text-neutral-500 mt-2 uppercase font-black tracking-tighter">AI Managed Spend</p>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-0.5 mt-8 gap-8">
                    <button
                        onClick={() => setViewMode('FUNDS')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'FUNDS' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Branch Funds Monitoring
                        {viewMode === 'FUNDS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('LEDGER')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'LEDGER' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Inter-Branch Ledger
                        {viewMode === 'LEDGER' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('AUDIT')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'AUDIT' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Compliance & Audit Hub
                        <span className="ml-2 px-1.5 py-0.5 bg-error text-white text-[8px] rounded uppercase shadow-sm">2 High Risk</span>
                        {viewMode === 'AUDIT' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                </div>

                {/* Conditional Content Rendering */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Primary List Area */}
                    <div className="lg:col-span-2 space-y-4">
                        {viewMode === 'FUNDS' && (
                            <>
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Branch or Fund Name..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {filteredFunds.map(fund => (
                                    <div key={fund.id} className={`group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm transition-all hover:scale-[1.005] hover:shadow-md ${fund.status === 'LOW_BALANCE' ? 'border-l-4 border-l-amber-500' :
                                        fund.status === 'AUDIT_REQUIRED' ? 'border-l-4 border-l-error' : 'shadow-sm'
                                        }`}>
                                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl transition group-hover:text-primary">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-neutral-900 dark:text-white group-hover:text-primary transition-colors">{fund.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-neutral-400 tracking-widest uppercase">{fund.branch}</span>
                                                        <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                                        <span className="text-[10px] font-black text-primary uppercase">ID: {fund.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Fund Liquidity</div>
                                                <div className={`text-2xl font-black tabular-nums ${fund.status === 'LOW_BALANCE' ? 'text-amber-600' : 'text-neutral-900 dark:text-white'}`}>
                                                    ₹{fund.current_balance.toLocaleString()}
                                                </div>
                                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm ${fund.status === 'HEALTHY' ? 'bg-success/10 text-success' :
                                                        fund.status === 'LOW_BALANCE' ? 'bg-amber-100 text-amber-600' : 'bg-error text-white'
                                                        }`}>
                                                        {fund.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl group/inner transition hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                                            <div>
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Burn Rate</p>
                                                <p className="text-sm font-black italic">₹{fund.burn_rate_daily}/day</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Est. Runway</p>
                                                <p className="text-sm font-black text-amber-600 italic">{Math.floor(fund.current_balance / fund.burn_rate_daily)} Days left</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Daily Limit</p>
                                                <p className="text-sm font-black italic">₹{fund.daily_limit.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Custodian</p>
                                                <div className="flex items-center gap-1.5">
                                                    <UserCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                                                    <p className="text-sm font-bold truncate">{fund.custodian}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {fund.status === 'LOW_BALANCE' && (
                                            <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between animate-pulse">
                                                <div className="flex items-center gap-3">
                                                    <Zap className="w-4 h-4 text-primary fill-current transition group-hover:scale-125" />
                                                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                        Agent recommends replenishing <span className="text-primary font-black">₹{fund.opening_balance - fund.current_balance}</span> from <span className="font-bold underline">{fund.replenishment_source}</span>
                                                    </p>
                                                </div>
                                                <button className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 active:scale-95">
                                                    Trigger Now
                                                </button>
                                            </div>
                                        )}

                                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                            <button className="text-[10px] font-black text-neutral-400 hover:text-primary transition-all flex items-center gap-1.5 uppercase tracking-widest group/btn_v">
                                                <Eye className="w-4 h-4 transition group-hover/btn_v:scale-110" /> View Transactions
                                            </button>
                                            <button className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors active:scale-90">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {viewMode === 'LEDGER' && (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-xs tabular-nums">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="p-4">Date/Time</th>
                                            <th className="p-4">Description</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Amount</th>
                                            <th className="p-4">Verification</th>
                                            <th className="p-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {recentTransactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-black text-neutral-900 dark:text-white">{tx.date.split(' ')[1]}</div>
                                                    <div className="text-neutral-400 font-medium">{tx.date.split(' ')[0]}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-neutral-700 dark:text-neutral-300">{tx.description}</div>
                                                    <div className="text-[9px] text-neutral-400 mt-0.5 font-black uppercase">ID: {tx.id} • {tx.custodian}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 rounded-full font-black uppercase tracking-tighter text-[10px]">
                                                        {tx.category}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className={`text-sm font-black italic ${tx.type === 'IN' ? 'text-success' : 'text-error'}`}>
                                                        {tx.type === 'IN' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {tx.violation ? (
                                                        <div className="flex items-center gap-1.5 text-error font-black">
                                                            <FileWarning className="w-3.5 h-3.5 shadow-sm" />
                                                            <span className="text-[10px] break-all max-w-[100px] leading-tight underline decoration-error/30 uppercase tracking-tighter">
                                                                {tx.violation.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-success font-black">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] uppercase tracking-tighter">Verified</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition group-hover:translate-x-1">
                                                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button className="w-full py-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 text-[10px] font-black text-neutral-500 uppercase tracking-widest hover:text-primary transition hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    Load Full Petty Cash Ledger History
                                </button>
                            </div>
                        )}

                        {viewMode === 'AUDIT' && (
                            <div className="bg-neutral-900 text-white rounded-[2.5rem] p-8 border border-neutral-800 shadow-2xl relative overflow-hidden group">
                                <ShieldAlert className="absolute -bottom-10 -right-10 w-48 h-48 text-primary/10 transition group-hover:rotate-12 group-hover:scale-110" />
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-error/20 border border-error/30 rounded-full text-error text-[10px] font-black uppercase tracking-[0.2em] mb-6 animate-pulse shadow-sm shadow-error/20">
                                        <ShieldAlert className="w-3 h-3 fill-current" /> High Security Integrity Hub
                                    </div>
                                    <h3 className="text-3xl font-black mb-6 leading-tight tracking-tight">
                                        Anti-Abuse Engine <br /> <span className="text-primary italic">Active Observation.</span>
                                    </h3>

                                    <div className="space-y-4">
                                        {alerts.map((alert, i) => (
                                            <div key={i} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm group/alert hover:bg-white/10 transition-all cursor-pointer">
                                                <div className={`p-3 rounded-xl h-fit shadow-inner ${alert.risk_level === 'HIGH' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                                                    }`}>
                                                    <AlertCircle className="w-5 h-5 shadow-sm" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{alert.fund_id}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase shadow-sm ${alert.risk_level === 'HIGH' ? 'bg-error text-white' : 'bg-warning text-neutral-900 font-bold'
                                                            }`}>
                                                            {alert.risk_level} Risk
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-sm mt-1 leading-snug">{alert.issue}</p>
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className="text-[9px] text-neutral-400 flex items-center gap-1 font-bold italic">
                                                            <Clock className="w-3 h-3" /> Detected 2h ago
                                                        </span>
                                                        <button className="text-[10px] font-black text-primary uppercase group-hover/alert:translate-x-1 transition-transform tracking-widest">
                                                            Execute Resolve Protocols →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Side Intelligence Panel */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">Compliance Health</h4>
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm shadow-black/5 transition hover:shadow-md">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Receipt Compliance</p>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black italic">Receipts Attached</span>
                                <span className="text-xs font-black text-primary italic">82%</span>
                            </div>
                            <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden mb-8 shadow-inner">
                                <div className="bg-primary h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: '82%' }} />
                            </div>

                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Monthly Allocation</p>
                            <div className="space-y-4">
                                {[
                                    { name: 'Tea & Snacks', spend: 2400, limit: 3000, color: 'bg-primary' },
                                    { name: 'Local Travel', spend: 1800, limit: 5000, color: 'bg-indigo-500' },
                                    { name: 'Office Repairs', spend: 4500, limit: 4000, color: 'bg-error shadow-sm shadow-error/20' }
                                ].map((cat, i) => (
                                    <div key={i} className="group/cat">
                                        <div className="flex justify-between text-[11px] mb-1.5">
                                            <span className="font-black uppercase tracking-tighter text-neutral-700 dark:text-neutral-300">{cat.name}</span>
                                            <span className="text-neutral-400 font-bold tabular-nums italic">₹{cat.spend}/₹{cat.limit}</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5 rounded-full overflow-hidden shadow-inner group-hover/cat:h-2 transition-all">
                                            <div className={`${cat.color} h-full rounded-full transition-all duration-700`} style={{ width: `${Math.min((cat.spend / cat.limit) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-primary text-white p-6 rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden group">
                            <Zap className="absolute -top-6 -right-6 w-32 h-32 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700" />
                            <div className="relative z-10">
                                <h4 className="font-black text-xl mb-2 tracking-tight italic">Automate Cash-to-Petty?</h4>
                                <p className="text-xs opacity-90 leading-relaxed mb-6 font-bold italic">
                                    The Agent predicts that Chennai fund will be exhausted in <span className="font-black underline scale-110 inline-block pointer-events-none">4 days</span>.
                                    Set up auto-replenishment to avoid operational delays.
                                </p>
                                <button className="w-full py-3 bg-white text-primary font-black text-[11px] uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-50 transition-all shadow-xl shadow-black/10 active:scale-95">
                                    Enable Autoflow Rebuild
                                </button>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-start gap-3 shadow-inner">
                            <Info className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-neutral-500 font-bold leading-relaxed italic">
                                Wings-Grade petty cash monitoring ensures every rupee spent operatively is accounted for with cryptographic proof of spend links.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PettyCash;
