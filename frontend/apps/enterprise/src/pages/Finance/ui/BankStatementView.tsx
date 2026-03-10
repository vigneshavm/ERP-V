import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, FileText, TrendingUp, TrendingDown, Activity, RefreshCw, CheckCircle2, Clock3, ChevronUp, ChevronDown } from 'lucide-react';
import { bankStatementService, BankStatementTransaction } from "@/entities/finance/api/bankStatementService";
import { toast } from 'react-toastify';

/* ─── Summary card ─────────────────────────────────────────────────────────── */
interface SummaryCardProps {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    accent: string;       // tailwind bg class for icon circle
    textAccent: string;   // tailwind text class for value
    delay: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, sub, icon, accent, textAccent, delay }) => (
    <div
        className="bg-card border border-default rounded-2xl p-5 flex items-start gap-4 shadow-sm"
        style={{ animation: `bs-rise 0.5s ease-out ${delay}ms both` }}
    >
        <div className={`${accent} p-3 rounded-xl flex-shrink-0`}>{icon}</div>
        <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">{label}</p>
            <p className={`text-2xl font-bold ${textAccent} leading-none`}>{value}</p>
            <p className="text-xs text-muted mt-1">{sub}</p>
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
            ? (sortDir === 'desc' ? <ChevronDown className="w-3.5 h-3.5 inline ml-1" /> : <ChevronUp className="w-3.5 h-3.5 inline ml-1" />)
            : <span className="w-3.5 h-3.5 inline-block ml-1 opacity-25">↕</span>
    );

    return (
        <>
            {/* ── Injected keyframes ─────────────────────────────────────────── */}
            <style>{`
                @keyframes bs-rise {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes bs-spin-slow {
                    to { transform: rotate(360deg); }
                }
                @keyframes bs-pulse-ring {
                    0%   { box-shadow: 0 0 0 0 rgba(var(--color-primary)/0.35); }
                    70%  { box-shadow: 0 0 0 10px rgba(var(--color-primary)/0); }
                    100% { box-shadow: 0 0 0 0 rgba(var(--color-primary)/0); }
                }
                .bs-row:nth-child(odd)  { background: rgba(var(--color-primary)/0.025); }
                .bs-row:hover           { background: rgba(var(--color-primary)/0.06); }
                .bs-drop-active         { box-shadow: 0 0 0 3px rgb(var(--color-primary)); }
            `}</style>

            <div className="space-y-6" style={{ animation: 'bs-rise 0.4s ease-out both' }}>

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1">Finance</p>
                        <h1 className="text-3xl font-extrabold tracking-tight text-main">Bank Statements</h1>
                        <p className="text-sm text-muted mt-1">AI-powered extraction &amp; transaction intelligence</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={loadTransactions}
                            disabled={fetching}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-default text-sm font-medium text-secondary hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all duration-200"
                        >
                            <RefreshCw className={`w-4 h-4 ${fetching ? '[animation:bs-spin-slow_1s_linear_infinite]' : ''}`} />
                            Refresh
                        </button>

                        <input
                            type="file"
                            accept="application/pdf,image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            style={loading ? {} : { animation: 'bs-pulse-ring 2s infinite' }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition-all duration-200"
                        >
                            {loading
                                ? <RefreshCw className="w-4 h-4 [animation:bs-spin-slow_0.8s_linear_infinite]" />
                                : <Upload className="w-4 h-4" />}
                            {loading ? 'Analysing…' : 'Upload Statement'}
                        </button>
                    </div>
                </div>

                {/* ── Summary Cards ───────────────────────────────────────────── */}
                {transactions.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard
                            label="Total Credits"
                            value={fmt(totalCredit)}
                            sub={`${transactions.filter(t => t.type === 'credit').length} transactions`}
                            icon={<TrendingUp className="w-5 h-5 text-success" />}
                            accent="bg-success-soft"
                            textAccent="text-success"
                            delay={0}
                        />
                        <SummaryCard
                            label="Total Debits"
                            value={fmt(totalDebit)}
                            sub={`${transactions.filter(t => t.type === 'debit').length} transactions`}
                            icon={<TrendingDown className="w-5 h-5 text-error" />}
                            accent="bg-error-soft"
                            textAccent="text-error"
                            delay={80}
                        />
                        <SummaryCard
                            label="Net Flow"
                            value={fmt(Math.abs(netFlow))}
                            sub={netFlow >= 0 ? '▲ Net positive cash flow' : '▼ Net negative outflow'}
                            icon={<Activity className="w-5 h-5 text-primary" />}
                            accent="bg-primary-soft"
                            textAccent={netFlow >= 0 ? 'text-success' : 'text-error'}
                            delay={160}
                        />
                    </div>
                )}

                {/* ── Drag-&-Drop Upload Zone ─────────────────────────────────── */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !loading && fileInputRef.current?.click()}
                    className={[
                        'relative border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 text-center select-none',
                        dragging
                            ? 'border-primary bg-primary-soft bs-drop-active scale-[1.01]'
                            : 'border-default hover:border-primary/50 hover:bg-primary-soft/40',
                        loading ? 'pointer-events-none opacity-60' : '',
                    ].join(' ')}
                    style={{ animation: 'bs-rise 0.45s ease-out 0.1s both' }}
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl ${dragging ? 'bg-primary' : 'bg-primary-soft'} flex items-center justify-center transition-colors duration-200`}>
                            {loading
                                ? <RefreshCw className="w-7 h-7 text-primary [animation:bs-spin-slow_0.9s_linear_infinite]" />
                                : <FileText className={`w-7 h-7 ${dragging ? 'text-white' : 'text-primary'}`} />}
                        </div>
                        <div>
                            <p className="font-semibold text-main text-sm">
                                {loading ? 'Processing with Gemini AI…' : dragging ? 'Drop to upload' : 'Drag & drop a PDF or image here'}
                            </p>
                            {!loading && (
                                <p className="text-xs text-muted mt-0.5">
                                    or <span className="text-primary font-medium underline underline-offset-2">browse files</span> · PDF, JPG, PNG up to 10 MB
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Transactions Panel ───────────────────────────────────────── */}
                <div
                    className="bg-card border border-default rounded-2xl shadow-sm overflow-hidden"
                    style={{ animation: 'bs-rise 0.5s ease-out 0.2s both' }}
                >
                    {/* Panel header with filter tabs */}
                    <div className="px-5 py-4 border-b border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="font-bold text-main text-base tracking-tight">
                            Extracted Transactions
                            {!fetching && transactions.length > 0 && (
                                <span className="ml-2 text-xs font-normal text-muted">({displayed.length} shown)</span>
                            )}
                        </h2>

                        {/* Filter pills */}
                        <div className="flex items-center gap-1 bg-surface rounded-lg p-1 self-start sm:self-auto">
                            {(['all', 'credit', 'debit'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={[
                                        'px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all duration-150',
                                        filterType === type
                                            ? 'bg-card shadow text-main'
                                            : 'text-muted hover:text-main',
                                    ].join(' ')}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            {/* Table header */}
                            <thead>
                                <tr className="border-b border-default">
                                    <th
                                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer select-none hover:text-primary transition-colors"
                                        onClick={() => toggleSort('date')}
                                    >
                                        Date <SortIcon field="date" />
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Description</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                                    <th
                                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer select-none hover:text-primary transition-colors text-right"
                                        onClick={() => toggleSort('amount')}
                                    >
                                        Amount <SortIcon field="amount" />
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted hidden md:table-cell">Balance</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted text-center">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {fetching ? (
                                    /* ── Skeleton ── */
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-default last:border-0">
                                            {[5, 8, 3, 4, 3, 3].map((w, j) => (
                                                <td key={j} className="px-5 py-4">
                                                    <div
                                                        className="h-3 rounded-full bg-surface animate-pulse"
                                                        style={{ width: `${w * 10}%`, animationDelay: `${i * 60 + j * 30}ms` }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : displayed.length === 0 ? (
                                    /* ── Empty state ── */
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center">
                                                    <FileText className="w-8 h-8 text-primary" />
                                                </div>
                                                <p className="font-semibold text-main">No transactions yet</p>
                                                <p className="text-sm text-muted max-w-xs">
                                                    Upload a PDF or image bank statement above. Gemini AI will extract and categorise every transaction automatically.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayed.map((tx, idx) => (
                                        <tr
                                            key={tx._id}
                                            className="bs-row border-b border-default last:border-0 transition-colors duration-150"
                                            style={{ animation: `bs-rise 0.35s ease-out ${idx * 35}ms both` }}
                                        >
                                            {/* Date */}
                                            <td className="px-5 py-3.5 text-muted text-xs font-mono whitespace-nowrap">
                                                {fmtDate(tx.date)}
                                            </td>

                                            {/* Description */}
                                            <td className="px-5 py-3.5 max-w-[200px]">
                                                <p className="text-main font-medium truncate" title={tx.description}>{tx.description}</p>
                                                {tx.reference && (
                                                    <p className="text-xs text-muted mt-0.5 font-mono truncate">Ref: {tx.reference}</p>
                                                )}
                                            </td>

                                            {/* Type badge */}
                                            <td className="px-5 py-3.5">
                                                <span className={[
                                                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide',
                                                    tx.type === 'credit'
                                                        ? 'bg-success-soft text-success'
                                                        : 'bg-error-soft text-error',
                                                ].join(' ')}>
                                                    {tx.type === 'credit' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {tx.type}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className={[
                                                'px-5 py-3.5 text-right font-bold tabular-nums whitespace-nowrap text-sm',
                                                tx.type === 'credit' ? 'text-success' : 'text-error',
                                            ].join(' ')}>
                                                {tx.type === 'credit' ? '+' : '−'}{fmt(tx.amount)}
                                            </td>

                                            {/* Balance */}
                                            <td className="px-5 py-3.5 text-muted text-xs font-mono hidden md:table-cell whitespace-nowrap">
                                                {tx.balance != null ? fmt(tx.balance) : '—'}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3.5 text-center">
                                                {tx.status === 'reconciled' ? (
                                                    <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Reconciled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-warning text-xs font-semibold">
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

                    {/* Footer totals row */}
                    {displayed.length > 0 && (
                        <div className="px-5 py-3 border-t border-default bg-surface flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs font-semibold text-muted">
                            <span>{displayed.length} transaction{displayed.length !== 1 ? 's' : ''}</span>
                            <div className="flex gap-6">
                                <span>Credits: <span className="text-success">{fmt(displayed.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0))}</span></span>
                                <span>Debits: <span className="text-error">{fmt(displayed.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0))}</span></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default BankStatementView;
