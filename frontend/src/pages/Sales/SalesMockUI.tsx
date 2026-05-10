import React, { useState, useMemo } from 'react';
import { FileText, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, ArrowRight, DollarSign, Download, Printer, MoreHorizontal, TrendingUp, ChevronDown } from 'lucide-react';
import salesData from '../../mockData/salesData.json';

const IconMap: Record<string, React.ElementType> = {
    FileText, Clock, AlertCircle, CheckCircle2
};

const SalesMockUI: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');

    // Filter Logic
    const filteredInvoices = useMemo(() => {
        return salesData.invoices.filter(inv => {
            const matchesSearch = 
                inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.amount.toString().includes(searchTerm);
            
            const matchesTab = 
                activeTab === 'All' || 
                (activeTab === 'Unpaid' && (inv.status === 'Open' || inv.status === 'Draft')) ||
                inv.status === activeTab;

            return matchesSearch && matchesTab;
        });
    }, [searchTerm, activeTab]);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-hidden flex flex-col transition-colors animate-fade-in relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8">
                {/* Cyber Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Sales & <span className="text-amber-500">Distribution</span>
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                                B2B Portal
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Ledger Protocol Active // Secure Instance</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-bold shadow-sm">
                            <FileText className="w-4 h-4 text-amber-500" /> Draft Estimate
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all text-xs font-black uppercase tracking-widest">
                            <Plus className="w-4 h-4" /> New Invoice
                        </button>
                    </div>
                </header>

                {/* Pipeline Stage Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {salesData.pipelineStages.map((stage, i) => {
                        const Icon = IconMap[stage.iconName];
                        return (
                            <div 
                                key={i} 
                                onClick={() => setActiveTab(stage.label === 'Overdue Invoices' ? 'Overdue' : stage.label.includes('Open') ? 'Unpaid' : 'All')}
                                className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 border ${stage.border} relative overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer shadow-sm`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${stage.bg} ${stage.color}`}>
                                        {Icon && <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className="text-2xl font-display font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">{stage.val}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.2em]">{stage.label}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <p className={`text-xl font-black tracking-tighter ${stage.color}`}>{stage.amount}</p>
                                        <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-500">
                                            <TrendingUp className="w-3 h-3" /> 12%
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                    {Icon && <Icon className="w-16 h-16" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Data Grid Area */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] flex flex-col overflow-hidden shadow-sm">
                    {/* Industrial Toolbar */}
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-amber-500" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="SEARCH BY INVOICE, CLIENT, OR VALUE..." 
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black tracking-widest focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-700 shadow-inner"
                                />
                            </div>
                            <button className="h-12 px-6 w-full md:w-auto bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2 transition-all shadow-sm">
                                <Filter className="w-4 h-4" /> Logic Filters
                            </button>
                        </div>
                        <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full md:w-auto overflow-x-auto">
                            {['All', 'Unpaid', 'Overdue', 'Paid'].map((tab) => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-1 md:flex-none ${
                                        activeTab === tab 
                                        ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-sm border border-neutral-200 dark:border-neutral-800' 
                                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Unified Data Workspace */}
                    <div className="flex-1 overflow-auto custom-scrollbar min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/50 sticky top-0 z-20">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">Invoice Registry</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">Timeline Node</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">B2B Entity Path</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 text-right">Value (INR)</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 text-center">Protocol Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 text-right w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredInvoices.length > 0 ? (
                                    filteredInvoices.map((inv, idx) => (
                                        <tr key={idx} className="hover:bg-amber-500/[0.02] transition-all group animate-slide-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                        <FileText className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                    <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors cursor-pointer tracking-tighter">{inv.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-bold text-neutral-900 dark:text-white">{inv.date}</div>
                                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" /> Due: {inv.due}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform inline-block">{inv.client}</div>
                                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-amber-500"></div> Institutional Tier
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="text-xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">₹{inv.amount}</div>
                                                <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">+ GST INCLUDED</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all flex items-center gap-2 ${
                                                        inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                        inv.status === 'Overdue' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                                            inv.status === 'Paid' ? 'bg-emerald-500 shadow-[0_0_8px_currentColor]' : 
                                                            inv.status === 'Overdue' ? 'bg-rose-500 animate-pulse' : 
                                                            'bg-amber-500'
                                                        }`}></div>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-end gap-2 group-hover:translate-x-0 translate-x-4 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button className="p-2.5 text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all" title="Download Asset"><Download className="w-4 h-4" /></button>
                                                    <button className="p-2.5 text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all" title="Print Hardcopy"><Printer className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800">
                                                    <Search className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-widest">No Node Matches</h3>
                                                    <p className="text-sm text-neutral-500 mt-1">Refine your search parameters or tab selection.</p>
                                                </div>
                                                <button 
                                                    onClick={() => { setSearchTerm(''); setActiveTab('All'); }}
                                                    className="mt-4 px-6 py-2 bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all"
                                                >
                                                    Clear All Filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Industrial Footer */}
                    <div className="p-8 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                                Syncing <span className="text-amber-500 font-black">{filteredInvoices.length}</span> of <span className="text-neutral-900 dark:text-white">{salesData.invoices.length}</span> Total Assets
                            </p>
                            <div className="h-1 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${(filteredInvoices.length / salesData.invoices.length) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 disabled:opacity-30 transition-all" disabled>Prev</button>
                            <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-500 hover:border-amber-500/50 transition-all shadow-sm">Next</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SalesMockUI;
