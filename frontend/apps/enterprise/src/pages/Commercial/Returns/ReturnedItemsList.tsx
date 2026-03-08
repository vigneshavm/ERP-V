import React from 'react';
import { SalesReturn } from "../../../types/salesReturn";
import { RefreshCw, Wallet, User, Calendar } from 'lucide-react';

interface ReturnedItemsListProps {
    returns: SalesReturn[];
    onViewDetails: (ret: SalesReturn) => void;
}

// Mock data integration point later
export const ReturnedItemsList: React.FC<ReturnedItemsListProps> = ({ returns, onViewDetails }) => {

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-slate-500" />
                    Recent Returns
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
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
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500">No returns recorded yet.</td></tr>
                        )}
                        {returns.map(ret => (
                            <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-400">#{ret.id.substring(0, 8)}</td>
                                <td className="p-4 text-slate-800 dark:text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {new Date(ret.returnDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 text-slate-400" />
                                        <span className="font-medium text-slate-900 dark:text-white">{ret.customerName || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">
                                        {ret.refundMethod === 'wallet' && <Wallet className="w-3 h-3" />}
                                        {ret.refundMethod}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-500">{ret.items?.length || 0} items</td>
                                <td className="p-4 text-right font-bold text-red-600">₹{ret.totalRefundAmount.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${ret.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
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
