import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import Layout from "../../../components/shared/Layout";
import {
    Landmark,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    History,
    Zap,
    Download,
    ArrowRightLeft,
    AlertTriangle,
    Info,
    Target,
} from 'lucide-react';

// --- Types ---

type AccountType = 'CURRENT' | 'SAVINGS' | 'OD' | 'CC';
type ReconStatus = 'OK' | 'MISMATCH' | 'PENDING_SETTLEMENT';

interface BankAccount {
    id: string;
    bank_name: string;
    acc_no: string;
    type: AccountType;
    branch: string;
    balance: number;
    expected: number;
    status: ReconStatus;
    last_sync: string;
    burn_rate: number;
}

interface FinancialObligation {
    id: string;
    type: 'GST' | 'VENDOR' | 'TDS' | 'SALARY';
    amount: number;
    due_date: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    target_acc_id: string;
}

const BankIntelligence: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'ACCOUNTS' | 'RECON' | 'CASHFLOW'>('ACCOUNTS');

    // --- Intelligence Engine ---

    const bankAccounts: BankAccount[] = useMemo(() => [
        { id: 'BANK-001', bank_name: 'HDFC Bank', acc_no: 'XXXX1234', type: 'CURRENT', branch: 'Chennai Main', balance: 520000, expected: 530000, status: 'MISMATCH', last_sync: '2026-01-11 18:00', burn_rate: 15000 },
        { id: 'BANK-002', bank_name: 'ICICI Bank', acc_no: 'XXXX5678', type: 'OD', branch: 'HQ', balance: 1250000, expected: 1250000, status: 'OK', last_sync: '2026-01-11 20:00', burn_rate: 45000 },
        { id: 'BANK-003', bank_name: 'SBI Business', acc_no: 'XXXX9012', type: 'SAVINGS', branch: 'Madurai Branch', balance: 85000, expected: 88500, status: 'PENDING_SETTLEMENT', last_sync: '2026-01-11 15:30', burn_rate: 2500 }
    ], []);

    const obligations: FinancialObligation[] = useMemo(() => [
        { id: 'OB-001', type: 'GST', amount: 320000, due_date: '2026-01-20', priority: 'CRITICAL', target_acc_id: 'BANK-001' },
        { id: 'OB-002', type: 'VENDOR', amount: 180000, due_date: '2026-01-15', priority: 'HIGH', target_acc_id: 'BANK-002' },
        { id: 'OB-003', type: 'TDS', amount: 45000, due_date: '2026-01-14', priority: 'MEDIUM', target_acc_id: 'BANK-001' }
    ], []);

    const filteredAccounts = useMemo(() => {
        return bankAccounts.filter(a => a.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) || a.acc_no.includes(searchTerm));
    }, [bankAccounts, searchTerm]);

    const liquidityMetrics = useMemo(() => {
        const total = bankAccounts.reduce((acc, a) => acc + a.balance, 0);
        const due7d = obligations.reduce((acc, o) => acc + o.amount, 0);
        return {
            totalBankBalance: total,
            dueSoon: due7d,
            runwayDays: Math.floor(total / (bankAccounts.reduce((acc, a) => acc + a.burn_rate, 0) || 1)),
            reconAlerts: bankAccounts.filter(a => a.status !== 'OK').length
        };
    }, [bankAccounts, obligations]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <Landmark className="w-6 h-6 text-primary" />
                            Bank Accounts Intelligence
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Multi-branch reconciliation and liquidity protection for <span className="font-bold text-primary">{tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm">
                            <Download className="w-4 h-4" /> statements
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all">
                            <RefreshCw className="w-4 h-4" /> Re-Sync All Nodes
                        </button>
                    </div>
                </div>

                {/* Financial Pulse Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Landmark className="w-16 h-16" />
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Bank Balance</p>
                        <h3 className="text-2xl font-black italic">₹{(liquidityMetrics.totalBankBalance / 100000).toFixed(2)}L</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <ArrowUpRight className="w-4 h-4 text-success" />
                            <span className="text-xs font-bold text-success">+₹2.4L inflow this month</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Upcoming Payables</p>
                        <h3 className="text-2xl font-black text-error">₹{(liquidityMetrics.dueSoon / 100000).toFixed(2)}L</h3>
                        <p className="text-xs text-neutral-500 mt-2 font-medium italic">Due within 7 days</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Recon Alerts</p>
                        <h3 className="text-2xl font-black text-warning">{liquidityMetrics.reconAlerts}</h3>
                        <div className="flex items-center gap-1.5 mt-2 font-bold text-warning text-xs">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Mismatch detected</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Liquidity Runway</p>
                        <h3 className="text-2xl font-black text-indigo-500">{liquidityMetrics.runwayDays} <span className="text-xs">Days</span></h3>
                        <p className="text-xs text-neutral-500 mt-2">Based on current burn rate</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-0.5 mt-4">
                    <div className="flex gap-8">
                        {['ACCOUNTS', 'RECON', 'CASHFLOW'].map(t => (
                            <button
                                key={t}
                                onClick={() => setView(t as any)}
                                className={`pb-3 text-sm font-black transition-all relative ${view === t ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                            >
                                {t === 'ACCOUNTS' ? 'Bank Nodes' : t === 'RECON' ? 'POS-Bank Reconciliation' : 'Cash Flow Intelligence'}
                                {view === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full animate-in slide-in-from-left-2" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {view === 'ACCOUNTS' && (
                            <>
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Bank name, account number or IFSC..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {filteredAccounts.map(acc => (
                                    <div key={acc.id} className={`group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm transition-all hover:border-primary/30 ${acc.status === 'MISMATCH' ? 'border-l-4 border-l-error' : ''
                                        }`}>
                                        <div className="flex flex-col sm:flex-row justify-between gap-6">
                                            <div className="flex gap-4">
                                                <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-2xl text-primary shrink-0">
                                                    <Landmark className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black tracking-tight">{acc.bank_name}</h4>
                                                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-0.5">{acc.acc_no} • {acc.type}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 rounded text-[9px] font-black text-neutral-500 uppercase">{acc.branch}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${acc.status === 'OK' ? 'bg-success/10 text-success' : 'bg-error text-white shadow-sm shadow-error/20'
                                                            }`}>
                                                            {acc.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Current Balance</p>
                                                <p className="text-3xl font-black tabular-nums">₹{acc.balance.toLocaleString()}</p>
                                                <div className="mt-2 text-[10px] font-bold text-neutral-400">
                                                    Last Synced: <span className="text-neutral-600 dark:text-neutral-300">{acc.last_sync}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {acc.status === 'MISMATCH' && (
                                            <div className="mt-6 p-4 bg-error/5 border border-error/10 rounded-2xl flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-error text-white rounded-full">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-error uppercase tracking-widest">Reconciliation Gap</p>
                                                        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                                                            ₹{(acc.expected - acc.balance).toLocaleString()} missing in HDFC credit settlements.
                                                        </p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 bg-error text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-error/20">
                                                    Audit Gap
                                                </button>
                                            </div>
                                        )}

                                        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <button className="text-[10px] font-black text-neutral-400 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest">
                                                    <History className="w-4 h-4" /> ledger
                                                </button>
                                                <button className="text-[10px] font-black text-neutral-400 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest">
                                                    <ArrowRightLeft className="w-4 h-4" /> fund transfer
                                                </button>
                                            </div>
                                            <button className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                Sync Statement
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {view === 'RECON' && (
                            <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight">Digital Collection Matcher</h3>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { channel: 'GPay/PhonePe', pos: 42000, bank: 38000, status: 'MISMATCH' },
                                        { channel: 'Card (Swipe)', pos: 125000, bank: 125000, status: 'MATCHED' },
                                        { channel: 'Wallet (PineLabs)', pos: 12000, bank: 9000, status: 'PENDING' }
                                    ].map((row, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row items-center gap-6 p-6 border border-neutral-100 dark:border-neutral-700 rounded-3xl group hover:border-primary/30 transition-all">
                                            <div className="w-full sm:w-1/3">
                                                <h4 className="font-black text-neutral-500 uppercase text-[10px] tracking-widest mb-1">{row.channel}</h4>
                                                <p className="font-bold text-lg">Daily Batch #401</p>
                                            </div>
                                            <div className="flex flex-1 items-center justify-between gap-8 border-l border-neutral-100 px-8">
                                                <div>
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase mb-1">POS Output</p>
                                                    <p className="font-black tabular-nums">₹{row.pos.toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-200">
                                                    <ArrowRightLeft className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase mb-1">Bank Input</p>
                                                    <p className="font-black tabular-nums italic">₹{row.bank.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${row.status === 'MATCHED' ? 'bg-success/10 text-success' :
                                                    row.status === 'MISMATCH' ? 'bg-error/10 text-error' : 'bg-neutral-100 text-neutral-500'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                                {row.status !== 'MATCHED' && (
                                                    <p className="text-[10px] font-bold text-error mt-1 tracking-tighter">-₹{row.pos - row.bank} gap</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Intelligence Side Panel */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">Financial Intelligence Radar</h4>

                        {/* Compliance & Payables */}
                        <div className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">upcoming payables</span>
                                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 rounded text-[9px] font-bold text-neutral-500 italic">Audit Ready</span>
                            </div>

                            <div className="space-y-4">
                                {obligations.map(o => (
                                    <div key={o.id} className="flex gap-4 group/item">
                                        <div className={`w-1 h-12 rounded-full ${o.priority === 'CRITICAL' ? 'bg-error' : o.priority === 'HIGH' ? 'bg-warning' : 'bg-neutral-300'
                                            }`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-black text-sm">{o.type} Payment</h5>
                                                <span className="text-[10px] font-bold text-error">₹{(o.amount / 1000).toFixed(0)}k</span>
                                            </div>
                                            <p className="text-[10px] text-neutral-400 mt-1">Due {new Date(o.due_date).toLocaleDateString()}</p>
                                        </div>
                                        <button className="opacity-0 group-hover/item:opacity-100 transition-opacity p-2 hover:bg-neutral-50 rounded-lg">
                                            <Zap className="w-4 h-4 text-primary" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Bank room utilization</span>
                                    <span className="text-[10px] font-black text-primary">68%</span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: '68%' }} />
                                </div>
                            </div>
                        </div>

                        {/* AI Strategic Advisor */}
                        <div className="bg-neutral-950 text-white p-8 rounded-[2.5rem] border border-neutral-800 relative overflow-hidden group shadow-2xl">
                            <Zap className="absolute -top-10 -right-10 w-48 h-48 text-primary/10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                                    <ShieldCheck className="w-3.5 h-3.5 fill-current" /> Financial AI Hub
                                </div>

                                <h4 className="text-xl font-black mb-4 leading-tight">
                                    Optimize <span className="text-primary italic">Inter-Branch</span> fund flow.
                                </h4>

                                <div className="space-y-4 mb-8">
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                                        <p className="text-[10px] font-medium text-neutral-400 leading-relaxed">
                                            Detected <span className="text-white font-bold">₹8.5L idle</span> at Madurai Savings.
                                            Agent recommends moving to HDFC Chennai to cover GST obligation due on 20th Jan.
                                        </p>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                    <ArrowRightLeft className="w-4 h-4" /> Execute Fund Rebalancing
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-start gap-3">
                            <Info className="w-4 h-4 text-neutral-400 mt-0.5" />
                            <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                                Wings Intelligence manages complex settlement cycles of Payment Gateways (T+1, T+2) automatically to ensure bank ledger mirrors real business performance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

interface RefreshCwProps extends React.ComponentProps<'svg'> { }
const RefreshCw: React.FC<RefreshCwProps> = (props) => {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    );
};

export default BankIntelligence;
