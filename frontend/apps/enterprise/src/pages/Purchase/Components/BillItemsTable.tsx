import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { PurchaseBillItem } from "@repo/shared";

interface BillItemsTableProps {
    items: PurchaseBillItem[];
    onUpdateItem: (index: number, field: keyof PurchaseBillItem, value: any) => void;
}

const BillItemsTable: React.FC<BillItemsTableProps> = ({ items, onUpdateItem }) => {
    return (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-default dark:border-default shadow-sm overflow-hidden">
            <div className="p-6 border-b border-default dark:border-default flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                    Invoice Items
                    <span className="px-2 py-0.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-[10px] rounded-lg text-neutral-500">{items.length} items</span>
                </h3>
                <button className="text-brand-600 text-xs font-bold hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Force Add Item
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 border-b dark:border-default">
                        <tr>
                            <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Product / Description</th>
                            <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-28 text-center">GRN Qty</th>
                            <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-32 text-center">Bill Qty</th>
                            <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-32 text-right">PO Rate</th>
                            <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-32 text-right">Bill Rate</th>
                            <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-32 text-right">Line Total</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50 font-medium">
                        {items.map((item, idx) => (
                            <tr key={idx} className={`group hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-bg)]/50 transition-colors ${item.variance_flag ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="text-neutral-900 dark:text-main font-bold">{item.product_name}</div>
                                    <div className="text-[10px] text-neutral-500 font-mono">{item.sku || 'NO-SKU'}</div>
                                </td>
                                <td className="px-6 py-4 text-center text-neutral-500">
                                    {item.grn_quantity}
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        value={item.bill_quantity}
                                        onChange={(e) => onUpdateItem(idx, 'bill_quantity', parseFloat(e.target.value) || 0)}
                                        className={`w-full text-center py-1.5 bg-transparent border-b ${item.bill_quantity !== item.grn_quantity ? 'border-amber-500 text-amber-600' : 'border-default dark:border-default'}`}
                                    />
                                </td>
                                <td className="px-6 py-4 text-right text-neutral-500">
                                    ₹{item.grn_rate?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-neutral-400 text-xs">₹</span>
                                        <input
                                            type="number"
                                            value={item.bill_rate}
                                            onChange={(e) => onUpdateItem(idx, 'bill_rate', parseFloat(e.target.value) || 0)}
                                            className={`w-24 text-right py-1.5 bg-transparent border-b ${item.bill_rate !== item.grn_rate ? 'border-amber-500 text-amber-600' : 'border-default dark:border-default'}`}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-neutral-900 dark:text-main">
                                    ₹{item.line_total?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {item.variance_flag && (
                                        <div className="relative group/tool">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                            <div className="absolute bottom-full right-0 mb-2 p-2 bg-[var(--erp-bg)] text-main text-[10px] rounded opacity-0 group-hover/tool:opacity-100 pointer-events-none whitespace-nowrap z-30">
                                                Variance Flagged: Rate/Qty mismatch
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-neutral-400 italic">
                                    Linked GRN to populate item details and perform variance analysis
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillItemsTable;

