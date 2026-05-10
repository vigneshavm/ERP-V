import React from 'react';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2, RotateCcw, TrendingDown, Package, ShieldAlert, Terminal, Users } from 'lucide-react';
import posReturnsIntelligenceData from '../../mockData/posReturnsIntelligenceData.json';

const POSReturnsIntelligenceMockUI: React.FC = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedTerminal, setSelectedTerminal] = React.useState('All Terminals');

    const terminals = ['All Terminals', ...new Set(posReturnsIntelligenceData.returns.map(r => r.terminal))];

    const filteredReturns = posReturnsIntelligenceData.returns.filter(ret => {
        const matchesSearch = ret.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            ret.terminal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            ret.cashier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTerminal = selectedTerminal === 'All Terminals' || ret.terminal === selectedTerminal;
        return matchesSearch && matchesTerminal;
    });

    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-rose-500/30 overflow-y-auto">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/5 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-main flex items-center gap-4">
                            Returns Intelligence
                            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Reverse Logistics
                            </span>
                        </h1>
                        <p className="text-muted font-medium tracking-wide mt-2">Monitoring refund velocity and inventory reintegration.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-default text-xs font-black uppercase tracking-widest text-muted hover:text-main hover:border-rose-500/30 transition-all">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-400 shadow-lg shadow-rose-500/20 transition-all text-xs font-black uppercase tracking-widest">
                            <BarChart2 className="w-4 h-4" /> Analyze Trends
                        </button>
                    </div>
                </header>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Return Volume', val: '₹8.2k', icon: TrendingDown, color: 'rose', trend: '+2.4%' },
                        { label: 'Return Rate', val: '1.8%', icon: ShieldAlert, color: 'orange', trend: 'Stable' },
                        { label: 'Restock Rate', val: '92%', icon: Package, color: 'emerald', trend: '+15.2%' },
                        { label: 'Audit Points', val: '24', icon: Terminal, color: 'amber', trend: 'Manual' }
                    ].map((stat, i) => (
                        <div key={i} className="glass-panel border border-default rounded-3xl p-6 group hover:border-rose-500/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 bg-${stat.color}-500/10 text-${stat.color}-400 rounded-2xl`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-black ${stat.trend.includes('+') ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10'} px-2 py-1 rounded-full`}>
                                    {stat.trend}
                                </span>
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
                            placeholder="Search return IDs, cashiers, or original receipt..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-app border border-default rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-rose-500/50 outline-none transition-all placeholder:text-muted/50"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Node Node Selection</span>
                        <div className="flex bg-app p-1 rounded-2xl border border-default">
                            {['All Nodes', 'T-1', 'T-2'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setSelectedTerminal(t === 'T-1' ? 'Terminal 1' : t === 'T-2' ? 'Terminal 2' : 'All Terminals')}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        (selectedTerminal === 'All Terminals' && t === 'All Nodes') || 
                                        (selectedTerminal === 'Terminal 1' && t === 'T-1') ||
                                        (selectedTerminal === 'Terminal 2' && t === 'T-2')
                                        ? 'bg-rose-500 text-white shadow-md' : 'text-muted hover:text-main'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Returns Grid */}
                <div className="glass-panel rounded-3xl border border-default overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-secondary border-b border-default bg-card/50">
                                    <th className="px-8 py-5 font-black">Return ID</th>
                                    <th className="px-8 py-5 font-black">Terminal Node</th>
                                    <th className="px-8 py-5 font-black">Audit Officer</th>
                                    <th className="px-8 py-5 font-black">Timestamp</th>
                                    <th className="px-8 py-5 font-black text-right">Refund Value</th>
                                    <th className="px-8 py-5 font-black text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {filteredReturns.length > 0 ? (
                                    filteredReturns.map((rec, i) => (
                                        <tr key={i} className="hover:bg-card transition-all group cursor-pointer">
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-black text-rose-400 group-hover:text-rose-300 transition-colors">
                                                    {rec.id}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
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
                                                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        Processed
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
                                                    <RotateCcw className="w-8 h-8 text-muted" />
                                                </div>
                                                <p className="text-sm font-medium text-muted">No return records found matching your search.</p>
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

export default POSReturnsIntelligenceMockUI;
