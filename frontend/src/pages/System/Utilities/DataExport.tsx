import { useState } from 'react';
import Layout from "../../../components/shared/Layout/Layout";

interface ExportModule {
    id: string;
    name: string;
    icon: string;
    count: number;
}

interface RecentExport {
    id: number;
    name: string;
    format: string;
    date: string;
    size: string;
}

interface DateRange {
    from: string;
    to: string;
}

interface ExportSettings {
    includeHeaders: boolean;
    compressFile: boolean;
    splitByMonth: boolean;
}

const DataExport = () => {
    const [exportFormat, setExportFormat] = useState<string>('excel');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
    const [settings, setSettings] = useState<ExportSettings>({
        includeHeaders: true,
        compressFile: false,
        splitByMonth: false,
    });

    const modules: ExportModule[] = [
        { id: 'items', name: 'Items', icon: '📦', count: 245 },
        { id: 'parties', name: 'Parties', icon: '👥', count: 128 },
        { id: 'sales', name: 'Sales', icon: '💰', count: 1543 },
        { id: 'purchase', name: 'Purchase', icon: '🛒', count: 892 },
        { id: 'expenses', name: 'Expenses', icon: '💸', count: 456 },
        { id: 'ledger', name: 'Ledger', icon: '📊', count: 2341 },
        { id: 'gst', name: 'GST Reports', icon: '📋', count: 234 },
        { id: 'transactions', name: 'Transactions', icon: '💳', count: 3421 },
    ];

    const recentExports: RecentExport[] = [
        { id: 1, name: 'sales_data_2024.xlsx', format: 'Excel', date: '2024-12-07', size: '2.4 MB' },
        { id: 2, name: 'inventory_report.csv', format: 'CSV', date: '2024-12-06', size: '856 KB' },
        { id: 3, name: 'gst_report_nov.pdf', format: 'PDF', date: '2024-12-05', size: '1.2 MB' },
        { id: 4, name: 'customer_list.xlsx', format: 'Excel', date: '2024-12-04', size: '445 KB' },
    ];

    const toggleModule = (moduleId: string) => {
        setSelectedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const toggleSetting = (setting: keyof ExportSettings) => {
        setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    };

    const handleExport = () => {
        alert(`Exporting ${selectedModules.length} modules as ${exportFormat.toUpperCase()}`);
    };

    const storageUsed = 45.8;
    const storageTotal = 100;
    const storagePercentage = (storageUsed / storageTotal) * 100;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-main mb-2">Data Export</h1>
                    <p className="text-secondary">Export your business data in various formats</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Export Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Export Format Selector */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-main mb-4">Export Format</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {['excel', 'csv', 'pdf'].map((format) => (
                                    <button
                                        key={format}
                                        type="button"
                                        onClick={() => setExportFormat(format)}
                                        className={`p-4 border-2 rounded-xl transition-all duration-200 ${exportFormat === format
                                            ? 'border-primary bg-primary-soft shadow-sm shadow-primary/10'
                                            : 'border-default bg-card hover:border-primary/30'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">
                                                {format === 'excel' && '📊'}
                                                {format === 'csv' && '📄'}
                                                {format === 'pdf' && '📕'}
                                            </div>
                                            <p className="text-sm font-medium text-main uppercase">{format}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Module Selection */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-main">Select Modules</h3>
                                <button
                                    type="button"
                                    onClick={() => setSelectedModules(selectedModules.length === modules.length ? [] : modules.map(m => m.id))}
                                    className="text-sm text-primary hover:text-primary-hover font-bold transition-colors"
                                >
                                    {selectedModules.length === modules.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {modules.map((module) => (
                                    <label
                                        key={module.id}
                                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${selectedModules.includes(module.id)
                                            ? 'border-primary bg-primary-soft shadow-sm shadow-primary/10'
                                            : 'border-default bg-card hover:border-primary/30'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedModules.includes(module.id)}
                                            onChange={() => toggleModule(module.id)}
                                            className="w-5 h-5 text-primary rounded border-default focus:ring-primary"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-main">{module.icon} {module.name}</p>
                                                <span className="text-xs text-muted font-medium">{module.count}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Date Range Selector */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-main mb-4">Date Range</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="dateFrom" className="block text-sm font-medium text-secondary mb-2">
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        id="dateFrom"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="w-full px-4 py-3 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-main transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dateTo" className="block text-sm font-medium text-secondary mb-2">
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        id="dateTo"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-4 py-3 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-main transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Export Settings */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-main mb-4">Export Settings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-main">Include Headers</p>
                                        <p className="text-xs text-muted">Add column headers to export</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.includeHeaders}
                                            onChange={() => toggleSetting('includeHeaders')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-main">Compress File</p>
                                        <p className="text-xs text-muted">Create ZIP archive</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.compressFile}
                                            onChange={() => toggleSetting('compressFile')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-main">Split by Month</p>
                                        <p className="text-xs text-muted">Create separate files per month</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.splitByMonth}
                                            onChange={() => toggleSetting('splitByMonth')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={selectedModules.length === 0}
                            className="btn-interactive w-full px-6 py-4 bg-primary text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-primary/25"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Export {selectedModules.length} Module{selectedModules.length !== 1 ? 's' : ''}</span>
                        </button>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Storage Usage */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-main mb-4">Storage Usage</h3>
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-secondary">Used</span>
                                    <span className="text-sm font-medium text-main">{storageUsed} MB / {storageTotal} MB</span>
                                </div>
                                <div className="w-full bg-surface rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-primary to-purple-600 h-3 rounded-full transition-all"
                                        style={{ width: `${storagePercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs text-muted mt-2">{(storageTotal - storageUsed).toFixed(1)} MB remaining</p>
                        </div>

                        {/* Recent Exports */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-main mb-4">Recent Exports</h3>
                            <div className="space-y-3">
                                {recentExports.map((exp) => (
                                    <div key={exp.id} className="p-3 bg-surface rounded-lg hover:bg-surface-hover transition">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-main truncate">{exp.name}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-primary-soft text-primary rounded">
                                                        {exp.format}
                                                    </span>
                                                    <span className="text-xs text-muted">{exp.size}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="ml-2 p-1 text-primary hover:text-primary-hover transition-colors"
                                                title="Download"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted">{exp.date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DataExport;
