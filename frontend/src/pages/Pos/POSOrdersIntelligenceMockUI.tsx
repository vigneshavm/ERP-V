import React from 'react';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2, TrendingUp, Users, Terminal, CreditCard } from 'lucide-react';
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
        <div className="min-h-screen bg-app text-main font-sans selection:bg-teal-500/30 overflow-y-auto">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-main flex items-center gap-4">
                            POS Intelligence
                            <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Live Feed
                            </span>
                        </h1>
                        <p className="text-muted font-medium tracking-wide mt-2">Real-time terminal tracking and transaction audit.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-default text-xs font-black uppercase tracking-widest text-muted hover:text-main hover:border-teal-500/30 transition-all">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-400 shadow-lg shadow-teal-500/20 transition-all text-xs font-black uppercase tracking-widest">
                            <BarChart2 className="w-4 h-4" /> Run Analytics
                        </button>
                    </div>
                </header>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Today\'s Volume', val: '₹42.8k', icon: TrendingUp, color: 'teal', trend: '+12.4%' },
                        { label: 'Avg Ticket', val: '₹1.2k', icon: CreditCard, color: 'cyan', trend: '+5.2%' },
                        { label: 'Active Terminals', val: '12/15', icon: Terminal, color: 'indigo', trend: 'Nominal' },
                        { label: 'Live Cashiers', val: '08', icon: Users, color: 'fuchsia', trend: 'Peak' }
                    ].map((stat, i) => (
                        <div key={i} className="glass-panel border border-default rounded-3xl p-6 group hover:border-teal-500/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 bg-${stat.color}-500/10 text-${stat.color}-400 rounded-2xl`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{stat.trend}</span>
                            </div>
                            <p className="text-3xl font-black text-main tracking-tighter mb-1">{stat.val}</p>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="glass-panel p-5 rounded-3xl border border-default flex flex-wrap gap-5 items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input 
                            type="text" 
                            placeholder="Search receipt IDs, cashiers, or terminals..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-app border border-default rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-teal-500/50 outline-none transition-all placeholder:text-muted/50"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Filter by Node</span>
                        <div className="flex bg-app p-1 rounded-2xl border border-default">
                            {['All Terminals', 'T-1', 'T-2'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setSelectedTerminal(t === 'T-1' ? 'Terminal 1' : t === 'T-2' ? 'Terminal 2' : 'All Terminals')}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        (selectedTerminal === 'All Terminals' && t === 'All Terminals') || 
                                        (selectedTerminal === 'Terminal 1' && t === 'T-1') ||
                                        (selectedTerminal === 'Terminal 2' && t === 'T-2')
                                        ? 'bg-teal-500 text-white shadow-md' : 'text-muted hover:text-main'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Grid */}
                <div className="glass-panel rounded-3xl border border-default overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-secondary border-b border-default bg-card/50">
                                    <th className="px-8 py-5 font-black">Receipt ID</th>
                                    <th className="px-8 py-5 font-black">Terminal Node</th>
                                    <th className="px-8 py-5 font-black">Cashier ID</th>
                                    <th className="px-8 py-5 font-black">Time Cycle</th>
                                    <th className="px-8 py-5 font-black text-right">Settlement</th>
                                    <th className="px-8 py-5 font-black text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((rec, i) => (
                                        <tr key={i} className="hover:bg-card transition-all group cursor-pointer">
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-black text-teal-400 group-hover:text-teal-300 transition-colors">
                                                    {rec.id}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                                    <span className="text-sm font-medium text-main">{rec.terminal}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-bold text-main opacity-80">{rec.cashier}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-mono text-secondary">{rec.time}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-main">{rec.amount.replace('$', '₹')}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-center">
                                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        Settled
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-card rounded-full border border-default">
                                                    <Search className="w-8 h-8 text-muted" />
                                                </div>
                                                <p className="text-sm font-medium text-muted">No transactions found matching your criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default POSOrdersIntelligenceMockUI;
