import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, CreditCard, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Bill } from '../../../redux/slices/billSlice';
import { formatDate } from '../../../utils/helpers';
import StatusBadge from '@/components/shared/UI/StatusBadge';

interface Props {
    bills: Bill[];
    isLoading: boolean;
    onMarkAsPaid: (bill: Bill) => void;
    onDelete: (id: string) => void;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const getStatusBadge = (status: string) => {
    // A "received" bill is waiting to be paid, so it needs attention.
    const s = status?.toLowerCase();
    if (s === 'received') return <StatusBadge status={status} label="Awaiting payment" tone="warning" />;
    return <StatusBadge status={status || 'DRAFT'} />;
};

const BillsTable: React.FC<Props> = ({ bills, isLoading, onMarkAsPaid, onDelete }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-sm overflow-hidden shadow-sm">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-4"></div>
                    <p className="text-muted font-medium">Loading bills...</p>
                </div>
            ) : bills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">No bills found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-neutral-900/50 border-b dark:border-neutral-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">Bill Details</th>
                                <th className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">Reference (PO/GRN)</th>
                                <th className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {bills.map((bill: any) => (
                                <tr key={bill._id} className="group hover:bg-slate-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="table-cell text-left">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-primary dark:text-primary">{bill.bill_number}</span>
                                            <span className="text-[10px] text-neutral-500">{formatDate(bill.date || bill.bill_date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {bill.po_number && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                                    PO: {bill.po_number}
                                                </span>
                                            )}
                                            {bill.grn_number && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                                                    GRN: {bill.grn_number}
                                                </span>
                                            )}
                                            {!bill.po_number && !bill.grn_number && <span className="text-neutral-400 text-xs">Direct Bill</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] inline-block">
                                            {bill.vendor_name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                                        {formatCurrency(bill.amount || bill.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(bill.status)}
                                    </td>
                                    <td className="px-6 py-4 text-secondary">
                                        {bill.dueDate || bill.due_date ? formatDate(bill.dueDate || bill.due_date) : '—'}
                                    </td>
                                    <td className="table-cell-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/purchase/bills/view/${bill._id || bill.id}`)}
                                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {(bill.status === 'Received' || bill.status === 'Approved' || bill.status === 'Matched' || bill.status === 'Partially Paid') && (
                                                <button
                                                    onClick={() => onMarkAsPaid(bill)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                    title="Record Payment"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(bill._id || bill.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BillsTable;
