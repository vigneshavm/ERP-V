import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Wallet,
    Landmark,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Search,
    Filter,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    ShieldCheck,
    History,
    FileText,
    Zap,
    Download,
    CreditCard,
    Smartphone,
    ArrowRightLeft,
    AlertTriangle,
    Info,
} from 'lucide-react';

// --- Types ---

type AccountType = 'CASH' | 'BANK' | 'UPI' | 'CARD' | 'WALLET' | 'CREDIT';
type ReconciliationStatus = 'OK' | 'SHORTAGE' | 'EXCESS' | 'UNRECONCILED';

interface CashBankStatus {
    account_id: string;
    account_name: string;
    type: AccountType;
    opening_balance: number;
    current_balance: number;
    pos_expected?: number;
    difference: number;
    status: ReconciliationStatus;
    last_reconciled: string;
    branch_id: string;
    risk_score: number; // 0-100
}

interface FinancialAuditEntry {
    id: string;
    date: string;
    type: 'FRAUD_ALERT' | 'DISCREPANCY' | 'SETTLEMENT';
    category: string;
    description: string;
    amount: number;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

// --- Component ---

const CashBankIntelligence: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<AccountType | 'ALL'>('ALL');

    // --- Intelligence Engine ---

    const accountStatuses: CashBankStatus[] = useMemo(() => {
        const base = [
            { id: 'ACC-001', name: 'Main Cash Counter - Chennai', type: 'CASH' as AccountType, opening: 50000, current: 67200, pos: 68000, branch: 'CHENNAI' },
            { id: 'ACC-002', name: 'HDFC Current Account', type: 'BANK' as AccountType, opening: 350000, current: 420000, pos: 420000, branch: 'HQ' },
            { id: 'ACC-003', name: 'GPay/PhonePe Pool', type: 'UPI' as AccountType, opening: 12000, current: 45000, pos: 45200, branch: 'ALL' },
            { id: 'ACC-004', name: 'Petty Cash - Madurai', type: 'CASH' as AccountType, opening: 5000, current: 5200, pos: 5000, branch: 'MADURAI' },
            { id: 'ACC-005', name: 'ICICI Credit Line', type: 'CREDIT' as AccountType, opening: -100000, current: -85000, pos: -85000, branch: 'HQ' },
        ];

        return base.map(acc => {
            const difference = acc.current - (acc.pos || acc.current);
            let status: ReconciliationStatus = 'OK';
            let risk = 0;

            if (difference < 0) {
                status = 'SHORTAGE';
                risk = Math.min(Math.abs(difference) / 10, 100);
            } else if (difference > 0) {
                status = 'EXCESS';
                risk = 40;
            }

            return {
                account_id: acc.id,
                account_name: acc.name,
                type: acc.type,
                opening_balance: acc.opening,
                current_balance: acc.current,
                pos_expected: acc.pos,
                difference,
                status,
                last_reconciled: new Date().toISOString().split('T')[0],
                branch_id: acc.branch,
                risk_score: Math.round(risk)
            };
        });
    }, []);

    const auditLogs: FinancialAuditEntry[] = useMemo(() => [
        { id: 'AUD-001', date: '2026-01-11 18:30', type: 'DISCREPANCY', category: 'Cash Reconciliation', description: '₹800 shortage detected at Chennai Counter. POS mismatch.', amount: -800, severity: 'HIGH' },
        { id: 'AUD-002', date: '2026-01-11 14:15', type: 'FRAUD_ALERT', category: 'Refund Patterns', description: 'Abnormal refund spike (5 in 1hr) at Madurai branch.', amount: 4500, severity: 'MEDIUM' },
        { id: 'AUD-003', date: '2026-01-11 10:00', type: 'SETTLEMENT', category: 'Bank Deposit', description: '₹40,000 cash deposit verified in HDFC account.', amount: 40000, severity: 'LOW' },
    ], []);

    const filteredAccounts = useMemo(() => {
        return accountStatuses.filter(a => {
            const matchesSearch = a.account_name.toLowerCase().includes(searchTerm.toLowerCase()) || a.account_id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'ALL' || a.type === filterType;
            return matchesSearch && matchesType;
        }).sort((a, b) => b.risk_score - a.risk_score);
    }, [accountStatuses, searchTerm, filterType]);

    const metrics = useMemo(() => {
        const totalNet = accountStatuses.reduce((acc, a) => acc + a.current_balance, 0);
        const shortages = accountStatuses.filter(a => a.status === 'SHORTAGE').length;
        return {
            totalLiquidity: totalNet,
            shortages,
            activeDiscrepancies: auditLogs.filter(l => l.type === 'DISCREPANCY').length,
            securityScore: 92
        };
    }, [accountStatuses, auditLogs]);

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-primary" />
                        Cash & Bank Intelligence Agent
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Live reconciliation and financial auditing for <span className="font-bold text-primary">{tenant_id}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold hover:bg-neutral-50 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Financial Report
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Run Full Reconcile
                    </button>
                </div>
            </div>

            {/* Financial Pulse Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Liquidity</p>
                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white">₹{(metrics.totalLiquidity / 100000).toFixed(2)}L</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <ArrowUpRight className="w-4 h-4 text-success" />
                        <span className="text-xs font-bold text-success">+4.2% from yesterday</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Cash Shortages</p>
                    <h3 className="text-2xl font-black text-error">{metrics.shortages}</h3>
                    <p className="text-xs text-neutral-500 mt-2">Accounts requiring audit</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Audit Discrepancies</p>
                    <h3 className="text-2xl font-black text-warning">{metrics.activeDiscrepancies}</h3>
                    <p className="text-xs text-neutral-500 mt-2">Pending investigation</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Financial Integrity</p>
                    <div className="flex items-center gap-3 mt-1">
                        <h3 className="text-2xl font-black text-success">{metrics.securityScore}%</h3>
                        <ShieldCheck className="w-6 h-6 text-success" />
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Active fraud monitoring</p>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search Account Name, ID or Branch..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none font-bold"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                    >
                        <option value="ALL">All Account Types</option>
                        <option value="CASH">Cash Counters</option>
                        <option value="BANK">Bank Accounts</option>
                        <option value="UPI">UPI/Wallets</option>
                        <option value="CREDIT">Credit Lines</option>
                    </select>
                </div>
            </div>

            {/* Account Audit List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">Monitored Accounts</h4>
                    {filteredAccounts.map((acc) => (
                        <div
                            key={acc.account_id}
                            className={`group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-700/30 ${acc.status !== 'OK' ? 'border-l-4 border-l-error shadow-sm' : ''
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${acc.type === 'CASH' ? 'bg-amber-100 text-amber-600' :
                                            acc.type === 'BANK' ? 'bg-primary/10 text-primary' : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        {acc.type === 'CASH' ? <Wallet className="w-6 h-6" /> :
                                            acc.type === 'BANK' ? <Landmark className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-900 dark:text-white group-hover:text-primary transition-colors">{acc.account_name}</h4>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                            <span>{acc.account_id}</span>
                                            <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                            <span>{acc.branch_id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xl font-black text-neutral-900 dark:text-white">₹{acc.current_balance.toLocaleString()}</p>
                                    <div className="flex items-center justify-end gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${acc.status === 'OK' ? 'bg-success/10 text-success' : 'bg-error text-white'
                                            }`}>
                                            {acc.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {acc.status !== 'OK' && (
                                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-error/5 border border-error/10 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <AlertCircle className="w-12 h-12" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <p className="text-[9px] font-black text-error uppercase tracking-widest">Expected (POS)</p>
                                        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">₹{acc.pos_expected?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-error uppercase tracking-widest">Difference</p>
                                        <p className="text-sm font-bold text-error">₹{acc.difference}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[9px] font-black text-error uppercase tracking-widest">Agent Recommendation</p>
                                        <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 leading-tight mt-0.5">
                                            Verify cash drawer for manual overrides or unlogged refunds.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button className="text-[10px] font-black text-neutral-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1">
                                        <History className="w-3 h-3" /> Ledger
                                    </button>
                                    <button className="text-[10px] font-black text-neutral-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1">
                                        <ArrowRightLeft className="w-3 h-3" /> Transfers
                                    </button>
                                </div>
                                <button className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 rounded text-[10px] font-black uppercase tracking-widest transition-all">
                                    Reconcile now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Audit Hub */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">Financial Intelligence Audit</h4>
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                            <span className="text-[10px] font-black text-neutral-500 uppercase">Live Anomalies</span>
                            <span className="px-2 py-0.5 bg-error text-white text-[9px] font-black rounded-full animate-pulse">LIVE</span>
                        </div>
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-all group">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full ${log.severity === 'HIGH' ? 'bg-error' : log.severity === 'MEDIUM' ? 'bg-warning' : 'bg-success'
                                            }`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{log.category}</p>
                                                <p className="text-[9px] text-neutral-400">{log.date.split(' ')[1]}</p>
                                            </div>
                                            <p className="text-xs font-bold text-neutral-700 dark:text-neutral-200 mt-1 leading-relaxed">{log.description}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className={`text-[10px] font-black ${log.amount > 0 ? 'text-success' : 'text-error'}`}>
                                                    {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}
                                                </span>
                                                <button className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Investigate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full p-4 text-[10px] font-black text-neutral-400 hover:text-primary transition-colors border-t border-neutral-100 dark:border-neutral-700 uppercase tracking-widest bg-neutral-50/50 dark:bg-neutral-900/10">
                            View Full Financial Audit Log
                        </button>
                    </div>

                    {/* Wings-style Summary Panel */}
                    <div className="bg-neutral-950 text-white p-6 rounded-[2rem] border border-neutral-800 shadow-2xl relative overflow-hidden group">
                        <Zap className="absolute -top-10 -right-10 w-40 h-40 text-primary/10" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                                <Zap className="w-3.5 h-3.5 fill-current" /> Financial AI
                            </div>
                            <h4 className="text-xl font-black leading-tight mb-3">
                                Detected <span className="text-primary italic">Refund Anomalies</span> at Madurai.
                            </h4>
                            <p className="text-neutral-400 text-xs leading-relaxed mb-6">
                                Refund frequency is 320% higher than average.
                                Recommended: Review staff login logs for the 14:00 - 15:00 window.
                            </p>
                            <button className="w-full py-3 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                                Lockdown Account 004
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashBankIntelligence;
