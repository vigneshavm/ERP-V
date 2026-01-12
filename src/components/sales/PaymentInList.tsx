import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Search, Plus, Filter, Download, Printer, Eye,
    MoreHorizontal, ArrowUpRight, Calendar, User
} from 'lucide-react';
import { setActiveTab, RootState } from '../../store';
import { getTable } from '../../services/dataSource';

// Demo Data
interface PaymentRecord {
    id: string;
    receiptNo: string;
    date: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    modes: string[];
    reference: string;
}

const PaymentInList: React.FC = () => {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const [payments, setPayments] = useState<PaymentRecord[]>([]);

    // Fetch payments on mount
    React.useEffect(() => {
        const fetchPayments = async () => {
            const data = await getTable<any>('payments', {});
            if (data) {
                setPayments(data.map((p: any) => ({
                    id: p.id,
                    receiptNo: `RCP-${p.id?.slice(-5) || '00000'}`,
                    date: p.date,
                    customerName: p.customer_name || 'Customer',
                    customerPhone: p.customer_phone || '',
                    amount: p.amount,
                    modes: [p.mode || 'Cash'],
                    reference: p.reference || '-'
                })));
            }
        };
        fetchPayments();
    }, []);

    // Filter payments
    const filteredPayments = useMemo(() => {
        if (!searchQuery) return payments;
        const q = searchQuery.toLowerCase();
        return payments.filter(p =>
            p.receiptNo.toLowerCase().includes(q) ||
            p.customerName.toLowerCase().includes(q) ||
            p.customerPhone.includes(q)
        );
    }, [searchQuery, payments]);

    // Format currency
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Payment In List Records</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">View all customer payment receipts</p>
                </div>
                <button
                    onClick={() => dispatch(setActiveTab('PAYMENT_IN'))}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    New Payment
                </button>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by receipt number, customer name, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <button className="btn btn-secondary">
                    <Filter className="w-4 h-4" /> Filter
                </button>
                <button className="btn btn-secondary">
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
                {filteredPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-lg font-medium text-neutral-600 dark:text-neutral-300">No payment records found</p>
                        <p className="text-sm mt-1">Try adjusting your search or create a new payment.</p>
                        <button
                            onClick={() => dispatch(setActiveTab('PAYMENT_IN'))}
                            className="btn btn-sm btn-primary mt-4"
                        >
                            Create Payment
                        </button>
                    </div>
                ) : (
                    <div className="min-w-full inline-block align-middle">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                            <thead className="bg-neutral-50 dark:bg-neutral-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Receipt No</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Mode</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600 dark:text-brand-400">
                                            {payment.receiptNo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {payment.date}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs mr-3">
                                                    {payment.customerName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{payment.customerName}</div>
                                                    <div className="text-xs text-neutral-500">{payment.customerPhone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                                            <div className="flex flex-wrap gap-1">
                                                {payment.modes.map(mode => (
                                                    <span key={mode} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                                                        {mode}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-xs text-neutral-400 mt-0.5">{payment.reference}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 hover:text-brand-600 transition-colors" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 hover:text-brand-600 transition-colors" title="Print">
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 hover:text-neutral-900 transition-colors" title="More">
                                                    <MoreHorizontal className="w-4 h-4" />
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
        </div>
    );
};

export default PaymentInList;
