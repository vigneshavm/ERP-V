import React, { useEffect, useState } from 'react';
import { Sale, CartItem } from '../../types/sales';
import { SalesReturnItem } from '../../types/salesReturn';
import { Trash2, AlertCircle } from 'lucide-react';

interface ReturnItemGridProps {
    invoice: Sale;
    onItemsChange: (items: SalesReturnItem[]) => void;
}

export const ReturnItemGrid: React.FC<ReturnItemGridProps> = ({ invoice, onItemsChange }) => {
    // We map invoice items to potential return items (with 0 quantity initially or pre-filled?)
    // Better to let user add items or list all matches and let them set qty > 0.
    // Let's list all items.

    // State for the return working list. 
    // We transform CartItems to SalesReturnItem-like structure for editing.
    const [returnItems, setReturnItems] = useState<Partial<SalesReturnItem>[]>([]);

    useEffect(() => {
        // Initialize return items from invoice
        const initialItems = invoice.items.map(item => ({
            productId: item.id || '', // CartItem maps to Product (id might be _id or id) - assuming id
            productName: item.name,
            variantId: item.variantId,
            quantity: 0, // Default to 0 return
            maxQuantity: item.qty, // Store max returnable
            unitPrice: item.sellingPrice,
            taxAmount: 0, // Need to calc
            lineTotal: 0,
            condition: 'resellable' as const,
            originalItem: item // Keep ref
        }));
        setReturnItems(initialItems);
    }, [invoice]);

    const handleQuantityChange = (index: number, qty: number) => {
        const newItems = [...returnItems];
        const item = newItems[index];
        const max = (item as any).maxQuantity || 0;

        if (qty < 0) qty = 0;
        if (qty > max) qty = max;

        item.quantity = qty;
        item.lineTotal = qty * (item.unitPrice || 0);
        // Recalc tax if needed? For now simple proportional.
        const originalTotal = ((item as any).originalItem.sellingPrice * (item as any).originalItem.qty);
        // This is tricky if tax was inclusive/exclusive. Assuming simple linear ratio.

        setReturnItems(newItems);

        // Filter out 0 qty items and send parent the valid return items
        const validItems = newItems
            .filter(i => i.quantity && i.quantity > 0)
            .map(i => ({
                id: crypto.randomUUID(), // Temp ID
                salesReturnId: '',
                productId: i.productId!,
                productName: i.productName,
                variantId: i.variantId,
                quantity: i.quantity!,
                unitPrice: i.unitPrice!,
                taxAmount: 0, // TODO: Calc tax
                lineTotal: i.lineTotal!,
                condition: i.condition!,
                reason: i.reason
            }));

        onItemsChange(validItems as SalesReturnItem[]);
    };

    const handleConditionChange = (index: number, condition: SalesReturnItem['condition']) => {
        const newItems = [...returnItems];
        newItems[index].condition = condition;
        setReturnItems(newItems);

        // Trigger update
        const validItems = newItems
            .filter(i => i.quantity && i.quantity > 0)
            .map(i => ({
                id: crypto.randomUUID(),
                salesReturnId: '',
                productId: i.productId!,
                productName: i.productName,
                variantId: i.variantId,
                quantity: i.quantity!,
                unitPrice: i.unitPrice!,
                taxAmount: 0,
                lineTotal: i.lineTotal!,
                condition: i.condition!,
                reason: i.reason
            }));
        onItemsChange(validItems as SalesReturnItem[]);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white">Select Items to Return</h3>
                <span className="text-xs font-mono text-slate-500">Invoice #{invoice.id}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                        <tr>
                            <th className="p-4">Product</th>
                            <th className="p-4 text-center">Sold Qty</th>
                            <th className="p-4 text-center">Return Qty</th>
                            <th className="p-4">Condition</th>
                            <th className="p-4 text-right">Refund Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {returnItems.map((item, index) => {
                            const isSelected = (item.quantity || 0) > 0;
                            return (
                                <tr key={index} className={`transition-colors ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-900 dark:text-white">{item.productName}</div>
                                        <div className="text-xs text-slate-500">₹{item.unitPrice} / unit</div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                        {(item as any).maxQuantity}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max={(item as any).maxQuantity}
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                                className={`w-20 text-center py-1 rounded border focus:ring-2 focus:ring-indigo-500 outline-none ${isSelected ? 'border-indigo-300 bg-white font-bold text-indigo-700' : 'border-slate-300 bg-slate-50 dark:bg-slate-700 text-slate-500'}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            disabled={!isSelected}
                                            value={item.condition}
                                            onChange={(e) => handleConditionChange(index, e.target.value as any)}
                                            className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-white focus:outline-none disabled:opacity-50"
                                        >
                                            <option value="resellable">Resellable</option>
                                            <option value="damaged">Damaged</option>
                                            <option value="defective">Defective</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                                        {item.lineTotal ? `₹${item.lineTotal.toFixed(2)}` : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {returnItems.every(i => !i.quantity) && (
                <div className="p-4 bg-amber-50 text-amber-700 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Please enter a quantity greater than 0 for items you wish to return.
                </div>
            )}
        </div>
    );
};
