import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';
import {
    RefreshCw,
    Users,
    ChevronLeft,
    ChevronRight,
    Calendar,
    TrendingUp,
    TrendingDown,
    FileText,
    DollarSign,
    FileSpreadsheet,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Filter
} from 'lucide-react';
import Layout from '../../components/shared/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import SupplierSubNav from '../People/Suppliers/SupplierSubNav';
import SupplierStatsCards from '../People/Suppliers/components/SupplierStatsCards';
import SupplierFilterBar from '../People/Suppliers/components/SupplierFilterBar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VendorRow {
    _id: string;
    businessName: string;
    contactPersonName?: string;
    supplierId?: string;
    totalInflow: number;
    totalOutflow: number;
    debitNoteTotal: number;
    billCount: number;
    paymentCount: number;
    openingBalance: number;
    closingBalance: number;
}

interface Totals {
    totalInflow: number;
    totalOutflow: number;
    debitNoteTotal: number;
    totalOpeningBalance: number;
    totalClosingBalance: number;
    vendorCount: number;
}

interface InflowOutflowData {
    vendors: VendorRow[];
    totals: Totals;
}



interface VendorInflowOutflowProps {
    embedded?: boolean;
}

const VendorInflowOutflow: React.FC<VendorInflowOutflowProps> = ({ embedded = false }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    // Data State
    const [data, setData] = useState<InflowOutflowData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter State
    const [vendorFilter, setVendorFilter] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const navigate = useNavigate();

    // Sort State
    const [sortColumn, setSortColumn] = useState<string>('totalInflow');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    const getConfig = () => ({
        headers: { Authorization: `Bearer ${user?.token}` }
    });

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append('startDate', dateFrom);
            if (dateTo) params.append('endDate', dateTo);
            if (vendorFilter !== 'ALL') params.append('supplierId', vendorFilter);

            const qs = params.toString();
            const url = `/api/purchases/suppliers/inflow-outflow${qs ? `?${qs}` : ''}`;
            const response = await api.get(url, getConfig());
            setData(response.data.data);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to fetch data';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchData();
    }, [user?.token]);



    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchData();
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleClearFilters = () => {
        setVendorFilter('ALL');
        setDateFrom('');
        setDateTo('');
        setSearchTerm('');
        setCurrentPage(1);
        // Fetch with no filters
        setIsLoading(true);
        api.get('/api/purchases/suppliers/inflow-outflow', getConfig())
            .then(res => setData(res.data.data))
            .catch(() => { })
            .finally(() => setIsLoading(false));
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    // Unique vendor list from supplier redux state for the filter dropdown
    const vendorOptions = useMemo(() => {
        return (suppliers || [])
            .filter((s: any) => s.status === 'active')
            .map((s: any) => ({ id: s._id, name: s.businessName }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }, [suppliers]);

    // Filtered + sorted vendors
    const processedVendors = useMemo(() => {
        if (!data?.vendors) return [];

        let vendors = [...data.vendors];

        // Search filter (client-side)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            vendors = vendors.filter(v =>
                v.businessName?.toLowerCase().includes(term) ||
                v.supplierId?.toLowerCase().includes(term)
            );
        }

        // Sort
        vendors.sort((a, b) => {
            const valA = (a as any)[sortColumn] ?? 0;
            const valB = (b as any)[sortColumn] ?? 0;

            if (typeof valA === 'string') {
                return sortDirection === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        });

        return vendors;
    }, [data?.vendors, searchTerm, sortColumn, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(processedVendors.length / itemsPerPage);
    const paginatedVendors = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedVendors.slice(start, start + itemsPerPage);
    }, [processedVendors, currentPage, itemsPerPage]);

    // Totals (use API totals, but if search is active recalculate from filtered list)
    const displayTotals = useMemo(() => {
        if (!searchTerm && data?.totals) return data.totals;
        return processedVendors.reduce(
            (acc, v) => ({
                totalInflow: acc.totalInflow + (v.totalInflow || 0),
                totalOutflow: acc.totalOutflow + (v.totalOutflow || 0),
                debitNoteTotal: acc.debitNoteTotal + (v.debitNoteTotal || 0),
                totalOpeningBalance: acc.totalOpeningBalance + (v.openingBalance || 0),
                totalClosingBalance: acc.totalClosingBalance + (v.closingBalance || 0),
                vendorCount: acc.vendorCount + 1
            }),
            { totalInflow: 0, totalOutflow: 0, debitNoteTotal: 0, totalOpeningBalance: 0, totalClosingBalance: 0, vendorCount: 0 }
        );
    }, [data?.totals, processedVendors, searchTerm]);

    const formatCurrency = (n: number | undefined | null) => {
        if (typeof n !== 'number' || isNaN(n)) return '₹0';
        return `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn === column) {
            return sortDirection === 'asc'
                ? <ArrowUp className="w-3 h-3 text-primary" />
                : <ArrowDown className="w-3 h-3 text-primary" />;
        }
        return <ArrowUpDown className="w-3 h-3 text-neutral-300" />;
    };

    // PDF Export
    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text('Supplier Inflow / Outflow Report', 14, 15);
        if (dateFrom || dateTo) {
            doc.setFontSize(10);
            doc.text(`Period: ${dateFrom || 'Start'} to ${dateTo || 'Today'}`, 14, 22);
        }

        const tableData = processedVendors.map(v => [
            v.businessName || 'N/A',
            formatCurrency(v.totalInflow),
            formatCurrency(v.totalOutflow),
            formatCurrency(v.debitNoteTotal),
            formatCurrency(v.closingBalance)
        ]);

        autoTable(doc, {
            head: [['Supplier', 'Total Inflow', 'Total Outflow', 'Debit Notes', 'Closing Balance']],
            body: tableData,
            startY: dateFrom || dateTo ? 28 : 22,
        });

        doc.save('supplier_inflow_outflow.pdf');
    };

    // CSV Export
    const handleExportCSV = () => {
        const headers = ['Supplier,Supplier ID,Total Inflow,Total Outflow,Debit Notes,Closing Balance,Bills,Payments'];
        const rows = processedVendors.map(v =>
            `"${v.businessName || 'N/A'}",${v.supplierId || '-'},${v.totalInflow},${v.totalOutflow},${v.debitNoteTotal},${v.closingBalance},${v.billCount},${v.paymentCount}`
        );
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'supplier_inflow_outflow.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── Detail Page View ─────────────────────────────────────────
    // ─── List Page View ──────────────────────────────────────────
    const Content = () => (
        <div className={`space-y-6 animate-fade-in pb-10 h-full flex flex-col ${embedded ? '' : ''}`}>
            {!embedded && (
                <div className="flex items-center justify-between pb-2">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-neutral-100 tracking-tight">Supplier Inflow / Outflow</h1>
                        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Consolidated view of all supplier purchase inflows and payment outflows</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Range Picker - Ledger Style */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 p-1.5 rounded-xl border border-slate-100 dark:border-neutral-700 shadow-sm">
                            <Calendar size={14} className="ml-2 text-slate-400" />
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs px-1.5 py-1 outline-none text-slate-700 dark:text-neutral-200 font-bold"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <span className="text-slate-200 dark:text-neutral-600 font-bold text-xs">→</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs px-1.5 py-1 outline-none text-slate-700 dark:text-neutral-200 font-bold"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                            <button
                                onClick={handleApplyFilters}
                                className="p-1.5 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded-lg transition-colors text-primary"
                                title="Apply Filter"
                            >
                                <Filter size={14} />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleRefresh} disabled={isRefreshing || isLoading}
                                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-slate-500">
                                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={handleExportCSV}
                                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-slate-600 dark:text-neutral-300">
                                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
                            </button>
                            <button onClick={handleExportPDF}
                                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-slate-600 dark:text-neutral-300">
                                <FileText className="w-4 h-4 text-red-600" /> PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!embedded && <SupplierSubNav />}

            {embedded && (
                <div className="flex justify-end mb-4">
                    <div className="flex gap-2">
                        <button onClick={handleRefresh} disabled={isRefreshing || isLoading}
                            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                            <RefreshCw className={`w-4 h-4 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={handleExportCSV}
                            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 text-slate-600 dark:text-neutral-300">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
                        </button>
                        <button onClick={handleExportPDF}
                            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 text-slate-600 dark:text-neutral-300">
                            <FileText className="w-4 h-4 text-rose-600" /> PDF
                        </button>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <SupplierStatsCards
                variant="inflow"
                totalInflow={displayTotals.totalInflow}
                totalOutflow={displayTotals.totalOutflow}
                totalClosingBalance={displayTotals.totalClosingBalance}
                netChange={displayTotals.totalInflow - displayTotals.totalOutflow - displayTotals.debitNoteTotal}
                activeSuppliers={displayTotals.vendorCount}
            />

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 shadow-sm p-4 mb-6">
                <SupplierFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onRefresh={fetchData}
                    isLoading={isLoading}
                    placeholder="Search supplier..."
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Supplier Select */}
                        <select
                            value={vendorFilter}
                            onChange={e => setVendorFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm text-slate-800 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all w-48"
                        >
                            <option value="ALL">All Suppliers</option>
                            {vendorOptions.map((v: any) => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleApplyFilters}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                            Apply
                        </button>
                        {(vendorFilter !== 'ALL' || dateFrom || dateTo) && (
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-sm font-medium"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </SupplierFilterBar>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-sm border border-slate-100 dark:border-neutral-700 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-neutral-900/50 sticky top-0 z-10 backdrop-blur-sm">
                            <tr className="border-b border-slate-100 dark:border-neutral-700">
                                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('businessName')}>
                                    <div className="flex items-center gap-1">
                                        Supplier <SortIcon column="businessName" />
                                    </div>
                                </th>
                                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap"
                                    onClick={() => handleSort('totalInflow')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Total Inflow <SortIcon column="totalInflow" />
                                    </div>
                                </th>
                                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap"
                                    onClick={() => handleSort('totalOutflow')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Total Outflow <SortIcon column="totalOutflow" />
                                    </div>
                                </th>
                                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap"
                                    onClick={() => handleSort('debitNoteTotal')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Debit Notes <SortIcon column="debitNoteTotal" />
                                    </div>
                                </th>
                                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors text-center whitespace-nowrap"
                                    onClick={() => handleSort('billCount')}>
                                    <div className="flex items-center justify-center gap-1">
                                        Bills <SortIcon column="billCount" />
                                    </div>
                                </th>
                                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors text-center whitespace-nowrap"
                                    onClick={() => handleSort('paymentCount')}>
                                    <div className="flex items-center justify-center gap-1">
                                        Payments <SortIcon column="paymentCount" />
                                    </div>
                                </th>
                                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap"
                                    onClick={() => handleSort('closingBalance')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Closing Balance <SortIcon column="closingBalance" />
                                    </div>
                                </th>
                                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap"
                                    onClick={() => handleSort('openingBalance')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Opening <SortIcon column="openingBalance" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-neutral-700/50">
                            {isLoading ? (
                                <tr><td colSpan={8} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                                        <p className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Loading data...</p>
                                    </div>
                                </td></tr>
                            ) : paginatedVendors.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <FileSpreadsheet className="w-10 h-10 text-slate-200 dark:text-neutral-700" />
                                        <p className="text-sm font-bold text-slate-400 dark:text-neutral-500">No records found</p>
                                    </div>
                                </td></tr>
                            ) : (
                                paginatedVendors.map(vendor => (
                                    <tr key={vendor._id} className="group hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/suppliers/${vendor._id}/ledger`)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-800 dark:text-neutral-100 group-hover:text-primary dark:group-hover:text-primary transition-colors">{vendor.businessName || 'N/A'}</span>
                                                {vendor.supplierId && (
                                                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">{vendor.supplierId}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(vendor.totalInflow)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-sm font-semibold text-rose-600 dark:text-danger">{formatCurrency(vendor.totalOutflow)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-sm text-slate-600 dark:text-neutral-400">{vendor.debitNoteTotal > 0 ? formatCurrency(vendor.debitNoteTotal) : '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className="text-sm text-slate-600 dark:text-neutral-400">{vendor.billCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className="text-sm text-slate-600 dark:text-neutral-400">{vendor.paymentCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatCurrency(vendor.closingBalance)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-400 dark:text-neutral-500">{formatCurrency(vendor.openingBalance)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* Footer totals row */}
                        {!isLoading && processedVendors.length > 0 && (
                            <tfoot className="bg-slate-50 dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-700">
                                <tr>
                                    <td className="px-6 py-4 text-xs font-black text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Total ({displayTotals.vendorCount})</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(displayTotals.totalInflow)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-rose-600 dark:text-danger">{formatCurrency(displayTotals.totalOutflow)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-600 dark:text-neutral-400">{formatCurrency(displayTotals.debitNoteTotal)}</td>
                                    <td colSpan={2}></td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-orange-600 dark:text-orange-400">{formatCurrency(displayTotals.totalClosingBalance)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-400 dark:text-neutral-500">{formatCurrency(displayTotals.totalOpeningBalance)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Pagination */}
                {processedVendors.length > itemsPerPage && (
                    <div className="p-4 border-t border-default flex items-center justify-between bg-surface">
                        <div className="text-xs text-muted">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedVendors.length)} of {processedVendors.length} suppliers
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-default rounded-lg hover:bg-card disabled:opacity-50 text-main"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium px-2 text-main">Page {currentPage} of {totalPages || 1}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-default rounded-lg hover:bg-card disabled:opacity-50 text-main"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return embedded ? <Content /> : (
        <Layout>
            <Content />
        </Layout>
    );
};

export default VendorInflowOutflow;
