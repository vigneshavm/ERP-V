import React from 'react';
import { Building2, ArrowUpDown, TrendingUp, ExternalLink } from 'lucide-react';
import { AgedBill } from '../hooks/useOutstandingPayables';
import { formatDate } from '../../../utils/helpers';

interface PayablesTableProps {
    viewMode: 'bill-wise' | 'vendor-wise';
    filteredBills: AgedBill[];
    vendorSummary: any[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (field: any) => void;
    onQuickPayment: (vendorId: string) => void;
}

const PayablesTable: React.FC<PayablesTableProps> = ({
    viewMode,
    filteredBills,
    vendorSummary,
    sortBy: __sortBy,
    sortOrder: __sortOrder,
    onSort,
    onQuickPayment
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    {viewMode === 'bill-wise' ? (
                        <>
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-600" onClick={() => onSort('vendorName')}>
                                            Vendor / Bill Details <ArrowUpDown size={12} />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-600" onClick={() => onSort('dueDate')}>
                                            Due Logistics <ArrowUpDown size={12} />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">
                                        <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-emerald-600" onClick={() => onSort('amount')}>
                                            Financials <ArrowUpDown size={12} />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Settlement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredBills.map((bill) => (
                                    <tr key={bill.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${bill.isUrgent ? 'bg-rose-50/20 dark:bg-rose-950/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl ${bill.isUrgent ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} flex items-center justify-center transition-colors`}>
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                        {bill.vendorName}
                                                        {bill.isUrgent && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] rounded uppercase font-bold animate-pulse">Critical</span>}
                                                        {bill.isDisputed && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] rounded uppercase font-bold">On Hold</span>}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                                        <span className="font-bold text-emerald-600">#{bill.billNumber}</span>
                                                        <span>•</span>
                                                        <span>{formatDate(bill.billDate)}</span>
                                                        {bill.hasDiscount && <span className="flex items-center gap-0.5 text-warning font-bold"><TrendingUp size={10} /> Discount Eligible</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-[10px] font-bold uppercase ${bill.daysOverdue > 0 ? 'text-danger' : bill.daysOverdue > -7 ? 'text-warning' : 'text-success'}`}>
                                                        {bill.daysOverdue > 0 ? `${bill.daysOverdue} Days Overdue` : `${Math.abs(bill.daysOverdue)} Days Left`}
                                                    </div>
                                                    <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${bill.daysOverdue > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${Math.min(100, Math.abs(bill.daysOverdue) * 3)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-medium">Due: {formatDate(bill.dueDate)}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-black text-slate-800 dark:text-white">₹{bill.outstandingAmount.toFixed(2)}</div>
                                            <div className="text-[9px] text-slate-400 font-medium line-through decoration-slate-300">Total: ₹{bill.amount.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => onQuickPayment(bill.vendorId)}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                                            >
                                                Pay Now
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </>
                    ) : (
                        <>
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Vendor Identity</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Open Bills</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Overdue Bal.</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Total Outstanding</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {vendorSummary.map((v) => (
                                    <tr key={v.vendorName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="text-xs font-black text-slate-800 dark:text-white uppercase">{v.vendorName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg">{v.count} Items</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`text-sm font-black ${v.overdue > 0 ? 'text-danger' : 'text-success'}`}>₹{v.overdue.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-black text-slate-800 dark:text-white">₹{v.total.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => onQuickPayment(v.vendorId)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Settle All Balances"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </>
                    )}
                </table>
            </div>
        </div>
    );
};

export default PayablesTable;
