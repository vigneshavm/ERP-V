import React from 'react';
import { Truck, ShieldAlert, CheckCircle, Package, ArrowRight, Anchor, FileText, Search, Plus, Filter, Factory, RefreshCcw } from 'lucide-react';

const PurchaseMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#060012] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[150px]" />
                <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            Procurement Node
                            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Factory className="w-3 h-3" /> Supply Chain Active
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Manage institutional vendors, purchase orders, and inbound logistics.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm tracking-wide rounded-xl transition-all border border-slate-700 flex items-center gap-2">
                            <Anchor className="w-4 h-4" /> Vendor Directory
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Protocol (PO)
                        </button>
                    </div>
                </header>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-900/50 rounded-3xl p-6 flex items-center justify-between group hover:bg-slate-800/80 transition-all cursor-default relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Inbound Goods in Transit</p>
                            <h2 className="text-4xl font-black text-white tabular-nums tracking-tighter">18 <span className="text-lg text-slate-500 font-bold tracking-normal">Shipments</span></h2>
                        </div>
                        <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl relative z-10 border border-cyan-500/20">
                            <Truck className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-900/50 rounded-3xl p-6 flex items-center justify-between group hover:bg-slate-800/80 transition-all cursor-default relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Pending Quality Control</p>
                            <h2 className="text-4xl font-black text-white tabular-nums tracking-tighter">5 <span className="text-lg text-slate-500 font-bold tracking-normal">Batches</span></h2>
                        </div>
                        <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl relative z-10 border border-indigo-500/20">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-900/50 rounded-3xl p-6 flex items-center justify-between group hover:bg-slate-800/80 transition-all cursor-default relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Received (MTD)</p>
                            <h2 className="text-4xl font-black text-white tabular-nums tracking-tighter">142 <span className="text-lg text-slate-500 font-bold tracking-normal">Nodes</span></h2>
                        </div>
                        <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl relative z-10 border border-emerald-500/20">
                            <Package className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Purchase Orders List */}
                <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-800/60 flex justify-between items-center bg-black/20">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-cyan-500" /> Active Purchase Protocols
                            </h3>
                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 transition-colors" title="Sync Status">
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search PO # or Vendor..." 
                                    className="w-80 bg-black/50 border border-slate-700/50 rounded-xl py-2 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-slate-200 placeholder:text-slate-600"
                                />
                            </div>
                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900/80 sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/60">PO Number</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/60">Supplier Entity</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/60">Date Issued</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/60 text-right">Value (INR)</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/60 text-center">Fulfillment State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {[
                                    { po: 'PO-2026-0042', supplier: 'Global Raw Materials Inc.', date: 'Oct 15, 2026', value: '45,20,000', state: 'In Transit', progress: 0, color: 'cyan' },
                                    { po: 'PO-2026-0041', supplier: 'TechComponents Asia', date: 'Oct 12, 2026', value: '12,85,500', state: 'Partial Receipt', progress: 65, color: 'indigo' },
                                    { po: 'PO-2026-0040', supplier: 'Omega Industrial Supply', date: 'Oct 10, 2026', value: '8,40,000', state: 'Pending QC', progress: 100, color: 'amber' },
                                    { po: 'PO-2026-0039', supplier: 'Starlight Medical', date: 'Oct 05, 2026', value: '3,15,000', state: 'Completed', progress: 100, color: 'emerald' },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-sm font-bold text-cyan-400 group-hover:underline">{row.po}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-200">{row.supplier}</div>
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Tier 1 Vendor</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-white">{row.date}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="font-mono text-lg font-black tracking-tighter text-white">₹{row.value}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-${row.color}-500/10 text-${row.color}-400 border-${row.color}-500/20`}>
                                                    {row.state}
                                                </span>
                                                {row.state !== 'Completed' && (
                                                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full bg-${row.color}-500 rounded-full transition-all`} style={{ width: `${row.progress || 15}%` }} />
                                                    </div>
                                                )}
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

export default PurchaseMockUI;
