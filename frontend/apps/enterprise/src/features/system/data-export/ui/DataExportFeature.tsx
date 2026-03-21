import React, { useState } from 'react';
import { useDataExport, ExportConfig, ExportFormat, ExportDateRange } from '../model/useDataExport';
import { toast } from 'react-toastify';

const modules = [
    { id: 'inventory', name: 'Inventory Master', icon: '📦', description: 'HSN, Price lists, and Stock levels' },
    { id: 'sales', name: 'Sales Vouchers', icon: '🛒', description: 'B2B/B2C Invoices for GST filing' },
    { id: 'purchase', name: 'Purchase Entry', icon: '📥', description: 'Inward supplies and ITC tracking' },
    { id: 'customers', name: 'Customer Database', icon: '👥', description: 'Profiles, Contact info and Ledger' },
    { id: 'suppliers', name: 'Supplier Database', icon: '🏢', description: 'Vendor info and Purchase history' },
    { id: 'ledger', name: 'General Ledger', icon: '📖', description: 'Complete accounting audit trail' }
];

export const DataExportFeature: React.FC = () => {
    const { exporting, performExport } = useDataExport();
    const [config, setConfig] = useState<ExportConfig>({
        selectedModule: 'inventory',
        format: 'xlsx',
        dateRange: { start: '', end: '' },
        includeHeaders: true,
        compressFile: false,
        splitMonthly: false
    });

    const handleExport = () => {
        performExport(config);
    };

    return (
        <div className="bg-white dark:bg-[var(--erp-bg)] rounded-xl shadow-sm border border-default dark:border-default overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-default">
                <h2 className="text-lg font-bold text-main dark:text-main uppercase tracking-tight">Select Module</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {modules.map((mod) => (
                        <button
                            key={mod.id}
                            onClick={() => setConfig({ ...config, selectedModule: mod.id })}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${config.selectedModule === mod.id
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                                    : 'border-slate-100 dark:border-default hover:border-indigo-300'
                                }`}
                        >
                            <div className="text-2xl mb-2">{mod.icon}</div>
                            <p className="font-black text-xs uppercase tracking-widest text-main dark:text-main">{mod.name}</p>
                            <p className="text-[10px] text-muted font-bold mt-1 line-clamp-2">{mod.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50">
                <h2 className="text-lg font-bold text-main dark:text-main mb-6 uppercase tracking-tight">Export Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-muted mb-2">Export Format</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['xlsx', 'csv', 'pdf'] as ExportFormat[]).map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setConfig({ ...config, format: fmt })}
                                        className={`py-2 px-3 rounded-lg border-2 font-black text-[10px] uppercase transition-all ${config.format === fmt
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                                : 'border-slate-100 dark:border-default text-muted'
                                            }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-muted mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={config.dateRange.start}
                                    onChange={(e) => setConfig({ ...config, dateRange: { ...config.dateRange, start: e.target.value } })}
                                    className="w-full px-3 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-lg text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-muted mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={config.dateRange.end}
                                    onChange={(e) => setConfig({ ...config, dateRange: { ...config.dateRange, end: e.target.value } })}
                                    className="w-full px-3 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-lg text-xs font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase text-muted mb-2">Configurations</label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={config.includeHeaders}
                                    onChange={(e) => setConfig({ ...config, includeHeaders: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-bold text-secondary dark:text-muted group-hover:text-indigo-600 transition-colors">Include column headers</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={config.compressFile}
                                    onChange={(e) => setConfig({ ...config, compressFile: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-bold text-secondary dark:text-muted group-hover:text-indigo-600 transition-colors">Compress as .zip</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={config.splitMonthly}
                                    onChange={(e) => setConfig({ ...config, splitMonthly: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-bold text-secondary dark:text-muted group-hover:text-indigo-600 transition-colors">Split data by month</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-default dark:border-default">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:bg-slate-300"
                    >
                        {exporting ? 'Processing Export...' : 'Generate and Download Export'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataExportFeature;
