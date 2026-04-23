import React from 'react';
import { FileText, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, ArrowRight, DollarSign, Download, Printer, MoreHorizontal } from 'lucide-react';

const SalesMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-amber-500/30 overflow-hidden flex flex-col">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                            Sales & Distribution
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                                B2B Portal
                            </span>
                        </h1>
                        <p className="text-sm text-secondary mt-1 font-medium">Manage institutional invoices, estimates, and outbound logistics.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-card hover:bg-card text-main font-bold text-sm tracking-wide rounded-xl transition-all border border-default flex items-center gap-2">
                            <FileText className="w-4 h-4" /> New Estimate
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-main font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Generate Invoice
                        </button>
                    </div>
                </header>

                {/* Pipeline Stage Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Draft Estimates', val: '12', amount: '₹4.2L', icon: FileText, color: 'text-muted', bg: 'bg-slate-500/10', border: 'border-default' },
                        { label: 'Pending Approval', val: '8', amount: '₹12.5L', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                        { label: 'Awaiting Payment', val: '24', amount: '₹45.8L', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
                        { label: 'Settled (MTD)', val: '142', amount: '₹1.2Cr', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
                    ].map((stage, i) => (
                        <div key={i} className={`glass-panel backdrop-blur-md rounded-2xl p-6 border ${stage.border} relative overflow-hidden group hover:bg-card/80 transition-all cursor-pointer`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stage.bg} ${stage.color}`}>
                                    <stage.icon className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-black text-main tabular-nums">{stage.val}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{stage.label}</p>
                                <p className={`text-xl font-black tracking-tighter mt-1 ${stage.color}`}>{stage.amount}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Data Grid Area */}
                <div className="flex-1 glass-panel backdrop-blur-xl border border-default rounded-3xl flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-default flex justify-between items-center bg-card">
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                                <input 
                                    type="text" 
                                    placeholder="Search by Invoice #, Client, or Amount..." 
                                    className="w-80 bg-input border border-default rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-colors text-main placeholder:text-slate-600"
                                />
                            </div>
                            <button className="h-10 px-4 bg-card hover:bg-card border border-default rounded-xl text-xs font-bold text-main flex items-center gap-2 transition-colors">
                                <Filter className="w-4 h-4" /> Advanced Filters
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Unpaid', 'Overdue', 'Paid'].map((tab, idx) => (
                                <button key={tab} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-secondary hover:text-main'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default">Invoice ID</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default">Date & Due</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default">Client Institution</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default text-right">Amount (INR)</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default text-center">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {[
                                    { id: 'INV-2026-0891', date: 'Oct 14, 2026', due: 'Oct 28, 2026', client: 'Nexus Cybernetics Ltd.', amount: '12,45,000', status: 'Unpaid', color: 'amber' },
                                    { id: 'INV-2026-0890', date: 'Oct 12, 2026', due: 'Oct 26, 2026', client: 'Quantum Core Industries', amount: '4,50,000', status: 'Paid', color: 'emerald' },
                                    { id: 'INV-2026-0889', date: 'Sep 28, 2026', due: 'Oct 12, 2026', client: 'Starlight Medical', amount: '8,90,000', status: 'Overdue', color: 'rose' },
                                    { id: 'INV-2026-0888', date: 'Sep 25, 2026', due: 'Oct 09, 2026', client: 'Apex Heavy Engineering', amount: '2,15,500', status: 'Paid', color: 'emerald' },
                                    { id: 'INV-2026-0887', date: 'Sep 24, 2026', due: 'Oct 08, 2026', client: 'NeuroTech Solutions', amount: '6,75,000', status: 'Paid', color: 'emerald' },
                                ].map((inv, idx) => (
                                    <tr key={idx} className="hover:bg-card/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-sm font-bold text-amber-400 group-hover:underline cursor-pointer">{inv.id}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-main">{inv.date}</div>
                                            <div className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1">Due: {inv.due}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-main">{inv.client}</div>
                                            <div className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1">B2B Premium</div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="font-mono text-lg font-black tracking-tighter text-main">₹{inv.amount}</span>
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
                                                <button className="p-2 text-muted hover:text-main bg-card hover:bg-card rounded-lg transition-colors" title="Download PDF"><Download className="w-4 h-4" /></button>
                                                <button className="p-2 text-muted hover:text-main bg-card hover:bg-card rounded-lg transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                                                <button className="p-2 text-muted hover:text-amber-400 bg-card hover:bg-card rounded-lg transition-colors" title="More Actions"><MoreHorizontal className="w-4 h-4" /></button>
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
