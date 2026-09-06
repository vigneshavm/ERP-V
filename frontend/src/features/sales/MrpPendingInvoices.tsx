import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { AlertTriangle, CheckCircle2, X, Pencil } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import api from "../../services/api";
import { formatDate } from '../../utils/helpers';

interface MrpPendingItem {
    item: string;
    name?: string;
    quantity: number;
    price: number;
    gstRate?: number;
}

interface MrpPendingInvoice {
    _id: string;
    invoiceNo: string;
    customer?: { _id: string; name?: string; phone?: string } | null;
    items: MrpPendingItem[];
    totalAmount: number;
    mrpPendingNote?: string;
    createdAt: string;
}

// Textilesoft's "Invoice Billing" mode lets a bill be raised at a provisional price before the
// final MRP for that stock is confirmed. This page is where those bills get resolved once the
// real price is known -- see backend/src/modules/sales/controllers/PosController.ts's
// finalizeMrpPricing. Deliberately narrow: it only ever corrects price/tax/total on a bill
// still flagged pending, not a general invoice editor (that's the separate sale/invoice edit
// endpoint work).
const MrpPendingInvoices: React.FC = () => {
    const [invoices, setInvoices] = useState<MrpPendingInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<MrpPendingInvoice | null>(null);
    const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/api/pos/invoice/mrp-pending');
            setInvoices(data?.invoices || []);
        } catch {
            toast.error('Failed to load MRP-pending invoices');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const openFinalize = (invoice: MrpPendingInvoice) => {
        setEditingInvoice(invoice);
        const initial: Record<string, string> = {};
        invoice.items.forEach((it) => { initial[it.item] = String(it.price); });
        setDraftPrices(initial);
    };

    const handleFinalize = async (recalculate: boolean) => {
        if (!editingInvoice) return;
        setIsSaving(true);
        try {
            const body = recalculate
                ? { items: editingInvoice.items.map((it) => ({ item: it.item, price: parseFloat(draftPrices[it.item]) || it.price })) }
                : {};
            await api.patch(`/api/pos/invoice/${editingInvoice._id}/finalize-mrp`, body);
            toast.success('MRP finalized');
            setEditingInvoice(null);
            fetchInvoices();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to finalize MRP');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Layout>
            <PageHeader
                title="MRP Pending Invoices"
                description="Bills raised at a provisional price, awaiting final MRP confirmation."
            />

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-6 py-3">Invoice</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Note</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {invoices.map((inv) => (
                                <tr key={inv._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                    <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white">{inv.invoiceNo}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{inv.customer?.name || 'Walk-in Customer'}</td>
                                    <td className="px-6 py-4 text-xs text-neutral-500">{formatDate(inv.createdAt)}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white">₹{inv.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-xs text-neutral-500 max-w-xs truncate">{inv.mrpPendingNote || '—'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openFinalize(inv)}
                                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 flex items-center gap-1.5 ml-auto"
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> Finalize MRP
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && invoices.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-neutral-400">
                                        <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        No invoices awaiting MRP confirmation.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingInvoice && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold">Finalize MRP — {editingInvoice.invoiceNo}</h3>
                            <button onClick={() => setEditingInvoice(null)} className="text-neutral-400 hover:text-neutral-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            <p className="text-xs text-neutral-500">
                                Correct each line's price to the confirmed MRP, or leave unchanged and just clear the pending flag.
                            </p>
                            {editingInvoice.items.map((it) => (
                                <div key={it.item} className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{it.name || it.item} × {it.quantity}</span>
                                    <div className="relative shrink-0">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={draftPrices[it.item] ?? ''}
                                            onChange={(e) => setDraftPrices(prev => ({ ...prev, [it.item]: e.target.value }))}
                                            className="w-28 pl-4 pr-2 py-1.5 text-sm text-right bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button onClick={() => setEditingInvoice(null)} className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-800">Cancel</button>
                            <button
                                onClick={() => handleFinalize(false)}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-60"
                            >
                                Clear flag only
                            </button>
                            <button
                                onClick={() => handleFinalize(true)}
                                disabled={isSaving}
                                className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save & Finalize'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default MrpPendingInvoices;
