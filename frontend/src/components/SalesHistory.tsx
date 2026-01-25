import { useState } from 'react';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { updateSaleStatus } from '../redux/slices/posSlice';
import { Calendar, Search, Printer, ChevronDown, CheckCircle, PackageCheck } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { useBranchResolver } from '../hooks/useBranchResolver';
import { Sale } from '../types/sales';

const SalesHistory = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { salesHistory, customers } = useSelector((state: RootState) => state.pos);
    const { user, role, currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { getBranchName } = useBranchResolver();

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchId, setSearchId] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

    const filteredSales = salesHistory.filter(sale => {
        // 1. Role-based Access Control
        // Owner/Admin sees everything in the current branch/sector
        // Staff only sees THEIR own sales
        if (role === 'Staff' && sale.userId !== user?.id) return false;

        // 2. Branch/Sector Filter
        if (sale.sector !== currentSector) return false;

        // 3. Search ID
        if (searchId && !sale.id.includes(searchId)) return false;

        // 4. Status Filter
        if (statusFilter !== 'ALL' && sale.status !== statusFilter) return false;

        // 5. Date Range
        if (dateFrom && new Date(sale.date) < new Date(dateFrom)) return false;
        if (dateTo) {
            const nextDay = new Date(dateTo);
            nextDay.setDate(nextDay.getDate() + 1);
            if (new Date(sale.date) >= nextDay) return false;
        }

        return true;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'PREORDER': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'FULFILLED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getCustomerName = (id?: string) => {
        if (!id) return 'Unknown';
        return customers.find(c => c.id === id)?.name || 'Walk-in';
    };


    const totalFilteredRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {selectedSale && <ReceiptModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Sales History <span className="text-slate-500 text-base font-normal">/ {getBranchName(currentBranch)}</span>
                </h2>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">Total Period Revenue</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalFilteredRevenue.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end transition-colors">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">Search Invoice ID</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g. 5x8s9..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                        />
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">From Date</label>
                    <div className="relative">
                        <input
                            type="date"
                            className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                        />
                        <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">To Date</label>
                    <div className="relative">
                        <input
                            type="date"
                            className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                        />
                        <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">Status</label>
                    <select
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PREORDER">Pre-order</option>
                        <option value="FULFILLED">Fulfilled</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <button
                    onClick={() => { setDateFrom(''); setDateTo(''); setSearchId(''); setStatusFilter('ALL'); }}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors"
                >
                    Clear Filters
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg transition-colors">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                            <tr>
                                <th className="p-4">Invoice ID</th>
                                <th className="p-4">Date & Time</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Items</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredSales.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No sales found matching criteria.</td></tr>
                            )}
                            {filteredSales.map(sale => (
                                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400">#{sale.id.substring(0, 8)}...</td>
                                    <td className="p-4 text-slate-800 dark:text-slate-200">
                                        {new Date(sale.date).toLocaleDateString()}
                                        <span className="text-slate-500 text-xs ml-1">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="p-4 text-slate-900 dark:text-white font-medium">{getCustomerName(sale.customerId)}</td>
                                    <td className="p-4 text-slate-500 dark:text-slate-400">{sale.items.length} items</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {sale.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{sale.total.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => setSelectedSale(sale)}
                                            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                            title="Print Receipt"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredSales.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No sales found.</div>
                    ) : (
                        filteredSales.map(sale => (
                            <div key={sale.id} className="p-4 bg-white dark:bg-slate-800">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#{sale.id.substring(0, 6)}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 ${getStatusColor(sale.status)}`}>
                                                {sale.status}
                                            </span>
                                        </div>
                                        <p className="font-bold text-slate-900 dark:text-white mt-1">{getCustomerName(sale.customerId)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{sale.total.toFixed(2)}</p>
                                        <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg mt-3">
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        <span className="font-bold">{sale.items.length} Items</span> • {sale.paymentMethod}
                                    </div>
                                    <button
                                        onClick={() => setSelectedSale(sale)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 text-xs font-bold rounded-lg"
                                    >
                                        <Printer className="w-3 h-3" /> Receipt
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesHistory;
