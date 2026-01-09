import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    Download,
    FileSpreadsheet,
    FileText,
    File,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Trash2,
    Archive,
    Check,
    Square,
    Package,
    Users,
    ShoppingCart,
    ArrowRight,
    DollarSign,
    BookOpen,
    Receipt,
    CreditCard,
    AlertTriangle,
    HardDrive
} from 'lucide-react';

type ExportFormat = 'XLSX' | 'CSV' | 'PDF';
type ExportStatus = 'PROCESSING' | 'READY' | 'FAILED';

interface ExportModule {
    id: string;
    label: string;
    icon: React.ElementType;
    hasDateFilter: boolean;
}

interface RecentExport {
    id: string;
    fileName: string;
    format: ExportFormat;
    size: number;
    modules: string[];
    dateRange?: { from: string; to: string };
    createdAt: string;
    createdBy: string;
    status: ExportStatus;
}

const EXPORT_MODULES: ExportModule[] = [
    { id: 'items', label: 'Items (Products)', icon: Package, hasDateFilter: false },
    { id: 'parties', label: 'Parties (Customers + Vendors)', icon: Users, hasDateFilter: false },
    { id: 'sales', label: 'Sales (Invoices)', icon: ShoppingCart, hasDateFilter: true },
    { id: 'purchase', label: 'Purchase Orders', icon: ArrowRight, hasDateFilter: true },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, hasDateFilter: true },
    { id: 'ledger', label: 'Ledger', icon: BookOpen, hasDateFilter: true },
    { id: 'gst_reports', label: 'GST Reports', icon: Receipt, hasDateFilter: true },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, hasDateFilter: true }
];

const DataExport: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);

    // Role-based access check - Only Owner, Admin, and Manager can access
    const userRole = (user?.role as string)?.toLowerCase() || '';
    const hasAccess = user?.systemRole === 'Owner' || ['admin', 'manager', 'owner'].includes(userRole);

    // Access Denied Screen for unauthorized users
    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
                <p className="text-slate-500">Only Owners, Admins, and Managers can access the Data Export module.</p>
            </div>
        );
    }

    // Selection state
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [format, setFormat] = useState<ExportFormat>('XLSX');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Options state
    const [includeHeaders, setIncludeHeaders] = useState(true);
    const [compressFile, setCompressFile] = useState(false);
    const [splitByMonth, setSplitByMonth] = useState(false);

    // Export state
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // Mock recent exports
    const [recentExports, setRecentExports] = useState<RecentExport[]>([
        { id: 'e1', fileName: 'Sales_Jan2026.xlsx', format: 'XLSX', size: 2456789, modules: ['sales'], dateRange: { from: '2026-01-01', to: '2026-01-31' }, createdAt: '2026-01-09 14:30', createdBy: 'Admin', status: 'READY' },
        { id: 'e2', fileName: 'Items_Full_Export.csv', format: 'CSV', size: 1234567, modules: ['items'], createdAt: '2026-01-08 10:15', createdBy: 'Owner', status: 'READY' },
        { id: 'e3', fileName: 'GST_Report_Q4.pdf', format: 'PDF', size: 567890, modules: ['gst_reports'], dateRange: { from: '2025-10-01', to: '2025-12-31' }, createdAt: '2026-01-05 16:45', createdBy: 'Admin', status: 'READY' },
        { id: 'e4', fileName: 'Full_Backup_Dec.xlsx', format: 'XLSX', size: 8901234, modules: ['items', 'parties', 'sales', 'purchase'], createdAt: '2025-12-31 23:59', createdBy: 'System', status: 'READY' },
        { id: 'e5', fileName: 'Ledger_2025.xlsx', format: 'XLSX', size: 0, modules: ['ledger'], dateRange: { from: '2025-01-01', to: '2025-12-31' }, createdAt: '2026-01-02 09:00', createdBy: 'Admin', status: 'FAILED' }
    ]);

    // Storage usage
    const storageUsed = recentExports.reduce((sum, e) => sum + e.size, 0);
    const storageLimit = 100 * 1024 * 1024; // 100MB
    const storagePercent = Math.round((storageUsed / storageLimit) * 100);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const toggleModule = (id: string) => {
        setSelectedModules(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const selectAllModules = () => {
        if (selectedModules.length === EXPORT_MODULES.length) {
            setSelectedModules([]);
        } else {
            setSelectedModules(EXPORT_MODULES.map(m => m.id));
        }
    };

    const hasDateFilteredModuleSelected = selectedModules.some(
        id => EXPORT_MODULES.find(m => m.id === id)?.hasDateFilter
    );

    const handleExport = () => {
        if (selectedModules.length === 0) return;

        setIsExporting(true);
        setExportProgress(0);

        const interval = setInterval(() => {
            setExportProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setIsExporting(false);

                    // Add to recent exports
                    const newExport: RecentExport = {
                        id: `e${Date.now()}`,
                        fileName: `Export_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`,
                        format,
                        size: Math.floor(Math.random() * 5000000) + 500000,
                        modules: selectedModules,
                        dateRange: hasDateFilteredModuleSelected && dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
                        createdAt: new Date().toLocaleString(),
                        createdBy: user?.fullName || 'User',
                        status: 'READY'
                    };
                    setRecentExports(prev => [newExport, ...prev]);
                    setSelectedModules([]);
                    return 100;
                }
                return p + 5;
            });
        }, 150);
    };

    const handleDelete = (id: string) => {
        setRecentExports(prev => prev.filter(e => e.id !== id));
    };

    const getStatusBadge = (status: ExportStatus) => {
        const styles: Record<ExportStatus, { bg: string; text: string; icon: React.ElementType }> = {
            PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-600', icon: Loader2 },
            READY: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
            FAILED: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircle }
        };
        const s = styles[status];
        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.text} flex items-center gap-1`}>
                <s.icon className={`w-3 h-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} /> {status}
            </span>
        );
    };

    const getFormatIcon = (fmt: ExportFormat) => {
        switch (fmt) {
            case 'XLSX': return FileSpreadsheet;
            case 'CSV': return FileText;
            case 'PDF': return File;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Data Export</h1>
                    <p className="text-slate-500 mt-1">Export your business data in multiple formats for reports and compliance.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Storage Used</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatBytes(storageUsed)} / {formatBytes(storageLimit)}</p>
                    </div>
                    <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full ${storagePercent > 80 ? 'bg-red-500' : 'bg-indigo-600'}`}
                            style={{ width: `${storagePercent}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel - Export Options */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Module Selection */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Select Modules to Export</h3>
                            <button
                                onClick={selectAllModules}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                {selectedModules.length === EXPORT_MODULES.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {EXPORT_MODULES.map((mod) => {
                                const isSelected = selectedModules.includes(mod.id);
                                return (
                                    <button
                                        key={mod.id}
                                        onClick={() => toggleModule(mod.id)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            {isSelected ? <Check className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                                            <mod.icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        </div>
                                        <p className={`text-sm font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-600 dark:text-slate-400'}`}>{mod.label}</p>
                                        {mod.hasDateFilter && <span className="text-[10px] text-slate-400">Date filter applies</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range */}
                    {hasDateFilteredModuleSelected && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-500" /> Date Range
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-3">Date filter applies to: Sales, Purchase, Expenses, Ledger, GST Reports, Transactions</p>
                        </div>
                    )}

                    {/* Export Format & Options */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Export Format</h3>
                        <div className="flex gap-4 mb-6">
                            {(['XLSX', 'CSV', 'PDF'] as ExportFormat[]).map((fmt) => {
                                const Icon = getFormatIcon(fmt);
                                return (
                                    <button
                                        key={fmt}
                                        onClick={() => setFormat(fmt)}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${format === fmt ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                    >
                                        <Icon className={`w-6 h-6 ${format === fmt ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className={`text-sm font-bold ${format === fmt ? 'text-indigo-600' : 'text-slate-500'}`}>.{fmt.toLowerCase()}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Options</h4>
                        <div className="space-y-3">
                            {[
                                { label: 'Include Headers', checked: includeHeaders, onChange: setIncludeHeaders },
                                { label: 'Compress File (ZIP)', checked: compressFile, onChange: setCompressFile },
                                { label: 'Split by Month', checked: splitByMonth, onChange: setSplitByMonth }
                            ].map((opt) => (
                                <label key={opt.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</span>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={opt.checked}
                                            onChange={() => opt.onChange(!opt.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={selectedModules.length === 0 || isExporting}
                        className="w-full px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Exporting... {exportProgress}%
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Export {selectedModules.length > 0 ? `${selectedModules.length} Module${selectedModules.length > 1 ? 's' : ''}` : 'Selected Modules'}
                            </>
                        )}
                    </button>

                    {isExporting && (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                            <div
                                className="bg-indigo-600 h-3 rounded-full transition-all"
                                style={{ width: `${exportProgress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Right Panel - Recent Exports */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" /> Recent Exports
                            </h3>
                            <span className="text-xs text-slate-500">{recentExports.length} files</span>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {recentExports.map((exp) => {
                                const FormatIcon = getFormatIcon(exp.format);
                                return (
                                    <div key={exp.id} className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exp.format === 'XLSX' ? 'bg-green-100 text-green-600' : exp.format === 'CSV' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                                <FormatIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{exp.fileName}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{exp.createdAt} • {formatBytes(exp.size)}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    {getStatusBadge(exp.status)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {exp.status === 'READY' && (
                                                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 transition-colors" title="Download">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Compliance Notice */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm text-yellow-800 dark:text-yellow-200">Audit Compliance</p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">All exports are logged with user, timestamp, and IP for GST and financial compliance.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataExport;
