import { useAuthStore } from '@repo/shared';
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import {
    Search,
    Users,
    User,
    Phone,
    Mail,
    MapPin,
    TrendingUp,
    Download,
    Plus,
    Eye,
    Edit,
    Star,
    ShoppingBag
} from 'lucide-react';
import Customer360Modal from './Customer360Modal';

const CustomerList: React.FC = () => {
    const { customers } = useSelector((state: RootState) => state.customers);
    const { invoices: salesHistory } = useSelector((state: RootState) => state.pos);
    const {  currentSector  } = useAuthStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'purchases' | 'recent'>('name');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate customer stats from sales history
    const customerStats = useMemo(() => {
        const stats: Record<string, { totalPurchases: number; purchaseCount: number; lastPurchase: string }> = {};

        salesHistory
            .filter((s: any) => s.sector === currentSector)
            .forEach((sale: any) => {
                const customerId = typeof sale.customer === 'string' ? sale.customer : sale.customer?._id || sale.customer?.id;
                if (customerId) {
                    if (!stats[customerId]) {
                        stats[customerId] = { totalPurchases: 0, purchaseCount: 0, lastPurchase: '' };
                    }
                    stats[customerId].totalPurchases += sale.totalAmount;
                    stats[customerId].purchaseCount++;
                    if (!stats[customerId].lastPurchase || sale.createdAt > stats[customerId].lastPurchase) {
                        stats[customerId].lastPurchase = sale.createdAt;
                    }
                }
            });

        return stats;
    }, [salesHistory, currentSector]);

    // Enrich customers with stats
    const enrichedCustomers = useMemo(() => {
        return (customers as any[]).map((customer: any) => ({
            ...customer,
            totalPurchases: customerStats[customer.id]?.totalPurchases || 0,
            purchaseCount: customerStats[customer.id]?.purchaseCount || 0,
            lastPurchase: customerStats[customer.id]?.lastPurchase || null,
            isActive: customerStats[customer.id]?.purchaseCount > 0
        }));
    }, [customers, customerStats]);

    // Filter and sort
    const filteredCustomers = useMemo(() => {
        const result = enrichedCustomers.filter((customer: any) => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!customer.name.toLowerCase().includes(search) &&
                    !customer.phone?.includes(searchTerm) &&
                    !customer.email?.toLowerCase().includes(search)) {
                    return false;
                }
            }
            if (filterActive === 'active' && !customer.isActive) return false;
            if (filterActive === 'inactive' && customer.isActive) return false;
            return true;
        });

        result.sort((a: any, b: any) => {
            switch (sortBy) {
                case 'name': return a.name.localeCompare(b.name);
                case 'purchases': return b.totalPurchases - a.totalPurchases;
                case 'recent':
                    if (!a.lastPurchase) return 1;
                    if (!b.lastPurchase) return -1;
                    return new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime();
                default: return 0;
            }
        });

        return result;
    }, [enrichedCustomers, searchTerm, sortBy, filterActive]);

    // Summary stats
    const totalCustomers = customers.length;
    const activeCustomers = enrichedCustomers.filter((c: any) => c.isActive).length;
    const totalRevenue = enrichedCustomers.reduce((acc: number, c: any) => acc + c.totalPurchases, 0);
    const avgPurchaseValue = totalRevenue / Math.max(1, enrichedCustomers.reduce((acc: number, c: any) => acc + c.purchaseCount, 0));

    return (
        <div className="page-shell">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="erp-page-title flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-400" />
                        Partner Registry
                    </h2>
                    <p className="text-muted text-[11px] font-bold uppercase tracking-[0.2em] mt-2 italic">Central Intelligence Node for Consumer Dynamics</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-2.5 bg-[var(--erp-bg-sunken)] border border-default text-muted rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-mono italic">
                        <Download className="w-4 h-4" /> Export Ledger
                    </button>
                    <button className="btn btn-primary text-[10px] uppercase tracking-widest">
                        <Plus className="w-4 h-4" /> Provision Node
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Partners', value: totalCustomers, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                    { label: 'Active Nodes', value: activeCustomers, icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', sub: `${Math.round((activeCustomers / Math.max(1, totalCustomers)) * 100)}% Engagement` },
                    { label: 'Gross Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    { label: 'Avg Unit Yield', value: `₹${avgPurchaseValue.toFixed(0)}`, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
                ].map((stat, i) => (
                    <div key={i} className="erp-card p-6 rounded-[2rem] border border-default shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                            <stat.icon className={`w-20 h-20 ${stat.color}`} />
                        </div>
                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.border} flex items-center justify-center mb-4 border`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] italic mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${i === 1 ? 'text-emerald-400' : i === 2 ? 'text-indigo-400' : 'text-main'} font-mono italic`}>{stat.value}</p>
                            {stat.sub && <p className="text-[8px] font-black text-secondary uppercase tracking-widest mt-1.5">{stat.sub}</p>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="erp-card p-6 rounded-[2rem] border border-default flex flex-wrap gap-6 items-end bg-[var(--erp-bg-sunken)] backdrop-blur-xl shadow-2xl">
                <div className="flex-1 min-w-[300px] group">
                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em] mb-3 block italic">Neural Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Identify node by identity, contact, or digital signature..."
                            className="w-full pl-12 pr-6 py-3.5 bg-[var(--erp-bg-sunken)] border border-default rounded-2xl text-slate-200 text-xs font-black placeholder:text-secondary outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all tracking-wide"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                </div>

                <div className="w-full sm:w-auto">
                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em] mb-3 block italic">Operational State</label>
                    <select
                        className="w-full sm:w-48 px-4 py-3.5 bg-[var(--erp-bg-sunken)] border border-default rounded-2xl text-muted text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all cursor-pointer appearance-none"
                        value={filterActive}
                        onChange={e => setFilterActive(e.target.value as any)}
                    >
                        <option value="all" className="bg-[var(--erp-bg)]">All Nodes</option>
                        <option value="active" className="bg-[var(--erp-bg)]">Active High-Yield</option>
                        <option value="inactive" className="bg-[var(--erp-bg)]">Latency Detected</option>
                    </select>
                </div>

                <div className="w-full sm:w-auto">
                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em] mb-3 block italic">Sequence Order</label>
                    <select
                        className="w-full sm:w-48 px-4 py-3.5 bg-[var(--erp-bg-sunken)] border border-default rounded-2xl text-muted text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all cursor-pointer appearance-none"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                    >
                        <option value="name" className="bg-[var(--erp-bg)]">Identity Index (A-Z)</option>
                        <option value="purchases" className="bg-[var(--erp-bg)]">Yield Magnitude</option>
                        <option value="recent" className="bg-[var(--erp-bg)]">Temporal Proximity</option>
                    </select>
                </div>
            </div>

            {/* Customer List */}
            <div className="bg-slate-950 w-full max-w-5xl rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border border-default animate-in zoom-in-95 duration-500">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-[var(--erp-bg-sunken)] backdrop-blur-md text-[9px] font-black text-muted uppercase tracking-[0.25em]">
                                <th className="px-8 py-6">Partner Identity</th>
                                <th className="px-8 py-6">Communication</th>
                                <th className="px-8 py-6 text-center">Velocity</th>
                                <th className="px-8 py-6 text-right">Yield Capital</th>
                                <th className="px-8 py-6">Last Proximity</th>
                                <th className="px-8 py-6 text-center">Intel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center text-muted">
                                        <div className="flex flex-col items-center gap-6 opacity-40">
                                            <Users className="w-16 h-16" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No consumer patterns identified in current sector</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer: any) => (
                                    <tr key={customer.id} className="group hover:bg-[var(--erp-bg-sunken)] transition-all cursor-default border-b border-default last:border-0">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-slate-800 to-slate-950 border border-default flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500 font-mono italic">
                                                    <span className="text-indigo-400 font-black text-lg">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-200 group-hover:text-indigo-400 transition-colors uppercase tracking-wide">{customer.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {customer.isActive ? (
                                                            <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-black uppercase tracking-widest italic">High Retention</span>
                                                        ) : (
                                                            <span className="text-[8px] px-2 py-0.5 bg-[var(--erp-bg-sunken)] text-muted border border-default rounded-lg font-black uppercase tracking-widest italic">New Acquisition</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2">
                                                {customer.phone && (
                                                    <div className="flex items-center gap-2.5 text-muted text-[10px] font-black font-mono tracking-tight">
                                                        <Phone className="w-3 h-3 text-secondary" /> {customer.phone}
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="flex items-center gap-2.5 text-secondary text-[9px] font-bold italic tracking-wide lowercase">
                                                        <Mail className="w-3 h-3" /> {customer.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-xs font-black text-indigo-400 font-mono italic">{customer.purchaseCount}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-emerald-400 text-xs font-mono italic">
                                            ₹{customer.totalPurchases.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-muted text-[10px] font-black uppercase tracking-widest italic">
                                            {customer.lastPurchase
                                                ? new Date(customer.lastPurchase).toLocaleDateString()
                                                : 'Pending'
                                            }
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2.5 bg-[var(--erp-bg-sunken)] border border-default hover:border-indigo-500/40 hover:bg-white/10 rounded-xl transition-all shadow-lg"
                                                    title="Neural View"
                                                >
                                                    <Eye className="w-4 h-4 text-indigo-400" />
                                                </button>
                                                <button className="p-2.5 bg-[var(--erp-bg-sunken)] border border-default hover:border-slate-500/40 hover:bg-white/10 rounded-xl transition-all shadow-lg" title="Configure Node">
                                                    <Edit className="w-4 h-4 text-muted" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                    {filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">No customers found</div>
                    ) : (
                        filteredCustomers.map((customer: any) => (
                            <div key={customer.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                            <span className="text-main font-bold">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-900 dark:text-main">{customer.name}</p>
                                            {customer.phone && <p className="text-xs text-neutral-500">{customer.phone}</p>}
                                        </div>
                                    </div>
                                    {customer.isActive && (
                                        <span className="text-[10px] px-2 py-0.5 bg-success/10 text-success rounded-full">Active</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center bg-[var(--erp-bg-sunken)] dark:bg-neutral-700/50 p-3 rounded-lg mt-2">
                                    <div className="text-xs text-neutral-500">
                                        <span className="font-bold text-primary">{customer.purchaseCount}</span> purchases
                                    </div>
                                    <p className="font-bold text-success">₹{customer.totalPurchases.toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-neutral-400">
                Showing {filteredCustomers.length} of {totalCustomers} customers
            </div>

            {selectedCustomer && (
                <Customer360Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    customer={selectedCustomer}
                />
            )}
        </div>
    );
};

export default CustomerList;
