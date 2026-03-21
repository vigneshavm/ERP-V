import { useNavigation } from '@/app/providers/NavigationContext';
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from "@/app/store/store";
import { getAllPurchases } from "@/entities/purchase/model/purchaseSlice";
import { PurchaseOrder } from "@repo/shared";
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
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    ArrowUpDown,
    ArrowUp,
    CheckSquare,
    ArrowDown,
    ShieldCheck,
    Database,
    Zap,
    Building2,
    CalendarDays
} from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
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

    // View Mode State
    const [viewMode, setViewMode] = useState<'ALL' | 'BILLED' | 'UNBILLED' | 'DRAFT'>('ALL');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Sort State
    const [sortColumn, setSortColumn] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

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
            setSortDirection('asc');
        }
    };

    const uniqueVendors = useMemo(() => {
        const vendorNames = orders.map(o => {
            if (o.vendorId && typeof o.vendorId === 'object') {
                return (o.vendorId as any).businessName || (o.vendorId as any).name;
            }
            return o.vendor_name;
        });
        return Array.from(new Set(vendorNames)).filter((v): v is string => !!v).sort();
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            let vName = '';
            if (order.vendorId && typeof order.vendorId === 'object') {
                vName = (order.vendorId as any).businessName || (order.vendorId as any).name || '';
            } else {
                vName = order.vendor_name || '';
            }

            const pNumber = order.purchaseNumber || order.po_number || '';
            const pDate = order.date || order.po_date;
            const tAmount = order.totalAmount || order.total_amount || 0;

            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!vName.toLowerCase().includes(search) && !pNumber.toLowerCase().includes(search)) return false;
            }

            if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
            if (vendorFilter !== 'ALL' && vName !== vendorFilter) return false;
            if (dateFrom && new Date(pDate) < new Date(dateFrom)) return false;
            if (dateTo) {
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                if (new Date(pDate) >= nextDay) return false;
            }

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
                    valA = ((a.vendorId as any)?.businessName || a.vendor_name || '').toLowerCase();
                    valB = ((b.vendorId as any)?.businessName || b.vendor_name || '').toLowerCase();
                    break;
                case 'amount':
                    valA = a.totalAmount || a.total_amount || 0;
                    valB = b.totalAmount || b.total_amount || 0;
                    break;
                default:
                    return 0;
            }

            if (sortDirection === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });
    }, [orders, searchTerm, statusFilter, dateFrom, dateTo, vendorFilter, sortColumn, sortDirection]);

    const displayOrders = useMemo(() => {
        switch (viewMode) {
            case 'BILLED':
                return filteredOrders.filter(o => ['COMPLETED', 'Billed', 'Paid', 'Converted'].includes(o.status || ''));
            case 'UNBILLED':
                return filteredOrders.filter(o => ['Pending', 'Pending Approval', 'Approved', 'Partial Receipt', 'Fully Received', 'RECEIVED'].includes(o.status || ''));
            case 'DRAFT':
                return filteredOrders.filter(o => o.status === 'Draft');
            default:
                return filteredOrders;
        }
    }, [filteredOrders, viewMode]);

    const totalPages = Math.ceil(displayOrders.length / itemsPerPage);
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return displayOrders.slice(start, start + itemsPerPage);
    }, [displayOrders, currentPage, itemsPerPage]);

    const totalPurchasesValue = filteredOrders.reduce((acc, o) => acc + (o.totalAmount || o.total_amount || 0), 0);
    const totalBilledValue = filteredOrders.filter(o => o.status === 'COMPLETED').reduce((acc, o) => acc + (o.totalAmount || o.total_amount || 0), 0);
    const pendingCount = filteredOrders.filter(o => ['Pending', 'Pending Approval', 'Draft'].includes(o.status || '')).length;

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Purchase Register", 14, 15);
        const tableData = displayOrders.map(o => [
            new Date(o.date || o.po_date).toLocaleDateString(),
            o.purchaseNumber || o.po_number || 'N/A',
            ((o.vendorId as any)?.businessName || o.vendor_name || 'N/A'),
            o.status,
            `Rs. ${(o.totalAmount || o.total_amount || 0).toLocaleString()}`
        ]);
        autoTable(doc, {
            head: [['Date', 'Number #', 'Vendor', 'Status', 'Amount']],
            body: tableData,
            startY: 20,
        });
        doc.save('purchase_register.pdf');
    };

    const handleExportCSV = () => {
        const headers = ["Date,Number #,Vendor,Status,Amount"];
        const rows = displayOrders.map(o => `${new Date(o.date || o.po_date).toLocaleDateString()},${o.purchaseNumber || o.po_number},"${((o.vendorId as any)?.businessName || o.vendor_name || 'N/A')}",${o.status},${o.totalAmount || o.total_amount || 0}`);
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
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 {/* Cinematic Header */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Audit Intelligence</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Procurement Register</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Fiscal Ledger <FileText className="w-8 h-8 text-blue-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Comprehensive record and audit trail of entire procurement pipeline.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="p-3.5 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 text-neutral-400 hover:text-blue-500 rounded-2xl transition-all shadow-sm group"
                        >
                            <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="p-3.5 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 text-neutral-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm group"
                        >
                            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/purchase/new')}
                            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Record Purchase</span>
                        </button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <RegisterStats label="Aggregate Volume" value={`₹ ${totalPurchasesValue.toLocaleString()}`} icon={TrendingUp} color="blue" sub="Total Inbound" />
                    <RegisterStats label="Liquidated Claims" value={`₹ ${totalBilledValue.toLocaleString()}`} icon={CheckSquare} color="emerald" sub="Verified Settlements" />
                    <RegisterStats label="Transaction Count" value={filteredOrders.length} icon={Database} color="indigo" sub="Registry Nodes" />
                    <RegisterStats label="Stasis Protocols" value={pendingCount} icon={Clock} color="amber" sub="Pending Verification" />
                </div>

                {/* Command Filter Matrix */}
                <div className="erp-card rounded-[3rem] p-8 border-none shadow-sm space-y-8 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Filter className="w-64 h-64 text-blue-500" />
                    </div>

                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none text-brand-colors">Registry Command</h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Filtering and Intercepting Audit Protocols</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within/search:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search PO # or Vendor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-inner uppercase tracking-tight italic"
                            />
                        </div>

                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <select
                                value={vendorFilter}
                                onChange={(e) => setVendorFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-inner appearance-none uppercase tracking-widest italic text-neutral-600 dark:text-neutral-400 cursor-pointer"
                            >
                                <option value="ALL">Universal Vendors</option>
                                {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>

                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-inner appearance-none uppercase tracking-widest italic text-neutral-600 dark:text-neutral-400 cursor-pointer"
                            >
                                <option value="ALL">Universal Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                                <option value="DRAFT">Draft</option>
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-inner uppercase tracking-widest italic text-neutral-600 dark:text-neutral-400 dark:invert-0 brightness-110"
                                />
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-inner uppercase tracking-widest italic text-neutral-600 dark:text-neutral-400 dark:invert-0 brightness-110"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Ledger Matrix */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    <div className="overflow-x-auto px-2">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-2 cursor-pointer hover:text-blue-500" onClick={() => handleSort('number')}>
                                        Protocol No <SortArrow active={sortColumn === 'number'} direction={sortDirection} />
                                    </th>
                                    <th className="px-8 py-2 cursor-pointer hover:text-blue-500" onClick={() => handleSort('date')}>
                                        Timestamp <SortArrow active={sortColumn === 'date'} direction={sortDirection} />
                                    </th>
                                    <th className="px-8 py-2 cursor-pointer hover:text-blue-500" onClick={() => handleSort('vendor')}>
                                        Entity designation <SortArrow active={sortColumn === 'vendor'} direction={sortDirection} />
                                    </th>
                                    <th className="px-8 py-2 text-right cursor-pointer hover:text-blue-500" onClick={() => handleSort('amount')}>
                                        Net Value <SortArrow active={sortColumn === 'amount'} direction={sortDirection} />
                                    </th>
                                    <th className="px-8 py-2 text-center">Protocol State</th>
                                    <th className="px-8 py-2 text-right">Commands</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrders.map((o) => (
                                    <tr key={o._id} className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-pointer" onClick={() => navigate(`/purchase/orders/${o._id}`)}>
                                        <td className="px-2 py-1">
                                         <div className="bg-white dark:bg-neutral-900 rounded-l-[1.5rem] p-6 border-y border-l border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-mono font-black text-blue-500 tracking-tighter text-xs uppercase italic">
                                            #{o.purchaseNumber || o.po_number || 'N/A'}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <div className="text-[10px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-tight italic leading-none">
                                                {new Date(o.date || o.po_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-1 italic block leading-none">
                                                Registry Logged
                                            </span>
                                         </div>
                                       </td>
                                       <td className="px-0 py-1">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-black text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-widest italic">
                                            {((o.vendorId as any)?.businessName || o.vendor_name || 'N/A')}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-right">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-mono font-black text-neutral-900 dark:text-neutral-300 italic text-sm">
                                            ₹ {(o.totalAmount || o.total_amount || 0).toLocaleString()}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-center">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all flex justify-center">
                                            <StatusLabel status={o.status} />
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-right">
                                         <div className="bg-white dark:bg-neutral-900 rounded-r-[1.5rem] p-6 border-y border-r border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <button className="p-3 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 group-hover/row:text-blue-500 rounded-xl transition-all shadow-sm">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                         </div>
                                       </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Matrix */}
                    <div className="px-8 py-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 italic">
                            Auditing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, displayOrders.length)} <span className="text-blue-500">/</span> {displayOrders.length} Transaction Records
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-xl hover:bg-blue-500 hover:text-white disabled:opacity-20 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] px-6 text-neutral-600 italic">
                                Page {currentPage} <span className="text-neutral-300 dark:text-neutral-800 mx-1">/</span> {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-xl hover:bg-blue-500 hover:text-white disabled:opacity-20 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Global Verification Footprint */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Audit Protocol Shield Verified • BizzAI Intelligence Core</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>
        </Layout>
    );
};

const RegisterStats = ({ label, value, icon: Icon, color, sub }: any) => {
    return (
        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none text-neutral-900 dark:text-white">
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{label}</p>
                    <h3 className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic whitespace-nowrap">
                        {value}
                    </h3>
                </div>
                <div className="mt-8 flex flex-col gap-2">
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">{sub}</p>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none italic">Active Matrix</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusLabel = ({ status }: { status?: string }) => {
    const s = (status || 'UNKNOWN').toUpperCase();
    let config: any = {
        'COMPLETED': { color: 'emerald', icon: CheckCircle },
        'PAID': { color: 'emerald', icon: CheckCircle },
        'APPROVED': { color: 'blue', icon: CheckCircle },
        'PENDING': { color: 'amber', icon: Clock },
        'DRAFT': { color: 'neutral', icon: Clock },
    };
    const { color, icon: Icon } = config[s] || { color: 'neutral', icon: Database };
    
    return (
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-${color === 'neutral' ? 'neutral-100 dark:bg-neutral-800 text-neutral-500' : `${color}-500/10 text-${color}-600 dark:text-${color}-400 border border-${color}-500/20`}`}>
            <Icon className="w-3 h-3" /> {s}
        </span>
    );
};

const SortArrow = ({ active, direction }: any) => {
    if (!active) return <ArrowUpDown className="w-3 h-3 text-neutral-300 dark:text-neutral-700 ml-1 inline" />;
    return direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500 ml-1 inline" /> : <ArrowDown className="w-3 h-3 text-blue-500 ml-1 inline" />;
};

export default PurchaseRegister;
