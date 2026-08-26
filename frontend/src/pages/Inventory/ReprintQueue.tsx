import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Printer, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useConfig } from "@/contexts/ConfigContext";
import { LabelPrintModal } from "./LabelPrintModal";

interface QueueItem {
    itemId: string;
    itemName: string;
    sku: string;
    oldPrice?: number;
    newPrice: number; // This will map to price/sellingPrice
    quantity: number; // This will map to stock
    reason?: string;
}

const ReprintQueue: React.FC = () => {
    const { tenantId } = useConfig();
    const apiUrl = (import.meta as any).env.VITE_BACKEND_URL;
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/inventory/reprint-queue`, {
                headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
            });
            setQueue(res.data);
        } catch (err) {
            console.error('Fetch Queue Error:', err);
            toast.error('Error fetching reprint queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [apiUrl, tenantId]);

    const handleClearQueue = async () => {
        if (!confirm('Are you sure you want to clear the reprint queue?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${apiUrl}/inventory/reprint-queue`, {
                headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
            });
            toast.success('Queue cleared');
            setQueue([]);
        } catch (err) {
            console.error('Clear Queue Error:', err);
            toast.error('Error clearing queue');
        }
    };

    // Prepare products for LabelPrintModal
    // Mapping QueueItem to the structure expected by LabelPrintModal (roughly matching Product type but with required fields)
    const productsToPrint = queue.map(item => ({
        id: item.itemId,
        name: item.itemName,
        sku: item.sku,
        price: item.newPrice, // LabelPrintModal uses p.mrp || p.price
        stock: item.quantity, // LabelPrintModal uses p.stock
        // Add other fields if needed to satisfy TS or logic
        category: '',
        costPrice: 0,
        sellingPrice: item.newPrice,
        stockQty: item.quantity,
        tenantId: '',
        unit: 'pcs'
    })) as any[]; // Cast to any to avoid strict type checks against the complex Product interface for now

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Printer className="w-8 h-8 text-success" />
                        Label Reprint Queue
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Items queued for updated labels (e.g., after price hikes).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchQueue}
                        className="p-2 text-gray-500 hover:text-emerald-600 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {queue.length > 0 && (
                        <>
                            <button
                                onClick={handleClearQueue}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors border border-transparent hover:border-red-200"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear Queue
                            </button>
                            <button
                                onClick={() => setIsPrintModalOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transform active:scale-95 transition-all"
                            >
                                <Printer className="w-5 h-5" />
                                Print {queue.length} Items
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
            ) : queue.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Printer className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Queue is Empty</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">No items are currently queued for reprinting.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qty</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Old Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">New Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {queue.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{item.itemName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                                        {item.sku}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                        {item.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500 line-through">
                                        {item.oldPrice ? `₹${item.oldPrice}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-success">
                                        ₹{item.newPrice}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {item.reason || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Label Print Modal */}
            <LabelPrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                products={productsToPrint}
                onPrintComplete={() => {
                    // Optional: Can prompt user to clear queue, or auto clear
                    // For now, let user manually clear or I can show a toast
                    toast.info("If printing was successful, please clear the queue to avoid duplicates.");
                }}
            />
        </div>
    );
};

export default ReprintQueue;
