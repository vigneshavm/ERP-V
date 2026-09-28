import React, { useState, useMemo } from 'react';
import { Search, FileText, CheckCircle, Clock, AlertCircle, Lock, MoreHorizontal, Trash2, Printer, Download, Eye, FileSpreadsheet, Info, ArrowUpDown, Activity } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem } from "../../hooks/usePurchaseOrders";
import StatusBadge from '@/components/shared/UI/StatusBadge';
import { Button, Input, Select } from '@/components/shared';

interface PurchaseOrderListProps {
    orders?: PurchaseOrder[];
    onCreate?: () => void;
    onView?: (id: string) => void;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ orders = [], onCreate: __onCreate = () => { }, onView = () => { } }) => {
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
        const result = orders.filter((o: PurchaseOrder) => {
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
        const labels: Record<string, string> = { SUBMITTED: 'Pending approval', PARTIALLY_RECEIVED: 'Part received', SENT_TO_VENDOR: 'Sent to supplier' };
        return <StatusBadge status={status} label={labels[status]} />;
    };

    return (
        <div className="ui-panel overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Audit Control Bar */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 space-y-8">
                <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-6 w-full xl:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <label className="ui-label mb-3 block">Search</label>
                            <Input
                                type="text"
                                placeholder="Search PO # or Supplier..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                icon={<Search className="w-4 h-4 text-slate-400" />}
                            />
                        </div>
                        {selectedOrders.length > 0 && (
                            <div className="flex items-center gap-4 bg-primary/5 text-primary px-6 py-2.5 rounded-sm border border-primary/10 animate-in zoom-in-95 self-end md:self-auto">
                                <span className="text-xs font-black uppercase tracking-widest">{selectedOrders.length} Nodes Active</span>
                                <div className="h-4 w-px bg-primary/20 mx-2" />
                                <Button variant="tertiary" size="sm" icon={<CheckCircle className="w-4 h-4" />} title="Bulk Approve" />
                                <Button variant="tertiary" size="sm" icon={<Trash2 className="w-4 h-4" />} className="text-danger" title="Bulk Cancel" />
                                <Button variant="tertiary" size="sm" icon={<Printer className="w-4 h-4" />} title="Bulk Print" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                        <Button variant="secondary" size="md" icon={<FileSpreadsheet className="w-4 h-4" />} />
                        <Button variant="secondary" size="md" icon={<Download className="w-4 h-4" />} />
                    </div>
                </div>

                {/* Advanced Filter Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                    <div>
                        <label className="ui-label mb-3 block">Operational Status</label>
                        <Select
                            options={['All', 'DRAFT', 'SUBMITTED', 'APPROVED', 'SENT_TO_VENDOR', 'PARTIALLY_RECEIVED', 'COMPLETED', 'Billed', 'Paid', 'CANCELLED'].map(s => ({ value: s, label: s === 'All' ? 'All Statuses' : s }))}
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(typeof value === 'string' ? value : value[0])}
                        />
                    </div>
                    <div>
                        <label className="ui-label mb-3 block">Supplier</label>
                        <Select
                            options={[{ value: 'All', label: 'All Entities' }, ...vendors.map(v => ({ value: v, label: v }))]}
                            value={vendorFilter}
                            onChange={(value) => setVendorFilter(typeof value === 'string' ? value : value[0])}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="ui-label mb-3 block">Fiscal Range</label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="date"
                                value={dateRange.from}
                                onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                            />
                            <span className="text-slate-300 font-bold">→</span>
                            <Input
                                type="date"
                                value={dateRange.to}
                                onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Procurement Ledger */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-8 py-5 w-10">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded-lg border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 h-5 w-5 cursor-pointer"
                                    />
                                </div>
                            </th>
                            <th className="px-8 py-5 ui-label cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('po_date')}>
                                <div className="flex items-center gap-2">Fiscal Date <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-8 py-5 ui-label cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('po_number')}>
                                <div className="flex items-center gap-2">PO No. <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-8 py-5 ui-label cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('vendor_name')}>
                                <div className="flex items-center gap-2">Supplier <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fulfillment</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('total_amount')}>
                                <div className="flex items-center justify-end gap-2">Amount (₹) <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto opacity-40">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-sm flex items-center justify-center">
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
                                    className={`group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all cursor-default ${selectedOrders.includes(order.id) ? 'bg-primary/5' : ''}`}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                                className="rounded-lg border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 h-5 w-5 cursor-pointer"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            {new Date(order.po_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className="text-xs font-black text-primary font-mono tracking-tighter uppercase group-hover:underline cursor-pointer" onClick={() => onView(order.id)}>
                                            #{order.po_number}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">
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
                                            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Fulfillment</span>
                                                <span className="text-slate-900 dark:text-white">
                                                    {Math.round(((order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.received_quantity || 0), 0) || 0) / (order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.quantity || 1), 0) || 1)) * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-success rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                                    style={{ width: `${Math.round(((order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.received_quantity || 0), 0) || 0) / (order.items?.reduce((acc: number, item: PurchaseOrderItem) => acc + (item.quantity || 1), 0) || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right whitespace-nowrap text-sm font-black tabular-nums text-slate-900 dark:text-white">
                                        ₹{Number(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="secondary" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => onView(order.id)} />
                                            <Button variant="secondary" size="sm" icon={<MoreHorizontal className="w-4 h-4" />} />
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
