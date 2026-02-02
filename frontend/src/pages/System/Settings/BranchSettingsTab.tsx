import React, { useState } from 'react';
import { Building, MapPin, Plus, Settings2, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from "../../../redux/store";
import { BranchConfig, Counter } from '../../../types/tenant/core';

const BranchSettingsTab: React.FC = () => {
    const { branches } = useSelector((state: RootState) => state.tenant || { branches: [] });
    // Use optional chaining carefully
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(branches?.[0]?.id);

    const selectedBranch = (branches || []).find((b: BranchConfig) => b.id === selectedBranchId);

    return (
        <div className="flex h-[calc(100vh-280px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Branch List Sidebar */}
            <div className="w-80 shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 p-6 space-y-4 overflow-y-auto">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Locations</p>
                    </div>
                    <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20">
                        <Plus className="w-4 h-4" /> Add New Branch
                    </button>
                </div>

                <div className="space-y-3">
                    {branches.map((br: BranchConfig) => {
                        const isActive = selectedBranchId === br.id;
                        return (
                            <button
                                key={br.id}
                                onClick={() => setSelectedBranchId(br.id)}
                                className={`w-full group relative p-4 rounded-2xl transition-all duration-300 text-left border ${isActive
                                    ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500 shadow-xl shadow-indigo-100/50 dark:shadow-none translate-x-1'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-bold truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{br.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3" /> {br.city}
                                        </p>
                                    </div>
                                    {isActive && <div className="w-1.5 h-6 bg-indigo-600 rounded-full absolute -right-0.5" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Branch Details Area */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
                {selectedBranch ? (
                    <div className="p-8 space-y-10">
                        {/* Header Stats */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Billing Counters</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{selectedBranch?.counters?.length || 0}</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Active Status</p>
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-sm font-bold">Operational</span>
                                </div>
                            </div>
                            <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Region Code</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedBranch?.city?.substring(0, 3).toUpperCase()}-{(selectedBranch?.id || '').substring(0, 4)}</p>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Basic Configuration</h4>
                            <div className="grid md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                                    <input type="text" defaultValue={selectedBranch.name} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">City / Hub</label>
                                    <input type="text" defaultValue={selectedBranch.city} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Physical Site Address</label>
                                    <textarea rows={2} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" defaultValue={selectedBranch?.address}></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Billing Counters Section */}
                        <div className="space-y-6 pb-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Billing Counters Management</h4>
                                <button className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:gap-2 transition-all">
                                    MANAGE ALL <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(selectedBranch?.counters || []).map((c: Counter) => (
                                    <div key={c.id} className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Settings2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-slate-800 dark:text-white">{c.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Last: #{c.lastBillNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                                                <Settings2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50/20 dark:bg-slate-900/40">
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <Building className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h4 className="text-lg font-extrabold text-slate-800 dark:text-white">No Branch Selected</h4>
                        <p className="text-slate-500 text-sm mt-1">Please select a location from the sidebar to modify.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchSettingsTab;
