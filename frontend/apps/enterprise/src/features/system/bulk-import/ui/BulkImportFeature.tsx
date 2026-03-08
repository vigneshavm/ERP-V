import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useBulkImport } from '../model/useBulkImport';

export const BulkImportFeature: React.FC = () => {
    const { mappingData, processFile, importing, setImporting } = useBulkImport();
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            await processFile(file);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                            <Upload className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ingestion Engine</h2>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60 ml-1">Automated validation for massive document datasets</p>
                </div>
                <button className="px-6 py-3 bg-white border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-50 transition-all active:scale-95">
                    <Download className="w-4 h-4 text-emerald-600" /> Download Schema
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    {/* Upload Zone */}
                    <div 
                        className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center group cursor-pointer hover:border-emerald-500 transition-all relative overflow-hidden"
                        onClick={() => document.getElementById('bulk-upload-input')?.click()}
                    >
                         <input id="bulk-upload-input" type="file" className="hidden" accept=".xlsx,.csv" onChange={handleFileChange} />
                         <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform relative">
                            <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                         </div>
                         <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                             {fileName || 'Supply Spreadsheet Protocol'}
                         </h3>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-60">Excel or CSV only • Schema enforced</p>
                    </div>

                    {/* Preview Table */}
                    {mappingData.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Heuristic Ingestion Preview</span>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider">{mappingData.length} records detected</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/40">
                                        <tr>
                                            {['Index', 'Status', 'Entity Name', 'Price Pattern', 'Validation'].map(h => (
                                                <th key={h} className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {mappingData.slice(0, 5).map((row) => (
                                            <tr key={row.row} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-8 py-5 text-[10px] font-black text-slate-400">#{row.row.toString().padStart(3, '0')}</td>
                                                <td className="px-8 py-5">
                                                    <div className={`w-2 h-2 rounded-full ${row.status === 'valid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500'}`} />
                                                </td>
                                                <td className="px-8 py-5 text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{row.name}</td>
                                                <td className="px-8 py-5 text-[10px] font-bold text-slate-500 tracking-tighter uppercase italic">Verified Logic</td>
                                                <td className="px-8 py-5">
                                                    {row.status === 'valid' ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-rose-500">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-black uppercase">Validation Error</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                     <div className="bg-emerald-600 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <FileSpreadsheet className="absolute -top-12 -right-12 w-48 h-48 opacity-10 group-hover:rotate-6 transition-all duration-1000" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200 mb-8 italic">Commitment Protocol</h4>
                        
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-100/60 transition-colors">
                                <span>Batch Integrity</span>
                                <span className="text-white">Active</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-100/60">
                                <span>Collision Protection</span>
                                <span className="text-white">Enabled</span>
                            </div>
                        </div>

                        <button 
                            className="w-full mt-12 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 shadow-xl active:scale-95 transition-all disabled:opacity-30"
                            disabled={mappingData.length === 0}
                        >
                            Execute Commitment
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-indigo-500/30">
                        <div className="flex items-center gap-3 mb-6">
                            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                            <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">System Status</h5>
                        </div>
                        <ul className="space-y-4">
                             {[
                                { label: 'Auth Token', status: 'Secured' },
                                { label: 'DB Latency', status: '8ms' },
                                { label: 'Schema Version', status: 'v2.4' }
                            ].map((s, i) => (
                                <li key={i} className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{s.label}</span>
                                    <span className="text-[9px] font-bold text-slate-900 dark:text-white uppercase">{s.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
