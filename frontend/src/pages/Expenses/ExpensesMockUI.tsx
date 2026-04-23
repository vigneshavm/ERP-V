import React from 'react';
import { Receipt, Plus, Search, Filter, TrendingUp, AlertTriangle, CheckCircle2, Wallet, Coffee, Car, Wrench, MoreHorizontal, Download } from 'lucide-react';

const ExpensesMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#04060f] text-slate-200 font-sans selection:bg-violet-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[20%] w-[55%] h-[55%] bg-violet-700/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[5%] w-[35%] h-[35%] bg-fuchsia-700/10 rounded-full blur-[130px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            Expense Intelligence
                            <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Wallet className="w-3 h-3" /> FY 2026-27
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Track, categorize, and audit all business expenditures in real-time.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm tracking-wide rounded-xl transition-all border border-slate-700 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Log Expense
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total This Month', val: '₹8.4L', sub: '+12% vs last month', icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
                        { label: 'Recurring Costs', val: '₹2.1L', sub: 'Auto-debited', icon: Receipt, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
                        { label: 'Pending Approvals', val: '17', sub: '₹3.6L awaiting', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                        { label: 'Settled (MTD)', val: '204', sub: '₹12.8L cleared', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                    ].map((card, i) => (
                        <div key={i} className={`bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border ${card.border} group hover:bg-slate-800/80 transition-all cursor-pointer`}>
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-black tracking-tighter mt-1 text-white">{card.val}</p>
                            <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-6 flex-1">
                    <div className="w-60 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 flex flex-col gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">By Category</h3>
                        {[
                            { cat: 'Operations', pct: 38, icon: Wrench, color: 'bg-violet-500' },
                            { cat: 'Travel & Fleet', pct: 22, icon: Car, color: 'bg-cyan-500' },
                            { cat: 'Office & Admin', pct: 17, icon: Coffee, color: 'bg-amber-500' },
                            { cat: 'Vendor Payments', pct: 13, icon: Receipt, color: 'bg-rose-500' },
                            { cat: 'Miscellaneous', pct: 10, icon: Wallet, color: 'bg-slate-500' },
                        ].map((c, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <c.icon className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-300">{c.cat}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-400">{c.pct}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-800/60 flex justify-between items-center bg-black/20">
                            <div className="flex gap-4">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input type="text" placeholder="Search expense, vendor..." className="w-72 bg-black/50 border border-slate-700/50 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-violet-500 transition-colors text-slate-200 placeholder:text-slate-600" />
                                </div>
                                <button className="h-10 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> Filter
                                </button>
                            </div>
                            <div className="flex gap-2">
                                {['All', 'Pending', 'Approved', 'Rejected'].map((tab, idx) => (
                                    <button key={tab} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${idx === 0 ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900/80 sticky top-0 z-20 backdrop-blur-md">
                                    <tr>
                                        {['Expense ID', 'Description', 'Category', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                                            <th key={h} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/60 ${h === 'Amount' || h === 'Actions' ? 'text-right' : h === 'Status' ? 'text-center' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {[
                                        { id: 'EXP-2026-0412', desc: 'Fleet maintenance & servicing', cat: 'Travel & Fleet', date: 'Oct 18, 2026', amount: '45,800', status: 'Approved', color: 'emerald' },
                                        { id: 'EXP-2026-0411', desc: 'Cloud infrastructure (AWS)', cat: 'Operations', date: 'Oct 15, 2026', amount: '1,24,000', status: 'Pending', color: 'amber' },
                                        { id: 'EXP-2026-0410', desc: 'Office supplies & stationery', cat: 'Office & Admin', date: 'Oct 14, 2026', amount: '8,500', status: 'Approved', color: 'emerald' },
                                        { id: 'EXP-2026-0409', desc: 'Marketing event — client dinner', cat: 'Miscellaneous', date: 'Oct 12, 2026', amount: '22,400', status: 'Pending', color: 'amber' },
                                        { id: 'EXP-2026-0408', desc: 'Diesel — delivery vehicles', cat: 'Travel & Fleet', date: 'Oct 10, 2026', amount: '18,200', status: 'Rejected', color: 'rose' },
                                    ].map((exp, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-5"><span className="font-mono text-sm font-bold text-violet-400 group-hover:underline cursor-pointer">{exp.id}</span></td>
                                            <td className="px-8 py-5"><div className="text-sm font-bold text-slate-200">{exp.desc}</div></td>
                                            <td className="px-8 py-5"><span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">{exp.cat}</span></td>
                                            <td className="px-8 py-5"><div className="text-sm font-bold text-white">{exp.date}</div></td>
                                            <td className="px-8 py-5 text-right"><span className="font-mono text-base font-black tracking-tighter text-white">₹{exp.amount}</span></td>
                                            <td className="px-8 py-5"><div className="flex justify-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-${exp.color}-500/10 text-${exp.color}-400 border-${exp.color}-500/20`}>{exp.status}</span></div></td>
                                            <td className="px-8 py-5"><div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-2 text-slate-400 hover:text-violet-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExpensesMockUI;
