import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, Eye, CreditCard, Trash2, CheckCircle, 
    Clock, AlertCircle, TrendingUp, ArrowUpRight, 
    MoreHorizontal, ShieldCheck, Zap
} from 'lucide-react';
import { Bill } from "@/entities/finance/model/billSlice";

interface Props {
    bills: Bill[];
    isLoading: boolean;
    onMarkAsPaid: (bill: Bill) => void;
    onDelete: (id: string) => void;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
        case 'paid':
            return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: ShieldCheck, label: 'Settled' };
        case 'matched':
        case 'approved':
            return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', icon: CheckCircle, label: status };
        case 'partial':
        case 'received':
            return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: Clock, label: status };
        case 'disputed':
        case 'rejected':
            return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', icon: AlertCircle, label: status };
        case 'hold':
            return { color: 'text-neutral-500', bg: 'bg-neutral-500/10', icon: Clock, label: 'Hold' };
        default:
            return { color: 'text-neutral-400', bg: 'bg-neutral-500/5', icon: FileText, label: status || 'Pending' };
    }
};

const BillsTable: React.FC<Props> = ({ bills, isLoading, onMarkAsPaid, onDelete }) => {
    const navigate = useNavigate();

    return (
        <div className="overflow-x-auto px-2">
            <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                    <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                        <th className="px-8 py-2">Bill Sequence</th>
                        <th className="px-8 py-2">Reference Link</th>
                        <th className="px-8 py-2">Supplier Node</th>
                        <th className="px-8 py-2 text-right">Fiscal Value</th>
                        <th className="px-8 py-2 text-center">Protocol State</th>
                        <th className="px-8 py-2">Execution Due</th>
                        <th className="px-8 py-2 text-right">Commands</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={7} className="px-8 py-32 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-6" />
                                    <p className="text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse italic">Synchronizing Manifests...</p>
                                </div>
                            </td>
                        </tr>
                    ) : bills.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-8 py-32 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] text-neutral-200 mb-6">
                                        <FileText className="w-16 h-16" />
                                    </div>
                                    <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Bill Null</h3>
                                    <p className="text-sm font-bold text-neutral-500 mt-2 italic">No fiscal liabilities detected in current bracket.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        bills.map((bill: any) => {
                            const config = getStatusConfig(bill.status);
                            const StatusIcon = config.icon;
                            return (
                                <tr 
                                    key={bill._id || bill.id} 
                                    className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-default"
                                >
                                    <td className="px-2 py-1">
                                        <div className="bg-white dark:bg-neutral-900 rounded-l-[1.5rem] p-6 border-y border-l border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <div className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter italic leading-none mb-1">
                                                {bill.bill_number}
                                            </div>
                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">
                                                {new Date(bill.date || bill.bill_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-0 py-1">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <div className="flex flex-col gap-2">
                                                {bill.po_number && (
                                                    <span className="inline-flex items-center gap-1.5 text-[8px] font-black text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                                                        <Zap className="w-2.5 h-2.5 text-blue-500" /> PO: {bill.po_number}
                                                    </span>
                                                )}
                                                {bill.grn_number && (
                                                    <span className="inline-flex items-center gap-1.5 text-[8px] font-black text-blue-600 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest leading-none border border-blue-500/10">
                                                        <TrendingUp className="w-2.5 h-2.5" /> GRN: {bill.grn_number}
                                                    </span>
                                                )}
                                                {!bill.po_number && !bill.grn_number && (
                                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">DIRECT PROTOCOL</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-0 py-1">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-black text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-tight italic">
                                            {bill.vendor_name || 'Anonymous Supplier'}
                                        </div>
                                    </td>
                                    <td className="px-0 py-1 text-right">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-mono font-black text-neutral-900 dark:text-main italic text-lg">
                                            {formatCurrency(bill.amount || bill.total_amount)}
                                        </div>
                                    </td>
                                    <td className="px-0 py-1 text-center">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${config.bg} ${config.color} border-current/10`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {config.label}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-0 py-1">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">{bill.dueDate || bill.due_date ? new Date(bill.dueDate || bill.due_date).toLocaleDateString() : '—'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-0 py-1 text-right">
                                        <div className="bg-white dark:bg-neutral-900 rounded-r-[1.5rem] p-6 border-y border-r border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => navigate(`/purchase/bills/view/${bill._id || bill.id}`)}
                                                    className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 group/eye"
                                                    title="View Matrix"
                                                >
                                                    <Eye className="w-5 h-5 group-hover/eye:scale-110 transition-transform" />
                                                </button>
                                                {(bill.status === 'Received' || bill.status === 'Approved' || bill.status === 'Matched' || bill.status === 'Partially Paid') && (
                                                    <button
                                                        onClick={() => onMarkAsPaid(bill)}
                                                        className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 group/pay"
                                                        title="Liquidate"
                                                    >
                                                        <CreditCard className="w-5 h-5 group-hover/pay:scale-110 transition-transform" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDelete(bill._id || bill.id)}
                                                    className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 group/trash"
                                                    title="Purge"
                                                >
                                                    <Trash2 className="w-5 h-5 group-hover/trash:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BillsTable;
