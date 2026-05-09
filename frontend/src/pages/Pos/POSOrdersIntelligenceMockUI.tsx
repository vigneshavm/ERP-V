import React from 'react';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2 } from 'lucide-react';
import posOrdersIntelligenceData from '../../mockData/posOrdersIntelligenceData.json';

const POSOrdersIntelligenceMockUI: React.FC = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedTerminal, setSelectedTerminal] = React.useState('All Terminals');

    const terminals = ['All Terminals', ...new Set(posOrdersIntelligenceData.orders.map(o => o.terminal))];

    const filteredOrders = posOrdersIntelligenceData.orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.terminal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.cashier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTerminal = selectedTerminal === 'All Terminals' || order.terminal === selectedTerminal;
        return matchesSearch && matchesTerminal;
    });

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        POS Orders Intelligence
                    </h1>
                    <p className="text-sm text-main/60 mt-1">POS Data Intelligence Grid</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm">
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all text-sm font-medium">
                        <BarChart2 className="w-4 h-4" /> Run Analytics
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 rounded-xl flex gap-4 items-center border border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/40" />
                    <input 
                        type="text" 
                        placeholder="Search transactions or receipts..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-teal-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Filter className="w-4 h-4 text-main/40" />
                    <select 
                        value={selectedTerminal}
                        onChange={(e) => setSelectedTerminal(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-teal-500/50 outline-none transition-all cursor-pointer"
                    >
                        {terminals.map(t => (
                            <option key={t} value={t} className="bg-slate-900 text-main">{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Data Grid */}
            <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/40 border-b border-white/10 text-main/60">
                            <tr>
                                <th className="p-4 text-left font-medium">Receipt ID</th>
                                <th className="p-4 text-left font-medium">Terminal</th>
                                <th className="p-4 text-left font-medium">Cashier</th>
                                <th className="p-4 text-left font-medium">Time</th>
                                <th className="p-4 text-right font-medium">Amount</th>
                                <th className="p-4 text-center font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((rec, i) => (
                                    <tr key={i} className="hover:bg-white/[0.04] transition-colors cursor-pointer group">
                                        <td className="p-4 font-medium text-teal-400 group-hover:text-teal-300">{rec.id}</td>
                                        <td className="p-4 text-main/80">{rec.terminal}</td>
                                        <td className="p-4 text-main/90 font-medium">{rec.cashier}</td>
                                        <td className="p-4 text-main/60">{rec.time}</td>
                                        <td className="p-4 text-right font-medium text-main/90">{rec.amount}</td>
                                        <td className="p-4 text-center">
                                            <ChevronRight className="w-4 h-4 text-main/30 group-hover:text-main/70 transition-colors inline-block" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-main/40 italic">
                                        No transactions found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default POSOrdersIntelligenceMockUI;
