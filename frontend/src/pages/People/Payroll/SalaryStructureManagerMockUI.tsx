import React from 'react';
import { Filter, Search, Plus, Download, ChevronRight, Users } from 'lucide-react';

const SalaryStructureManagerMockUI: React.FC = () => {
    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Salary Structures
                    </h1>
                    <p className="text-sm text-main/60 mt-1">HR & Payroll Data Grid</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm">
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-sm font-medium">
                        <Plus className="w-4 h-4" /> Create Record
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 rounded-xl flex gap-4 items-center border border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/40" />
                    <input 
                        type="text" 
                        placeholder="Search employees or records..." 
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-purple-500/50 outline-none transition-all"
                    />
                </div>
                <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm ml-auto">
                    <Filter className="w-4 h-4" /> Filter by Dept
                </button>
            </div>

            {/* Data Grid */}
            <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/40 border-b border-white/10 text-main/60">
                            <tr>
                                <th className="p-4 text-left font-medium">ID</th>
                                <th className="p-4 text-left font-medium">Name</th>
                                <th className="p-4 text-left font-medium">Department</th>
                                <th className="p-4 text-left font-medium">Status</th>
                                <th className="p-4 text-right font-medium">Amount/Value</th>
                                <th className="p-4 text-center font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i} className="hover:bg-white/[0.04] transition-colors cursor-pointer group">
                                    <td className="p-4 font-medium text-purple-400 group-hover:text-purple-300">EMP-00${i}</td>
                                    <td className="p-4 text-main/90 font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            Employee ${i}
                                        </div>
                                    </td>
                                    <td className="p-4 text-main/80">Engineering</td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium tracking-wide">
                                            Active
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-medium text-main/90">$${i},000.00</td>
                                    <td className="p-4 text-center">
                                        <ChevronRight className="w-4 h-4 text-main/30 group-hover:text-main/70 transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalaryStructureManagerMockUI;
