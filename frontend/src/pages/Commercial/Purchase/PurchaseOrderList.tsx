
import React, { useState } from 'react';
import { Search, Filter, Plus, FileText, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus } from "../../../hooks/usePurchaseOrders";

interface PurchaseOrderListProps {
    orders: PurchaseOrder[];
    onCreate: () => void;
    onView: (id: string) => void;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ orders, onCreate, onView }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    const filteredOrders = orders.filter(o =>
        (statusFilter === 'All' || o.status === statusFilter) &&
        (o.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusColor = (status: PurchaseOrderStatus) => {
        switch (status) {
            case 'Approved': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
            case 'Converted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 items-center w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search PO # or Supplier..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-neutral-500" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                        >
                            <option value="All">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Converted">Converted</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={onCreate}
                    className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Order</span>
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-neutral-500">Date</th>
                            <th className="px-6 py-3 font-semibold text-neutral-500">PO Number</th>
                            <th className="px-6 py-3 font-semibold text-neutral-500">Supplier</th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 text-center">Status</th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 text-right">Amount</th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {filteredOrders.map(order => (
                            <tr
                                key={order.id}
                                onClick={() => onView(order.id)}
                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                                    {new Date(order.po_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs font-bold text-primary">
                                    {order.po_number}
                                </td>
                                <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                    {order.vendor_name || 'Unknown Vendor'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                        {/* Icons based on status */}
                                        {order.status === 'Draft' && <FileText className="w-3 h-3" />}
                                        {order.status === 'Pending' && <Clock className="w-3 h-3" />}
                                        {order.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                                        {order.status === 'Converted' && <Lock className="w-3 h-3" />}
                                        {order.status === 'Cancelled' && <AlertCircle className="w-3 h-3" />}
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white text-right">
                                    ₹{Number(order.total_amount).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-secondary hover:underline text-xs font-semibold">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PurchaseOrderList;
