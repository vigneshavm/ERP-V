import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import Layout from "../../../components/shared/Layout";
import {
    Activity,
    Search,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
    History,
    Zap,
    Download,
    ArrowRightLeft,
    MoreVertical,
    Clock,
    RefreshCcw,
    Scale,
    Link,
    Unlink,
    Landmark,
} from 'lucide-react';

// --- Types ---

type MatchStatus = 'MATCHED' | 'MISSING_IN_ERP' | 'MISSING_IN_BANK' | 'DUPLICATE' | 'WRONG_AMOUNT';

interface BankEntry {
    id: string;
    date: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    utr: string;
    description: string;
}

interface ERPEntry {
    id: string;
    date: string;
    amount: number;
    direction: 'IN' | 'OUT';
    source: 'SALE' | 'PURCHASE' | 'GST' | 'TRANSFER' | 'REFUND' | 'EXPENSE';
    reference_no: string;
}

interface ReconciliationItem {
    id: string;
    bankEntry?: BankEntry;
    erpEntry?: ERPEntry;
    status: MatchStatus;
    issue?: string;
    recommended_action?: string;
}

const BankReconciliation: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<MatchStatus | 'ALL'>('ALL');

    // --- Intelligence Engine ---

    const items: ReconciliationItem[] = useMemo(() => [
        {
            id: 'REC-001',
            bankEntry: { id: 'B1', date: '2026-01-03', amount: 5000, type: 'CREDIT', utr: 'UPI98765', description: 'GPay Settlement - Batch 10' },
            erpEntry: { id: 'E1', date: '2026-01-03', amount: 5000, direction: 'IN', source: 'SALE', reference_no: 'UPI98765' },
            status: 'MATCHED'
        },
        {
            id: 'REC-002',
            bankEntry: { id: 'B2', date: '2026-01-03', amount: 11000, type: 'CREDIT', utr: 'UPI29384', description: 'UPI Payer 456' },
            status: 'MISSING_IN_ERP',
            issue: 'UPI sale not posted in ERP ledger',
            recommended_action: 'Post missing UPI sale (Batch #104) to balance books'
        },
        {
            id: 'REC-003',
            erpEntry: { id: 'E2', date: '2026-01-02', amount: 2500, direction: 'OUT', source: 'EXPENSE', reference_no: 'CHQ001' },
            status: 'MISSING_IN_BANK',
            issue: 'Cheque not yet cleared in bank',
            recommended_action: 'Monitor for settlement or contact vendor'
        },
        {
            id: 'REC-004',
            bankEntry: { id: 'B3', date: '2026-01-03', amount: 8500, type: 'CREDIT', utr: 'CRD8899', description: 'PineLabs Card Settlement' },
            erpEntry: { id: 'E3', date: '2026-01-03', amount: 8450, direction: 'IN', source: 'SALE', reference_no: 'CRD8899' },
            status: 'WRONG_AMOUNT',
            issue: 'ERP amount mismatch (Mismatch: ₹50)',
            recommended_action: 'Verify transaction MDR fee or rounding error'
        },
        {
            id: 'REC-005',
            erpEntry: { id: 'E4', date: '2026-01-03', amount: 1500, direction: 'OUT', source: 'REFUND', reference_no: 'REF7722' },
            status: 'DUPLICATE',
            issue: 'Duplicate refund entry detected in ERP',
            recommended_action: 'Delete duplicate refund entry #E4'
        }
    ], []);

    const metrics = useMemo(() => {
        const erp_bal = 531000;
        const bank_bal = 520000;
        const difference = erp_bal - bank_bal;
        const unresolved = items.filter(i => i.status !== 'MATCHED').length;
        return { erp_bal, bank_bal, difference, unresolved };
    }, [items]);

    const filteredItems = items.filter(i => {
        const matchesSearch = (i.bankEntry?.utr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.erpEntry?.reference_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.issue?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterStatus === 'ALL' || i.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <Scale className="w-6 h-6 text-primary" />
                            Bank Reconciliation Intelligence
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Closing the gap between ERP ledgers and bank statements for <span className="font-bold text-primary">{typeof tenant_id === 'object' && tenant_id !== null ? (tenant_id as any).name : tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95">
                            <Download className="w-4 h-4" /> Download Recon Report
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95">
                            <RefreshCcw className="w-4 h-4" /> Sync Transactions
                        </button>
                    </div>
                </div>

                {/* Parity Pulse KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Landmark className="w-16 h-16" />
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1">Bank Statement Balance</p>
                        <h3 className="text-2xl font-black tabular-nums">₹{metrics.bank_bal.toLocaleString()}</h3>
                        <p className="text-[10px] text-neutral-500 mt-2 font-bold italic underline decoration-neutral-200">As of Jan 11, 2026</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1">ERP Ledger Balance</p>
                        <h3 className="text-2xl font-black tabular-nums">₹{metrics.erp_bal.toLocaleString()}</h3>
                        <p className="text-[10px] text-neutral-500 mt-2 font-bold italic underline decoration-neutral-200">System Recorded</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1">Reconciliation Delta</p>
                        <h3 className="text-2xl font-black text-error">₹{metrics.difference.toLocaleString()}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <AlertCircle className="w-4 h-4 text-error" />
                            <span className="text-xs font-black text-error">Mismatch Detected</span>
                        </div>
                    </div>

                    <div className="bg-primary text-white p-6 rounded-3xl shadow-xl shadow-primary/20 relative group overflow-hidden">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                        <p className="text-[10px] font-black text-primary-light uppercase tracking-[0.1em] mb-1">Unresolved Items</p>
                        <h3 className="text-2xl font-black italic">{metrics.unresolved} <span className="text-xs font-bold uppercase not-italic opacity-80">Pending Action</span></h3>
                        <p className="text-[10px] opacity-70 mt-2 font-bold">Audit ready: 60%</p>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-8">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search UTR, Ref or Issue..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        {(['ALL', 'MATCHED', 'MISSING_IN_ERP', 'MISSING_IN_BANK', 'WRONG_AMOUNT', 'DUPLICATE'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterStatus === s
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                    : 'bg-white dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'
                                    }`}
                            >
                                {s.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reconciliation Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Ledger Comparison View */}
                    <div className="lg:col-span-2 space-y-4">
                        {filteredItems.map(item => (
                            <div key={item.id} className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2rem] p-6 shadow-sm group hover:border-primary/30 transition-all ${item.status === 'MATCHED' ? 'opacity-70 grayscale-[0.5]' : 'border-l-4 border-l-primary'
                                }`}>
                                <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                                    {/* Bank Side */}
                                    <div className="flex-1 w-full text-center md:text-left">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Bank Statement</p>
                                        {item.bankEntry ? (
                                            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-black italic">₹{item.bankEntry.amount.toLocaleString()}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.bankEntry.type === 'CREDIT' ? 'bg-success/10 text-success' : 'bg-error text-white'}`}>
                                                        {item.bankEntry.type}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate">{item.bankEntry.description}</p>
                                                <p className="text-[9px] text-neutral-400 mt-1 uppercase font-black">UTR: {item.bankEntry.utr}</p>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl border border-dashed border-neutral-200 flex flex-col items-center justify-center min-h-[85px]">
                                                <Unlink className="w-5 h-5 text-neutral-300 mb-1" />
                                                <p className="text-[10px] italic font-bold text-neutral-400">No matching credit found</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Connector */}
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                        <div className={`p-2 rounded-full ${item.status === 'MATCHED' ? 'bg-success text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                                            {item.status === 'MATCHED' ? <CheckCircle2 className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${item.status === 'MATCHED' ? 'text-success' : 'text-neutral-400'}`}>
                                            {item.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    {/* ERP Side */}
                                    <div className="flex-1 w-full text-center md:text-right">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">ERP Bank Ledger</p>
                                        {item.erpEntry ? (
                                            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                                <div className="flex items-center justify-between mb-1 flex-row-reverse">
                                                    <span className="text-xs font-black italic">₹{item.erpEntry.amount.toLocaleString()}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.erpEntry.direction === 'IN' ? 'bg-primary/10 text-primary' : 'bg-neutral-500 text-white'}`}>
                                                        {item.erpEntry.direction}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate">{item.erpEntry.source} #{item.erpEntry.id}</p>
                                                <p className="text-[9px] text-neutral-400 mt-1 uppercase font-black">Ref: {item.erpEntry.reference_no}</p>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl border border-dashed border-neutral-200 flex flex-col items-center justify-center min-h-[85px]">
                                                <Link className="w-5 h-5 text-primary mb-1" />
                                                <p className="text-[10px] italic font-bold text-primary">Post entry to ledger</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {item.status !== 'MATCHED' && (
                                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl group/advice">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tight">{item.issue}</p>
                                                <p className="text-[11px] font-bold text-primary italic leading-tight mt-0.5">"{item.recommended_action}"</p>
                                            </div>
                                        </div>
                                        <button className="px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20 whitespace-nowrap">
                                            Resolve Now
                                        </button>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-neutral-50 dark:border-neutral-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-4">
                                        <button className="text-[10px] font-black text-neutral-400 hover:text-primary uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                            <History className="w-3.5 h-3.5" /> view audit trail
                                        </button>
                                        <button className="text-[10px] font-black text-neutral-400 hover:text-primary uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                            <ShieldAlert className="w-3.5 h-3.5" /> report fraud
                                        </button>
                                    </div>
                                    <button className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredItems.length === 0 && (
                            <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 p-12 flex flex-col items-center text-center">
                                <CheckCircle2 className="w-16 h-16 text-success mb-4 opacity-20" />
                                <h3 className="text-xl font-black mb-2">Workspace Clear</h3>
                                <p className="text-sm text-neutral-500 max-w-xs font-medium italic">All transactions for selected filters are perfectly reconciled and audit-ready.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Rail - Strategic Insights */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Reconciliation Intelligence</h4>

                        {/* Branch Accuracy Summary */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">Branch Parity Score</p>
                            <div className="space-y-5">
                                {[
                                    { name: 'Chennai OMR', score: 98, diff: -500 },
                                    { name: 'Madurai Godown', score: 100, diff: 0 },
                                    { name: 'HQ Corporate', score: 92, diff: -10500 },
                                ].map((branch, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-black">{branch.name}</span>
                                            <span className={`text-[10px] font-black ${branch.diff === 0 ? 'text-success' : 'text-error'}`}>
                                                {branch.diff === 0 ? 'Parity OK' : `₹${branch.diff.toLocaleString()} gap`}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${branch.score === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${branch.score}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Security Hub */}
                        <div className="bg-neutral-950 text-white p-8 rounded-[2.5rem] border border-neutral-800 relative overflow-hidden group shadow-2xl">
                            <Landmark className="absolute -bottom-10 -left-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 transition-transform duration-[1.5s]" />
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                                    <ShieldAlert className="w-4 h-4 fill-current" /> Wings Anti-Leak Detection
                                </div>

                                <h4 className="text-2xl font-black mb-4 leading-tight">
                                    Protect your <span className="text-primary italic">Financial Core.</span>
                                </h4>

                                <div className="space-y-4 mb-8">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group/sub hover:bg-white/10 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-error uppercase tracking-widest">Fraud Risk Alert</span>
                                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                        </div>
                                        <p className="text-[11px] font-bold text-neutral-400 group-hover/sub:text-white transition-colors leading-relaxed">
                                            <span className="text-white">Duplicate Refund detected</span> at Chennai Store. ₹1,500 recorded twice in ERP against single customer debit.
                                        </p>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                    Execute Auto-Resolution <Zap className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="p-5 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex gap-3 italic">
                            <Activity className="w-5 h-5 text-neutral-400 shrink-0" />
                            <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
                                The Reconciliation Agent uses <span className="text-primary font-black uppercase">Deep Settlement Matching</span> to ensure every rupee from your payment terminal actually hits your bank account without leakages.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BankReconciliation;
