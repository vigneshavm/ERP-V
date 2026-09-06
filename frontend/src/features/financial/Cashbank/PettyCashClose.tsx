import React, { useEffect, useMemo, useState } from 'react';
import { IndianRupee, CheckCircle2, AlertTriangle, Loader2, CreditCard, Wallet, Ban, History } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency } from '@/utils/helpers';

// Denomination-based petty cash close screen -- the counterpart to Textilesoft's
// "Closingpattycash": the cashier counts physical notes/coins by denomination, and that count is
// reconciled against what the system expects (cash sales - cash expenses) plus card/credit sales
// and manually-tallied cancelled bills, matching Textilesoft's close-of-shift fields.
// Sits alongside the existing DayEndModal (a whole-day reconciliation); this is the per-shift/
// per-counter cash-drawer close.

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10] as const;
type DenomKey = `d${typeof DENOMINATIONS[number]}`;

interface Summary {
    date: string;
    counterId: string;
    openingCash: number;
    cashSales: number;
    cashExpenses: number;
    expectedCash: number;
    cardAmount: number;
    creditAmount: number;
}

interface HistoryRow {
    _id: string;
    date: string;
    counterId: string;
    countedCash: number;
    expectedCash: number;
    variance: number;
    status: string;
    performedBy?: { name?: string };
}

const emptyCounts = (): Record<DenomKey, string> =>
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [`d${d}`]: '' }), {} as Record<DenomKey, string>);

const PettyCashClose: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [counts, setCounts] = useState<Record<DenomKey, string>>(emptyCounts());
    const [coinsAmount, setCoinsAmount] = useState('');
    const [cancelledBillCount, setCancelledBillCount] = useState('');
    const [cancelledBillAmount, setCancelledBillAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [history, setHistory] = useState<HistoryRow[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSummary();
        fetchHistory();
    }, []);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/petty-cash/summary');
            setSummary(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load petty cash summary');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/api/petty-cash/history', { params: { limit: 10 } });
            setHistory(res.data || []);
        } catch {
            // History is supplementary context; a failed fetch shouldn't block closing the drawer.
        }
    };

    const countedCash = useMemo(() => {
        const notesTotal = DENOMINATIONS.reduce((sum, d) => sum + d * (parseInt(counts[`d${d}`], 10) || 0), 0);
        return notesTotal + (parseFloat(coinsAmount) || 0);
    }, [counts, coinsAmount]);

    const variance = summary ? countedCash - summary.expectedCash : 0;

    const handleSave = async () => {
        if (!summary) return;
        setSaving(true);
        setError('');
        try {
            const denominations = {
                ...DENOMINATIONS.reduce((acc, d) => ({ ...acc, [`d${d}`]: parseInt(counts[`d${d}`], 10) || 0 }), {}),
                coinsAmount: parseFloat(coinsAmount) || 0,
            };
            await api.post('/api/petty-cash/close', {
                date: summary.date,
                counterId: summary.counterId,
                denominations,
                expectedCash: summary.expectedCash,
                cardAmount: summary.cardAmount,
                creditAmount: summary.creditAmount,
                cancelledBillCount: parseInt(cancelledBillCount, 10) || 0,
                cancelledBillAmount: parseFloat(cancelledBillAmount) || 0,
                notes,
            });
            setCounts(emptyCounts());
            setCoinsAmount('');
            setCancelledBillCount('');
            setCancelledBillAmount('');
            setNotes('');
            await Promise.all([fetchSummary(), fetchHistory()]);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save petty cash close');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-primary" /> Petty Cash Close
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium text-sm">
                    Count the drawer by denomination and reconcile against system-recorded sales.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 rounded-lg text-rose-700 dark:text-danger text-sm font-bold">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : summary ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-4">Count Physical Cash</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {DENOMINATIONS.map((d) => (
                                    <div key={d}>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">₹{d} Notes</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="number"
                                                min="0"
                                                value={counts[`d${d}`]}
                                                onChange={(e) => setCounts((prev) => ({ ...prev, [`d${d}`]: e.target.value }))}
                                                placeholder="0"
                                                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            <span className="text-xs font-bold text-neutral-400 whitespace-nowrap">
                                                = ₹{(d * (parseInt(counts[`d${d}`], 10) || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Coins / Loose Change (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={coinsAmount}
                                        onChange={(e) => setCoinsAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-neutral-500">Total Counted</span>
                                <span className="text-2xl font-black italic text-primary">₹{formatCurrency(countedCash)}</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                                <Ban className="w-4 h-4" /> Cancelled / Voided Bills
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Count</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cancelledBillCount}
                                        onChange={(e) => setCancelledBillCount(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Value (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cancelledBillAmount}
                                        onChange={(e) => setCancelledBillAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    placeholder="Any discrepancies or notes..."
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving || countedCash === 0}
                            className="w-full py-4 bg-neutral-950 dark:bg-primary text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            {saving ? 'Saving…' : 'Close Petty Cash & Save'}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-neutral-900 text-white p-6 rounded-[2rem] shadow-xl">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">System Expected (Today)</p>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-neutral-400">Opening Cash</span><span className="font-bold">₹{formatCurrency(summary.openingCash)}</span></div>
                                <div className="flex justify-between"><span className="text-neutral-400">+ Cash Sales</span><span className="font-bold text-success">₹{formatCurrency(summary.cashSales)}</span></div>
                                <div className="flex justify-between"><span className="text-neutral-400">- Cash Expenses</span><span className="font-bold text-error">₹{formatCurrency(summary.cashExpenses)}</span></div>
                                <div className="pt-3 border-t border-white/10 flex justify-between">
                                    <span className="font-black uppercase text-xs tracking-widest">Expected Cash</span>
                                    <span className="text-xl font-black text-primary">₹{formatCurrency(summary.expectedCash)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5" /> Other Tender (Reference)
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-neutral-500">Card Sales</span><span className="font-bold">₹{formatCurrency(summary.cardAmount)}</span></div>
                                <div className="flex justify-between"><span className="text-neutral-500">Credit / Due Sales</span><span className="font-bold">₹{formatCurrency(summary.creditAmount)}</span></div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-[2rem] border ${variance === 0 ? 'bg-success/10 border-success/20' : variance > 0 ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'}`}>
                            <div className="flex items-center gap-3">
                                {variance >= 0 ? <CheckCircle2 className="w-6 h-6 text-success shrink-0" /> : <AlertTriangle className="w-6 h-6 text-error shrink-0" />}
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Variance</p>
                                    <p className={`text-lg font-black ${variance >= 0 ? 'text-success' : 'text-error'}`}>
                                        ₹{formatCurrency(Math.abs(variance))} {variance >= 0 ? 'Surplus' : 'Shortage'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {history.length > 0 && (
                            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <History className="w-3.5 h-3.5" /> Recent Closes
                                </p>
                                <div className="space-y-3">
                                    {history.map((h) => (
                                        <div key={h._id} className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-neutral-500">{new Date(h.date).toLocaleDateString('en-IN')}</span>
                                            <span className={`font-black ${h.variance >= 0 ? 'text-success' : 'text-error'}`}>
                                                {h.variance >= 0 ? '+' : ''}₹{formatCurrency(Math.abs(h.variance))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-neutral-400 flex items-center justify-center gap-2">
                    <IndianRupee className="w-5 h-5" /> Failed to load summary. Please try again.
                </div>
            )}
        </div>
    );
};

export default PettyCashClose;
