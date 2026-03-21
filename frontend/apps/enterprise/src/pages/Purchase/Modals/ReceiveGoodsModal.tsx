
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Package } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "@repo/shared";

interface ReceiveGoodsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrder;
    onConfirm: (receivedItems: { sku: string; received: number }[], status: 'Partial Receipt' | 'Fully Received') => void;
}

const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({ isOpen, onClose, order, onConfirm }) => {
    const [items, setItems] = useState<{ sku: string; name: string; ordered: number; received: number }[]>([]);

    useEffect(() => {
        if (order && order.items) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
            setItems(order.items.map(i => ({
                sku: i.sku || i.product_id || '',
                name: i.product_name,
                ordered: i.quantity,
                received: i.quantity // Default to full receipt
            })));
        }
    }, [order]);

    const handleQuantityChange = (idx: number, val: string) => {
        const qty = parseInt(val) || 0;
        const newItems = [...items];
        newItems[idx].received = qty;
        setItems(newItems);
    };

    const handleSubmit = () => {
        const totalOrdered = items.reduce((sum, i) => sum + i.ordered, 0);
        const totalReceived = items.reduce((sum, i) => sum + i.received, 0);

        let status: 'Partial Receipt' | 'Fully Received' = 'Fully Received';
        if (totalReceived === 0) {
            // Nothing received? warn or close
            onClose();
            return;
        }
        if (totalReceived < totalOrdered) {
            status = 'Partial Receipt';
        }

        const receiptData = items.map(i => ({ sku: i.sku, received: i.received }));
        onConfirm(receiptData, status);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl w-full max-w-2xl shadow-2xl border dark:border-default flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-default dark:border-default flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Receive Goods</h2>
                        <p className="text-sm text-neutral-500">PO #{order.po_number}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-700/50">
                            <tr>
                                <th className="p-3 rounded-l-lg">Product</th>
                                <th className="p-3 text-right">Ordered</th>
                                <th className="p-3 text-right rounded-r-lg">Received Now</th>
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
                                            className="w-20 px-2 py-1 text-right bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border border-default dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            value={item.received}
                                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-default dark:border-default flex justify-end gap-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-default dark:border-default rounded-xl font-medium hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" /> Confirm Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiveGoodsModal;

