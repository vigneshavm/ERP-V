
import React, { useState } from 'react';
import { CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "../../../types/purchase";
import { Button, Modal } from '../../../components/shared';import { Input } from '@/components/shared/Input';


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

interface ReceiveRow { productId: string; name: string; ordered: number; received: number; rejected: number }

// One row per PO line, defaulting to receiving everything still outstanding.
const toReceiveRows = (order?: { items?: PurchaseOrderItem[] } | null): ReceiveRow[] =>
    (order?.items || []).map((i: PurchaseOrderItem) => {
        const outstanding = Math.max(0, (i.quantity || 0) - (i.received_quantity || 0));
        return {
            productId: resolveProductId(i),
            name: i.product_name,
            ordered: outstanding,
            received: outstanding,
            rejected: 0
        };
    });

const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({ isOpen, onClose, order, onConfirm, isSubmitting = false, error = null }) => {
    const [items, setItems] = useState(() => toReceiveRows(order));
    // Re-initialize when given a different order; adjusted during render (tracking the previous
    // prop) instead of setState in an effect.
    const [prevOrder, setPrevOrder] = useState(order);
    if (order !== prevOrder) {
        setPrevOrder(order);
        if (order?.items) setItems(toReceiveRows(order));
    }

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Receive Goods"
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        icon={<CheckCircle className="w-4 h-4" />}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                    >
                        Confirm Receipt
                    </Button>
                </div>
            }
        >
            <p className="text-sm text-slate-500 -mt-4 mb-4">PO #{order.po_number}</p>
                    {error && (
                        <div className="mb-4 p-3 bg-danger-soft dark:bg-danger-soft text-danger dark:text-danger rounded-lg text-sm font-medium flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-3 rounded-l-lg">Product</th>
                                <th className="p-3 text-right">Outstanding</th>
                                <th className="p-3 text-right">Received Now</th>
                                <th className="p-3 text-right rounded-r-lg">Damaged/Rejected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
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
                                    <td className="p-3 text-right text-slate-500 font-medium">{item.ordered}</td>
                                    <td className="p-3 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.ordered}
                                            disabled={isSubmitting}
                                            className="w-20 px-2 py-1 text-right bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
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
                                            className="w-20 px-2 py-1 text-right bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                            value={item.rejected}
                                            onChange={(e) => handleRejectedChange(idx, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
        </Modal>
    );
};

export default ReceiveGoodsModal;
