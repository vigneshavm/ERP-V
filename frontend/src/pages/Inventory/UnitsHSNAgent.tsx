import React, { useState } from 'react';
import { Hash, Search, Plus, Edit, Trash2, Download } from 'lucide-react';

const UNITS = [
    { id: 'U001', name: 'PCS', fullName: 'Pieces', type: 'Count', hsn: '' },
    { id: 'U002', name: 'MTR', fullName: 'Metres', type: 'Length', hsn: '' },
    { id: 'U003', name: 'KG', fullName: 'Kilogram', type: 'Weight', hsn: '' },
    { id: 'U004', name: 'BOX', fullName: 'Box', type: 'Pack', hsn: '' },
    { id: 'U005', name: 'SET', fullName: 'Set', type: 'Pack', hsn: '' },
];

const HSN_CODES = [
    { code: '5208', description: 'Woven fabrics of cotton', gst: '5%', items: 24 },
    { code: '6109', description: 'T-shirts, singlets and other vests', gst: '12%', items: 18 },
    { code: '6204', description: 'Women\'s suits, ensembles, jackets', gst: '12%', items: 31 },
    { code: '6211', description: 'Track suits, ski suits and swimwear', gst: '5%', items: 9 },
    { code: '5515', description: 'Woven fabrics of synthetic staple fibres', gst: '12%', items: 14 },
];

const UnitsHSNAgent: React.FC = () => {
    const [tab, setTab] = useState<'units' | 'hsn'>('units');
    const [search, setSearch] = useState('');

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center"><Hash className="w-5 h-5 text-white" /></div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Units & HSN Agent</h1>
                        <p className="text-xs text-slate-500">Manage measurement units and GST HSN codes</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">
                        <Plus className="w-4 h-4" /> Add {tab === 'units' ? 'Unit' : 'HSN Code'}
                    </button>
                </div>
            </div>

            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
                {(['units', 'hsn'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${tab === t ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {t === 'units' ? 'Units of Measure' : 'HSN Codes'}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={tab === 'units' ? 'Search units...' : 'Search HSN code or description...'}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                </div>

                {tab === 'units' ? (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>{['Code', 'Full Name', 'Type', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {UNITS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.fullName.toLowerCase().includes(search.toLowerCase())).map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-3 font-black text-teal-600">{u.name}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{u.fullName}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">{u.type}</span></td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <button className="p-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-600 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                        <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>{['HSN Code', 'Description', 'GST Rate', 'Mapped Items', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {HSN_CODES.filter(h => h.code.includes(search) || h.description.toLowerCase().includes(search.toLowerCase())).map(h => (
                                <tr key={h.code} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-3 font-black text-teal-600">{h.code}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{h.description}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-black">{h.gst}</span></td>
                                    <td className="px-4 py-3 text-sm font-bold text-slate-500">{h.items} items</td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <button className="p-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-600 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UnitsHSNAgent;
