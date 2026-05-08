import React from 'react';
import { FileText, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, ArrowRight, DollarSign, Download, Printer, MoreHorizontal } from 'lucide-react';
import salesData from '../../mockData/salesData.json';

const IconMap: Record<string, React.ElementType> = {
    FileText, Clock, AlertCircle, CheckCircle2
};

const SalesMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-primary/30 overflow-hidden flex flex-col transition-colors">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            Sales & Distribution
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                                B2B Portal
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-bold">Manage institutional invoices, estimates, and outbound logistics.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm tracking-wide rounded-xl transition-all border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> New Estimate
                        </button>
                        <button className="h-11 px-6 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-sm shadow-primary/20 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Generate Invoice
                        </button>
                    </div>
                </header>

                {/* Pipeline Stage Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {salesData.pipelineStages.map((stage, i) => {
                        const Icon = IconMap[stage.iconName];
                        return (
                            <div key={i} className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 border ${stage.border} relative overflow-hidden group hover:border-primary/50 transition-all cursor-pointer shadow-sm`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${stage.bg} ${stage.color}`}>
                                        {Icon && <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums">{stage.val}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{stage.label}</p>
                                    <p className={`text-xl font-black tracking-tighter mt-1 ${stage.color}`}>{stage.amount}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Data Grid Area */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by Invoice #, Client, or Amount..." 
                                    className="w-80 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-bold shadow-sm"
                                />
                            </div>
                            <button className="h-10 px-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2 transition-colors shadow-sm">
                                <Filter className="w-4 h-4" /> Advanced Filters
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Unpaid', 'Overdue', 'Paid'].map((tab, idx) => (
                                <button key={tab} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${idx === 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/50 sticky top-0 z-20">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">Invoice ID</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">Date & Due</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">Client Institution</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 text-right">Amount (INR)</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 text-center">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {salesData.invoices.map((inv, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-sm font-bold text-primary group-hover:underline cursor-pointer">{inv.id}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-neutral-900 dark:text-white">{inv.date}</div>
                                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest mt-1">Due: {inv.due}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-neutral-900 dark:text-white">{inv.client}</div>
                                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest mt-1">B2B Premium</div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="font-mono text-lg font-black tracking-tighter text-neutral-900 dark:text-white">₹{inv.amount}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-${inv.color}-500/10 text-${inv.color}-400 border-${inv.color}-500/20 flex items-center gap-1.5`}>
                                                    {inv.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : inv.status === 'Overdue' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 rounded-lg transition-colors shadow-sm" title="Download PDF"><Download className="w-4 h-4" /></button>
                                                <button className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 rounded-lg transition-colors shadow-sm" title="Print"><Printer className="w-4 h-4" /></button>
                                                <button className="p-2 text-neutral-400 hover:text-primary bg-white dark:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 rounded-lg transition-colors shadow-sm" title="More Actions"><MoreHorizontal className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SalesMockUI;
