
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, FileText, CheckCircle, Clock, AlertCircle, Lock, MoreHorizontal, Trash2, Printer, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem } from "../../hooks/usePurchaseOrders";
import { toast } from 'react-toastify';

interface PurchaseOrderListProps {
    orders?: PurchaseOrder[];
    onCreate?: () => void;
    onView?: (id: string) => void;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ orders = [], onCreate = () => { }, onView = () => { } }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Advanced Filters
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [vendorFilter, setVendorFilter] = useState('All');
    const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('All');

    // Selection & Actions
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Derived Data
    const vendors = useMemo(() => Array.from(new Set(orders.map((o: PurchaseOrder) => o.vendor_name || 'Unknown'))).sort(), [orders]);

    const filteredOrders = useMemo(() => {
        let result = orders.filter((o: PurchaseOrder) => {
            const matchesSearch = o.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
            const matchesVendor = vendorFilter === 'All' || o.vendor_name === vendorFilter;

            let matchesDate = true;
            if (dateRange.from && new Date(o.po_date) < new Date(dateRange.from)) matchesDate = false;
            if (dateRange.to && new Date(o.po_date) > new Date(dateRange.to)) matchesDate = false;

            return matchesSearch && matchesStatus && matchesVendor && matchesDate;
        });

        if (sortConfig) {
            result.sort((a: any, b: any) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [orders, searchTerm, statusFilter, vendorFilter, dateRange, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleSelect = (id: string) => {
        setSelectedOrders(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const handleExport = (type: 'CSV' | 'PDF') => {
        toast.info(`Exporting ${filteredOrders.length} orders to ${type}...`);
        // Logic would go here
    };

    const getStatusColor = (status: PurchaseOrderStatus) => {
        switch (status) {
            case 'Approved': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
            case 'Fully Received':
            case 'Converted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Partial Receipt': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'Billed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Pending':
            case 'Pending Approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
                        {selectedOrders.length > 0 && (
                            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-left-2">
                                <span className="text-xs font-bold">{selectedOrders.length} Selected</span>
                                <div className="h-4 w-px bg-primary/20 mx-1" />
                                <button className="p-1 hover:bg-primary/20 rounded-md transition-colors" title="Bulk Approve"><CheckCircle className="w-4 h-4" /></button>
                                <button className="p-1 hover:bg-red-100 text-red-600 rounded-md transition-colors" title="Bulk Cancel"><Trash2 className="w-4 h-4" /></button>
                                <button className="p-1 hover:bg-primary/20 rounded-md transition-colors" title="Bulk Print"><Printer className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={() => handleExport('CSV')} className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-800">
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onCreate}
                            className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Order</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Filters Bar */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-neutral-700 dark:text-neutral-300"
                        >
                            <option value="All">All Statuses</option>
                            {['Draft', 'Pending Approval', 'Approved', 'Partial Receipt', 'Fully Received', 'Billed', 'Paid', 'Cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Vendor:</span>
                        <select
                            value={vendorFilter}
                            onChange={e => setVendorFilter(e.target.value)}
                            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-neutral-700 dark:text-neutral-300"
                        >
                            <option value="All">All Vendors</option>
                            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date From:</span>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">To:</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('po_date')}>
                                <div className="flex items-center gap-1">Date {sortConfig?.key === 'po_date' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('po_number')}>
                                <div className="flex items-center gap-1">PO Number {sortConfig?.key === 'po_number' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('vendor_name')}>
                                <div className="flex items-center gap-1">Supplier {sortConfig?.key === 'vendor_name' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 text-center">Status</th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 text-center">Receipt</th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('total_amount')}>
                                <div className="flex items-center justify-end gap-1">Amount {sortConfig?.key === 'total_amount' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-neutral-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {filteredOrders.map((order: PurchaseOrder) => (
                            <tr
                                key={order.id}
                                className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${selectedOrders.includes(order.id) ? 'bg-primary/5' : ''}`}
                            >
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(order.id)}
                                        onChange={() => toggleSelect(order.id)}
                                        className="rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
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
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 w-24 mx-auto">
                                        <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                                            <span>{Math.round(((order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.received_quantity || 0), 0) || 0) / (order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.quantity || 1), 0) || 1)) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.round(((order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.received_quantity || 0), 0) || 0) / (order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.quantity || 1), 0) || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white text-right">
                                    ₹{Number(order.total_amount).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); onView(order.id); }} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-neutral-500" title="View Details">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
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
