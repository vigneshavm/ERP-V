import React, { useState, useEffect } from 'react';
import { Building, MapPin, Plus, Settings2, Trash2, CheckCircle2, ChevronRight, Save } from 'lucide-react';
import api from '../../../services/api';
import { Counter } from '../../../types/tenant/core';

const BranchSettingsTab: React.FC = () => {
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>();
    const [isCreating, setIsCreating] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        api.get('/api/stores').then(res => {
            const data = Array.isArray(res.data) ? res.data : [];
            setBranches(data);
            if (data.length > 0 && !selectedBranchId) {
                setSelectedBranchId(data[0]._id);
            }
        }).catch(err => {
            console.error("Failed to load stores", err);
            setBranches([]);
        });
    }, []);

    const selectedBranch = Array.isArray(branches) ? branches.find((b: any) => b._id === selectedBranchId) : undefined;

    const handleCreateBranch = async () => {
        if (!newBranchName) return;
        try {
            const res = await api.post('/api/stores', { name: newBranchName, city: 'City', address: '' });
            setBranches([...branches, res.data]);
            setSelectedBranchId(res.data._id);
            setIsCreating(false);
            setNewBranchName('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleLocalChange = (id: string, field: string, value: string) => {
        setBranches(prev => prev.map(b => b._id === id ? { ...b, [field]: value } : b));
        setSaveSuccess(false);
    };

    const handleSaveBranch = async (branchToSave: any) => {
        if (!branchToSave || !branchToSave._id) return;
        setIsSaving(true);
        try {
            const res = await api.put(`/api/stores/${branchToSave._id}`, {
                name: branchToSave.name,
                city: branchToSave.city,
                address: branchToSave.address
            });
            if (res.data) {
                setBranches(prev => prev.map(b => b._id === branchToSave._id ? { ...b, ...res.data } : b));
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to update branch:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-280px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Branch List Sidebar */}
            <div className="w-80 shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 p-6 space-y-4 overflow-y-auto">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Locations</p>
                    </div>
                    {isCreating ? (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newBranchName} 
                                onChange={e => setNewBranchName(e.target.value)} 
                                placeholder="Branch Name" 
                                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            />
                            <button onClick={handleCreateBranch} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold">Save</button>
                            <button onClick={() => setIsCreating(false)} className="bg-slate-200 dark:bg-slate-800 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-bold">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsCreating(true)} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20">
                            <Plus className="w-4 h-4" /> Add New Branch
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {(Array.isArray(branches) ? branches : []).map((br: any) => {
                        const isActive = selectedBranchId === br._id;
                        return (
                            <button
                                key={br._id}
                                onClick={() => setSelectedBranchId(br._id)}
                                className={`w-full group relative p-4 rounded-sm transition-all duration-300 text-left border ${isActive
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
                            <div className="p-5 rounded-sm bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Billing Counters</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{selectedBranch?.counters?.length || 0}</p>
                            </div>
                            <div className="p-5 rounded-sm bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Active Status</p>
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-sm font-bold">Operational</span>
                                </div>
                            </div>
                            <div className="p-5 rounded-sm bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Region Code</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{(selectedBranch?.city || 'HUB').substring(0, 3).toUpperCase()}-{(selectedBranch?._id || selectedBranch?.id || '').substring(0, 4)}</p>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Basic Configuration</h4>
                                <button 
                                    onClick={() => handleSaveBranch(selectedBranch)}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={selectedBranch.name || ''} 
                                        onChange={e => handleLocalChange(selectedBranch._id, 'name', e.target.value)}
                                        onBlur={() => handleSaveBranch(selectedBranch)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">City / Hub</label>
                                    <input 
                                        type="text" 
                                        value={selectedBranch.city || ''} 
                                        onChange={e => handleLocalChange(selectedBranch._id, 'city', e.target.value)}
                                        onBlur={() => handleSaveBranch(selectedBranch)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Physical Site Address</label>
                                    <textarea 
                                        rows={3} 
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y" 
                                        value={selectedBranch.address || ''} 
                                        onChange={e => handleLocalChange(selectedBranch._id, 'address', e.target.value)}
                                        onBlur={() => handleSaveBranch(selectedBranch)}
                                        placeholder="Enter site street, door number, landmark, and pincode..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Billing Counters Section */}
                        <div className="space-y-6 pb-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Billing Counters Management</h4>
                                <button className="text-[11px] font-black text-primary dark:text-primary flex items-center gap-1 hover:gap-2 transition-all">
                                    MANAGE ALL <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(selectedBranch?.counters || []).map((c: Counter) => (
                                    <div key={c.id} className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800/50 rounded-sm border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-primary transition-colors">
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
