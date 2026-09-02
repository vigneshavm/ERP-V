import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from "../../redux/store";
import { getAllPurchases } from "../../redux/slices/purchaseSlice";
import { setActiveTab } from "../../redux/slices/uiSlice";
import { PurchaseOrder } from "../../types/purchase";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import {
    Search,
    TrendingUp,
    FileText,
    Plus,
    Eye,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    ArrowUpDown,
    CheckSquare,
    Info,
    MoreHorizontal
} from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
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
    const [amountMin] = useState('');
    const [amountMax] = useState('');

    // View Mode State
    const [viewMode, setViewMode] = useState<'ALL' | 'BILLED' | 'UNBILLED' | 'DRAFT'>('ALL');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Sort State
    const [sortColumn, setSortColumn] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

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
            setSortDirection('asc');
        }
    };

    // Derived Data for Filters 
    const uniqueVendors = useMemo(() => {
        const vendorNames = orders.map(o => {
            if (o.vendorId && typeof o.vendorId === 'object') {
                return (o.vendorId as any).businessName || (o.vendorId as any).name;
            }
            return (o as any).vendor_name;
        });
        return Array.from(new Set(vendorNames)).filter((v): v is string => !!v).sort();
    }, [orders]);

    // Filtering Logic
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            let vName = '';
            if (order.vendorId && typeof order.vendorId === 'object') {
                vName = (order.vendorId as any).businessName || (order.vendorId as any).name || '';
            } else {
                vName = (order as any).vendor_name || '';
            }

            const pNumber = (order as any).purchaseNumber || (order as any).po_number || '';
            const pDate = (order as any).date || (order as any).po_date;
            const tAmount = (order as any).totalAmount || (order as any).total_amount || 0;

            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!vName.toLowerCase().includes(search) && !pNumber.toLowerCase().includes(search)) {
                    return false;
                }
            }
            if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
            if (vendorFilter !== 'ALL' && vName !== vendorFilter) return false;
            if (dateFrom && new Date(pDate) < new Date(dateFrom)) return false;
            if (dateTo) {
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                if (new Date(pDate) >= nextDay) return false;
            }
            if (amountMin && tAmount < parseFloat(amountMin)) return false;
            if (amountMax && tAmount > parseFloat(amountMax)) return false;

            return true;
        }).sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortColumn) {
                case 'number':
                    valA = (a as any).purchaseNumber || (a as any).po_number || '';
                    valB = (b as any).purchaseNumber || (b as any).po_number || '';
                    break;
                case 'date':
                    valA = new Date((a as any).createdAt || (a as any).created_at || (a as any).date || (a as any).po_date || 0).getTime();
                    valB = new Date((b as any).createdAt || (b as any).created_at || (b as any).date || (b as any).po_date || 0).getTime();
                    break;
                case 'vendor':
                    if (a.vendorId && typeof a.vendorId === 'object') {
                        valA = ((a.vendorId as any).businessName || (a.vendorId as any).name || '').toLowerCase();
                    } else {
                        valA = ((a as any).vendor_name || '').toLowerCase();
                    }
                    if (b.vendorId && typeof b.vendorId === 'object') {
                        valB = ((b.vendorId as any).businessName || (b.vendorId as any).name || '').toLowerCase();
                    } else {
                        valB = ((b as any).vendor_name || '').toLowerCase();
                    }
                    break;
                case 'items':
                    valA = a.items.length;
                    valB = b.items.length;
                    break;
                case 'amount':
                    valA = (a as any).totalAmount || (a as any).total_amount || 0;
                    valB = (b as any).totalAmount || (b as any).total_amount || 0;
                    break;
                case 'status':
                    valA = a.status || '';
                    valB = b.status || '';
                    break;
                default:
                    return 0;
            }

            if (sortDirection === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });
    }, [orders, searchTerm, statusFilter, dateFrom, dateTo, vendorFilter, amountMin, amountMax, sortColumn, sortDirection]);

    const displayOrders = useMemo(() => {
        switch (viewMode) {
            case 'BILLED':
                return filteredOrders.filter(o => ['COMPLETED', 'Billed', 'Paid', 'Converted'].includes(o.status));
            case 'UNBILLED':
                return filteredOrders.filter(o => ['Pending', 'Pending Approval', 'Approved', 'Partial Receipt', 'Fully Received', 'RECEIVED'].includes(o.status));
            case 'DRAFT':
                return filteredOrders.filter(o => o.status === 'DRAFT' || (o.status as string) === 'Draft');
            default:
                return filteredOrders;
        }
    }, [filteredOrders, viewMode]);

    const totalPages = Math.ceil(displayOrders.length / itemsPerPage);
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return displayOrders.slice(start, start + itemsPerPage);
    }, [displayOrders, currentPage, itemsPerPage]);

    // KPI cards must reflect whatever the table below is actually showing.
    // These were previously derived from `filteredOrders` (search/vendor/status/
    // date filters only), which never re-narrowed when the ALL/BILLED/UNBILLED/
    // DRAFT view tabs did -- so e.g. switching to the "BILLED" tab would show
    // 12 rows in the table while "Total Nodes" kept displaying the full
    // unfiltered count. Deriving from `displayOrders` (which already applies
    // the view-mode filter on top of the other filters) keeps the header
    // numbers and the table in sync in every tab.
    const totalPurchasesValue = displayOrders.reduce((acc, o) => acc + ((o as any).totalAmount || (o as any).total_amount || 0), 0);
    const totalBilledValue = displayOrders.filter(o => o.status === 'COMPLETED').reduce((acc, o) => acc + ((o as any).totalAmount || (o as any).total_amount || 0), 0);
    const pendingCount = displayOrders.filter(o => ['Pending', 'Pending Approval', 'Draft'].includes(o.status)).length;

    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase();
        switch (s) {
            case 'APPROVED':
            case 'COMPLETED':
                return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-success text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> {status === 'COMPLETED' ? 'Completed' : 'Approved'}</span>;
            case 'PENDING':
            case 'PENDING APPROVAL':
            case 'DRAFT':
                return <span className="px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-warning text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5"><Clock className="w-3 h-3" /> {s === 'DRAFT' ? 'Draft' : 'Pending'}</span>;
            case 'REJECTED':
            case 'CANCELLED':
                return <span className="px-3 py-1 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-danger text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5"><XCircle className="w-3 h-3" /> {status}</span>;
            default:
                return <span className="px-3 py-1 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest rounded-full">{status}</span>;
        }
    };

    const handleView = (order: PurchaseOrder) => {
        navigate(`/purchase/orders/${order._id || (order as any).id}`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Purchase Register", 14, 15);
        const tableData = displayOrders.map(o => [
            new Date((o as any).date || (o as any).po_date).toLocaleDateString(),
            (o as any).purchaseNumber || (o as any).po_number || 'N/A',
            (o.vendorId && typeof o.vendorId === 'object') ? ((o.vendorId as any).businessName || (o.vendorId as any).name) : ((o as any).vendor_name || 'N/A'),
            o.status,
            o.items.length.toString(),
            `Rs. ${((o as any).totalAmount || (o as any).total_amount || 0).toLocaleString()}`
        ]);
        autoTable(doc, { head: [['Date', 'Number #', 'Vendor', 'Status', 'Items', 'Amount']], body: tableData, startY: 20 });
        doc.save('purchase_register.pdf');
    };

    const handleExportCSV = () => {
        const headers = ["Date,Number #,Vendor,Status,Items,Amount,Created By"];
        const rows = displayOrders.map(o => {
            const vName = (o.vendorId && typeof o.vendorId === 'object') ? ((o.vendorId as any).businessName || (o.vendorId as any).name) : ((o as any).vendor_name || 'N/A');
            const created = (o.createdBy && typeof o.createdBy === 'object') ? (o.createdBy as any).name : ((o as any).created_by || '-');
            return `${new Date((o as any).date || (o as any).po_date).toLocaleDateString()},${(o as any).purchaseNumber || (o as any).po_number},"${vName}",${o.status},${o.items.length},${(o as any).totalAmount || (o as any).total_amount || 0},${created}`;
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
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Purchase Register"
                    description="Comprehensive audit trail and institutional procurement node tracking."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Register' }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button onClick={handleRefresh} disabled={isRefreshing || isProcessing} className="p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 shadow-sm transition active:scale-95">
                                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isProcessing) ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={handleExportCSV} className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                                <FileSpreadsheet className="w-4 h-4 text-success" /> Excel
                            </button>
                            <button onClick={handleExportPDF} className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                                <FileText className="w-4 h-4 text-danger" /> PDF
                            </button>
                            <button
                                onClick={() => dispatch(setActiveTab('PURCHASE_ENTRY'))}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" /> New Entry
                            </button>
                        </div>
                    }
                />

                {/* KPI Pulse Node Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-primary/20 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-sm group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Total Value</h3>
                        </div>
                        <p className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">₹{totalPurchasesValue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-success/20 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-50 text-success dark:bg-emerald-900/20 rounded-sm group-hover:scale-110 transition-transform">
                                <CheckSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Billed Volume</h3>
                        </div>
                        <p className="text-3xl font-black text-emerald-600 dark:text-success tracking-tighter tabular-nums">₹{totalBilledValue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-neutral-400/20 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 rounded-sm group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Total Nodes</h3>
                        </div>
                        <p className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">{displayOrders.length}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-warning/20 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-50 text-warning dark:bg-amber-900/20 rounded-sm group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Pending Res</h3>
                        </div>
                        <p className="text-3xl font-black text-amber-600 dark:text-warning tracking-tighter tabular-nums">{pendingCount}</p>
                    </div>
                </div>

                {/* Audit Workspace Container */}
                <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {/* Control Bar */}
                    <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex flex-col xl:flex-row gap-8">
                        <div className="flex-1 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Node Context Search</label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                        <input type="text" placeholder="Search PO # or Vendor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Institutional Vendor</label>
                                    <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className="w-full px-5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                                        <option value="ALL">All Entities</option>
                                        {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Operational Status</label>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                                        <option value="ALL">All Status</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Pending">Pending</option>
                                        <option value="DRAFT">Draft</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Fiscal Range</label>
                                        <div className="flex items-center gap-2">
                                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-[10px] font-bold focus:ring-2 focus:ring-primary/20 transition-all" />
                                            <span className="text-neutral-300 font-bold">→</span>
                                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-[10px] font-bold focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-1.5 bg-neutral-50 dark:bg-neutral-900 rounded-sm border border-neutral-100 dark:border-neutral-800 self-start">
                                {(['ALL', 'BILLED', 'UNBILLED', 'DRAFT'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            viewMode === mode
                                                ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                                                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                                        }`}
                                    >
                                        {mode} Nodes
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('number')}>
                                        <div className="flex items-center gap-2">
                                            Node ID <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-2">
                                            Fiscal Date <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('vendor')}>
                                        <div className="flex items-center gap-2">
                                            Institutional Vendor <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Payload</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Quantum (INR) <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Node Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {paginatedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 max-w-sm mx-auto opacity-40">
                                                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                    <Info className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-widest">Archive Empty</p>
                                                    <p className="text-xs font-bold mt-2 italic leading-relaxed">No institutional procurement nodes found matching the current filter context.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map(order => {
                                        let vName = '';
                                        if (order.vendorId && typeof order.vendorId === 'object') {
                                            vName = (order.vendorId as any).businessName || (order.vendorId as any).name || '';
                                        } else {
                                            vName = (order as any).vendor_name || 'N/A';
                                        }

                                        return (
                                            <tr key={order._id || (order as any).id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all cursor-default">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className="text-xs font-black text-primary font-mono tracking-tighter uppercase group-hover:underline">
                                                        #{(order as any).purchaseNumber || (order as any).po_number || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                                                            {new Date((order as any).date || (order as any).po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] font-black text-neutral-400 mt-0.5 font-mono uppercase tracking-widest">
                                                            {new Date((order as any).createdAt || (order as any).created_at || (order as any).date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">{vName}</p>
                                                    <p className="text-[10px] font-black text-neutral-400 mt-1 uppercase tracking-widest italic">{getBranchName((order as any).branchId)}</p>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-[10px] font-black text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 rounded-full uppercase tracking-widest">
                                                        {order.items.length} Units
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right whitespace-nowrap text-sm font-black tabular-nums text-neutral-900 dark:text-white">
                                                    ₹{((order as any).totalAmount || (order as any).total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        {getStatusBadge(order.status)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleView(order)} className="p-2.5 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-all">
                                                            <MoreHorizontal className="w-4 h-4" />
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

                    {/* Pagination Node Controller */}
                    <div className="px-8 py-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                            Auditing nodes <span className="text-neutral-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-neutral-900 dark:text-white">{Math.min(currentPage * itemsPerPage, displayOrders.length)}</span> of <span className="text-neutral-900 dark:text-white">{displayOrders.length}</span> institutional records
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="px-6 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
                                Page {currentPage} <span className="text-neutral-300 mx-2">/</span> {totalPages || 1}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
