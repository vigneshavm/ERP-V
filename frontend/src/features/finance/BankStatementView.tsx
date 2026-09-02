import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, FileText, TrendingUp, TrendingDown, Activity, RefreshCw, CheckCircle2, Clock3, ChevronUp, ChevronDown, Download, Info } from 'lucide-react';
import { bankStatementService, BankStatementTransaction } from '../../services/bankStatementService';
import { toast } from 'react-toastify';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';

/* ─── Summary card ─────────────────────────────────────────────────────────── */
interface SummaryCardProps {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, sub, icon, colorClass, bgClass }) => (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2rem] p-6 shadow-sm flex items-start gap-4 group hover:border-primary/20 transition-all duration-500">
        <div className={`p-3.5 rounded-sm ${bgClass} ${colorClass} shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">{label}</p>
            <p className={`text-2xl font-black tracking-tighter tabular-nums leading-none ${colorClass}`}>{value}</p>
            <p className="text-[10px] font-bold text-neutral-500 mt-2 italic">{sub}</p>
        </div>
    </div>
);

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* ─── Main view ─────────────────────────────────────────────────────────────── */
const BankStatementView: React.FC = () => {
    const [transactions, setTransactions] = useState<BankStatementTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [sortField, setSortField] = useState<'date' | 'amount'>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadTransactions(); }, []);

    const loadTransactions = async () => {
        setFetching(true);
        try {
            const data = await bankStatementService.getTransactions();
            if (data.success) setTransactions(data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch transactions');
        } finally {
            setFetching(false);
        }
    };

    const processFile = useCallback(async (file: File | undefined) => {
        if (!file) return;
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            toast.error('Only PDF or image files are supported.');
            return;
        }
        setLoading(true);
        try {
            const result = await bankStatementService.uploadStatement(file);
            if (result.success) {
                toast.success('Bank statement parsed successfully!');
                loadTransactions();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error processing bank statement');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        processFile(e.target.files?.[0]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        processFile(e.dataTransfer.files?.[0]);
    }, [processFile]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);

    /* ── computed ── */
    const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const netFlow = totalCredit - totalDebit;

    const displayed = [...transactions]
        .filter(t => filterType === 'all' || t.type === filterType)
        .sort((a, b) => {
            const mul = sortDir === 'asc' ? 1 : -1;
            if (sortField === 'date') return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
            if (sortField === 'amount') return mul * (a.amount - b.amount);
            return 0;
        });

    const toggleSort = (field: 'date' | 'amount') => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const SortIcon = ({ field }: { field: 'date' | 'amount' }) => (
        sortField === field
            ? (sortDir === 'desc' ? <ChevronDown className="w-4 h-4 inline ml-1.5" /> : <ChevronUp className="w-4 h-4 inline ml-1.5" />)
            : <span className="w-4 h-4 inline-block ml-1.5 opacity-20">↕</span>
    );

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Statement Intelligence"
                    description="AI-powered extraction and institutional transaction mapping."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance', link: '/finance' },
                        { label: 'Statements' }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button
                                onClick={loadTransactions}
                                disabled={fetching}
                                className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} /> Sync Data
                            </button>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,image/*"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {loading ? 'Analyzing...' : 'Upload Statement'}
                            </button>
                        </div>
                    }
                />

                {/* KPI Overview Pulse */}
                {transactions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryCard
                            label="Consolidated Credits"
                            value={fmt(totalCredit)}
                            sub={`${transactions.filter(t => t.type === 'credit').length} inbound nodes`}
                            icon={<TrendingUp className="w-6 h-6" />}
                            colorClass="text-success"
                            bgClass="bg-emerald-50 dark:bg-emerald-900/20"
                        />
                        <SummaryCard
                            label="Consolidated Debits"
                            value={fmt(totalDebit)}
                            sub={`${transactions.filter(t => t.type === 'debit').length} outbound nodes`}
                            icon={<TrendingDown className="w-6 h-6" />}
                            colorClass="text-danger"
                            bgClass="bg-rose-50 dark:bg-rose-900/20"
                        />
                        <SummaryCard
                            label="Net Capital Flow"
                            value={fmt(Math.abs(netFlow))}
                            sub={netFlow >= 0 ? '▲ Net surplus position' : '▼ Net deficit position'}
                            icon={<Activity className="w-6 h-6" />}
                            colorClass={netFlow >= 0 ? 'text-success' : 'text-danger'}
                            bgClass={netFlow >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}
                        />
                    </div>
                )}

                {/* Drop Zone Intel */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !loading && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-[3rem] p-12 cursor-pointer transition-all duration-700 text-center flex flex-col items-center gap-6 group overflow-hidden ${
                        dragging
                            ? 'border-primary bg-primary/5 scale-[1.02] shadow-2xl'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-primary/40 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30'
                    } ${loading ? 'pointer-events-none opacity-40' : ''}`}
                >
                    <div className={`w-20 h-20 rounded-sm flex items-center justify-center transition-all duration-700 ${dragging ? 'bg-primary text-white' : 'bg-primary/10 text-primary'} shadow-xl group-hover:scale-110`}>
                        {loading ? <RefreshCw className="w-10 h-10 animate-spin" /> : <FileText className="w-10 h-10" />}
                    </div>
                    <div>
                        <p className="text-xl font-black text-neutral-900 dark:text-white tracking-tighter italic">
                            {loading ? 'Executing Gemini AI Protocols...' : dragging ? 'Release to Initialize Upload' : 'Deploy Bank Statement for Analysis'}
                        </p>
                        {!loading && (
                            <p className="text-xs font-bold text-neutral-400 mt-2 uppercase tracking-widest italic">
                                Supports PDF, JPG, PNG · Maximum Payload 10MB
                            </p>
                        )}
                    </div>
                    {/* Background glow */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-700" />
                </div>

                {/* Transactions Archive */}
                <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Institutional Records</h2>
                            {!fetching && transactions.length > 0 && (
                                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-black text-neutral-400 rounded-full">
                                    {displayed.length} NODES
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 p-1.5 bg-neutral-50 dark:bg-neutral-900 rounded-sm border border-neutral-100 dark:border-neutral-800">
                            {(['all', 'credit', 'debit'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filterType === type
                                            ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                                            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th
                                        className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => toggleSort('date')}
                                    >
                                        Fiscal Date <SortIcon field="date" />
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Narration</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Classification</th>
                                    <th
                                        className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => toggleSort('amount')}
                                    >
                                        Quantum <SortIcon field="amount" />
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right hidden md:table-cell">Residual Balance</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {fetching ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-6"><div className="h-2 w-20 bg-neutral-100 dark:bg-neutral-900 rounded-full" /></td>
                                            <td className="px-8 py-6"><div className="h-2 w-48 bg-neutral-100 dark:bg-neutral-900 rounded-full" /></td>
                                            <td className="px-8 py-6"><div className="h-4 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-full" /></td>
                                            <td className="px-8 py-6"><div className="h-2 w-24 bg-neutral-100 dark:bg-neutral-900 rounded-full ml-auto" /></td>
                                            <td className="px-8 py-6"><div className="h-2 w-24 bg-neutral-100 dark:bg-neutral-900 rounded-full ml-auto" /></td>
                                            <td className="px-8 py-6"><div className="h-4 w-20 bg-neutral-100 dark:bg-neutral-900 rounded-full mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : displayed.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-6 max-w-sm mx-auto opacity-40">
                                                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                    <Info className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-widest">Vault Empty</p>
                                                    <p className="text-xs font-bold mt-2 italic leading-relaxed">Gemini AI is ready. Upload a bank statement to begin extraction protocols.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayed.map((tx, __idx) => (
                                        <tr key={tx._id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all cursor-default">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-xs font-black text-neutral-500 font-mono tracking-tighter uppercase">{fmtDate(tx.date)}</span>
                                            </td>
                                            <td className="px-8 py-6 max-w-xs">
                                                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate uppercase tracking-tighter" title={tx.description}>{tx.description}</p>
                                                {tx.reference && (
                                                    <p className="text-[10px] font-black text-neutral-400 mt-1 font-mono uppercase tracking-widest">REF: {tx.reference}</p>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    tx.type === 'credit'
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-success'
                                                        : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-danger'
                                                }`}>
                                                    {tx.type === 'credit' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={`px-8 py-6 text-right whitespace-nowrap text-sm font-black tabular-nums ${tx.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                                                {tx.type === 'credit' ? '+' : '−'}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-8 py-6 text-right whitespace-nowrap text-xs font-black text-neutral-400 font-mono hidden md:table-cell tabular-nums">
                                                {tx.balance != null ? tx.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {tx.status === 'reconciled' ? (
                                                    <span className="inline-flex items-center gap-1.5 text-success text-[10px] font-black uppercase tracking-widest">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Locked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-warning text-[10px] font-black uppercase tracking-widest">
                                                        <Clock3 className="w-3.5 h-3.5" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Ledger Intelligence Summary Footer */}
                    {displayed.length > 0 && (
                        <div className="px-8 py-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-wrap items-center justify-between gap-8 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                            <div className="flex items-center gap-4">
                                <span className="text-neutral-500">{displayed.length} NODES AUDITED</span>
                                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800" />
                                <span>CREDITS: <span className="text-success">₹{displayed.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}</span></span>
                                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800" />
                                <span>DEBITS: <span className="text-danger">₹{displayed.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}</span></span>
                            </div>
                            <button className="flex items-center gap-2 hover:text-primary transition-colors italic">
                                <Download className="w-3.5 h-3.5" /> Generate Intelligence Report
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default BankStatementView;
