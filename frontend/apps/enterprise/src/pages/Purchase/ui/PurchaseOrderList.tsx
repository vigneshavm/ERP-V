import React, { useState, useMemo } from 'react';
import { 
    Search, Filter, Plus, FileText, CheckCircle, Clock, 
    AlertCircle, Lock, MoreHorizontal, Trash2, Printer, 
    Download, ChevronUp, ChevronDown, ShoppingCart, 
    TrendingUp, Package, ShieldCheck, ArrowUpRight,
    Truck, Boxes, Zap
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem } from "@repo/shared";
import { toast } from 'react-toastify';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";

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
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

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
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
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
    };

    const getStatusConfig = (status: PurchaseOrderStatus) => {
        const configs: any = {
            'Approved': { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', icon: CheckCircle, label: 'Approved' },
            'Fully Received': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: ShieldCheck, label: 'Fulfilled' },
            'Converted': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: Lock, label: 'Secured' },
            'Partial Receipt': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: Clock, label: 'Partial' },
            'Billed': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: FileText, label: 'Accounted' },
            'Paid': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: Zap, label: 'Settled' },
            'Pending': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Clock, label: 'Queued' },
            'Pending Approval': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Clock, label: 'Review' },
            'Cancelled': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: AlertCircle, label: 'Purged' }
        };
        return configs[status] || { bg: 'bg-neutral-500/10', text: 'text-neutral-500', icon: Package, label: status };
    };

    // Metrics
    const totalExposure = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const pendingOrders = filteredOrders.filter(o => o.status === 'Pending' || o.status === 'Pending Approval').length;
    const fulfilledOrders = filteredOrders.filter(o => o.status === 'Fully Received' || o.status === 'Paid').length;

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Supply Protocol</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Global Sourcing Ledger</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Purchase Orders <ShoppingCart className="w-8 h-8 text-blue-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Monitoring and execution of intentional inbound supply cycles.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleExport('CSV')}
                            className="p-4 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-2xl text-neutral-500 hover:bg-neutral-50 transition-all shadow-sm"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onCreate}
                            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Initiate Order</span>
                        </button>
                    </div>
                </div>

                {/* Sourcing KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Exposure', value: `₹${totalExposure.toLocaleString()}`, icon: TrendingUp, color: 'blue', sub: 'Capital Allocated' },
                        { label: 'Active Cycles', value: filteredOrders.length, icon: Boxes, color: 'purple', status: 'Inbound Stream' },
                        { label: 'Pending Review', value: pendingOrders, icon: Clock, color: 'amber', alert: pendingOrders > 5 },
                        { label: 'Fulfillment Velocity', value: `${fulfilledOrders}/${filteredOrders.length}`, icon: Truck, color: 'emerald', sub: 'Nodes Restored' }
                    ].map((kpi, i) => (
                        <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <kpi.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{kpi.label}</p>
                                    <h3 className={`text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic whitespace-nowrap`}>
                                        {kpi.value}
                                    </h3>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    {kpi.sub && (
                                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{kpi.sub}</p>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full bg-${kpi.color}-500 animate-pulse`} />
                                        <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${kpi.alert ? 'text-rose-500' : 'text-neutral-400'}`}>
                                            {kpi.status || (kpi.alert ? 'Latency Spike' : 'Protocol Nominal')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Inbound Operations Island */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    {/* Command Search & Filter Matrix */}
                    <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
                        <div className="relative w-full lg:max-w-xl group/search">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Intercept PO # or Supplier Entity..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-neutral-900 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                                <Filter className="w-4 h-4 text-neutral-400 ml-3" />
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                                >
                                    <option value="All">Global Status</option>
                                    {['Draft', 'Pending Approval', 'Approved', 'Partial Receipt', 'Fully Received', 'Billed', 'Paid', 'Cancelled'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                                <Truck className="w-4 h-4 text-neutral-400 ml-3" />
                                <select
                                    value={vendorFilter}
                                    onChange={e => setVendorFilter(e.target.value)}
                                    className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                                >
                                    <option value="All">All Suppliers</option>
                                    {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            
                            {selectedOrders.length > 0 && (
                                <div className="flex items-center gap-2 p-1 bg-blue-600 text-white rounded-[1.5rem] animate-in zoom-in-95 duration-300">
                                    <span className="px-4 text-[10px] font-black uppercase tracking-widest">{selectedOrders.length} SELECTED</span>
                                    <div className="flex gap-1">
                                         <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><CheckCircle className="w-4 h-4" /></button>
                                         <button className="p-2.5 hover:bg-rose-500 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sourcing Ledger Table */}
                    <div className="overflow-x-auto px-2">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-2 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded-lg border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500 h-5 w-5 bg-white dark:bg-neutral-900"
                                        />
                                    </th>
                                    <th className="px-4 py-2 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('po_date')}>
                                        Date Node {sortConfig?.key === 'po_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-8 py-2 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('po_number')}>
                                        Order Sequence {sortConfig?.key === 'po_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-8 py-2 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('vendor_name')}>
                                        Supplier Entity {sortConfig?.key === 'vendor_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-8 py-2 text-center">Protocol State</th>
                                    <th className="px-8 py-2 text-center">Fulfillment</th>
                                    <th className="px-8 py-2 text-right cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('total_amount')}>
                                        Total Value {sortConfig?.key === 'total_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-8 py-2 text-right">Commands</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] mb-6 text-neutral-200 animate-in zoom-in duration-500">
                                                    <ShoppingCart className="w-16 h-16" />
                                                </div>
                                                <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Purchase Null</h3>
                                                <p className="text-sm font-bold text-neutral-500 mt-2 italic max-w-sm">No supply cycles detected in current spatial bracket.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order: PurchaseOrder) => {
                                        const config = getStatusConfig(order.status);
                                        const StatusIcon = config.icon;
                                        const totalQty = order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 1;
                                        const receivedQty = order.items?.reduce((acc: number, item: any) => acc + (item.received_quantity || 0), 0) || 0;
                                        const progress = Math.round((receivedQty / totalQty) * 100);
                                        
                                        return (
                                            <tr 
                                                key={order.id}
                                                className={`group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-default ${selectedOrders.includes(order.id) ? 'translate-x-2' : ''}`}
                                            >
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-l-[1.5rem] p-6 border-y border-l border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOrders.includes(order.id)}
                                                            onChange={() => toggleSelect(order.id)}
                                                            className="rounded-lg border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500 h-5 w-5 bg-white dark:bg-neutral-900"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-0 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                                        <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">{new Date(order.po_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    </div>
                                                </td>
                                                <td className="px-0 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                                        <button 
                                                            onClick={() => onView(order.id)}
                                                            className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter italic hover:opacity-70 transition-opacity"
                                                        >
                                                            {order.po_number}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-0 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                                        <div className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-1">{order.vendor_name || 'Anonymous Entity'}</div>
                                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">SUPPLY NODE</span>
                                                    </div>
                                                </td>
                                                <td className="px-0 py-1 text-center">
                                                    <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${config.bg} ${config.text} border-current/10`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {config.label}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-0 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all h-full">
                                                        <div className="flex flex-col gap-1.5 w-24 mx-auto">
                                                            <div className="flex justify-between items-center px-1">
                                                                <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">{progress}%</span>
                                                                <ArrowUpRight className="w-2.5 h-2.5 text-emerald-500" />
                                                            </div>
                                                            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-0 py-1 text-right">
                                                    <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-mono font-black text-neutral-900 dark:text-main italic text-lg">
                                                        ₹{Number(order.total_amount).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-0 py-1 text-right">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-r-[1.5rem] p-6 border-y border-r border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                onClick={() => onView(order.id)}
                                                                className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 group/eye"
                                                            >
                                                                <MoreHorizontal className="w-5 h-5 group-hover/eye:scale-110 transition-transform" />
                                                            </button>
                                                            <button className="p-4 bg-neutral-50 dark:bg-neutral-800/30 text-neutral-400 rounded-2xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all shadow-sm active:scale-95">
                                                                <Printer className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sourcing Footprint */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Supply Matrix Integrity Verified • Sequence: {orders.length} Nodes</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>
        </Layout>
    );
};

export default PurchaseOrderList;
