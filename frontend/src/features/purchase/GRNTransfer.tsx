import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ArrowRightLeft, Plus, X, Package } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import api from "../../services/api";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchMasterEntries } from "../../redux/slices/masterDataSlice";
import { formatDate } from '../../utils/helpers';

interface GRNOption {
    id: string;
    grnNumber: string;
    vendorName: string;
    items: { productId: string; productName: string; acceptedQty: number; batchNumber?: string }[];
}

interface TransferItemDraft {
    productId: string;
    productName: string;
    availableInGrn: number;
    batchNumber?: string;
    quantity: number;
}

interface TransferRecord {
    _id: string;
    transferNumber: string;
    sourceGrnId?: { grnNumber?: string } | string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: { productName: string; quantity: number; batchNumber?: string }[];
    transferDate: string;
    notes?: string;
}

// GRN-wise / combo material transfer -- Textilesoft's GRNwiseMaterialTransfer /
// GRNwiseComboMaterialTransfer pages. Moves stock received under a specific GRN from one
// warehouse/bin to another, with an audit trail back to the originating receipt (see
// backend/src/modules/purchase/controllers/GRNTransferController.ts).
const GRNTransfer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { entriesByType } = useSelector((state: RootState) => state.masterData);
    const warehouses = entriesByType.WAREHOUSE || [];

    const [transfers, setTransfers] = useState<TransferRecord[]>([]);
    const [grns, setGrns] = useState<GRNOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [sourceGrnId, setSourceGrnId] = useState('');
    const [fromWarehouseId, setFromWarehouseId] = useState('');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [notes, setNotes] = useState('');
    const [draftItems, setDraftItems] = useState<TransferItemDraft[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        dispatch(fetchMasterEntries({ type: 'WAREHOUSE' }) as any);
        fetchTransfers();
        fetchGrns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTransfers = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/api/grn-transfers');
            setTransfers(data?.data || []);
        } catch (err) {
            console.error('Failed to fetch GRN transfers', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGrns = async () => {
        try {
            const { data } = await api.get('/api/grn');
            const list = (data?.data || []).map((g: any) => ({
                id: g._id,
                grnNumber: g.grnNumber,
                vendorName: g.vendorId?.businessName || '',
                items: (g.items || []).map((it: any) => ({
                    productId: it.productId,
                    productName: it.productName,
                    acceptedQty: it.acceptedQty,
                    batchNumber: it.lotNumber
                }))
            }));
            setGrns(list);
        } catch (err) {
            console.error('Failed to fetch GRNs', err);
        }
    };

    const selectedGrn = useMemo(() => grns.find(g => g.id === sourceGrnId), [grns, sourceGrnId]);

    const handleGrnSelect = (id: string) => {
        setSourceGrnId(id);
        const grn = grns.find(g => g.id === id);
        setDraftItems(
            (grn?.items || []).map(it => ({
                productId: it.productId,
                productName: it.productName,
                availableInGrn: it.acceptedQty,
                batchNumber: it.batchNumber,
                quantity: 0
            }))
        );
    };

    const updateDraftQty = (productId: string, qty: number) => {
        setDraftItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(0, qty) } : i));
    };

    const resetForm = () => {
        setSourceGrnId('');
        setFromWarehouseId('');
        setToWarehouseId('');
        setNotes('');
        setDraftItems([]);
    };

    const handleSubmit = async () => {
        const itemsToSend = draftItems.filter(i => i.quantity > 0);
        if (!sourceGrnId) { toast.warning('Select a source GRN'); return; }
        if (!fromWarehouseId || !toWarehouseId) { toast.warning('Select both warehouses'); return; }
        if (fromWarehouseId === toWarehouseId) { toast.warning('Source and destination warehouse must differ'); return; }
        if (itemsToSend.length === 0) { toast.warning('Enter a quantity for at least one item'); return; }

        setIsSaving(true);
        try {
            await api.post('/api/grn-transfers', {
                sourceGrnId,
                fromWarehouseId,
                toWarehouseId,
                notes,
                items: itemsToSend.map(i => ({
                    productId: i.productId,
                    productName: i.productName,
                    quantity: i.quantity,
                    batchNumber: i.batchNumber
                }))
            });
            toast.success('Material transferred successfully');
            setIsModalOpen(false);
            resetForm();
            fetchTransfers();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to transfer material');
        } finally {
            setIsSaving(false);
        }
    };

    const warehouseName = (id: string) => (warehouses as any[]).find((w: any) => w._id === id)?.name || id;

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="GRN Material Transfer"
                    description="Move stock received under a specific GRN between warehouses, with a traceable audit trail."
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
                                    <th className="px-6 py-3">Source GRN</th>
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
                                            {typeof t.sourceGrnId === 'object' ? t.sourceGrnId?.grnNumber : t.sourceGrnId}
                                        </td>
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
                                        <td colSpan={5} className="px-6 py-16 text-center text-neutral-400">
                                            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                            No transfers yet. Move GRN-received stock between warehouses to see it here.
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
                            <h3 className="text-lg font-bold">New GRN Transfer</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Source GRN</label>
                                <select
                                    value={sourceGrnId}
                                    onChange={(e) => handleGrnSelect(e.target.value)}
                                    className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="">Select GRN...</option>
                                    {grns.map(g => <option key={g.id} value={g.id}>{g.grnNumber} — {g.vendorName}</option>)}
                                </select>
                            </div>
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

                            {selectedGrn && (
                                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase">
                                            <tr>
                                                <th className="px-4 py-2">Item</th>
                                                <th className="px-4 py-2">Batch</th>
                                                <th className="px-4 py-2">Received</th>
                                                <th className="px-4 py-2 w-28">Transfer Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {draftItems.map(item => (
                                                <tr key={item.productId}>
                                                    <td className="px-4 py-2">{item.productName}</td>
                                                    <td className="px-4 py-2 text-xs text-neutral-400">{item.batchNumber || '—'}</td>
                                                    <td className="px-4 py-2 text-neutral-500">{item.availableInGrn}</td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.quantity || ''}
                                                            onChange={(e) => updateDraftQty(item.productId, parseFloat(e.target.value) || 0)}
                                                            className="w-24 px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                                                        />
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
                                {isSaving ? 'Transferring...' : 'Transfer Material'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default GRNTransfer;
