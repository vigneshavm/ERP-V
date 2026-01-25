import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useBranchResolver } from '../../hooks/useBranchResolver';
import {
    Search,
    Calendar,
    CreditCard,
    Wallet,
    TrendingUp,
    Download,
    Plus,
    Eye,
    Truck,
    CheckCircle,
    Clock,
    Building,
    Banknote,
    Receipt
} from 'lucide-react';

interface SupplierPayment {
    id: string;
    date: string;
    vendorId: string;
    vendorName: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK' | 'CHEQUE' | 'UPI' | 'NEFT';
    referenceNo?: string;
    invoiceRefs: string[];
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
    branchId: string;
    notes?: string;
}

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
    CASH: { label: 'Cash', icon: <Banknote className="w-3 h-3" /> },
    BANK: { label: 'Bank Transfer', icon: <Building className="w-3 h-3" /> },
    CHEQUE: { label: 'Cheque', icon: <Receipt className="w-3 h-3" /> },
    UPI: { label: 'UPI', icon: <Wallet className="w-3 h-3" /> },
    NEFT: { label: 'NEFT/RTGS', icon: <Building className="w-3 h-3" /> }
};

const SupplierPayments: React.FC = () => {
    const { orders } = useSelector((state: RootState) => state.purchase);
    const { vendors } = useSelector((state: RootState) => state.vendor);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { getBranchName } = useBranchResolver();

    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Generate sample payments from purchase orders
    const payments: SupplierPayment[] = useMemo(() => {
        const paymentList: SupplierPayment[] = [];
        const methods: SupplierPayment['paymentMethod'][] = ['CASH', 'BANK', 'UPI', 'CHEQUE', 'NEFT'];

        orders
            .filter(o => o.sector === currentSector && o.status === 'APPROVED')
            .forEach((order, idx) => {
                paymentList.push({
                    id: `PAY-${order.id.substring(0, 6)}`,
                    date: order.date,
                    vendorId: order.vendorId || '',
                    vendorName: order.vendor,
                    amount: order.total,
                    paymentMethod: methods[idx % methods.length],
                    referenceNo: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    invoiceRefs: [`PO-${order.id.substring(0, 8)}`],
                    status: idx % 5 === 0 ? 'PENDING' : 'COMPLETED',
                    branchId: order.branchId || currentBranch || 'Main'
                });
            });

        return paymentList;
    }, [orders, currentSector, currentBranch]);

    // Apply filters
    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!payment.vendorName.toLowerCase().includes(search) &&
                    !payment.id.toLowerCase().includes(search) &&
                    !payment.referenceNo?.toLowerCase().includes(search)) {
                    return false;
                }
            }
            if (methodFilter !== 'ALL' && payment.paymentMethod !== methodFilter) return false;
            if (statusFilter !== 'ALL' && payment.status !== statusFilter) return false;
            if (dateFrom && new Date(payment.date) < new Date(dateFrom)) return false;
            if (dateTo) {
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                if (new Date(payment.date) >= nextDay) return false;
            }
            return true;
        });
    }, [payments, searchTerm, methodFilter, statusFilter, dateFrom, dateTo]);

    // Summary
    const totalPaid = filteredPayments.filter(p => p.status === 'COMPLETED').reduce((acc, p) => acc + p.amount, 0);
    const pendingAmount = filteredPayments.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + p.amount, 0);
    const todayPayments = filteredPayments.filter(p =>
        new Date(p.date).toDateString() === new Date().toDateString()
    ).length;

    // Group by method for chart
    const methodBreakdown = useMemo(() => {
        const breakdown: Record<string, number> = {};
        filteredPayments.forEach(p => {
            if (p.status === 'COMPLETED') {
                breakdown[p.paymentMethod] = (breakdown[p.paymentMethod] || 0) + p.amount;
            }
        });
        return breakdown;
    }, [filteredPayments]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="px-2 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Paid
                </span>;
            case 'PENDING':
                return <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                </span>;
            default:
                return null;
        }
    };

    const getMethodBadge = (method: string) => {
        const config = PAYMENT_METHOD_LABELS[method];
        return (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg flex items-center gap-1">
                {config?.icon} {config?.label || method}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-primary" />
                        Supplier Payments
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">
                        Track payments made to suppliers • {getBranchName(currentBranch)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Record Payment
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Paid</p>
                            <p className="text-2xl font-bold text-success mt-1">₹{totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-success/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-success" />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{filteredPayments.filter(p => p.status === 'COMPLETED').length} payments</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Pending</p>
                            <p className="text-2xl font-bold text-warning mt-1">₹{pendingAmount.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-warning/10 rounded-xl">
                            <Clock className="w-6 h-6 text-warning" />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{filteredPayments.filter(p => p.status === 'PENDING').length} pending</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today's Payments</p>
                            <p className="text-2xl font-bold text-primary mt-1">{todayPayments}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Calendar className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Unique Vendors</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                                {new Set(filteredPayments.map(p => p.vendorId)).size}
                            </p>
                        </div>
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                            <Truck className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">Payment Method Breakdown</h3>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(methodBreakdown).map(([method, amount]) => (
                        <div key={method} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                            {PAYMENT_METHOD_LABELS[method]?.icon}
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{PAYMENT_METHOD_LABELS[method]?.label}</span>
                            <span className="text-sm font-bold text-primary">₹{amount.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Payment ID, Vendor, or Reference..."
                            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">From</label>
                    <input
                        type="date"
                        className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">To</label>
                    <input
                        type="date"
                        className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Method</label>
                    <select
                        className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={methodFilter}
                        onChange={e => setMethodFilter(e.target.value)}
                    >
                        <option value="ALL">All Methods</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="NEFT">NEFT/RTGS</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Status</label>
                    <select
                        className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                    </select>
                </div>

                <button
                    onClick={() => { setSearchTerm(''); setMethodFilter('ALL'); setStatusFilter('ALL'); setDateFrom(''); setDateTo(''); }}
                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold"
                >
                    Clear
                </button>
            </div>

            {/* Payments Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-xs font-medium">
                            <tr>
                                <th className="p-4">Payment ID</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Vendor</th>
                                <th className="p-4">Method</th>
                                <th className="p-4">Reference</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {filteredPayments.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-neutral-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <CreditCard className="w-8 h-8 text-neutral-300" />
                                        <p>No payments found</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <td className="p-4 font-mono text-xs text-primary font-medium">{payment.id}</td>
                                        <td className="p-4 text-neutral-600 dark:text-neutral-400">
                                            {new Date(payment.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Truck className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="font-medium text-neutral-900 dark:text-white">{payment.vendorName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">{getMethodBadge(payment.paymentMethod)}</td>
                                        <td className="p-4 font-mono text-xs text-neutral-500">{payment.referenceNo || '-'}</td>
                                        <td className="p-4 text-right font-bold text-success">₹{payment.amount.toLocaleString()}</td>
                                        <td className="p-4 text-center">{getStatusBadge(payment.status)}</td>
                                        <td className="p-4 text-center">
                                            <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg" title="View">
                                                <Eye className="w-4 h-4 text-primary" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                    {filteredPayments.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">No payments found</div>
                    ) : (
                        filteredPayments.map(payment => (
                            <div key={payment.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-mono text-xs text-primary font-medium">{payment.id}</p>
                                        <p className="font-bold text-neutral-900 dark:text-white">{payment.vendorName}</p>
                                    </div>
                                    {getStatusBadge(payment.status)}
                                </div>
                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg mt-2">
                                    <div className="flex items-center gap-2">
                                        {getMethodBadge(payment.paymentMethod)}
                                    </div>
                                    <p className="font-bold text-success">₹{payment.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Summary Footer */}
            <div className="text-center text-xs text-neutral-400">
                Showing {filteredPayments.length} payments • Total: ₹{filteredPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
            </div>
        </div>
    );
};

export default SupplierPayments;
