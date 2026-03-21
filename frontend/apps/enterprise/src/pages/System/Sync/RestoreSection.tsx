import React, { useState } from 'react';
import {
    RotateCcw, Upload, Download, AlertTriangle, CheckCircle, 
    XCircle, Clock, Shield, Lock, Eye, FileText, Database, 
    HardDrive, Cloud, Loader2, AlertOctagon, CheckCircle2, 
    History, Users, Calendar, ShieldCheck, ShieldAlert,
    ChevronRight, Sparkles, Filter, Search, ArrowRight, Archive
} from 'lucide-react';
import { BackupEntry, BackupStatus, BackupDestination } from "@/entities/session/model/sync";

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

    // Mock backup list
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
            incompatibleReason: 'Schema version mismatch (v2.2 vs v2.4)'
        }
    ];

    // Mock restore logs
    const restoreLogs: RestoreLog[] = [
        { id: 'rl1', initiatedBy: 'Admin User', initiatedAt: '2026-01-08 14:30', backupId: 'b3', backupDate: '2026-01-08', result: 'SUCCESS', recordsRestored: 15420, duration: '2m 35s' },
        { id: 'rl2', initiatedBy: 'Owner', initiatedAt: '2026-01-02 10:15', backupId: 'b6', backupDate: '2026-01-02', result: 'ROLLED_BACK', recordsRestored: 0, duration: '1m 12s' }
    ];

    const formatBytes = (bytes: number) => {
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
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

    const handleRestoreClick = (backup: any) => {
        if (!backup.isCompatible) return;
        setSelectedBackup(backup);
        setShowConfirmModal(true);
    };

    const handleConfirmRestore = () => {
        setShowConfirmModal(false);
        setIsRestoring(true);
        setTimeout(() => {
            setIsRestoring(false);
            setSelectedBackup(null);
        }, 3000);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Recovery Vault Header Card */}
            <div className="bg-[var(--erp-bg)] rounded-[3rem] p-10 border border-default shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -mr-40 -mt-40 blur-[100px]" />
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                            <RotateCcw className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-main italic uppercase tracking-tight">Recovery <span className="text-emerald-400">Vault</span></h2>
                            <p className="text-muted font-medium text-lg leading-relaxed max-w-md mt-1">Restore business continuity using point-in-time cryptographic snapshots.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <label className="flex-1 sm:flex-none px-8 h-16 bg-[var(--erp-card)] hover:bg-slate-700 text-main rounded-2xl font-black text-xs uppercase tracking-widest border border-default transition-all flex items-center justify-center gap-3 cursor-pointer">
                            <Upload className="w-5 h-5 text-emerald-400" /> Upload External Pack
                            <input type="file" className="hidden" accept=".backup,.zip" />
                        </label>
                    </div>
                </div>
            </div>

            {/* Warning Protocol */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-8 flex items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-amber-900 dark:text-amber-400 italic uppercase">Overwrite Protocol</h3>
                    <p className="text-amber-700 dark:text-amber-500/80 font-medium mt-1 leading-relaxed max-w-2xl">
                        A restore operation will overwrite all existing data nodes. The system will automatically generate a <span className="font-black underline italic decoration-amber-500/30 underline-offset-4 tracking-tight">Pre-Restore Shield</span> snapshot before deployment.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-3 bg-white dark:bg-[var(--erp-bg)] p-2 rounded-[2rem] border border-default dark:border-default w-fit shadow-sm">
                {[
                    { id: 'restore', label: 'Snapshot Ledger', icon: Database },
                    { id: 'logs', label: 'Recovery Audit', icon: History }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-muted hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)]'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Restore Grid */}
            {activeTab === 'restore' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {backups.map((backup) => {
                        const DestIcon = getDestinationIcon(backup.destination);
                        const isCompatible = backup.isCompatible;
                        
                        return (
                            <div 
                                key={backup.id}
                                className={`group relative bg-white dark:bg-[var(--erp-bg)] rounded-[2.5rem] border p-8 transition-all duration-500 hover:shadow-2xl ${
                                    isCompatible 
                                        ? 'border-default dark:border-default' 
                                        : 'border-red-200 dark:border-red-900/30 opacity-70'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest tabular-nums">#{backup.id.toUpperCase()}</span>
                                        <h4 className="text-2xl font-black text-main tabular-nums mt-1">{backup.date} <span className="text-muted font-medium italic text-lg ml-2">{backup.time}</span></h4>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border font-black text-[9px] uppercase tracking-widest ${
                                        isCompatible 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                            : 'bg-red-500/10 border-red-500/20 text-red-600'
                                    }`}>
                                        {isCompatible ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                        {isCompatible ? 'Validated' : 'Corrupted/Legacy'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-8 border-t border-slate-50 dark:border-default pt-8">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">Storage Payload</p>
                                        <div className="flex items-center gap-2 text-main font-black text-sm">
                                            <Archive className="w-4 h-4 text-indigo-500" /> {formatBytes(backup.size)}
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">Vault Source</p>
                                        <div className="flex items-center justify-end gap-2 text-main font-black text-sm uppercase">
                                            {backup.destination.replace('_', ' ')} <DestIcon className="w-4 h-4 text-indigo-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-2">
                                        {backup.modules.map((mod: any) => (
                                            <span key={mod} className="px-3 py-1.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-xl text-[10px] font-black text-muted uppercase tracking-widest border border-default dark:border-default">{mod}</span>
                                        ))}
                                    </div>

                                    {!isCompatible && (
                                        <p className="text-[10px] font-black text-red-500 uppercase bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20 flex items-center gap-3">
                                            <AlertTriangle className="w-4 h-4 shrink-0" /> {backup.incompatibleReason}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            onClick={() => handleRestoreClick(backup)}
                                            disabled={!isCompatible || isRestoring}
                                            className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                                                isCompatible 
                                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20' 
                                                    : 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-muted cursor-not-allowed border border-default dark:border-default'
                                            }`}
                                        >
                                            <RotateCcw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                                            {isCompatible ? 'Initiate Recovery' : 'Incompatible'}
                                        </button>
                                        <button className="w-14 h-14 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-2xl flex items-center justify-center text-muted hover:text-indigo-600 transition-all hover:scale-[1.05]">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Recovery Logs */}
            {activeTab === 'logs' && (
                <div className="bg-white dark:bg-[var(--erp-bg)] rounded-[3rem] border border-default dark:border-default overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-default dark:border-default">
                        <h3 className="text-2xl font-black text-main italic uppercase leading-none">Global <span className="text-indigo-600">Recovery Audit</span></h3>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-2 px-0.5">Persistence Reconciliation History</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/50 text-left">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted">Recovery Hash</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted">Authorized Agent</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted">Timestamp</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted text-center">Status Protocol</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted text-right">IO Throughput</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {restoreLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[var(--erp-bg-sunken)]/50 dark:hover:bg-[var(--erp-card)]/20 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-indigo-600 tabular-nums uppercase">#{log.id.toUpperCase()}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-black text-main uppercase tracking-tight">{log.initiatedBy}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-muted tabular-nums uppercase">{log.initiatedAt}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                                                log.result === 'SUCCESS' 
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                                            }`}>
                                                {log.result}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-xs font-black text-muted tabular-nums">{log.recordsRestored.toLocaleString()} OPS • {log.duration}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Confirmation Modal - Tactical Protocol */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[var(--erp-bg)] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-xl w-full p-12 border border-default dark:border-default relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16" />
                        <div className="w-20 h-20 bg-red-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-10 text-white shadow-2xl shadow-red-500/20">
                            <AlertOctagon className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-main text-center italic uppercase leading-tight mb-4">Tactical <span className="text-red-600">Reconciliation</span></h2>
                        <p className="text-muted text-center font-medium leading-relaxed mb-10 max-w-sm mx-auto">
                            Authorization required. This protocol will wipe all current enterprise states and redeploy from the selected seed.
                        </p>

                        <div className="space-y-4 mb-10 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 p-6 rounded-[2rem] border border-default dark:border-default">
                            {[
                                { icon: ShieldCheck, text: 'Auto-Snapshot Active', color: 'text-emerald-500' },
                                { icon: Lock, text: 'Network Node Lockdown', color: 'text-amber-500' },
                                { icon: Search, text: 'Structural Integrity Check', color: 'text-indigo-500' }
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-secondary dark:text-muted">
                                    <step.icon className={`w-5 h-5 ${step.color}`} /> {step.text}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 h-14 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-muted rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Abort Mission
                            </button>
                            <button
                                onClick={handleConfirmRestore}
                                className="flex-1 h-14 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-3"
                            >
                                <RotateCcw className="w-4 h-4" /> Deploy Recovery
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deployment Overlay */}
            {isRestoring && (
                <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="relative mb-12">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[80px] animate-pulse" />
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(79,70,229,0.5)]">
                            <Loader2 className="w-12 h-12 text-main animate-spin-slow" />
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black text-main italic uppercase tracking-tighter">System <span className="text-indigo-500">Rebuilding</span></h2>
                        <div className="flex items-center justify-center gap-3">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-muted font-black text-[10px] uppercase tracking-[0.5em]">Persistence Recon Solidifying</p>
                        </div>
                        <p className="text-muted font-medium text-sm max-w-sm mt-8 opacity-60">DO NOT DEAUTHORIZE POWER. CRYPTOGRAPHIC INTEGRITY VERIFICATION IN PROGRESS.</p>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes spin-slow {
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default RestoreSection;
