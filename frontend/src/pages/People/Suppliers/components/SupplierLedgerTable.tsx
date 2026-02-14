import React from 'react';
import { Book, RefreshCw } from 'lucide-react';

interface Transaction {
    date: string;
    type: 'BILL' | 'PAYMENT' | 'DEBIT_NOTE';
    refNo: string;
    description: string;
    credit: number;
    debit: number;
    balance: number;
    originalRef: any;
    purchaseReturnId?: string;
}

interface LedgerData {
    period: {
        start: string;
        end: string;
    };
    openingBalance: number;
    closingBalance: number;
    totals: {
        credit: number;
        debit: number;
    };
    transactions: Transaction[];
}

interface SupplierLedgerTableProps {
    data: LedgerData;
    loading: boolean;
    onRowClick?: (t: Transaction) => void;
}

const SupplierLedgerTable: React.FC<SupplierLedgerTableProps> = ({ data, loading, onRowClick }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-100 dark:border-neutral-700 shadow-sm overflow-hidden relative">
            {/* Table Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-700 print:hidden">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                        <Book className="w-4 h-4 text-indigo-500" /> Transaction History
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-widest mt-0.5">
                        {data.transactions.length} transaction{data.transactions.length !== 1 ? 's' : ''} in period
                    </p>
                </div>
                {loading && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 dark:bg-neutral-900/50">
                        <tr>
                            <th className="py-3 px-5 font-bold text-slate-400 dark:text-neutral-500 uppercase text-[11px] tracking-wider text-left whitespace-nowrap">Date</th>
                            <th className="py-3 px-5 font-bold text-slate-400 dark:text-neutral-500 uppercase text-[11px] tracking-wider text-left whitespace-nowrap">Type</th>
                            <th className="py-3 px-5 font-bold text-slate-400 dark:text-neutral-500 uppercase text-[11px] tracking-wider text-left whitespace-nowrap">Description</th>
                            <th className="py-3 px-5 font-bold text-slate-400 dark:text-neutral-500 uppercase text-[11px] tracking-wider text-right whitespace-nowrap">Debit (₹)</th>
                            <th className="py-3 px-5 font-bold text-slate-400 dark:text-neutral-500 uppercase text-[11px] tracking-wider text-right whitespace-nowrap">Credit (₹)</th>
                            <th className="py-3 px-5 font-bold text-slate-400 dark:text-neutral-500 uppercase text-[11px] tracking-wider text-right whitespace-nowrap">Balance (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-neutral-700/50">
                        {/* Opening Balance Row */}
                        <tr className="bg-slate-50/30 dark:bg-neutral-800/50">
                            <td className="py-3.5 px-5 text-slate-500 font-medium text-sm whitespace-nowrap">{new Date(data.period.start).toLocaleDateString('en-IN')}</td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-700 text-[10px] font-black text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Opening</span>
                            </td>
                            <td className="py-3.5 px-5 italic text-slate-400 dark:text-neutral-500 text-xs whitespace-nowrap">Opening Balance Forwarded</td>
                            <td className="py-3.5 px-5 text-right text-slate-200 dark:text-neutral-700 whitespace-nowrap">—</td>
                            <td className="py-3.5 px-5 text-right text-slate-200 dark:text-neutral-700 whitespace-nowrap">—</td>
                            <td className="py-3.5 px-5 text-right font-black text-slate-600 dark:text-neutral-300 whitespace-nowrap text-sm">{formatCurrency(data.openingBalance)}</td>
                        </tr>

                        {data.transactions.map((t, i) => (
                            <tr
                                key={i}
                                className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick && onRowClick(t)}
                            >
                                <td className="py-3.5 px-5 text-slate-600 dark:text-neutral-400 font-medium text-sm whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-IN')}</td>
                                <td className="py-3.5 px-5 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${t.type === 'BILL' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/20' :
                                        t.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20' :
                                            'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20'
                                        }`}>
                                        {t.type === 'DEBIT_NOTE' ? (t.purchaseReturnId ? 'Return' : 'D.Note') : t.type}
                                    </span>
                                </td>
                                <td className="py-3.5 px-5 whitespace-nowrap">
                                    <div className="font-bold text-slate-800 dark:text-neutral-200 text-sm group-hover:text-indigo-500 transition-colors">#{t.refNo}</div>
                                    <div className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 truncate max-w-[200px]">{t.description}</div>
                                </td>
                                <td className="py-3.5 px-5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                                    {t.debit > 0 ? formatCurrency(t.debit) : '—'}
                                </td>
                                <td className="py-3.5 px-5 text-right font-black text-rose-500 dark:text-rose-400 text-sm whitespace-nowrap">
                                    {t.credit > 0 ? formatCurrency(t.credit) : '—'}
                                </td>
                                <td className="py-3.5 px-5 text-right font-black text-slate-900 dark:text-white text-sm whitespace-nowrap">
                                    {formatCurrency(t.balance)}
                                    <span className="text-[9px] ml-1 text-slate-400 dark:text-neutral-500 font-bold">
                                        {t.balance > 0 ? 'Cr' : 'Dr'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50/80 dark:bg-neutral-900/50">
                            <td colSpan={3} className="py-4 px-5 text-right text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Closing Balance</td>
                            <td className="py-4 px-5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(data.totals.debit)}</td>
                            <td className="py-4 px-5 text-right font-black text-rose-500 dark:text-rose-400 text-sm">{formatCurrency(data.totals.credit)}</td>
                            <td className="py-4 px-5 text-right font-black text-indigo-500 text-lg">{formatCurrency(data.closingBalance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default SupplierLedgerTable;
