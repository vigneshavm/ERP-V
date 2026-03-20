import { logger } from '@/shared/lib/logger';
import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Filter, Download, Printer, Eye,
    MoreHorizontal, Calendar, IndianRupee, History,
    CreditCard, X
} from 'lucide-react';
import { RootState } from "@/app/store/store";
import { getTable } from "@/shared/api/dataSource";
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import MetricCard from "@/shared/ui/Feedback/MetricCard";

// Demo Data Interface
interface PaymentRecord {
    id: string;
    receiptNo: string;
    date: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    modes: string[];
    reference: string;
    excessAmount?: number;
    allocatedCount?: number;
}

const PaymentInList: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch payments on mount
    React.useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const data = await getTable<any>('payments', {});
                if (data) {
                    setPayments(data.map((p: any) => ({
                        id: p.id || p._id,
                        receiptNo: p.receiptNumber || `RCP-${p.id?.slice(-5) || '00000'}`,
                        date: p.paymentDate || p.date,
                        customerName: p.customer?.name || p.customer_name || 'Customer',
                        customerPhone: p.customer?.phone || p.customer_phone || '',
                        amount: p.totalAmount || p.amount || 0,
                        modes: p.paymentMethods?.map((pm: any) => pm.method) || [p.mode || 'Cash'],
                        reference: p.reference || '-',
                        excessAmount: p.excessAmount || 0,
                        allocatedCount: p.allocatedInvoices?.length || 0
                    })));
                }
            } catch (error) {
                logger.error('Error fetching payments:', error);
            } finally {
                setLoading(false);
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

    // Dashboard Metrics
    const metrics = useMemo(() => {
        const totalValue = payments.reduce((sum, p) => sum + p.amount, 0);
        const creditCount = payments.filter(p => (p.excessAmount || 0) > 0).length;
        return {
            totalValue,
            count: payments.length,
            creditCount
        };
    }, [payments]);

    // Format currency
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Payment In"
                    description="Track and manage customer payment records"
                    actions={
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.print()}
                                className="btn btn-secondary bg-white"
                                title="Print List"
                            >
                                <Printer className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => navigate('/sales/payment-in')}
                                className="btn btn-primary"
                            >
                                <Plus className="w-4 h-4" />
                                Record Payment
                            </button>
                        </div>
                    }
                />

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="Total Collections"
                        value={formatCurrency(metrics.totalValue)}
                        icon={IndianRupee}
                        color="emerald"
                    />
                    <MetricCard
                        title="Transactions"
                        value={metrics.count}
                        icon={History}
                        color="blue"
                    />
                    <MetricCard
                        title="With Credit/Excess"
                        value={metrics.creditCount}
                        icon={CreditCard}
                        color="amber"
                    />
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
                    {/* Controls */}
                    <div className="p-4 bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search receipt #, customer name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10 w-full"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="btn btn-ghost text-neutral-500"
                                >
                                    <X className="w-4 h-4 mr-2" /> Clear
                                </button>
                            )}
                            <button className="btn btn-secondary">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                            <button className="btn btn-secondary">
                                <Download className="w-4 h-4" /> Export
                            </button>
                        </div>
                    </div>

                    {/* Data Display */}
                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-4"></div>
                                <p className="text-neutral-500 font-medium font-outfit">Loading payments...</p>
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4 font-outfit">
                                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="text-lg font-bold text-neutral-800 dark:text-neutral-200">No records found</p>
                                <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                                    Try adjusting your search or record a new payment.
                                </p>
                                <button
                                    onClick={() => navigate('/sales/payment-in')}
                                    className="btn btn-primary mt-6"
                                >
                                    Record Payment
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block">
                                    <table className="w-full text-left font-outfit">
                                        <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Receipt No</th>
                                                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Allocation</th>
                                                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Mode</th>
                                                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Amount</th>
                                                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                                            {filteredPayments.map((payment) => (
                                                <tr
                                                    key={payment.id}
                                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                                                    onClick={() => navigate(`/sales/payment-in/${payment.id}`)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-600 dark:text-brand-400">
                                                        {payment.receiptNo}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(payment.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs mr-3">
                                                                {payment.customerName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-outfit">{payment.customerName}</div>
                                                                <div className="text-xs text-neutral-500">{payment.customerPhone}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {payment.allocatedCount && payment.allocatedCount > 0 ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                                    {payment.allocatedCount} Inv
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                                    Advance
                                                                </span>
                                                            )}
                                                            {(payment.excessAmount || 0) > 0 && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                                    +Credit
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {payment.modes.map((mode, idx) => (
                                                                <span key={idx} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 text-[10px] uppercase font-bold rounded">
                                                                    {mode}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                                        {formatCurrency(payment.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 hover:text-brand-600 transition-colors"
                                                                title="View"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 hover:text-brand-600 transition-colors"
                                                                title="Print"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.print();
                                                                }}
                                                            >
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

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {filteredPayments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            onClick={() => navigate(`/sales/payment-in/${payment.id}`)}
                                            className="p-4 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-brand-600 dark:text-brand-400">{payment.receiptNo}</div>
                                                    <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{payment.customerName}</div>
                                                </div>
                                                <div className="font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(payment.amount)}</div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="text-xs text-neutral-500">
                                                    {new Date(payment.date).toLocaleDateString()}
                                                </div>
                                                <div className="flex gap-1">
                                                    {payment.modes.map((mode, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 text-[10px] uppercase font-bold rounded">
                                                            {mode}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentInList;


