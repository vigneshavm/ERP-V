import React, { useEffect, useState } from 'react';
import { AlertTriangle, Search, Package, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

interface ItemOption {
    _id: string;
    name: string;
    sku?: string;
    stockQty: number;
}

interface WriteOffRecord {
    itemName: string;
    quantity: number;
    cause: 'DAMAGE' | 'MISSING';
    reason: string;
    at: string;
}

// Records stock lost to damage or unexplained shrinkage, separate from a normal sale or
// manual adjustment -- covers the Textilesoft "StockDamage"/"StockMissing" gap. Posts to
// POST /api/inventory/write-off (InventoryService.writeOffStock), which logs a StockLog
// entry with type DAMAGE or MISSING so it's distinguishable from ADJUST/SALES in history.
const StockWriteOff: React.FC = () => {
    const [search, setSearch] = useState('');
    const [options, setOptions] = useState<ItemOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);

    const [quantity, setQuantity] = useState('');
    const [cause, setCause] = useState<'DAMAGE' | 'MISSING'>('DAMAGE');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [recent, setRecent] = useState<WriteOffRecord[]>([]);

    useEffect(() => {
        if (!search.trim() || selectedItem) {
            setOptions([]);
            return;
        }
        let cancelled = false;
        setSearching(true);
        const handle = setTimeout(async () => {
            try {
                const res = await api.get('/api/inventory', { params: { search, limit: 10 } });
                if (!cancelled) setOptions(res.data?.items || []);
            } catch {
                if (!cancelled) setOptions([]);
            } finally {
                if (!cancelled) setSearching(false);
            }
        }, 300);
        return () => { cancelled = true; clearTimeout(handle); };
    }, [search, selectedItem]);

    const resetForm = () => {
        setSelectedItem(null);
        setSearch('');
        setQuantity('');
        setCause('DAMAGE');
        setReason('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedItem) {
            setError('Select an item first');
            return;
        }
        const qty = Number(quantity);
        if (!qty || qty <= 0) {
            setError('Enter a valid quantity');
            return;
        }
        if (qty > selectedItem.stockQty) {
            setError(`Only ${selectedItem.stockQty} in stock`);
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/api/inventory/write-off', {
                itemId: selectedItem._id,
                quantity: qty,
                cause,
                reason: reason.trim()
            });
            setRecent(prev => [{ itemName: selectedItem.name, quantity: qty, cause, reason: reason.trim(), at: new Date().toLocaleString() }, ...prev]);
            resetForm();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to record write-off');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-rose-600 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-white" /></div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Damage / Loss Write-Off</h1>
                    <p className="text-xs text-slate-500">Record stock lost to damage or unexplained shrinkage</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Item</label>
                        {selectedItem ? (
                            <div className="mt-1 flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedItem.name}</p>
                                    <p className="text-xs text-slate-500">{selectedItem.sku || '—'} · In stock: {selectedItem.stockQty}</p>
                                </div>
                                <button type="button" onClick={() => setSelectedItem(null)} className="text-xs font-bold text-primary">Change</button>
                            </div>
                        ) : (
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search item by name or SKU..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
                                {options.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                                        {options.map(opt => (
                                            <button
                                                type="button"
                                                key={opt._id}
                                                onClick={() => { setSelectedItem(opt); setOptions([]); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                            >
                                                <Package className="w-4 h-4 text-slate-400" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{opt.name}</p>
                                                    <p className="text-xs text-slate-500">{opt.sku || '—'} · In stock: {opt.stockQty}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                            <input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Cause</label>
                            <div className="flex gap-1 mt-1">
                                {(['DAMAGE', 'MISSING'] as const).map(c => (
                                    <button
                                        type="button"
                                        key={c}
                                        onClick={() => setCause(c)}
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${cause === c ? 'bg-rose-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                                    >
                                        {c === 'DAMAGE' ? 'Damage' : 'Missing / Shrinkage'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Reason</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                            placeholder="e.g. Water damage in storage, unexplained count mismatch during audit..."
                            className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all"
                    >
                        {submitting ? 'Recording...' : 'Record Write-Off'}
                    </button>
                </form>

                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4">Recorded this session</h4>
                    {recent.length === 0 ? (
                        <p className="text-xs text-slate-400">No write-offs recorded yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recent.map((r, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{r.itemName} <span className="text-rose-600">-{r.quantity}</span></p>
                                        <p className="text-xs text-slate-500">{r.cause === 'DAMAGE' ? 'Damage' : 'Missing / Shrinkage'} · {r.at}</p>
                                        {r.reason && <p className="text-xs text-slate-400 mt-0.5">{r.reason}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockWriteOff;
