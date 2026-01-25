import React, { useState } from 'react';
import { Building, MapPin, Plus, Settings2, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const BranchSettingsTab: React.FC = () => {
    const { branches } = useSelector((state: RootState) => state.tenant);
    const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id);

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Building className="w-5 h-5 text-indigo-500" /> Branch Configuration
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Manage physical locations, billing counters, and branch-specific details.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all">
                    <Plus className="w-4 h-4" /> Add Branch
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                    {branches.map((br) => (
                        <button
                            key={br.id}
                            onClick={() => setSelectedBranch(br.id)}
                            className={`w-full p-4 rounded-2xl border transition-all text-left flex flex-col gap-1 ${selectedBranch === br.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                        >
                            <p className={`text-sm font-bold ${selectedBranch === br.id ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>{br.name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {br.city}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-3 bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
                    {selectedBranch ? (
                        <div className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Branch Name</label>
                                    <input type="text" value={branches.find(b => b.id === selectedBranch)?.name || ''} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City / Location</label>
                                    <input type="text" value={branches.find(b => b.id === selectedBranch)?.city || ''} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Physical Address</label>
                                    <textarea rows={3} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Full address of the branch..."></textarea>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Settings2 className="w-4 h-4 text-slate-400" /> Billing Counters
                                    </h4>
                                    <button className="text-xs font-bold text-indigo-600 hover:underline">Manage Counters</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(branches.find(b => b.id === selectedBranch)?.counters || []).map((c: any) => (
                                        <div key={c.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div>
                                                <p className="text-sm font-bold">{c.name}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">Last Bill: #{c.lastBillNumber}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                            <Building className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium text-sm">Select a branch to view and edit its settings.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BranchSettingsTab;
