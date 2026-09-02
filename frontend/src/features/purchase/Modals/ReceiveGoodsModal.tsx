
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Package, Loader2, AlertTriangle } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "../../../types/purchase";

// Payload shape sent up to the caller, which POSTs it to /api/grn via grnService.createGRN.
export interface ReceiveGoodsItem {
    productId: string;
    productName: string;
    receivedQty: number;
    rejectedQty: number;
}

interface ReceiveGoodsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrder;
    onConfirm: (items: ReceiveGoodsItem[]) => void | Promise<void>;
    isSubmitting?: boolean;
    error?: string | null;
}

// Resolves an item's product id whether it came through normalizePurchaseOrder (product_id,
// always a plain string) or, defensively, a raw backend item that slipped through unnormalized
// (productId, possibly a populated Item object).
const resolveProductId = (item: any): string => {
    const pid = item.product_id ?? item.productId;
    if (pid && typeof pid === 'object') return pid._id || pid.id || '';
    return pid || '';
};

const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({ isOpen, onClose, order, onConfirm, isSubmitting = false, error = null }) => {
    const [items, setItems] = useState<{ productId: string; name: string; ordered: number; received: number; rejected: number }[]>([]);

    useEffect(() => {
        if (order && order.items) {
            setItems(order.items.map((i: PurchaseOrderItem) => {
                const outstanding = Math.max(0, (i.quantity || 0) - (i.received_quantity || 0));
                return {
                    productId: resolveProductId(i),
                    name: i.product_name,
                    ordered: outstanding,
                    received: outstanding, // Default to receiving everything still outstanding
                    rejected: 0
                };
            }));
        }
    }, [order]);

    const handleReceivedChange = (idx: number, val: string) => {
        const qty = Math.max(0, parseInt(val) || 0);
        const newItems = [...items];
        newItems[idx].received = qty;
        if (newItems[idx].rejected > qty) newItems[idx].rejected = qty;
        setItems(newItems);
    };

    const handleRejectedChange = (idx: number, val: string) => {
        const qty = Math.max(0, parseInt(val) || 0);
        const newItems = [...items];
        newItems[idx].rejected = Math.min(qty, newItems[idx].received);
        setItems(newItems);
    };

    const handleSubmit = async () => {
        const totalReceived = items.reduce((sum, i) => sum + i.received, 0);
        if (totalReceived === 0) {
            onClose();
            return;
        }
        await onConfirm(items.map(i => ({
            productId: i.productId,
            productName: i.name,
            receivedQty: i.received,
            rejectedQty: i.rejected,
        })));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-sm w-full max-w-2xl shadow-2xl border dark:border-neutral-700 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Receive Goods</h2>
                        <p className="text-sm text-neutral-500">PO #{order.po_number}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-700/50">
                            <tr>
                                <th className="p-3 rounded-l-lg">Product</th>
                                <th className="p-3 text-right">Outstanding</th>
                                <th className="p-3 text-right">Received Now</th>
                                <th className="p-3 text-right rounded-r-lg">Damaged/Rejected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="p-3 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                <Package className="w-4 h-4" />
                                            </div>
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="p-3 text-right text-neutral-500 font-medium">{item.ordered}</td>
                                    <td className="p-3 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.ordered}
                                            disabled={isSubmitting}
                                            className="w-20 px-2 py-1 text-right bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                            value={item.received}
                                            onChange={(e) => handleReceivedChange(idx, e.target.value)}
                                        />
                                    </td>
                                    <td className="p-3 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.received}
                                            disabled={isSubmitting}
                                            className="w-20 px-2 py-1 text-right bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                            value={item.rejected}
                                            onChange={(e) => handleRejectedChange(idx, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium hover:bg-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {isSubmitting ? 'Recording...' : 'Confirm Receipt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiveGoodsModal;
