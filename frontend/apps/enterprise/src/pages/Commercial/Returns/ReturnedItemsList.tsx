import React from 'react';
import { SalesReturn } from "@repo/shared";
import { RefreshCw, Wallet, User, Calendar } from 'lucide-react';

interface ReturnedItemsListProps {
    returns?: SalesReturn[];
    onViewDetails?: (ret: SalesReturn) => void;
}

// Mock data integration point later
export const ReturnedItemsList: React.FC<ReturnedItemsListProps> = ({ returns = [], onViewDetails }) => {

    return (
        <div className="bg-white dark:bg-[var(--erp-card)] rounded-xl border border-default dark:border-default shadow-sm overflow-hidden">
            <div className="p-4 border-b border-default dark:border-default flex justify-between items-center">
                <h3 className="font-bold text-main dark:text-main flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-muted" />
                    Recent Returns
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] text-muted dark:text-muted uppercase font-medium">
                        <tr>
                            <th className="p-4">Return ID</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Method</th>
                            <th className="p-4">Items</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {returns.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-muted">No returns recorded yet.</td></tr>
                        )}
                        {returns.map(ret => (
                            <tr key={ret.id} className="hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)] transition-colors">
                                <td className="p-4 font-mono text-secondary dark:text-muted">#{ret.id.substring(0, 8)}</td>
                                <td className="p-4 text-main dark:text-muted">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-muted" />
                                        {new Date(ret.returnDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 text-muted" />
                                        <span className="font-medium text-main">{ret.customerName || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1 bg-[var(--erp-bg-sunken)] dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold text-secondary dark:text-muted capitalize">
                                        {ret.refundMethod === 'wallet' && <Wallet className="w-3 h-3" />}
                                        {ret.refundMethod}
                                    </span>
                                </td>
                                <td className="p-4 text-muted">{ret.items?.length || 0} items</td>
                                <td className="p-4 text-right font-bold text-red-600">₹{ret.totalRefundAmount.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${ret.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--erp-bg-sunken)] text-secondary'}`}>
                                        {ret.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default ReturnedItemsList;
