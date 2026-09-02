import React, { useState } from 'react';
import {
    RotateCcw,
    Upload,
    Download,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Shield,
    Lock,
    Eye,
    Database,
    HardDrive,
    Cloud,
    Loader2,
    AlertOctagon,
    CheckCircle2,
    History,
    Users,
    ShieldCheck,
    ShieldAlert
} from 'lucide-react';
import { BackupEntry, BackupDestination } from "../../../types/tenant/index";

interface RestoreLog {
    id: string;
    initiatedBy: string;
    initiatedAt: string;
    backupId: string;
    backupDate: string;
    result: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
    recordsRestored: number;
    duration: string;
}

interface CompatibilityCheck {
    tenantId: boolean;
    schemaVersion: boolean;
    moduleCompatibility: boolean;
    encryptionKey: boolean;
}

const RestoreSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'restore' | 'logs'>('restore');
    const [isRestoring, setIsRestoring] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<BackupEntry | null>(null);

    // Mock backup list with compatibility
    const backups: (BackupEntry & { compatibility: CompatibilityCheck; isCompatible: boolean; incompatibleReason?: string })[] = [
        {
            id: 'b1', date: '2026-01-10', time: '02:00', size: 47395430, destination: 'LOCAL', status: 'COMPLETED',
            modules: ['Invoices', 'Customers', 'Products', 'Inventory', 'Finance'],
            compatibility: { tenantId: true, schemaVersion: true, moduleCompatibility: true, encryptionKey: true },
            isCompatible: true
        },
        {
            id: 'b2', date: '2026-01-09', time: '02:00', size: 46123890, destination: 'LOCAL', status: 'COMPLETED',
            modules: ['Invoices', 'Customers', 'Products', 'Inventory'],
            compatibility: { tenantId: true, schemaVersion: true, moduleCompatibility: true, encryptionKey: true },
            isCompatible: true
        },
        {
            id: 'b3', date: '2026-01-08', time: '02:00', size: 45234567, destination: 'GOOGLE_DRIVE', status: 'COMPLETED',
            modules: ['Invoices', 'Customers', 'Products', 'Inventory'],
            compatibility: { tenantId: true, schemaVersion: true, moduleCompatibility: true, encryptionKey: true },
            isCompatible: true
        },
        {
            id: 'b4', date: '2026-01-05', time: '02:00', size: 41234567, destination: 'LOCAL', status: 'COMPLETED',
            modules: ['Invoices', 'Customers'],
            compatibility: { tenantId: true, schemaVersion: false, moduleCompatibility: true, encryptionKey: true },
            isCompatible: false,
            incompatibleReason: 'Schema version mismatch. Backup created with v2.2, current version is v2.4.'
        },
        {
            id: 'b5', date: '2026-01-01', time: '02:00', size: 38567890, destination: 'LOCAL', status: 'COMPLETED',
            modules: ['Invoices', 'Customers', 'Products'],
            compatibility: { tenantId: false, schemaVersion: true, moduleCompatibility: true, encryptionKey: true },
            isCompatible: false,
            incompatibleReason: 'Tenant ID mismatch. This backup belongs to a different tenant.'
        }
    ];

    // Mock restore logs
    const restoreLogs: RestoreLog[] = [
        { id: 'rl1', initiatedBy: 'Admin User', initiatedAt: '2026-01-08 14:30', backupId: 'b3', backupDate: '2026-01-08', result: 'SUCCESS', recordsRestored: 15420, duration: '2m 35s' },
        { id: 'rl2', initiatedBy: 'Owner', initiatedAt: '2026-01-02 10:15', backupId: 'b6', backupDate: '2026-01-02', result: 'ROLLED_BACK', recordsRestored: 0, duration: '1m 12s' },
        { id: 'rl3', initiatedBy: 'Admin User', initiatedAt: '2025-12-28 16:45', backupId: 'b8', backupDate: '2025-12-28', result: 'SUCCESS', recordsRestored: 12890, duration: '2m 10s' }
    ];

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getDestinationIcon = (dest: BackupDestination) => {
        switch (dest) {
            case 'LOCAL': return HardDrive;
            case 'GOOGLE_DRIVE': return Cloud;
            default: return Database;
        }
    };

    const handleRestoreClick = (backup: BackupEntry & { isCompatible: boolean }) => {
        if (!backup.isCompatible) return;
        setSelectedBackup(backup);
        setShowConfirmModal(true);
    };

    const handleConfirmRestore = () => {
        setShowConfirmModal(false);
        setIsRestoring(true);
        // Simulate restore
        setTimeout(() => {
            setIsRestoring(false);
            setSelectedBackup(null);
        }, 3000);
    };

    const getResultBadge = (result: RestoreLog['result']) => {
        const styles = {
            SUCCESS: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
            FAILED: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
            ROLLED_BACK: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: RotateCcw }
        };
        const s = styles[result];
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.text} flex items-center gap-1`}>
                <s.icon className="w-3 h-3" /> {result.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Restore Data</h2>
                    <p className="text-sm text-slate-500 mt-1">Recover your data from previous backups safely and securely.</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer">
                        <Upload className="w-4 h-4" /> Upload Backup File
                        <input type="file" className="hidden" accept=".backup,.zip" />
                    </label>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-sm p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 flex-shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">Important Warning</h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                        Restoring a backup will <strong>overwrite current data</strong>. A snapshot of your current data will be automatically created before proceeding.
                        This action requires explicit confirmation.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit">
                {[
                    { id: 'restore', label: 'Available Backups', icon: Database },
                    { id: 'logs', label: 'Restore Logs', icon: History }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Restore Tab */}
            {activeTab === 'restore' && (
                <div className="space-y-6">
                    {/* Compatibility Legend */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            <span className="text-slate-600 dark:text-slate-400">Compatible</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            <span className="text-slate-600 dark:text-slate-400">Incompatible</span>
                        </div>
                    </div>

                    {/* Backup List Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Date & Time</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Size</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Location</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Data Included</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Compatibility</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map((backup) => {
                                    const DestIcon = getDestinationIcon(backup.destination);
                                    const incompatibleReason = backup.incompatibleReason || '';

                                    return (
                                        <tr key={backup.id} className={`border-b border-slate-50 dark:border-slate-800/50 transition-colors ${backup.isCompatible ? 'hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'opacity-60'}`}>
                                            <td className="p-5">
                                                <div className="font-bold text-slate-900 dark:text-white">{backup.date}</div>
                                                <div className="text-xs text-slate-500">{backup.time}</div>
                                            </td>
                                            <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{formatBytes(backup.size)}</td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    <DestIcon className="w-4 h-4" /> {backup.destination.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-wrap gap-1">
                                                    {backup.modules.slice(0, 3).map((mod) => (
                                                        <span key={mod} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">{mod}</span>
                                                    ))}
                                                    {backup.modules.length > 3 && (
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">+{backup.modules.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                {backup.isCompatible ? (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600 flex items-center gap-1 w-fit">
                                                        <ShieldCheck className="w-3 h-3" /> Compatible
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600 flex items-center gap-1 w-fit">
                                                            <ShieldAlert className="w-3 h-3" /> Incompatible
                                                        </span>
                                                        <p className="text-[10px] text-red-500 mt-1 max-w-[200px]">{incompatibleReason}</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleRestoreClick(backup)}
                                                        disabled={!backup.isCompatible || isRestoring}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${backup.isCompatible ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                                    >
                                                        <RotateCcw className="w-3 h-3" /> Restore
                                                    </button>
                                                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors" title="View Details">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors" title="Download">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Audit & Restore Logs</h2>

                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Initiated By</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Date & Time</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Backup Date</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Result</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Records</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restoreLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-primary">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white">{log.initiatedBy}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{log.initiatedAt}</td>
                                        <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{log.backupDate}</td>
                                        <td className="p-5">{getResultBadge(log.result)}</td>
                                        <td className="p-5 text-sm font-bold text-slate-900 dark:text-white">{log.recordsRestored.toLocaleString()}</td>
                                        <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{log.duration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && selectedBackup && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-red-100 rounded-sm flex items-center justify-center mx-auto mb-6">
                            <AlertOctagon className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-4">Confirm Restore</h2>
                        <p className="text-slate-500 text-center mb-6">
                            You are about to restore data from <strong>{selectedBackup.date}</strong>. This action will:
                        </p>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-sm">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="text-slate-700 dark:text-slate-300">Create a snapshot of current data</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Lock className="w-5 h-5 text-yellow-500" />
                                <span className="text-slate-700 dark:text-slate-300">Lock all users during restore</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Database className="w-5 h-5 text-primary" />
                                <span className="text-slate-700 dark:text-slate-300">Overwrite current data with backup</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="w-5 h-5 text-primary" />
                                <span className="text-slate-700 dark:text-slate-300">Verify data integrity before commit</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRestore}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Confirm Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restoring Overlay */}
            {isRestoring && (
                <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-8 animate-pulse">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Restoring Data...</h2>
                    <p className="text-slate-400 text-center max-w-md">
                        Please do not close this window. All users are temporarily locked out.
                        The system will automatically recover if the restore fails.
                    </p>
                </div>
            )}
        </div>
    );
};

export default RestoreSection;
