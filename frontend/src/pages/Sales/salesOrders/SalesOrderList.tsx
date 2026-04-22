import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../services/api";
import { toast } from 'react-toastify';
import Layout from "../../../components/shared/Layout/Layout";
import { SalesOrder } from '../../../types/sales';

const SalesOrderList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        overdue: false
    });

    const isOverdue = (order: SalesOrder) => {
        if (!order.expectedDeliveryDate) return false;
        return new Date(order.expectedDeliveryDate) < new Date() && order.status !== 'Delivered' && order.status !== 'Invoiced' && order.status !== 'Cancelled';
    };

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.overdue) params.append('overdue', 'true');

            const response = await api.get(
                `/api/sales-orders?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            let fetchedOrders = response.data;

            // Apply search filter on frontend
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                fetchedOrders = fetchedOrders.filter((order: SalesOrder) =>
                    order.orderNumber.toLowerCase().includes(searchLower) ||
                    order.customer?.name.toLowerCase().includes(searchLower)
                );
            }

            setOrders(fetchedOrders);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch sales orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered':
            case 'Invoiced':
                return 'bg-success/10 text-success border border-success/30';
            case 'Confirmed':
                return 'bg-info/10 text-info border border-info/30';
            case 'Partially Delivered':
            case 'Partially Invoiced':
                return 'bg-warning/10 text-warning border border-warning/30';
            case 'Cancelled':
                return 'bg-danger/10 text-danger border border-danger/30';
            default: // Draft
                return 'bg-surface/50 text-main border border-default/30';
        }
    };

    // Calculate Dashboard Metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const confirmedOrders = orders.filter((o) => ['Confirmed', 'Partially Delivered', 'Delivered'].includes(o.status)).length;
    const overdueOrders = orders.filter((o) => isOverdue(o)).length;

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-main tracking-tight">Sales Orders</h1>
                        <p className="text-sm text-secondary opacity-70 mt-1">Manage, track, and fulfill customer orders</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="p-2 glass-panel border border-default/40 rounded-lg text-secondary hover:bg-surface/40 shadow-sm transition-all"
                            title="Print List"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => navigate('/sales/sales-order')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-sm transition-all font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Create Order</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard / Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-main mt-1">₹{totalRevenue.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-success/10 rounded-lg text-success">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-success font-medium">
                            <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                +12% from last month
                            </span>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Total Orders</p>
                                <h3 className="text-2xl font-bold text-main mt-1">{totalOrders}</h3>
                            </div>
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full bg-surface/50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '70%' }}></div>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Confirmed</p>
                                <h3 className="text-2xl font-bold text-main mt-1">{confirmedOrders}</h3>
                            </div>
                            <div className="p-2 bg-info/10 rounded-lg text-info">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-secondary opacity-70">
                            <strong>{((confirmedOrders / (totalOrders || 1)) * 100).toFixed(0)}%</strong> conversion rate
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Attention Needed</p>
                                <h3 className="text-2xl font-bold text-main mt-1">{overdueOrders}</h3>
                            </div>
                            <div className="p-2 bg-rose-50 rounded-lg text-danger">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-danger font-medium">
                            {overdueOrders > 0 ? "Requires immediate action" : "All clear"}
                        </div>
                    </div>
                </div>

                {/* Main Content Island */}
                <div className="glass-panel rounded-xl shadow-sm border border-default/30 overflow-hidden flex flex-col">
                    {/* Advanced Filter Bar */}
                    <div className="p-5 border-b border-default/20 bg-surface/30">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative w-full md:max-w-md group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-secondary opacity-50 group-focus-within:text-primary hover:text-primary-hover transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search order #, customer name..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-2 border border-default/40 rounded-lg leading-5 glass-panel placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all shadow-sm"
                                />
                            </div>

                            {/* Filters & Actions */}
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="block w-full md:w-40 py-2 px-3 border border-default/40 glass-panel rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-main opacity-90 font-medium"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Invoiced">Invoiced</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>

                                <label className="flex items-center gap-2 cursor-pointer glass-panel px-3 py-2 border border-default/40 rounded-lg shadow-sm hover:bg-surface/40 transition-colors select-none">
                                    <input
                                        type="checkbox"
                                        checked={filters.overdue}
                                        onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                                        className="w-4 h-4 text-primary rounded border-default/40 focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-main opacity-90">Overdue</span>
                                </label>

                                {(filters.status || filters.search || filters.overdue) && (
                                    <button
                                        onClick={() => setFilters({ status: '', search: '', overdue: false })}
                                        className="text-sm text-secondary opacity-70 hover:text-primary font-medium px-2 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Data Display */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                            <p className="text-secondary opacity-70 font-medium">Loading sales orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="bg-surface/50 p-4 rounded-full mb-4">
                                <svg className="w-8 h-8 text-secondary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-main">No orders found</h3>
                            <p className="text-secondary opacity-70 mt-1 max-w-sm">
                                Try adjusting your filters or create a new sales order to get started.
                            </p>
                            <button
                                onClick={() => navigate('/sales/sales-order')}
                                className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium shadow-sm"
                            >
                                Create First Order
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface/40 border-b border-default/30">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Order</th>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider text-right">Amount</th>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-default/20 glass-panel">
                                        {orders.map((order: SalesOrder) => (
                                            <tr
                                                key={order._id}
                                                onClick={() => navigate(`/sales/sales-order/${order._id}`)}
                                                className="hover:bg-surface/40 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-main">{order.orderNumber}</div>
                                                    {isOverdue(order) && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger mt-1">
                                                            OVERDUE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-main">{order.customer?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-secondary opacity-70">{order.customer?.phone || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                    {new Date(order.orderDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="font-bold text-main">₹{order.totalAmount.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/sales/sales-order/${order._id}`);
                                                        }}
                                                        className="text-primary hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card Stack View */}
                            <div className="md:hidden divide-y divide-default/20">
                                {orders.map((order: SalesOrder) => (
                                    <div
                                        key={order._id}
                                        onClick={() => navigate(`/sales/sales-order/${order._id}`)}
                                        className="p-4 active:bg-surface/40 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-main">{order.orderNumber}</div>
                                                <div className="text-sm text-secondary">{order.customer?.name}</div>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="text-xs text-secondary opacity-70">
                                                {new Date(order.orderDate).toLocaleDateString()}
                                            </div>
                                            <div className="font-bold text-main">₹{order.totalAmount.toLocaleString()}</div>
                                        </div>
                                        <div className="mt-3">
                                            <button className="w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                                                View Details
                                            </button>
                                        </div>
                                        {isOverdue(order) && (
                                            <div className="mt-2 text-xs font-bold text-danger flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Overdue Delivery
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SalesOrderList;

