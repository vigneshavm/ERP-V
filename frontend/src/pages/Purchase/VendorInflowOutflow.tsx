import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';
import {
    Search,
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    FileText,
    FileSpreadsheet,
    RefreshCw,
    Users,
    ChevronLeft,
    ChevronRight,
    Calendar,
    DollarSign,
    Activity
} from 'lucide-react';
import Layout from '../../components/shared/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import StatsCard from '../../components/shared/Display/StatsCard';
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
    netBalance: number;
}

interface Totals {
    totalInflow: number;
    totalOutflow: number;
    debitNoteTotal: number;
    netBalance: number;
    vendorCount: number;
}

interface InflowOutflowData {
    vendors: VendorRow[];
    totals: Totals;
}

const VendorInflowOutflow: React.FC = () => {
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
                totalInflow: acc.totalInflow + v.totalInflow,
                totalOutflow: acc.totalOutflow + v.totalOutflow,
                debitNoteTotal: acc.debitNoteTotal + v.debitNoteTotal,
                netBalance: acc.netBalance + v.netBalance,
                vendorCount: acc.vendorCount + 1
            }),
            { totalInflow: 0, totalOutflow: 0, debitNoteTotal: 0, netBalance: 0, vendorCount: 0 }
        );
    }, [data?.totals, processedVendors, searchTerm]);

    const formatCurrency = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

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
        doc.text('Vendor Inflow / Outflow Report', 14, 15);
        if (dateFrom || dateTo) {
            doc.setFontSize(10);
            doc.text(`Period: ${dateFrom || 'Start'} to ${dateTo || 'Today'}`, 14, 22);
        }

        const tableData = processedVendors.map(v => [
            v.businessName || 'N/A',
            formatCurrency(v.totalInflow),
            formatCurrency(v.totalOutflow),
            formatCurrency(v.debitNoteTotal),
            formatCurrency(v.netBalance)
        ]);

        autoTable(doc, {
            head: [['Vendor', 'Total Inflow', 'Total Outflow', 'Debit Notes', 'Net Balance']],
            body: tableData,
            startY: dateFrom || dateTo ? 28 : 22,
        });

        doc.save('vendor_inflow_outflow.pdf');
    };

    // CSV Export
    const handleExportCSV = () => {
        const headers = ['Vendor,Supplier ID,Total Inflow,Total Outflow,Debit Notes,Net Balance,Bills,Payments'];
        const rows = processedVendors.map(v =>
            `"${v.businessName || 'N/A'}",${v.supplierId || '-'},${v.totalInflow},${v.totalOutflow},${v.debitNoteTotal},${v.netBalance},${v.billCount},${v.paymentCount}`
        );
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'vendor_inflow_outflow.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10 h-full flex flex-col">
                <PageHeader
                    title="Vendor Inflow / Outflow"
                    description="Consolidated view of all vendor purchase inflows and payment outflows"
                    actions={
                        <div className="flex gap-2">
                            <button onClick={handleRefresh} disabled={isRefreshing || isLoading}
                                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={handleExportCSV}
                                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
                            </button>
                            <button onClick={handleExportPDF}
                                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-red-600" /> PDF
                            </button>
                        </div>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Inflow (Bills)"
                        value={formatCurrency(displayTotals.totalInflow)}
                        icon={<TrendingUp />}
                        iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                        iconColor="text-blue-600 dark:text-blue-400"
                    />
                    <StatsCard
                        title="Total Outflow (Payments)"
                        value={formatCurrency(displayTotals.totalOutflow)}
                        icon={<TrendingDown />}
                        iconBgColor="bg-red-100 dark:bg-red-900/30"
                        iconColor="text-red-600 dark:text-red-400"
                    />
                    <StatsCard
                        title="Net Balance"
                        value={`${displayTotals.netBalance >= 0 ? '' : '-'}${formatCurrency(displayTotals.netBalance)}`}
                        icon={<DollarSign />}
                        iconBgColor={displayTotals.netBalance >= 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}
                        iconColor={displayTotals.netBalance >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
                    />
                    <StatsCard
                        title="Active Vendors"
                        value={displayTotals.vendorCount}
                        icon={<Users />}
                        iconBgColor="bg-purple-100 dark:bg-purple-900/30"
                        iconColor="text-purple-600 dark:text-purple-400"
                    />
                </div>

                {/* Filters */}
                <div className="bg-card rounded-xl border border-default p-4 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Search</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search vendor..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-input border border-default rounded-lg text-sm text-main placeholder-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                        <div className="w-56">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Vendor</label>
                            <select
                                value={vendorFilter}
                                onChange={e => setVendorFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-input border border-default rounded-lg text-sm text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="ALL">All Vendors</option>
                                {vendorOptions.map((v: any) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-40">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> From
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 bg-input border border-default rounded-lg text-sm text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="w-40">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> To
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 bg-input border border-default rounded-lg text-sm text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleApplyFilters}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                            >
                                <Activity className="w-4 h-4" /> Apply
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-card rounded-xl border border-default flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface text-muted uppercase text-xs font-medium sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                        onClick={() => handleSort('businessName')}>
                                        <div className="flex items-center gap-2">
                                            Vendor <SortIcon column="businessName" />
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-right"
                                        onClick={() => handleSort('totalInflow')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Total Inflow <SortIcon column="totalInflow" />
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-right"
                                        onClick={() => handleSort('totalOutflow')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Total Outflow <SortIcon column="totalOutflow" />
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-right"
                                        onClick={() => handleSort('debitNoteTotal')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Debit Notes <SortIcon column="debitNoteTotal" />
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-center"
                                        onClick={() => handleSort('billCount')}>
                                        <div className="flex items-center justify-center gap-2">
                                            Bills <SortIcon column="billCount" />
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-center"
                                        onClick={() => handleSort('paymentCount')}>
                                        <div className="flex items-center justify-center gap-2">
                                            Payments <SortIcon column="paymentCount" />
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-right"
                                        onClick={() => handleSort('netBalance')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Net Balance <SortIcon column="netBalance" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {isLoading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-muted">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
                                        </div>
                                    </td></tr>
                                ) : paginatedVendors.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-muted">No records found</td></tr>
                                ) : (
                                    paginatedVendors.map(vendor => (
                                        <tr key={vendor._id} className="hover:bg-surface transition-colors">
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-main">{vendor.businessName || 'N/A'}</span>
                                                    {vendor.supplierId && (
                                                        <span className="text-xs text-muted font-mono">{vendor.supplierId}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(vendor.totalInflow)}
                                            </td>
                                            <td className="p-4 text-right font-semibold text-red-600 dark:text-red-400">
                                                {formatCurrency(vendor.totalOutflow)}
                                            </td>
                                            <td className="p-4 text-right text-secondary">
                                                {vendor.debitNoteTotal > 0 ? formatCurrency(vendor.debitNoteTotal) : '-'}
                                            </td>
                                            <td className="p-4 text-center text-secondary">{vendor.billCount}</td>
                                            <td className="p-4 text-center text-secondary">{vendor.paymentCount}</td>
                                            <td className={`p-4 text-right font-bold ${vendor.netBalance > 0 ? 'text-amber-600 dark:text-amber-400' : vendor.netBalance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-main'}`}>
                                                {vendor.netBalance > 0 && ''}
                                                {vendor.netBalance < 0 && '-'}
                                                {formatCurrency(vendor.netBalance)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {/* Footer totals row */}
                            {!isLoading && processedVendors.length > 0 && (
                                <tfoot className="bg-surface border-t-2 border-default">
                                    <tr className="font-bold">
                                        <td className="p-4 text-main">Total ({displayTotals.vendorCount} vendors)</td>
                                        <td className="p-4 text-right text-blue-600 dark:text-blue-400">{formatCurrency(displayTotals.totalInflow)}</td>
                                        <td className="p-4 text-right text-red-600 dark:text-red-400">{formatCurrency(displayTotals.totalOutflow)}</td>
                                        <td className="p-4 text-right text-secondary">{formatCurrency(displayTotals.debitNoteTotal)}</td>
                                        <td className="p-4 text-center text-secondary">-</td>
                                        <td className="p-4 text-center text-secondary">-</td>
                                        <td className={`p-4 text-right ${displayTotals.netBalance >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {displayTotals.netBalance < 0 && '-'}{formatCurrency(displayTotals.netBalance)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {processedVendors.length > itemsPerPage && (
                        <div className="p-4 border-t border-default flex items-center justify-between bg-surface">
                            <div className="text-xs text-muted">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedVendors.length)} of {processedVendors.length} vendors
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
        </Layout>
    );
};

export default VendorInflowOutflow;
