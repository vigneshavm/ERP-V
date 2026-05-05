import React from 'react';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2 } from 'lucide-react';

const ReturnedItemsManagerMockUI: React.FC = () => {
    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Returned Items Manager
                    </h1>
                    <p className="text-sm text-main/60 mt-1">Cyber-Carbon Data Grid Workspace</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all text-sm font-medium">
                        <Plus className="w-4 h-4" /> Create New
                    </button>
                </div>
            </div>

            {/* Micro-Metrics */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total Volume", value: "$42,500" },
                    { label: "Pending", value: "12 Records" },
                    { label: "Completed", value: "148 Records" },
                    { label: "Growth", value: "+14.2%" }
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <p className="text-xs text-main/50 uppercase tracking-wider font-medium">{stat.label}</p>
                        <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 rounded-xl flex gap-4 items-center border border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/40" />
                    <input 
                        type="text" 
                        placeholder="Search records..." 
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500/50 outline-none transition-all"
                    />
                </div>
                <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm ml-auto">
                    <Filter className="w-4 h-4" /> Filters
                </button>
                <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm">
                    <BarChart2 className="w-4 h-4" /> Insights
                </button>
            </div>

            {/* Data Grid */}
            <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/40 border-b border-white/10 text-main/60">
                            <tr>
                                <th className="p-4 text-left font-medium">Record ID</th>
                                <th className="p-4 text-left font-medium">Date</th>
                                <th className="p-4 text-left font-medium">Customer/Reference</th>
                                <th className="p-4 text-left font-medium">Status</th>
                                <th className="p-4 text-right font-medium">Amount</th>
                                <th className="p-4 text-center font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i} className="hover:bg-white/[0.04] transition-colors cursor-pointer group">
                                    <td className="p-4 font-medium text-blue-400 group-hover:text-blue-300">#REC-2024-{1000 + i}</td>
                                    <td className="p-4 text-main/80">Oct 24, 2024</td>
                                    <td className="p-4 text-main/90 font-medium">Global Tech Corp</td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium tracking-wide">
                                            Completed
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-medium text-main/90">$1,250.00</td>
                                    <td className="p-4 text-center">
                                        <ChevronRight className="w-4 h-4 text-main/30 group-hover:text-main/70 transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center text-xs text-main/60 mt-auto">
                    <span>Showing 1 to 6 of 24 records</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 disabled:opacity-30 transition-colors" disabled>Previous</button>
                        <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnedItemsManagerMockUI;
