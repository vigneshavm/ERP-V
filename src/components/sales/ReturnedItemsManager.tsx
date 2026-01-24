import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setActiveTab } from '../../store';
import { useSalesReturnManager } from '../../hooks/useSalesReturnManager';
import {
    Search,
    Filter,
    Download,
    Plus,
    RotateCcw,
    Calendar,
    Wallet,
    CreditCard,
    Banknote,
    RefreshCw,
    AlertCircle,
    User,
    ChevronDown,
    MoreHorizontal,
    Printer,
    FileText
} from 'lucide-react';
import { SalesReturn } from '../../types/salesReturn';

const ReturnedItemsManager = () => {
    const dispatch = useDispatch();
    const { returnsHistory, loadingHistory, refreshReturns } = useSalesReturnManager();

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'completed' | 'cancelled'>('ALL');
    const [methodFilter, setMethodFilter] = useState<'ALL' | 'cash' | 'wallet' | 'card' | 'exchange' | 'upi' | 'bank_transfer'>('ALL');

    // Mobile Filters Expansion
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Derived Data
    const filteredReturns = useMemo(() => {
        return returnsHistory.filter(ret => {
            // 1. Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                ret.id.toLowerCase().includes(searchLower) ||
                (ret.customerName || '').toLowerCase().includes(searchLower) ||
                (ret.invoiceId || '').toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // 2. Status
            if (statusFilter !== 'ALL' && ret.status !== statusFilter) return false;

            // 3. Method
            if (methodFilter !== 'ALL' && ret.refundMethod !== methodFilter) return false;

            return true;
        });
    }, [returnsHistory, searchTerm, statusFilter, methodFilter]);

    const stats = useMemo(() => {
        const total = filteredReturns.reduce((acc, curr) => acc + curr.totalRefundAmount, 0);
        const pending = filteredReturns.filter(r => r.status === 'pending').length;
        return { total, count: filteredReturns.length, pending };
    }, [filteredReturns]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Banknote className="w-3 h-3" />;
            case 'wallet': return <Wallet className="w-3 h-3" />;
            case 'card': return <CreditCard className="w-3 h-3" />;
            case 'exchange': return <RefreshCw className="w-3 h-3" />;
            default: return <CreditCard className="w-3 h-3" />;
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Returned Items <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-mono">{filteredReturns.length}</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Audit and manage customer returns and refunds</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors">
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('SALES_RETURN'))}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Return</span>
                    </button>
                </div>
            </div>

            {/* Stats Bar (Optional compact summary) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Total Refunded</p>
                        <p className="text-xl font-bold text-red-600">₹{stats.total.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                        <RotateCcw className="w-5 h-5" />
                    </div>
                </div>
                {/* Add more cards if needed */}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Search by Return ID, Invoice #, or Customer..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        className="md:hidden flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                    >
                        <Filter className="w-4 h-4" /> Filters <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`${showMobileFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4`}>
                        <div className="w-full md:w-48">
                            <select
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                value={methodFilter}
                                onChange={(e) => setMethodFilter(e.target.value as any)}
                            >
                                <option value="ALL">All Payments</option>
                                <option value="cash">Cash</option>
                                <option value="wallet">Wallet</option>
                                <option value="exchange">Exchange</option>
                                <option value="card">Card</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Return ID</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Date</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Customer</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Invoice Ref</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Method</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Amount</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Status</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loadingHistory ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400">Loading returns history...</td>
                                </tr>
                            ) : filteredReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                            <RotateCcw className="w-12 h-12 mb-4 opacity-50" />
                                            <p className="text-lg font-medium">No returns found</p>
                                            <p className="text-sm">Try adjusting your filters or create a new return.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReturns.map(ret => (
                                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                        <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                                            #{ret.id.substring(0, 8)}
                                        </td>
                                        <td className="p-4 text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{new Date(ret.returnDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-xs text-slate-400 pl-5.5">{new Date(ret.returnDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                {ret.customerName || 'Walk-in Customer'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {ret.invoiceId ? (
                                                <span className="flex items-center gap-1 hover:text-indigo-600 hover:underline">
                                                    <FileText className="w-3 h-3" /> #{ret.invoiceId.substring(0, 8)}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 capitalize">
                                                {getMethodIcon(ret.refundMethod)}
                                                {ret.refundMethod}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-red-600 dark:text-red-400">
                                            ₹{ret.totalRefundAmount.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(ret.status)}`}>
                                                {ret.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReturnedItemsManager;
