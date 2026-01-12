import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
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

const CustomerList: React.FC = () => {
    const { customers, salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'purchases' | 'recent'>('name');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

    // Calculate customer stats from sales history
    const customerStats = useMemo(() => {
        const stats: Record<string, { totalPurchases: number; purchaseCount: number; lastPurchase: string }> = {};

        salesHistory
            .filter(s => s.sector === currentSector)
            .forEach(sale => {
                if (sale.customerId) {
                    if (!stats[sale.customerId]) {
                        stats[sale.customerId] = { totalPurchases: 0, purchaseCount: 0, lastPurchase: '' };
                    }
                    stats[sale.customerId].totalPurchases += sale.total;
                    stats[sale.customerId].purchaseCount++;
                    if (!stats[sale.customerId].lastPurchase || sale.date > stats[sale.customerId].lastPurchase) {
                        stats[sale.customerId].lastPurchase = sale.date;
                    }
                }
            });

        return stats;
    }, [salesHistory, currentSector]);

    // Enrich customers with stats
    const enrichedCustomers = useMemo(() => {
        return customers.map(customer => ({
            ...customer,
            totalPurchases: customerStats[customer.id]?.totalPurchases || 0,
            purchaseCount: customerStats[customer.id]?.purchaseCount || 0,
            lastPurchase: customerStats[customer.id]?.lastPurchase || null,
            isActive: customerStats[customer.id]?.purchaseCount > 0
        }));
    }, [customers, customerStats]);

    // Filter and sort
    const filteredCustomers = useMemo(() => {
        let result = enrichedCustomers.filter(customer => {
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

        result.sort((a, b) => {
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
    const activeCustomers = enrichedCustomers.filter(c => c.isActive).length;
    const totalRevenue = enrichedCustomers.reduce((acc, c) => acc + c.totalPurchases, 0);
    const avgPurchaseValue = totalRevenue / Math.max(1, enrichedCustomers.reduce((acc, c) => acc + c.purchaseCount, 0));

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Customer List
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">Manage your customer database</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Customer
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Customers</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{totalCustomers}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Active Customers</p>
                            <p className="text-2xl font-bold text-success mt-1">{activeCustomers}</p>
                        </div>
                        <div className="p-3 bg-success/10 rounded-xl">
                            <ShoppingBag className="w-6 h-6 text-success" />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{Math.round((activeCustomers / Math.max(1, totalCustomers)) * 100)}% of total</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Revenue</p>
                            <p className="text-2xl font-bold text-primary mt-1">₹{totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Avg Transaction</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">₹{avgPurchaseValue.toFixed(0)}</p>
                        </div>
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                            <Star className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[250px]">
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Name, phone, or email..."
                            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Status</label>
                    <select
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={filterActive}
                        onChange={e => setFilterActive(e.target.value as any)}
                    >
                        <option value="all">All Customers</option>
                        <option value="active">Active (Has Purchases)</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Sort By</label>
                    <select
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                    >
                        <option value="name">Name (A-Z)</option>
                        <option value="purchases">Total Purchases</option>
                        <option value="recent">Most Recent</option>
                    </select>
                </div>
            </div>

            {/* Customer List */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-xs font-medium">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4 text-center">Purchases</th>
                                <th className="p-4 text-right">Total Spent</th>
                                <th className="p-4">Last Purchase</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {filteredCustomers.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="w-8 h-8 text-neutral-300" />
                                        <p>No customers found</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                                    <span className="text-white font-bold">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900 dark:text-white">{customer.name}</p>
                                                    {customer.isActive ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded-full">Active</span>
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 rounded-full">New</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                {customer.phone && (
                                                    <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 text-xs">
                                                        <Phone className="w-3 h-3" /> {customer.phone}
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="flex items-center gap-1 text-neutral-500 text-xs">
                                                        <Mail className="w-3 h-3" /> {customer.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-primary">{customer.purchaseCount}</span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-success">
                                            ₹{customer.totalPurchases.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-neutral-500 text-sm">
                                            {customer.lastPurchase
                                                ? new Date(customer.lastPurchase).toLocaleDateString()
                                                : '-'
                                            }
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-1">
                                                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg" title="View">
                                                    <Eye className="w-4 h-4 text-primary" />
                                                </button>
                                                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg" title="Edit">
                                                    <Edit className="w-4 h-4 text-neutral-400" />
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
                        filteredCustomers.map(customer => (
                            <div key={customer.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                            <span className="text-white font-bold">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-900 dark:text-white">{customer.name}</p>
                                            {customer.phone && <p className="text-xs text-neutral-500">{customer.phone}</p>}
                                        </div>
                                    </div>
                                    {customer.isActive && (
                                        <span className="text-[10px] px-2 py-0.5 bg-success/10 text-success rounded-full">Active</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg mt-2">
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
        </div>
    );
};

export default CustomerList;
