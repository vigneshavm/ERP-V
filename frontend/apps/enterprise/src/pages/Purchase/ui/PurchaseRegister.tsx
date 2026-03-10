import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from "@/app/store/store";
import { getAllPurchases } from "@/entities/purchase/model/purchaseSlice";
import { useUiStore } from "@/shared/lib/store/uiStore";
import { PurchaseOrder, PurchaseOrderStatus } from "@repo/shared-kernel";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import {
    Search,
    Calendar,
    Package,
    TrendingUp,
    FileText,
    Filter,
    Download,
    Plus,
    Eye,
    CheckCircle,
    Clock,
    XCircle,
    Truck,
    RefreshCw,
    User,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    ArrowUpDown,
    ArrowUp,
    CheckSquare,
    ArrowDown
} from 'lucide-react';
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import StatsCard from "../../components/shared/Display/StatsCard";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PurchaseRegister: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { orders, isProcessing } = useSelector((state: RootState) => state.purchase);
    const { getBranchName } = useBranchResolver();

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [vendorFilter, setVendorFilter] = useState('ALL');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');

    // View Mode State
    const [viewMode, setViewMode] = useState<'ALL' | 'BILLED' | 'UNBILLED' | 'DRAFT'>('ALL');

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Sort State
    const [sortColumn, setSortColumn] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Load Data
    React.useEffect(() => {
        dispatch(getAllPurchases());
    }, [dispatch]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await dispatch(getAllPurchases());
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc'); // Default new column to asc, or maybe desc for date? let's stick to standard toggle
        }
    };

    // Derived Data for Filters 
    // Handle the fact that vendorId is populated in the backend
    const uniqueVendors = useMemo(() => {
        const vendorNames = orders.map(o => {
            if (o.vendorId && typeof o.vendorId === 'object') {
                return o.vendorId.businessName || o.vendorId.name;
            }
            return o.vendor_name;
        });
        return Array.from(new Set(vendorNames)).filter((v): v is string => !!v).sort();
    }, [orders]);

    // Filtering Logic
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            let vName = '';
            if (order.vendorId && typeof order.vendorId === 'object') {
                vName = order.vendorId.businessName || order.vendorId.name || '';
            } else {
                vName = order.vendor_name || '';
            }

            const pNumber = order.purchaseNumber || order.po_number || '';
            const pDate = order.date || order.po_date;
            const tAmount = order.totalAmount || order.total_amount || 0;

            // Search
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!vName.toLowerCase().includes(search) &&
                    !pNumber.toLowerCase().includes(search)) {
                    return false;
                }
            }

            // Status
            if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;

            // Vendor
            if (vendorFilter !== 'ALL' && vName !== vendorFilter) return false;

            // Date Range
            if (dateFrom && new Date(pDate) < new Date(dateFrom)) return false;
            if (dateTo) {
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                if (new Date(pDate) >= nextDay) return false;
            }

            // Amount Range
            if (amountMin && tAmount < parseFloat(amountMin)) return false;
            if (amountMax && tAmount > parseFloat(amountMax)) return false;

            return true;
        }).sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortColumn) {
                case 'number':
                    valA = a.purchaseNumber || a.po_number || '';
                    valB = b.purchaseNumber || b.po_number || '';
                    break;
                case 'date':
                    valA = new Date((a as any).createdAt || a.created_at || a.date || a.po_date || 0).getTime();
                    valB = new Date((b as any).createdAt || b.created_at || b.date || b.po_date || 0).getTime();
                    break;
                case 'vendor':
                    if (a.vendorId && typeof a.vendorId === 'object') {
                        valA = (a.vendorId.businessName || a.vendorId.name || '').toLowerCase();
                    } else {
                        valA = (a.vendor_name || '').toLowerCase();
                    }
                    if (b.vendorId && typeof b.vendorId === 'object') {
                        valB = (b.vendorId.businessName || b.vendorId.name || '').toLowerCase();
                    } else {
                        valB = (b.vendor_name || '').toLowerCase();
                    }
                    break;
                case 'items':
                    valA = a.items.length;
                    valB = b.items.length;
                    break;
                case 'amount':
                    valA = a.totalAmount || a.total_amount || 0;
                    valB = b.totalAmount || b.total_amount || 0;
                    break;
                case 'status':
                    valA = a.status || '';
                    valB = b.status || '';
                    break;
                default:
                    return 0;
            }

            if (sortDirection === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });
    }, [orders, searchTerm, statusFilter, dateFrom, dateTo, vendorFilter, amountMin, amountMax, sortColumn, sortDirection]);

    // Apply View Mode
    const displayOrders = useMemo(() => {
        switch (viewMode) {
            case 'BILLED':
                return filteredOrders.filter(o =>
                    o.status === 'COMPLETED' ||
                    o.status === 'Billed' ||
                    o.status === 'Paid' ||
                    o.status === 'Converted'
                );
            case 'UNBILLED':
                return filteredOrders.filter(o =>
                    o.status === 'Pending' ||
                    o.status === 'Pending Approval' ||
                    o.status === 'Approved' ||
                    o.status === 'Partial Receipt' || // Corrected from Partially Received
                    o.status === 'Fully Received' ||
                    o.status === 'RECEIVED'
                );
            case 'DRAFT':
                return filteredOrders.filter(o => o.status === 'Draft');
            case 'ALL':
            default:
                return filteredOrders;
        }
    }, [filteredOrders, viewMode]);

    // Pagination Logic
    const totalPages = Math.ceil(displayOrders.length / itemsPerPage);
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return displayOrders.slice(start, start + itemsPerPage);
    }, [displayOrders, currentPage, itemsPerPage]);

    // Stats (Calculated on Base Filtered Orders, NOT affected by 'Billed Only' toggle)
    const totalPurchasesValue = filteredOrders.reduce((acc, o) => acc + (o.totalAmount || o.total_amount || 0), 0);
    const totalBilledValue = filteredOrders
        .filter(o => o.status === 'COMPLETED')
        .reduce((acc, o) => acc + (o.totalAmount || o.total_amount || 0), 0);

    const pendingCount = filteredOrders.filter(o => o.status === 'Pending' || o.status === 'Pending Approval' || o.status === 'Draft').length;
    const approvedCount = filteredOrders.filter(o => o.status === 'Approved' || o.status === 'Fully Received').length;

    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase();
        switch (s) {
            case 'APPROVED':
            case 'COMPLETED':
                return <span className="px-2 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {status === 'COMPLETED' ? 'Completed' : 'Approved'}</span>;
            case 'PENDING':
            case 'PENDING APPROVAL':
            case 'DRAFT':
                return <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> {s === 'DRAFT' ? 'Draft' : 'Pending'}</span>;
            case 'REJECTED':
            case 'CANCELLED':
                return <span className="px-2 py-1 bg-error/10 text-error text-xs font-bold rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> {status}</span>;
            case 'PAID':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
            case 'BILLED':
                return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full flex items-center gap-1"><FileText className="w-3 h-3" /> Billed</span>;
            default:
                return <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-full">{status}</span>;
        }
    };

    const handleView = (order: PurchaseOrder) => {
        if (!order) return;
        navigate(`/purchase/orders/${order._id || order.id}`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Purchase Register", 14, 15);

        const tableData = displayOrders.map(o => {
            const vName = (o.vendorId && typeof o.vendorId === 'object') ? (o.vendorId.businessName || o.vendorId.name) : (o.vendor_name || 'N/A');
            return [
                new Date(o.date || o.po_date).toLocaleDateString(),
                o.purchaseNumber || o.po_number || 'N/A',
                vName || 'N/A',
                o.status,
                o.items.length.toString(),
                `Rs. ${(o.totalAmount || o.total_amount || 0).toLocaleString()}`
            ];
        });

        autoTable(doc, {
            head: [['Date', 'Number #', 'Vendor', 'Status', 'Items', 'Amount']],
            body: tableData,
            startY: 20,
        });

        doc.save('purchase_register.pdf');
    };

    const handleExportCSV = () => {
        const headers = ["Date,Number #,Vendor,Status,Items,Amount,Created By"];
        const rows = displayOrders.map(o => {
            const vName = (o.vendorId && typeof o.vendorId === 'object') ? (o.vendorId.businessName || o.vendorId.name) : (o.vendor_name || 'N/A');
            const created = (o.createdBy && typeof o.createdBy === 'object') ? o.createdBy.name : (o.created_by || '-');
            return `${new Date(o.date || o.po_date).toLocaleDateString()},${o.purchaseNumber || o.po_number},"${vName}",${o.status},${o.items.length},${o.totalAmount || o.total_amount || 0},${created}`;
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "purchase_register.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10 h-full flex flex-col">
                <PageHeader
                    title="Purchase Register"
                    description="Comprehensive record and audit trail of all purchases"
                    actions={
                        <div className="flex gap-2">
                            <button onClick={handleRefresh} disabled={isRefreshing || isProcessing} className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isProcessing) ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={handleExportCSV} className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
                            </button>
                            <button onClick={handleExportPDF} className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-red-600" /> PDF
                            </button>
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value as any)}
                                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="ALL">All Orders</option>
                                <option value="BILLED">Billed / Completed</option>
                                <option value="UNBILLED">Unbilled / Pending</option>
                                <option value="DRAFT">Drafts</option>
                            </select>
                            <button
                                onClick={() => setActiveTab('PURCHASE_ENTRY')}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> New Purchase
                            </button>
                        </div>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Value"
                        value={`₹${totalPurchasesValue.toLocaleString()}`}
                        icon={<TrendingUp />}
                        iconBgColor="bg-primary/10"
                        iconColor="text-primary"
                    />
                    <StatsCard
                        title="Total Billed"
                        value={`₹${totalBilledValue.toLocaleString()}`}
                        icon={<CheckSquare />}
                        iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
                        iconColor="text-emerald-600 dark:text-emerald-400"
                    />
                    <StatsCard
                        title="Transactions"
                        value={filteredOrders.length}
                        icon={<FileText />}
                        iconBgColor="bg-neutral-100 dark:bg-neutral-700"
                        iconColor="text-neutral-600 dark:text-neutral-300"
                    />
                    <StatsCard
                        title="Pending"
                        value={pendingCount}
                        icon={<Clock />}
                        iconBgColor="bg-warning/10"
                        iconColor="text-warning"
                    />

                </div>

                {/* Advanced Filters */}
                <div className="bg-card rounded-xl border border-default p-4 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Search</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                                <input type="text" placeholder="Search PO #..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-input border border-default rounded-lg text-sm text-main placeholder-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                            </div>
                        </div>
                        <div className="w-48">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Vendor</label>
                            <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className="w-full px-3 py-2 bg-input border border-default rounded-lg text-sm text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                                <option value="ALL">All Vendors</option>
                                {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="w-40">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-input border border-default rounded-lg text-sm text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                                <option value="ALL">All Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                                <option value="DRAFT">Draft</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="w-36">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 bg-input border border-default rounded-lg text-sm text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                        </div>
                        <div className="w-36">
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 bg-input border border-default rounded-lg text-sm text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card rounded-xl border border-default flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface text-muted uppercase text-xs font-medium sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" onClick={() => handleSort('number')}>
                                        <div className="flex items-center gap-2">
                                            Number #
                                            {sortColumn === 'number' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                            {sortColumn !== 'number' && <ArrowUpDown className="w-3 h-3 text-neutral-300" />}
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-2">
                                            Date
                                            {sortColumn === 'date' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                            {sortColumn !== 'date' && <ArrowUpDown className="w-3 h-3 text-neutral-300" />}
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" onClick={() => handleSort('vendor')}>
                                        <div className="flex items-center gap-2">
                                            Vendor
                                            {sortColumn === 'vendor' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                            {sortColumn !== 'vendor' && <ArrowUpDown className="w-3 h-3 text-neutral-300" />}
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-center" onClick={() => handleSort('items')}>
                                        <div className="flex items-center justify-center gap-2">
                                            Items
                                            {sortColumn === 'items' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                            {sortColumn !== 'items' && <ArrowUpDown className="w-3 h-3 text-neutral-300" />}
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-right" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Amount
                                            {sortColumn === 'amount' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                            {sortColumn !== 'amount' && <ArrowUpDown className="w-3 h-3 text-neutral-300" />}
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-center" onClick={() => handleSort('status')}>
                                        <div className="flex items-center justify-center gap-2">
                                            Status
                                            {sortColumn === 'status' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                            {sortColumn !== 'status' && <ArrowUpDown className="w-3 h-3 text-neutral-300" />}
                                        </div>
                                    </th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {paginatedOrders.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-muted">No records found</td></tr>
                                ) : (
                                    paginatedOrders.map(order => {
                                        let vName = '';
                                        if (order.vendorId && typeof order.vendorId === 'object') {
                                            vName = order.vendorId.businessName || order.vendorId.name || '';
                                        } else {
                                            vName = order.vendor_name || 'N/A';
                                        }

                                        return (
                                            <tr key={order._id || order.id} className="hover:bg-surface transition-colors">
                                                <td className="p-4 font-mono text-xs text-primary font-bold">
                                                    #{order.purchaseNumber || order.po_number || 'N/A'}
                                                </td>
                                                <td className="p-4 text-secondary">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-main">
                                                            {new Date(order.date || order.po_date).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-xs text-muted">
                                                            {new Date((order as any).createdAt || (order as any).created_at || order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium text-main">
                                                    {vName}
                                                </td>
                                                <td className="p-4 text-center text-secondary">{order.items.length}</td>
                                                <td className="p-4 text-right font-bold text-main">
                                                    ₹{(order.totalAmount || order.total_amount || 0).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">{getStatusBadge(order.status)}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleView(order)} className="p-2 hover:bg-surface rounded-lg text-primary transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-default flex items-center justify-between bg-surface">
                        <div className="text-xs text-muted">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, displayOrders.length)} of {displayOrders.length} entries
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
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseRegister;

