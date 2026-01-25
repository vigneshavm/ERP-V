import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    FileText, Search, Filter, Download, Printer, Mail,
    Phone, Eye, Edit, ChevronDown, ChevronUp, Plus,
    CheckCircle, Clock, AlertCircle, XCircle, Calendar,
    Users, Building2, CreditCard, RefreshCw
} from 'lucide-react';
import { RootState } from '../../store';
import { useSalesLedger } from '../../hooks/useSalesLedger'; // Import the hook

const statusConfig: Record<string, any> = {
    DRAFT: { label: 'Draft', color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', icon: FileText },
    ISSUED: { label: 'Issued', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: FileText },
    PARTIAL: { label: 'Partial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
    PAID: { label: 'Paid', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
    OVERDUE: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400', icon: XCircle }
};

const SalesInvoiceRegister: React.FC = () => {
    // Hook Integration
    const { fetchLedger, invoices, loading, totalCount, stats } = useSalesLedger();

    // Local State for Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Fetch Data on Change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLedger(currentPage, itemsPerPage, {
                searchQuery,
                status: statusFilter,
                paymentMode: paymentFilter,
                dateFrom,
                dateTo
            });
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [currentPage, searchQuery, statusFilter, paymentFilter, dateFrom, dateTo, fetchLedger]);


    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Selection Logic
    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === invoices.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(invoices.map(i => i.id)));
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* KPI Header - Sticky */}
            <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Invoices', value: totalCount, format: 'number', color: 'text-neutral-700 dark:text-neutral-200' },
                        { label: 'Total Sales', value: stats.totalSales, format: 'currency', color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Collected', value: stats.collected, format: 'currency', color: 'text-green-600 dark:text-green-400' },
                        { label: 'Outstanding', value: stats.outstanding, format: 'currency', color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Overdue', value: stats.overdue, format: 'currency', color: 'text-red-600 dark:text-red-400' },
                        { label: 'Avg Invoice', value: stats.totalSales > 0 ? stats.totalSales / totalCount : 0, format: 'currency', color: 'text-neutral-600 dark:text-neutral-300' },
                    ].map((kpi, i) => (
                        <div key={i} className="text-center p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                            <div className={`text-lg font-bold ${kpi.color}`}>
                                {kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value.toLocaleString()}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{kpi.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
                {/* Top row: Search + Actions */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search invoice, customer, mobile..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn btn-secondary flex items-center gap-2 px-3 py-2 rounded-lg border ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : 'border-neutral-200 text-neutral-700'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        New Invoice
                    </button>
                </div>

                {/* Expandable filters */}
                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg animate-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">Status</label>
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm">
                                <option value="ALL">All Status</option>
                                <option value="ISSUED">Issued</option>
                                <option value="PAID">Paid</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">Payment Mode</label>
                            <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setCurrentPage(1); }} className="w-full p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm">
                                <option value="ALL">All Modes</option>
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="UPI">UPI</option>
                                <option value="MIXED">Mixed</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">From Date</label>
                            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }} className="w-full p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">To Date</label>
                            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }} className="w-full p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm" />
                        </div>
                        <div className="col-span-2 flex items-end gap-2">
                            <button
                                onClick={() => { setStatusFilter('ALL'); setPaymentFilter('ALL'); setDateFrom(''); setDateTo(''); setSearchQuery(''); setCurrentPage(1); }}
                                className="text-neutral-500 hover:text-neutral-700 text-sm flex items-center gap-1 px-2 py-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Clear All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoice Grid */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0 z-0">
                        <tr className="text-left text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            <th className="p-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === invoices.length && invoices.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-neutral-300"
                                />
                            </th>
                            <th className="p-3">Invoice #</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 text-right">Paid</th>
                            <th className="p-3 text-right">Balance</th>
                            <th className="p-3">Payment</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {loading ? (
                            <tr><td colSpan={10} className="p-12 text-center text-neutral-500">Loading sales ledger...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={10} className="p-12 text-center text-neutral-500">No invoices found matching your criteria.</td></tr>
                        ) : (
                            invoices.map((inv) => {
                                const status = statusConfig[inv.status] || statusConfig['ISSUED'];
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(inv.id)}
                                                onChange={() => toggleSelect(inv.id)}
                                                className="rounded border-neutral-300"
                                            />
                                        </td>
                                        <td className="p-3 font-mono text-brand-600 dark:text-brand-400 font-medium">
                                            {inv.invoiceNo}
                                        </td>
                                        <td className="p-3 text-neutral-600 dark:text-neutral-400">
                                            {new Date(inv.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium text-neutral-800 dark:text-neutral-200">{inv.customerName}</div>
                                            <div className="text-xs text-neutral-500">{inv.customerPhone}</div>
                                        </td>
                                        <td className="p-3 text-right font-medium">{formatCurrency(inv.netAmount)}</td>
                                        <td className="p-3 text-right text-green-600 dark:text-green-400">{formatCurrency(inv.paidAmount)}</td>
                                        <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-medium">{formatCurrency(inv.balanceAmount)}</td>
                                        <td className="p-3">
                                            <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                                {inv.paymentMode}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="View">
                                                    <Eye className="w-4 h-4 text-neutral-500" />
                                                </button>
                                                <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Print">
                                                    <Printer className="w-4 h-4 text-neutral-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
                <div className="text-sm text-neutral-500">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-neutral-300 rounded text-sm disabled:opacity-50 hover:bg-neutral-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-medium px-3">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1 border border-neutral-300 rounded text-sm disabled:opacity-50 hover:bg-neutral-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesInvoiceRegister;
