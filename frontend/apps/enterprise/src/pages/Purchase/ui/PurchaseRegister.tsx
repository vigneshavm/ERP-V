import { useNavigation } from '@/app/providers/NavigationContext';
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from "@/app/store/store";
import { getAllPurchases } from "@/entities/purchase/model/purchaseSlice";
import { useUiStore } from "@/shared/lib/store/uiStore";
import { PurchaseOrder, PurchaseOrderStatus } from "@repo/shared";
import { useBranchResolver } from "@/hooks/useBranchResolver";
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
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import { StatsCard } from "@repo/ui";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { navigate } = useNavigation();
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
            case 'PAID':
                return (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit mx-auto">
                        <CheckCircle className="w-3 h-3" /> {status}
                    </span>
                );
            case 'PENDING':
            case 'PENDING APPROVAL':
            case 'DRAFT':
                return (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit mx-auto">
                        <Clock className="w-3 h-3" /> {status}
                    </span>
                );
            case 'REJECTED':
            case 'CANCELLED':
                return (
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit mx-auto">
                        <XCircle className="w-3 h-3" /> {status}
                    </span>
                );
            case 'BILLED':
                return (
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit mx-auto">
                        <FileText className="w-3 h-3" /> Billed
                    </span>
                );
            default:
                return <span className="px-2 py-0.5 bg-white/5 text-slate-500 border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-full w-fit mx-auto">{status}</span>;
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
            <div className="space-y-6 animate-fade-in pb-10 h-full flex flex-col premium-bg min-h-screen px-4 pt-6">
                <PageHeader
                    title="Purchase Register"
                    description="Comprehensive record and audit trail of all purchases"
                    actions={
                        <div className="flex gap-2">
                            <button onClick={handleRefresh} disabled={isRefreshing || isProcessing} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-400 transition-all">
                                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isProcessing) ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={handleExportCSV} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-all">
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
                            </button>
                            <button onClick={handleExportPDF} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-all">
                                <FileText className="w-3.5 h-3.5 text-rose-400" /> PDF
                            </button>
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value as any)}
                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none min-w-[140px] text-center transition-all cursor-pointer"
                            >
                                <option value="ALL">All Orders</option>
                                <option value="BILLED">Billed</option>
                                <option value="UNBILLED">Unbilled</option>
                                <option value="DRAFT">Drafts</option>
                            </select>
                            <button
                                onClick={() => navigate('PURCHASE_ENTRY')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
                            >
                                <Plus className="w-4 h-4" /> New Purchase
                            </button>
                        </div>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="premium-card p-4 shadow-xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="w-12 h-12 text-indigo-400" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Value</p>
                        <p className="text-2xl font-black text-slate-200 font-mono">₹{totalPurchasesValue.toLocaleString()}</p>
                    </div>

                    <div className="premium-card p-4 shadow-xl border border-white/5 relative overflow-hidden group text-right">
                        <div className="absolute top-0 left-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckSquare className="w-12 h-12 text-emerald-400" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Billed</p>
                        <p className="text-2xl font-black text-emerald-400 font-mono text-white/90">₹{totalBilledValue.toLocaleString()}</p>
                    </div>

                    <div className="premium-card p-4 shadow-xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText className="w-12 h-12 text-indigo-400" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Transactions</p>
                        <p className="text-2xl font-black text-slate-200 font-mono">{filteredOrders.length}</p>
                    </div>

                    <div className="premium-card p-4 shadow-xl border border-white/5 relative overflow-hidden group text-right">
                        <div className="absolute top-0 left-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="w-12 h-12 text-amber-400" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending</p>
                        <p className="text-2xl font-black text-amber-400 font-mono text-white/90">{pendingCount}</p>
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="premium-card p-4 shadow-xl border border-white/5">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Search Procurement</label>
                            <div className="relative group">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search PO # or Vendor..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all" 
                                />
                            </div>
                        </div>
                        <div className="w-48">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Vendor</label>
                            <select 
                                value={vendorFilter} 
                                onChange={e => setVendorFilter(e.target.value)} 
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-tight text-slate-300 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer appearance-none transition-all"
                            >
                                <option value="ALL">All Vendors</option>
                                {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="w-40">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Status</label>
                            <select 
                                value={statusFilter} 
                                onChange={e => setStatusFilter(e.target.value)} 
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-tight text-slate-300 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer appearance-none transition-all"
                            >
                                <option value="ALL">All Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                                <option value="DRAFT">Draft</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-36">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">From</label>
                                <input 
                                    type="date" 
                                    value={dateFrom} 
                                    onChange={e => setDateFrom(e.target.value)} 
                                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-slate-300 focus:ring-1 focus:ring-indigo-500/50 outline-none invert dark:invert-0 brightness-200 dark:brightness-100" 
                                />
                            </div>
                            <div className="w-36">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">To</label>
                                <input 
                                    type="date" 
                                    value={dateTo} 
                                    onChange={e => setDateTo(e.target.value)} 
                                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-slate-300 focus:ring-1 focus:ring-indigo-500/50 outline-none invert dark:invert-0 brightness-200 dark:brightness-100" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="premium-card shadow-2xl border border-white/5 flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm border-separate border-spacing-0">
                            <thead className="bg-white/5 backdrop-blur-md sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('number')}>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            PO Number
                                            {sortColumn === 'number' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />)}
                                            {sortColumn !== 'number' && <ArrowUpDown className="w-3 h-3 text-slate-700" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Date
                                            {sortColumn === 'date' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />)}
                                            {sortColumn !== 'date' && <ArrowUpDown className="w-3 h-3 text-slate-700" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('vendor')}>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Vendor / Supplier
                                            {sortColumn === 'vendor' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />)}
                                            {sortColumn !== 'vendor' && <ArrowUpDown className="w-3 h-3 text-slate-700" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors text-center" onClick={() => handleSort('items')}>
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            SKUs
                                            {sortColumn === 'items' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />)}
                                            {sortColumn !== 'items' && <ArrowUpDown className="w-3 h-3 text-slate-700" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors text-right" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Net Amount
                                            {sortColumn === 'amount' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />)}
                                            {sortColumn !== 'amount' && <ArrowUpDown className="w-3 h-3 text-slate-700" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
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
                                            <tr key={order._id || order.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-[11px] font-black text-indigo-400 uppercase tracking-tighter">
                                                        #{order.purchaseNumber || order.po_number || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight">
                                                            {new Date(order.date || order.po_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[9px] text-slate-600 font-mono">
                                                            {new Date((order as any).createdAt || (order as any).created_at || order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight line-clamp-1">
                                                        {vName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-[11px] font-black text-slate-400 font-mono">{order.items.length}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-[11px] font-black text-slate-200 font-mono">
                                                        ₹{(order.totalAmount || order.total_amount || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">{getStatusBadge(order.status)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleView(order)} className="p-2 hover:bg-indigo-500/10 rounded-lg text-slate-500 hover:text-indigo-400 transition-all">
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
                    <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, displayOrders.length)} <span className="text-slate-700">/</span> {displayOrders.length} records
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-20 text-slate-400 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-widest px-4 text-slate-300">
                                Page {currentPage} <span className="text-slate-600">OF</span> {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-20 text-slate-400 transition-all"
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


