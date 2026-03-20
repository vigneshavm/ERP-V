import { logger } from '@/shared/lib/logger';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import { Save, Calculator, Search, AlertCircle, Info } from 'lucide-react';
import api from "@/shared/api/api";
import { toast } from 'react-toastify';

interface Supplier {
    _id: string;
    businessName: string;
}

interface Item {
    _id: string;
    name: string;
    stockQty: number;
    batches: any[];
}

const RateRevisionForm: React.FC = () => {
    const navigate = useNavigate();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    // Form State
    const [supplierId, setSupplierId] = useState('');
    const [itemId, setItemId] = useState('');
    const [batchNumber, setBatchNumber] = useState('');

    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [newRate, setNewRate] = useState<number>(0);
    const [reason, setReason] = useState('');

    useEffect(() => {
        // Fetch Suppliers
        api.get('/purchases/suppliers').then(res => {
            if (res.data.success) setSuppliers(res.data.data);
        }).catch(err => logger.error("Failed to fetch suppliers", err));

        // Fetch Items (Optimize in production to filter or search)
        api.get('/inventory/items').then(res => {
            // Assuming structure { items: [...] } or { data: [...] } depending on API. 
            // InventoryService return format check: { items, pagination } or just array?
            // Looking at InventoryController (not shown but inferred), likely returns { success: true, data: { items: [] } }
            if (res.data.data?.items) setItems(res.data.data.items);
            else if (Array.isArray(res.data.data)) setItems(res.data.data);
        }).catch(err => logger.error("Failed to fetch items", err));
    }, []);

    // Filter items based on ... actually items are global usually. 
    // Maybe we filter items that this supplier supplies? For now, list all.

    useEffect(() => {
        if (itemId && batchNumber) {
            const item = items.find(i => i._id === itemId);
            if (item && item.batches) {
                const batch = item.batches.find((b: any) => b.batchNumber === batchNumber);
                // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
                setSelectedBatch(batch || null);
            }
        } else {
            setSelectedBatch(null);
        }
    }, [itemId, batchNumber, items]);

    const oldRate = selectedBatch?.costPrice || 0;
    const affectedQty = selectedBatch?.quantity || 0; // Using current batch qty? 
    // Requirement is retrospective. If we sold some, we still might pay for original. 
    // But data shows only current batch info usually. 
    // Let's rely on user to verify Quantity if needed, or default to current batch Qty.
    // Ideally we should store 'receivedQty' in batch, but we only have 'quantity' (current).
    // Let's proceed with current quantity as 'Affected Stock'. 

    const diffAmount = (newRate - oldRate) * affectedQty;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || !itemId || !batchNumber || !newRate) return toast.error("Please fill all fields");
        if (newRate <= oldRate) return toast.error("New rate must be higher than old rate");

        try {
            await api.post('/purchases/rate-revisions', {
                supplierId,
                itemId,
                batchNumber,
                oldRate,
                newRate,
                affectedQty,
                reason
            });
            toast.success("Revision Request Created");
            navigate('/purchase/rate-revisions');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create request");
        }
    };

    return (
        <Layout>
            <PageHeader
                title="New Rate Revision"
                description="Request a retrospective cost increase approval"
                breadcrumbs={[{ label: 'Revisions', link: '/purchase/rate-revisions' }, { label: 'New' }]}
            />

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 space-y-6">

                    {/* Supplier & Item Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Supplier</label>
                            <select
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                            >
                                <option value="">-- Select Supplier --</option>
                                {suppliers.map(s => (
                                    <option key={s._id} value={s._id}>{s.businessName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Item</label>
                            <select
                                value={itemId}
                                onChange={e => {
                                    setItemId(e.target.value);
                                    setBatchNumber('');
                                }}
                                className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                            >
                                <option value="">-- Select Item --</option>
                                {items.map(i => (
                                    <option key={i._id} value={i._id}>{i.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Batch Selection */}
                    {itemId && (
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Select Batch</label>
                            <select
                                value={batchNumber}
                                onChange={e => setBatchNumber(e.target.value)}
                                className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                            >
                                <option value="">-- Select Batch to Revise --</option>
                                {items.find(i => i._id === itemId)?.batches
                                    ?.filter((b: any) => !supplierId || b.supplierId === supplierId) // Filter by supplier
                                    ?.map((b: any) => (
                                        <option key={b.batchNumber} value={b.batchNumber}>
                                            {b.batchNumber} (Current Cost: ₹{b.costPrice}, Qty: {b.quantity})
                                        </option>
                                    ))}
                            </select>
                            {/* If no batches found */}
                            {items.find(i => i._id === itemId)?.batches?.length === 0 && (
                                <p className="text-sm text-red-500 mt-1">No batches found for this item.</p>
                            )}
                        </div>
                    )}

                    {/* Rate Input & Calc */}
                    {selectedBatch && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                <Calculator size={18} /> Impact Calculator
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Old Rate</label>
                                    <div className="text-lg font-mono font-bold text-neutral-700 dark:text-neutral-300">₹{oldRate}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-indigo-500 uppercase mb-1">New Rate</label>
                                    <input
                                        type="number"
                                        value={newRate}
                                        onChange={e => setNewRate(parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 bg-white dark:bg-neutral-800 border border-indigo-300 rounded font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Affected Qty</label>
                                    <div className="text-lg font-mono font-bold text-neutral-700 dark:text-neutral-300 text-right">{affectedQty}</div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800 flex justify-between items-center">
                                <span className="text-sm text-indigo-600">Rate Difference: <strong>₹{(newRate - oldRate).toFixed(2)}</strong></span>
                                <div className="text-right">
                                    <span className="block text-xs text-neutral-500">Total Liability Increase</span>
                                    <span className="text-xl font-bold text-red-600">+₹{diffAmount > 0 ? diffAmount.toLocaleString() : 0}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Reason / Notes</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg h-24"
                            placeholder="Why is the rate changing retrospectively?"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/purchase/rate-revisions')}
                            className="px-6 py-2.5 text-neutral-600 font-bold hover:bg-neutral-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
                        >
                            <Save size={18} />
                            Submit Request
                        </button>
                    </div>

                </form>
            </div>
        </Layout>
    );
};

export default RateRevisionForm;
