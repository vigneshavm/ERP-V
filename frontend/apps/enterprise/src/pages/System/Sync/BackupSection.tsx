import React from 'react';
import { AppView } from '@repo/shared-kernel';
import { 
    Upload, Loader2, CheckCircle, HardDrive, AlertTriangle, 
    Download, Archive, Trash2, RotateCw, Eye, ShieldCheck, 
    Database, Clock, ChevronRight, Lock, History, Settings 
} from 'lucide-react';
import { BackupConfig, BackupStatus, BackupDestination } from "@/entities/session/model/sync";

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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Vault Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Last Backup Status */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <History className="w-16 h-16" />
                    </div>
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
                            <CheckCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vault Integrity</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Optimal</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-500 uppercase tracking-widest">Last Snapshot</span>
                            <span className="font-black text-slate-900 dark:text-white">{backupConfig.lastBackup?.date} • {backupConfig.lastBackup?.time}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-500 uppercase tracking-widest">Payload Size</span>
                            <span className="font-black text-slate-900 dark:text-white tabular-nums">{formatBytes(backupConfig.lastBackup?.size || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Storage Pulse */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm group">
                    <div className="flex items-center gap-5 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                            isStorageWarning 
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-amber-500/10' 
                                : 'bg-indigo-600 text-white shadow-indigo-600/20'
                        }`}>
                            <HardDrive className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Storage Allocation</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic">{storagePercent}% <span className="text-slate-500">of capacity</span></p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                        <div
                            className={`h-full transition-all duration-1000 ${isStorageWarning ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${storagePercent}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{formatBytes(backupConfig.storage.used)} Used</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{formatBytes(backupConfig.storage.total)} Total</span>
                    </div>
                </div>

                {/* Tactical Actions */}
                <div className="space-y-4">
                    <button
                        onClick={onBackupNow}
                        disabled={isBackingUp}
                        className="w-full h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 group"
                    >
                        {isBackingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
                        {isBackingUp ? 'Finalizing Encryption...' : 'Create Instant Snapshot'}
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:scale-[1.02]" title="Download Recovery Payload">
                            <Download className="w-6 h-6" />
                        </button>
                        <button className="h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:scale-[1.02]" title="Manage Archives">
                            <Archive className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Smart Configuration Hub */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Automation Rules */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Automation <span className="text-indigo-600">Protocol</span></h3>
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
                            <Settings className="w-6 h-6" />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                        <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Scheduled Snapshotting</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Daily Automated Cycle at {backupSettings.scheduleTime}</p>
                        </div>
                        <button
                            onClick={() => setBackupSettings((s: any) => ({ ...s, autoBackupEnabled: !s.autoBackupEnabled }))}
                            className={`w-14 h-8 rounded-full transition-all ${backupSettings.autoBackupEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'} p-1 shadow-inner`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${backupSettings.autoBackupEnabled ? 'translate-x-6' : ''} shadow-sm`} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                            <Lock className="w-3.5 h-3.5" /> Security Parameters
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Retention Policy</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{backupSettings.retentionDays} Days</p>
                            </div>
                            <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{backupSettings.destination === 'LOCAL' ? 'On-Site Storage' : 'Cloud Vault'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Selection - Vault Perimeter */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-8">Asset <span className="text-indigo-600">Perimeter</span></h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(backupSettings.modulesToBackup).map(([key, value]) => {
                            const Icon = backupModuleIcons[key] || Database;
                            const isIncluded = value;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setBackupSettings((s: any) => ({ ...s, modulesToBackup: { ...s.modulesToBackup, [key]: !value } }))}
                                    className={`flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 ${isIncluded ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900/50 shadow-md' : 'bg-slate-50/50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isIncluded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isIncluded ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{key}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isIncluded ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700'}`}>
                                        {Boolean(isIncluded) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Premium Archive Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase">Audit <span className="text-indigo-600">Archives</span></h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cryptographic History Ledger</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-left">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sequence ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payload</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vault Location</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Protocol Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {backupConfig.history.map((backup: any) => {
                                const DestIcon = getDestinationIcon(backup.destination);
                                return (
                                    <tr key={backup.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-indigo-600 tabular-nums uppercase">#{backup.id.toUpperCase()}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{backup.date}</span>
                                                <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase">{backup.time}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <Archive className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-black text-slate-600 dark:text-slate-400 tabular-nums">{backup.size > 0 ? formatBytes(backup.size) : '0 B'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                                    <DestIcon className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{backup.destination.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center tabular-nums">
                                            {getBackupStatusBadge(backup.status)}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {backup.status === 'COMPLETED' && (
                                                    <button className="p-3 bg-white dark:bg-slate-800 rounded-xl hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all font-bold text-xs" title="Force Recovery">
                                                        <RotateCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button className="p-3 bg-white dark:bg-slate-800 rounded-xl hover:text-slate-900 shadow-sm border border-slate-100 dark:border-slate-700 transition-all font-bold text-xs" title="Open Audit Log">
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
        </div>
    );
};

export default BackupSection;
