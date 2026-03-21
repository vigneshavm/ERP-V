import { useAuthStore } from '@repo/shared';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
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
    ShoppingBag,
    Filter,
    ArrowUpRight,
    ShieldCheck,
    ChevronRight,
    Zap
} from 'lucide-react';
import Customer360Modal from './Customer360Modal';

const CustomerList: React.FC = () => {
    const navigate = useNavigate();
    const { customers = [] } = useSelector((state: RootState) => state.customers);
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
        if (!customers || !Array.isArray(customers)) return [];
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
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">Citizen Matrix</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Global CRM v4.2</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Partner Intelligence <Users className="w-8 h-8 text-indigo-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Strategic registry and analysis of high-yield consumer nodes.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-4 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-2xl text-neutral-500 hover:bg-neutral-50 transition-all shadow-sm font-mono italic text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export Ledger
                        </button>
                        <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                            <Plus className="w-5 h-5" /> 
                            <span>Provision Node</span>
                        </button>
                    </div>
                </div>

                {/* KPI Pulse Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Partners', value: totalCustomers, icon: Users, color: 'indigo', status: 'Live Flux' },
                        { label: 'Active Engagement', value: activeCustomers, icon: ShoppingBag, color: 'emerald', sub: `${Math.round((activeCustomers / Math.max(1, totalCustomers)) * 100)}% Conversion` },
                        { label: 'Aggregate Yield', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'blue', trend: 'Alpha Gain' },
                        { label: 'Unit Yield Mean', value: `₹${avgPurchaseValue.toFixed(0)}`, icon: Star, color: 'amber', rating: 'Optimal' }
                    ].map((stat, i) => (
                        <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <stat.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1 italic">{stat.label}</p>
                                    <h3 className={`text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic`}>
                                        {stat.value}
                                    </h3>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    {stat.sub && (
                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{stat.sub}</p>
                                    )}
                                    {stat.trend && (
                                        <div className="flex items-center gap-1.5 text-blue-500 font-black uppercase tracking-widest text-[8px]">
                                            <TrendingUp className="w-2.5 h-2.5" /> {stat.trend}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full bg-${stat.color}-500 animate-pulse`} />
                                        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                                            {stat.status || stat.rating || 'Live Signal'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Command Center */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
                        {/* Search Node */}
                        <div className="relative w-full lg:max-w-xl group/search">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Identify node by identity, contact, or digital signature..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-neutral-900 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                            />
                        </div>

                        {/* Attribute Matrix */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                                <Filter className="w-4 h-4 text-neutral-400 ml-3" />
                                <select
                                    value={filterActive}
                                    onChange={e => setFilterActive(e.target.value as any)}
                                    className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                                >
                                    <option value="all">Global Matrix</option>
                                    <option value="active">High-Yield Active</option>
                                    <option value="inactive">Latency Detected</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                                <TrendingUp className="w-4 h-4 text-neutral-400 ml-3" />
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                    className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                                >
                                    <option value="name">Identity Sequence</option>
                                    <option value="purchases">Yield Magnitude</option>
                                    <option value="recent">Temporal Proximity</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Partner Matrix Display */}
                    <div className="overflow-x-auto px-2">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-2">Partner Identity</th>
                                    <th className="px-8 py-2">Communication Link</th>
                                    <th className="px-8 py-2 text-center">Velocity</th>
                                    <th className="px-8 py-2 text-right">Yield Capital</th>
                                    <th className="px-8 py-2">Last Sync</th>
                                    <th className="px-8 py-2 text-center">Neural Intel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] mb-6 text-neutral-200 animate-in zoom-in duration-500">
                                                    <Users className="w-16 h-16" />
                                                </div>
                                                <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Identity Null</h3>
                                                <p className="text-sm font-bold text-neutral-500 mt-2 italic max-w-sm">
                                                    Zero consumer patterns detected in current sector range.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer: any) => (
                                        <tr key={customer.id} className="group/row hover:transform hover:-translate-y-1 transition-all duration-500">
                                            <td className="px-2 py-1">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-indigo-500/20 group-hover/row:shadow-xl group-hover/row:shadow-indigo-500/5 transition-all relative overflow-hidden flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xl font-black italic shadow-lg">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-1 group-hover/row:text-indigo-400 transition-colors">
                                                            {customer.name}
                                                        </p>
                                                        {customer.isActive ? (
                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-1">
                                                                <ShieldCheck className="w-2.5 h-2.5" /> High Retention
                                                            </span>
                                                        ) : (
                                                            <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest italic">New Acquisition</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-1">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[10px] font-black font-mono text-neutral-600 dark:text-neutral-400 flex items-center gap-2 tracking-tight italic">
                                                            <Phone className="w-3 h-3 text-indigo-500/50" /> {customer.phone || 'NO SIGNAL'}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-neutral-400 italic flex items-center gap-2 leading-none">
                                                            <Mail className="w-3 h-3 text-indigo-500/50" /> {customer.email || 'no_comms_node'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-indigo-500 italic text-lg">
                                                    {customer.purchaseCount}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-emerald-500 italic text-xl tracking-tighter">
                                                    ₹{customer.totalPurchases.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-black text-neutral-400 uppercase tracking-widest italic text-[10px]">
                                                    {customer.lastPurchase
                                                        ? new Date(customer.lastPurchase).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                                        : 'PENDING'
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCustomer(customer);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 group/intel"
                                                    >
                                                        <Eye className="w-5 h-5 group-hover/intel:scale-110 transition-transform" />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/customers/edit/${customer.id || customer._id}`)}
                                                        className="p-4 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 rounded-2xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Edit className="w-5 h-5" />
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

                {/* Footer Matrix Info */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                        Displaying {filteredCustomers.length} of {totalCustomers} Identities
                    </span>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>

            {selectedCustomer && (
                <Customer360Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    customer={selectedCustomer}
                />
            )}
        </Layout>
    );
};

export default CustomerList;
