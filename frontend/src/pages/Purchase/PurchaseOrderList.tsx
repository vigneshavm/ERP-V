import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, FileText, CheckCircle, Clock, AlertCircle, Lock, MoreHorizontal, Trash2, Printer, Download, ChevronUp, ChevronDown, Eye, FileSpreadsheet, Info, ArrowUpDown, Activity } from 'lucide-react';
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

    // Selection & Actions
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'po_date', direction: 'desc' });

    // Derived Data
    const vendors = useMemo(() => Array.from(new Set(orders.map((o: PurchaseOrder) => o.vendor_name || 'Unknown'))).sort(), [orders]);

    const filteredOrders = useMemo(() => {
        let result = orders.filter((o: PurchaseOrder) => {
            const matchesSearch = o.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    const getStatusBadge = (status: PurchaseOrderStatus) => {
        const baseClass = "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5";
        switch (status) {
            case 'Approved':
                return <span className={`${baseClass} bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400`}><CheckCircle className="w-3 h-3" /> Approved</span>;
            case 'Fully Received':
            case 'Converted':
            case 'Paid':
                return <span className={`${baseClass} bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400`}><Lock className="w-3 h-3" /> {status}</span>;
            case 'Partial Receipt':
                return <span className={`${baseClass} bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400`}><Activity className="w-3 h-3" /> Partial</span>;
            case 'Billed':
                return <span className={`${baseClass} bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400`}><FileText className="w-3 h-3" /> Billed</span>;
            case 'Pending':
            case 'Pending Approval':
                return <span className={`${baseClass} bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400`}><Clock className="w-3 h-3" /> Pending</span>;
            case 'Cancelled':
                return <span className={`${baseClass} bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400`}><AlertCircle className="w-3 h-3" /> Cancelled</span>;
            default:
                return <span className={`${baseClass} bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400`}>{status}</span>;
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Audit Control Bar */}
            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 space-y-8">
                <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-6 w-full xl:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Node Search</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search PO # or Supplier..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                        {selectedOrders.length > 0 && (
                            <div className="flex items-center gap-4 bg-primary/5 text-primary px-6 py-2.5 rounded-2xl border border-primary/10 animate-in zoom-in-95 self-end md:self-auto">
                                <span className="text-[10px] font-black uppercase tracking-widest">{selectedOrders.length} Nodes Active</span>
                                <div className="h-4 w-px bg-primary/20 mx-2" />
                                <button className="p-1.5 hover:bg-primary/10 rounded-xl transition-all" title="Bulk Approve"><CheckCircle className="w-4 h-4" /></button>
                                <button className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-xl transition-all" title="Bulk Cancel"><Trash2 className="w-4 h-4" /></button>
                                <button className="p-1.5 hover:bg-primary/10 rounded-xl transition-all" title="Bulk Print"><Printer className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                        <button className="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-neutral-400 hover:text-emerald-500 transition-all">
                            <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-neutral-400 hover:text-rose-500 transition-all">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Advanced Filter Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                    <div>
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Operational Status</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full px-5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="All">All Statuses</option>
                            {['Draft', 'Pending Approval', 'Approved', 'Partial Receipt', 'Fully Received', 'Billed', 'Paid', 'Cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Institutional Vendor</label>
                        <select
                            value={vendorFilter}
                            onChange={e => setVendorFilter(e.target.value)}
                            className="w-full px-5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="All">All Entities</option>
                            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Fiscal Range</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-[10px] font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                            <span className="text-neutral-300 font-bold">→</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-[10px] font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Procurement Ledger */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
                        <tr>
                            <th className="px-8 py-5 w-10">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded-lg border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary/20 h-5 w-5 cursor-pointer"
                                    />
                                </div>
                            </th>
                            <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('po_date')}>
                                <div className="flex items-center gap-2">Fiscal Date <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('po_number')}>
                                <div className="flex items-center gap-2">Node ID <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('vendor_name')}>
                                <div className="flex items-center gap-2">Institutional Vendor <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Fulfillment</th>
                            <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('total_amount')}>
                                <div className="flex items-center justify-end gap-2">Quantum (INR) <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto opacity-40">
                                        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-3xl flex items-center justify-center">
                                            <Info className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-widest">Archive Empty</p>
                                            <p className="text-xs font-bold mt-2 italic leading-relaxed">No procurement nodes found matching the current search context.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order: PurchaseOrder) => (
                                <tr
                                    key={order.id}
                                    className={`group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all cursor-default ${selectedOrders.includes(order.id) ? 'bg-primary/5' : ''}`}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                                className="rounded-lg border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary/20 h-5 w-5 cursor-pointer"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                                            {new Date(order.po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className="text-xs font-black text-primary font-mono tracking-tighter uppercase group-hover:underline cursor-pointer" onClick={() => onView(order.id)}>
                                            #{order.po_number}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">
                                            {order.vendor_name || 'Unknown Vendor'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            {getStatusBadge(order.status)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2 w-32 mx-auto">
                                            <div className="flex justify-between text-[8px] font-black text-neutral-400 uppercase tracking-widest">
                                                <span>Fulfillment</span>
                                                <span className="text-neutral-900 dark:text-white">
                                                    {Math.round(((order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.received_quantity || 0), 0) || 0) / (order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.quantity || 1), 0) || 1)) * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                                    style={{ width: `${Math.round(((order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.received_quantity || 0), 0) || 0) / (order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.quantity || 1), 0) || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right whitespace-nowrap text-sm font-black tabular-nums text-neutral-900 dark:text-white">
                                        ₹{Number(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => onView(order.id)} className="p-2.5 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-all">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PurchaseOrderList;
