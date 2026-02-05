import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from "../../redux/store";
import { getAllPurchases } from "../../redux/slices/purchaseSlice";
import { setActiveTab } from "../../redux/slices/uiSlice";
import { PurchaseOrder, PurchaseOrderStatus } from "../../types/purchase";
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
    FileSpreadsheet
} from 'lucide-react';
import Layout from "../../components/shared/Layout";
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
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

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
        });
    }, [orders, searchTerm, statusFilter, dateFrom, dateTo, vendorFilter, amountMin, amountMax]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredOrders.slice(start, start + itemsPerPage);
    }, [filteredOrders, currentPage, itemsPerPage]);

    // Stats
    const totalPurchasesValue = filteredOrders.reduce((acc, o) => acc + (o.totalAmount || o.total_amount || 0), 0);
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

        const tableData = filteredOrders.map(o => {
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
        const rows = filteredOrders.map(o => {
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
                            <button
                                onClick={() => dispatch(setActiveTab('PURCHASE_ENTRY'))}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> New Purchase
                            </button>
                        </div>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div><p className="text-xs font-medium text-neutral-500 uppercase">Total Value</p><p className="text-2xl font-bold text-primary mt-1">₹{totalPurchasesValue.toLocaleString()}</p></div>
                            <div className="p-3 bg-primary/10 rounded-xl"><TrendingUp className="w-6 h-6 text-primary" /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div><p className="text-xs font-medium text-neutral-500 uppercase">Transactions</p><p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{filteredOrders.length}</p></div>
                            <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl"><FileText className="w-6 h-6" /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div><p className="text-xs font-medium text-neutral-500 uppercase">Pending</p><p className="text-2xl font-bold text-warning mt-1">{pendingCount}</p></div>
                            <div className="p-3 bg-warning/10 rounded-xl"><Clock className="w-6 h-6 text-warning" /></div>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Search</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                                <input type="text" placeholder="Search PO #..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm" />
                            </div>
                        </div>
                        <div className="w-48">
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Vendor</label>
                            <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm">
                                <option value="ALL">All Vendors</option>
                                {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="w-40">
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm">
                                <option value="ALL">All Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                                <option value="DRAFT">Draft</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="w-36">
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm" />
                        </div>
                        <div className="w-36">
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-xs font-medium sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Number #</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Vendor</th>
                                    <th className="p-4 text-center">Items</th>
                                    <th className="p-4 text-right">Amount</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {paginatedOrders.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-neutral-500">No records found</td></tr>
                                ) : (
                                    paginatedOrders.map(order => {
                                        let vName = '';
                                        if (order.vendorId && typeof order.vendorId === 'object') {
                                            vName = order.vendorId.businessName || order.vendorId.name || '';
                                        } else {
                                            vName = order.vendor_name || 'N/A';
                                        }

                                        return (
                                            <tr key={order._id || order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                                <td className="p-4 font-mono text-xs text-primary font-bold">
                                                    #{order.purchaseNumber || order.po_number || 'N/A'}
                                                </td>
                                                <td className="p-4 text-neutral-600">
                                                    {new Date(order.date || order.po_date).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    {vName}
                                                </td>
                                                <td className="p-4 text-center">{order.items.length}</td>
                                                <td className="p-4 text-right font-bold">
                                                    ₹{(order.totalAmount || order.total_amount || 0).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">{getStatusBadge(order.status)}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleView(order)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-primary transition-colors">
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
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900">
                        <div className="text-xs text-neutral-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium px-2">Page {currentPage} of {totalPages || 1}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-50"
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

