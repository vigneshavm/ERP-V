
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Calendar, Search, Filter, ArrowUpRight } from 'lucide-react';

const SalesHistory: React.FC = () => {
  const { salesHistory, customers } = useSelector((state: RootState) => state.pos);
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchId, setSearchId] = useState('');

  const filteredSales = salesHistory.filter(sale => {
      // 1. Branch/Sector Filter
      if (sale.sector !== currentSector) return false;
      if (currentBranch !== 'All' && sale.branch !== currentBranch) return false;

      // 2. Search ID
      if (searchId && !sale.id.includes(searchId)) return false;

      // 3. Date Range
      if (dateFrom && new Date(sale.date) < new Date(dateFrom)) return false;
      if (dateTo) {
          const nextDay = new Date(dateTo);
          nextDay.setDate(nextDay.getDate() + 1);
          if (new Date(sale.date) >= nextDay) return false;
      }

      return true;
  });

  const getCustomerName = (id?: string) => {
      if (!id) return 'Unknown';
      return customers.find(c => c.id === id)?.name || 'Walk-in';
  };

  const totalFilteredRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Sales History <span className="text-slate-500 text-base font-normal">/ {currentBranch}</span>
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

            <button 
                onClick={() => { setDateFrom(''); setDateTo(''); setSearchId(''); }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold"
            >
                Clear
            </button>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg transition-colors">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                        <tr>
                            <th className="p-4">Invoice ID</th>
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Items</th>
                            <th className="p-4">Payment</th>
                            <th className="p-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredSales.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">No sales found matching criteria.</td></tr>
                        )}
                        {filteredSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="p-4 font-mono text-slate-500 dark:text-slate-400">#{sale.id}</td>
                                <td className="p-4 text-slate-800 dark:text-slate-200">
                                    {new Date(sale.date).toLocaleDateString()} 
                                    <span className="text-slate-500 text-xs ml-1">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'})}</span>
                                </td>
                                <td className="p-4 text-slate-900 dark:text-white font-medium">{getCustomerName(sale.customerId)}</td>
                                <td className="p-4 text-slate-500 dark:text-slate-400">{sale.items.length} items</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {sale.paymentMethod}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{sale.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default SalesHistory;
    