import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from "../../redux/store";
import { getAllPurchases } from "../../redux/slices/purchaseSlice";
import { PurchaseOrder } from "../../types/purchase";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import {
    Search,
    TrendingUp,
    FileText,
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
import StatusBadge from '@/components/shared/UI/StatusBadge';
import { Button, Input, Select } from '@/components/shared';

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

    const getStatusBadge = (status: string) => <StatusBadge status={status} />;

    const handleView = (order: PurchaseOrder) => {
        const grnNo = (order as any).purchaseNumber || (order as any).po_number || String(order._id || (order as any).id || "").replace(/^sql:/, "");
        navigate(`/purchase/grn/view/${encodeURIComponent(grnNo)}`);
    };

    const handleExportPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
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
                            <Button
                                variant="secondary"
                                size="md"
                                icon={<RefreshCw className={`w-4 h-4 ${(isRefreshing || isProcessing) ? 'animate-spin' : ''}`} />}
                                onClick={handleRefresh}
                                disabled={isRefreshing || isProcessing}
                            />
                            <Button
                                variant="secondary"
                                size="md"
                                icon={<FileSpreadsheet className="w-4 h-4 text-success" />}
                                onClick={handleExportCSV}
                            >
                                Excel
                            </Button>
                            <Button
                                variant="secondary"
                                size="md"
                                icon={<FileText className="w-4 h-4 text-danger" />}
                                onClick={handleExportPDF}
                            >
                                PDF
                            </Button>
                            <span className="rounded-md border border-warning/30 bg-warning-soft px-4 py-2 text-xs font-semibold text-warning" role="status">
                                New entry unavailable
                            </span>
                        </div>
                    }
                />

                {/* KPI Pulse Node Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-primary/20 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-sm group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Value</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">₹{totalPurchasesValue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-success/20 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-success-soft text-success dark:bg-success-soft rounded-sm group-hover:scale-110 transition-transform">
                                <CheckSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billed Volume</h3>
                        </div>
                        <p className="text-3xl font-black text-success dark:text-success tracking-tighter tabular-nums">₹{totalBilledValue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-slate-400/20 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-sm group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Nodes</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{displayOrders.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-warning/20 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-warning-soft text-warning dark:bg-warning-soft rounded-sm group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pending Res</h3>
                        </div>
                        <p className="text-3xl font-black text-warning dark:text-warning tracking-tighter tabular-nums">{pendingCount}</p>
                    </div>
                </div>

                {/* Audit Workspace Container */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {/* Control Bar */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row gap-8">
                        <div className="flex-1 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Search</label>
                                    <Input
                                        type="text"
                                        placeholder="Search PO # or Vendor..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        icon={<Search className="w-4 h-4 text-slate-400" />}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Supplier</label>
                                    <Select
                                        options={[{ value: 'ALL', label: 'All Entities' }, ...uniqueVendors.map(v => ({ value: v, label: v }))]}
                                        value={vendorFilter}
                                        onChange={(value) => setVendorFilter(typeof value === 'string' ? value : value[0])}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Operational Status</label>
                                    <Select
                                        options={[
                                            { value: 'ALL', label: 'All Status' },
                                            { value: 'COMPLETED', label: 'Completed' },
                                            { value: 'Approved', label: 'Approved' },
                                            { value: 'Pending', label: 'Pending' },
                                            { value: 'DRAFT', label: 'Draft' },
                                            { value: 'CANCELLED', label: 'Cancelled' },
                                        ]}
                                        value={statusFilter}
                                        onChange={(value) => setStatusFilter(typeof value === 'string' ? value : value[0])}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Fiscal Range</label>
                                        <div className="flex items-center gap-2">
                                            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                                            <span className="text-slate-300 font-bold">→</span>
                                            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 self-start">
                                {(['ALL', 'BILLED', 'UNBILLED', 'DRAFT'] as const).map(mode => (
                                    <Button
                                        key={mode}
                                        variant={viewMode === mode ? 'secondary' : 'tertiary'}
                                        size="sm"
                                        onClick={() => setViewMode(mode)}
                                    >
                                        {mode} Nodes
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('number')}>
                                        <div className="flex items-center gap-2">
                                            PO No. <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-2">
                                            Fiscal Date <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('vendor')}>
                                        <div className="flex items-center gap-2">
                                            Supplier <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payload</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Amount (₹) <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {paginatedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 max-w-sm mx-auto opacity-40">
                                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-sm flex items-center justify-center">
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
                                            <tr key={order._id || (order as any).id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all cursor-default">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className="text-xs font-black text-primary font-mono tracking-tighter uppercase group-hover:underline">
                                                        #{(order as any).purchaseNumber || (order as any).po_number || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                            {new Date((order as any).date || (order as any).po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 mt-0.5 font-mono uppercase tracking-widest">
                                                            {new Date((order as any).createdAt || (order as any).created_at || (order as any).date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">{vName}</p>
                                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest italic">{getBranchName((order as any).branchId)}</p>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest">
                                                        {order.items.length} Units
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right whitespace-nowrap text-sm font-black tabular-nums text-slate-900 dark:text-white">
                                                    ₹{((order as any).totalAmount || (order as any).total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        {getStatusBadge(order.status)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="secondary" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => handleView(order)} />
                                                        <Button variant="secondary" size="sm" icon={<MoreHorizontal className="w-4 h-4" />} />
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
                    <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Auditing nodes <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, displayOrders.length)}</span> of <span className="text-slate-900 dark:text-white">{displayOrders.length}</span> institutional records
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ChevronLeft className="w-4 h-4" />}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            />
                            <div className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
                                Page {currentPage} <span className="text-slate-300 mx-2">/</span> {totalPages || 1}
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ChevronRight className="w-4 h-4" />}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseRegister;

