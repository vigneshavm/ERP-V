import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ArrowRightLeft, Plus, X, Package, Search } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import api from "../../services/api";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchMasterEntries } from "../../redux/slices/masterDataSlice";
import { formatDate } from '../../utils/helpers';

interface ItemOption {
    _id: string;
    name: string;
    sku?: string;
}

interface TransferItemDraft {
    productId: string;
    productName: string;
    quantity: number;
}

interface TransferRecord {
    _id: string;
    transferNumber: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: { productName: string; quantity: number }[];
    transferDate: string;
    notes?: string;
}

// General inter-warehouse stock move, NOT scoped to a goods receipt -- see GRNTransfer.tsx
// (frontend/src/features/purchase/GRNTransfer.tsx) for the GRN-scoped sibling. Covers the
// Textilesoft MaterialTransfer/StoreTransferEntry gap: moving existing stock between
// warehouses regardless of when/how it arrived.
const StockTransfer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { entriesByType } = useSelector((state: RootState) => state.masterData);
    const warehouses = entriesByType.WAREHOUSE || [];

    const [transfers, setTransfers] = useState<TransferRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [fromWarehouseId, setFromWarehouseId] = useState('');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [notes, setNotes] = useState('');
    const [draftItems, setDraftItems] = useState<TransferItemDraft[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [itemSearch, setItemSearch] = useState('');
    const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

    useEffect(() => {
        dispatch(fetchMasterEntries({ type: 'WAREHOUSE' }) as any);
        fetchTransfers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!itemSearch.trim()) {
            setItemOptions([]);
            return;
        }
        let cancelled = false;
        const handle = setTimeout(async () => {
            try {
                const { data } = await api.get('/api/inventory', { params: { search: itemSearch, limit: 10 } });
                if (!cancelled) setItemOptions(data?.items || []);
            } catch {
                if (!cancelled) setItemOptions([]);
            }
        }, 300);
        return () => { cancelled = true; clearTimeout(handle); };
    }, [itemSearch]);

    const fetchTransfers = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/api/stock-transfers');
            setTransfers(data?.data || []);
        } catch (err) {
            console.error('Failed to fetch stock transfers', err);
        } finally {
            setIsLoading(false);
        }
    };

    const addDraftItem = (opt: ItemOption) => {
        setDraftItems(prev => prev.some(i => i.productId === opt._id)
            ? prev
            : [...prev, { productId: opt._id, productName: opt.name, quantity: 0 }]);
        setItemSearch('');
        setItemOptions([]);
    };

    const updateDraftQty = (productId: string, qty: number) => {
        setDraftItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(0, qty) } : i));
    };

    const removeDraftItem = (productId: string) => {
        setDraftItems(prev => prev.filter(i => i.productId !== productId));
    };

    const resetForm = () => {
        setFromWarehouseId('');
        setToWarehouseId('');
        setNotes('');
        setDraftItems([]);
        setItemSearch('');
        setItemOptions([]);
    };

    const handleSubmit = async () => {
        const itemsToSend = draftItems.filter(i => i.quantity > 0);
        if (!fromWarehouseId || !toWarehouseId) { toast.warning('Select both warehouses'); return; }
        if (fromWarehouseId === toWarehouseId) { toast.warning('Source and destination warehouse must differ'); return; }
        if (itemsToSend.length === 0) { toast.warning('Add at least one item with a quantity'); return; }

        setIsSaving(true);
        try {
            await api.post('/api/stock-transfers', {
                fromWarehouseId,
                toWarehouseId,
                notes,
                items: itemsToSend.map(i => ({
                    productId: i.productId,
                    productName: i.productName,
                    quantity: i.quantity
                }))
            });
            toast.success('Stock transferred successfully');
            setIsModalOpen(false);
            resetForm();
            fetchTransfers();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to transfer stock');
        } finally {
            setIsSaving(false);
        }
    };

    const warehouseName = (id: string) => (warehouses as any[]).find((w: any) => w._id === id)?.name || id;

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Stock Transfer"
                    description="Move existing stock between warehouses, independent of any specific goods receipt."
                    actions={
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success/90 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> New Transfer
                        </button>
                    }
                />

                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3">Transfer #</th>
                                    <th className="px-6 py-3">From &rarr; To</th>
                                    <th className="px-6 py-3">Items</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {transfers.map(t => (
                                    <tr key={t._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                        <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white">{t.transferNumber}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                                            <span className="inline-flex items-center gap-1">
                                                {warehouseName(t.fromWarehouseId)} <ArrowRightLeft className="w-3 h-3 text-neutral-400" /> {warehouseName(t.toWarehouseId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-neutral-500">
                                            {t.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(t.transferDate)}</td>
                                    </tr>
                                ))}
                                {!isLoading && transfers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-neutral-400">
                                            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                            No transfers yet. Move stock between warehouses to see it here.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold">New Stock Transfer</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">From Warehouse</label>
                                    <select
                                        value={fromWarehouseId}
                                        onChange={(e) => setFromWarehouseId(e.target.value)}
                                        className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="">Select...</option>
                                        {(warehouses as any[]).map((w: any) => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">To Warehouse</label>
                                    <select
                                        value={toWarehouseId}
                                        onChange={(e) => setToWarehouseId(e.target.value)}
                                        className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="">Select...</option>
                                        {(warehouses as any[]).map((w: any) => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Add Item</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        value={itemSearch}
                                        onChange={(e) => setItemSearch(e.target.value)}
                                        placeholder="Search item by name or SKU..."
                                        className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                {itemOptions.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {itemOptions.map(opt => (
                                            <button
                                                type="button"
                                                key={opt._id}
                                                onClick={() => addDraftItem(opt)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                            >
                                                {opt.name} <span className="text-xs text-neutral-400">{opt.sku}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {draftItems.length > 0 && (
                                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase">
                                            <tr>
                                                <th className="px-4 py-2">Item</th>
                                                <th className="px-4 py-2 w-28">Quantity</th>
                                                <th className="px-4 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {draftItems.map(item => (
                                                <tr key={item.productId}>
                                                    <td className="px-4 py-2">{item.productName}</td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.quantity || ''}
                                                            onChange={(e) => updateDraftQty(item.productId, parseFloat(e.target.value) || 0)}
                                                            className="w-24 px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <button type="button" onClick={() => removeDraftItem(item.productId)} className="text-neutral-400 hover:text-danger">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none h-20"
                                    placeholder="Reason for transfer..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
                            >
                                {isSaving ? 'Transferring...' : 'Transfer Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default StockTransfer;
