import React from 'react';
import { Upload, Loader2, CheckCircle, HardDrive, AlertTriangle, Download, Archive, Trash2, RotateCw, Eye } from 'lucide-react';
import { BackupConfig, BackupStatus, BackupDestination } from "@/types/tenant";

interface BackupSectionProps {
    backupConfig: BackupConfig;
    isBackingUp: boolean;
    onBackupNow: () => void;
    backupSettings: any;
    setBackupSettings: React.Dispatch<React.SetStateAction<any>>;
    getBackupStatusBadge: (status: BackupStatus) => React.ReactNode;
    formatBytes: (bytes: number) => string;
    getDestinationIcon: (dest: BackupDestination) => any;
    backupModuleIcons: Record<string, any>;
}

const BackupSection: React.FC<BackupSectionProps> = ({
    backupConfig, isBackingUp, onBackupNow, backupSettings, setBackupSettings,
    getBackupStatusBadge, formatBytes, getDestinationIcon, backupModuleIcons
}) => {
    const storagePercent = Math.round((backupConfig.storage.used / backupConfig.storage.total) * 100);
    const isStorageWarning = storagePercent >= backupConfig.storage.warningThreshold;

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Backup Management</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBackupNow}
                        disabled={isBackingUp}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isBackingUp ? 'Backing Up...' : 'Create Backup Now'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Backup</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{backupConfig.lastBackup?.date} at {backupConfig.lastBackup?.time}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Size</span>
                        <span className="font-bold">{formatBytes(backupConfig.lastBackup?.size || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-slate-500">Status</span>
                        {getBackupStatusBadge(backupConfig.lastBackup?.status || 'COMPLETED')}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isStorageWarning ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Storage Usage</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{storagePercent}% Used</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-4">
                        <div
                            className={`h-3 rounded-full transition-all ${isStorageWarning ? 'bg-yellow-500' : 'bg-indigo-600'}`}
                            style={{ width: `${storagePercent}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{formatBytes(backupConfig.storage.used)} used</span>
                        <span className="font-bold">{formatBytes(backupConfig.storage.total)} total</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quick Actions</p>
                    <button className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                        <Download className="w-4 h-4" /> Download Latest Backup
                    </button>
                    <button className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                        <Archive className="w-4 h-4" /> View All Backups
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Automatic Backups</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Enable Daily Backups</p>
                            <p className="text-sm text-slate-500">Automatically backup data every day</p>
                        </div>
                        <button
                            onClick={() => setBackupSettings((s: any) => ({ ...s, autoBackupEnabled: !s.autoBackupEnabled }))}
                            className={`w-14 h-8 rounded-full transition-all ${backupSettings.autoBackupEnabled ? 'bg-indigo-600' : 'bg-slate-200'} p-1`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${backupSettings.autoBackupEnabled ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                    {/* Add other auto backup settings if needed */}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">What to Backup</h3>
                    {Object.entries(backupSettings.modulesToBackup).map(([key, value]) => {
                        const Icon = backupModuleIcons[key] || HardDrive;
                        return (
                            <div key={key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white capitalize">{key}</span>
                                </div>
                                <button
                                    onClick={() => setBackupSettings((s: any) => ({ ...s, modulesToBackup: { ...s.modulesToBackup, [key]: !value } }))}
                                    className={`w-14 h-8 rounded-full transition-all ${value ? 'bg-indigo-600' : 'bg-slate-200'} p-1`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Backup History</h3>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Time</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Size</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Location</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backupConfig.history.map((backup) => {
                            const DestIcon = getDestinationIcon(backup.destination);
                            return (
                                <tr key={backup.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-5 font-bold text-slate-900 dark:text-white">{backup.date}</td>
                                    <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{backup.time}</td>
                                    <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{backup.size > 0 ? formatBytes(backup.size) : '-'}</td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                            <DestIcon className="w-4 h-4" /> {backup.destination.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="p-5">{getBackupStatusBadge(backup.status)}</td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            {backup.status === 'COMPLETED' && (
                                                <>
                                                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors" title="Download">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-green-600 transition-colors" title="Restore">
                                                        <RotateCw className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors" title="View Log">
                                                <Eye className="w-4 h-4" />
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
    );
};

export default BackupSection;
