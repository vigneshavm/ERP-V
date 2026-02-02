import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../../redux/store";
import { setActiveTab } from "../../../redux/slices/uiSlice";
import { useBranchResolver } from "../../../hooks/useBranchResolver";
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
    Truck
} from 'lucide-react';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";

const PurchaseRegister: React.FC = () => {
    const dispatch = useDispatch();
    const { orders } = useSelector((state: RootState) => state.purchase);
    const { currentSector, currentBranch, role } = useSelector((state: RootState) => state.auth);
    const { getBranchName } = useBranchResolver();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Orders are already scoped to tenant/branch typically, sector removed if not in interface
    const sectorOrders = orders;

    // Apply filters
    const filteredOrders = useMemo(() => {
        return sectorOrders.filter(order => {
            // Search
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!order.vendor_name.toLowerCase().includes(search) &&
                    !order.id.includes(searchTerm)) {
                    return false;
                }
            }

            // Status
            if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;

            // Date range
            if (dateFrom && new Date(order.po_date) < new Date(dateFrom)) return false;
            if (dateTo) {
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                if (new Date(order.po_date) >= nextDay) return false;
            }

            return true;
        });
    }, [sectorOrders, searchTerm, statusFilter, dateFrom, dateTo]);

    // Summary stats
    const totalPurchases = filteredOrders.reduce((acc, o) => acc + o.total_amount, 0);
    const pendingCount = filteredOrders.filter(o => o.status === 'Pending').length;
    const approvedCount = filteredOrders.filter(o => o.status === 'Approved').length;
    const totalItems = filteredOrders.reduce((acc, o) => acc + o.items.length, 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved':
                return <span className="px-2 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Approved
                </span>;
            case 'Pending':
                return <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                </span>;
            case 'Rejected':
                return <span className="px-2 py-1 bg-error/10 text-error text-xs font-bold rounded-full flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Rejected
                </span>;
            default:
                return <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-full">{status}</span>;
        }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Purchase Register"
                    description="Complete record of all purchase transactions"
                    actions={
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                                <Download className="w-4 h-4" /> Export
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
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Purchases</p>
                                <p className="text-2xl font-bold text-primary mt-1">₹{totalPurchases.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">{filteredOrders.length} purchase orders</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Pending Approval</p>
                                <p className="text-2xl font-bold text-warning mt-1">{pendingCount}</p>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-xl">
                                <Clock className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">Awaiting owner approval</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Approved</p>
                                <p className="text-2xl font-bold text-success mt-1">{approvedCount}</p>
                            </div>
                            <div className="p-3 bg-success/10 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-success" />
                            </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">Stock updated</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Items</p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{totalItems}</p>
                            </div>
                            <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                                <Package className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                            </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">Products purchased</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Search</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Vendor or PO ID..."
                                className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">From Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />
                            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">To Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                            />
                            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Status</label>
                        <select
                            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="APPROVED">Approved</option>
                            <option value="PENDING">Pending</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    <button
                        onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); setStatusFilter('ALL'); }}
                        className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold"
                    >
                        Clear
                    </button>
                </div>

                {/* Purchase Orders Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-xs font-medium">
                                <tr>
                                    <th className="p-4">PO #</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Vendor</th>
                                    <th className="p-4">Branch</th>
                                    <th className="p-4 text-center">Items</th>
                                    <th className="p-4 text-right">Total</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {filteredOrders.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="w-8 h-8 text-neutral-300" />
                                            <p>No purchase orders found</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                            <td className="p-4 font-mono text-xs text-primary font-medium">
                                                #{order.id.substring(0, 8)}
                                            </td>
                                            <td className="p-4 text-neutral-600 dark:text-neutral-400">
                                                {new Date(order.po_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Truck className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium text-neutral-900 dark:text-white">{order.vendor_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-neutral-500">{getBranchName(order.branch_id)}</td>
                                            <td className="p-4 text-center text-neutral-600 dark:text-neutral-400">{order.items.length}</td>
                                            <td className="p-4 text-right font-bold text-neutral-900 dark:text-white">
                                                ₹{order.total_amount.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg" title="View Details">
                                                    <Eye className="w-4 h-4 text-primary" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                        {filteredOrders.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">No purchase orders</div>
                        ) : (
                            filteredOrders.map(order => (
                                <div key={order.id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-mono text-xs text-primary">#{order.id.substring(0, 8)}</p>
                                            <p className="font-bold text-neutral-900 dark:text-white">{order.vendor_name}</p>
                                        </div>
                                        {getStatusBadge(order.status)}
                                    </div>
                                    <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg mt-2">
                                        <div className="text-xs text-neutral-500">
                                            {new Date(order.po_date).toLocaleDateString()} • {order.items.length} items
                                        </div>
                                        <p className="font-bold text-primary">₹{order.total_amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="text-center text-xs text-neutral-400">
                    Showing {filteredOrders.length} of {sectorOrders.length} purchase orders
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseRegister;

