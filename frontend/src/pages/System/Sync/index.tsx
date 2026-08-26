import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/redux/store';
import { setActiveTab } from '@/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import {
    Smartphone, Monitor, Laptop, Tablet, RefreshCw, CheckCircle, AlertCircle, Clock,
    Settings2, AlertTriangle, HardDrive, Database, QrCode, WifiOff, Loader2, Calendar, Archive, Cloud, XCircle,
    Cpu, Zap, Activity
} from 'lucide-react';
import { DeviceRegistryEntry, SyncConfig, DeviceStatus, SyncStatus, BackupConfig, BackupStatus, BackupDestination } from "@/types/tenant";

// Components
import DevicesSection from './DevicesSection';
import BackupSection from './BackupSection';
import SyncSettingsSection from './SyncSettingsSection';
import ConflictsSection from './ConflictsSection';
import RestoreSection from './RestoreSection';

type SyncSection = 'device' | 'add' | 'settings' | 'conflicts' | 'backup' | 'restore' | 'devices';

const Sync: React.FC = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { activeTab } = useSelector((state: RootState) => state.ui);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || (user?.role as string).toLowerCase() === 'admin';

    const [localSection, setLocalSection] = useState<SyncSection | null>(null);
    const activeSection: SyncSection = localSection || (() => {
        switch (activeTab) {
            case 'GROW_SYNC_DEVICE': return 'device';
            case 'GROW_SYNC_CLOUD': return 'device';
            case 'GROW_BACKUP': return 'backup';
            case 'GROW_RESTORE_DATA': return 'restore';
            case 'GROW_SYNC_LOGS': return 'settings';
            default: return 'device';
        }
    })();

    const [isSyncing, setIsSyncing] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    const handleSectionChange = (newSection: SyncSection) => {
        const tabMap: Record<string, string> = {
            device: 'GROW_SYNC_DEVICE',
            backup: 'GROW_BACKUP',
            restore: 'GROW_RESTORE_DATA',
            settings: 'GROW_SYNC_LOGS'
        };

        if (tabMap[newSection]) {
            dispatch(setActiveTab(tabMap[newSection] as any));
            setLocalSection(null);
        } else {
            setLocalSection(newSection);
        }
    };

    // Mock Data (Ideally these would come from Redux or a Hook)
    const syncConfig: SyncConfig = {
        tenantId: activeTenant?.id || '',
        devices: [
            { id: 'd1', name: 'Desktop – Office', branchId: 'BR-001', userId: 'user_01', platform: 'Windows', osVersion: '10', appVersion: '2.4.1', lastSyncAt: new Date(Date.now() - 2 * 60000).toISOString(), lastOnlineAt: new Date().toISOString(), ipAddress: '192.168.1.10', status: 'ACTIVE', isOnline: true, syncHealth: 98, errorRate: 0, pendingOps: 0 },
            { id: 'd2', name: 'Laptop – Home', branchId: 'BR-001', userId: 'user_01', platform: 'macOS', osVersion: '12', appVersion: '2.4.0', lastSyncAt: new Date(Date.now() - 60 * 60000).toISOString(), lastOnlineAt: new Date(Date.now() - 30 * 60000).toISOString(), ipAddress: '192.168.1.15', status: 'ACTIVE', isOnline: true, syncHealth: 85, errorRate: 2, pendingOps: 0 },
            { id: 'd3', name: 'Mobile – iPhone', branchId: 'BR-001', userId: 'user_01', platform: 'iOS', osVersion: '15', appVersion: '2.4.1', lastSyncAt: new Date(Date.now() - 5 * 60000).toISOString(), lastOnlineAt: new Date().toISOString(), ipAddress: '192.168.1.20', status: 'ACTIVE', isOnline: true, syncHealth: 99, errorRate: 0, pendingOps: 0 },
            { id: 'd4', name: 'Tablet – Store', branchId: 'BR-001', userId: 'user_02', platform: 'Android', osVersion: '11', appVersion: '2.3.9', lastSyncAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(), lastOnlineAt: new Date(Date.now() - 60 * 60000).toISOString(), ipAddress: '192.168.1.25', status: 'INACTIVE', isOnline: false, syncHealth: 45, errorRate: 15, pendingOps: 12 }
        ],
        settings: {
            autoSync: true,
            syncInterval: 5,
            syncOnWifiOnly: false,
            backgroundSync: true,
            syncDomains: { invoices: true, customers: true, items: true, reports: true, inventory: true, loyalty: true, payments: true, sales: true, finance: true }
        },
        lastSyncAt: new Date(Date.now() - 2 * 60000).toISOString(),
        syncStatus: 'UP_TO_DATE',
        conflicts: [
            { id: 'cf1', ledgerEntryId: 'LE-001', entity: 'Customer', entityId: 'CUST-99', field: 'phone', localValue: '+91-9876543210', remoteValue: '+91-9876543211', occurredAt: new Date(Date.now() - 30 * 60000).toISOString() }
        ]
    };

    const backupConfig: BackupConfig = {
        tenantId: activeTenant?.id || '',
        settings: {
            autoBackupEnabled: true, scheduleTime: '02:00', retentionDays: 30, destination: 'LOCAL',
            modulesToBackup: { invoices: true, customers: true, products: true, inventory: true, finance: true, reports: true, loyalty: true, configuration: true, users: true }
        },
        history: [
            { id: 'b1', date: '2026-01-10', time: '02:00', size: 47395430, destination: 'LOCAL', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] },
            { id: 'b2', date: '2026-01-09', time: '02:00', size: 46123890, destination: 'LOCAL', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] },
            { id: 'b3', date: '2026-01-08', time: '02:00', size: 45234567, destination: 'GOOGLE_DRIVE', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] },
            { id: 'b4', date: '2026-01-07', time: '02:00', size: 0, destination: 'LOCAL', status: 'FAILED', modules: [], log: 'Disk space insufficient' },
            { id: 'b5', date: '2026-01-06', time: '02:00', size: 43876543, destination: 'LOCAL', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] }
        ],
        lastBackup: { id: 'b1', date: '2026-01-10', time: '02:00', size: 47395430, destination: 'LOCAL', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] },
        storage: { used: 182345678, total: 524288000, warningThreshold: 80 }
    };

    const [settings, setSettings] = useState(syncConfig.settings);
    const [backupSettings, setBackupSettings] = useState(backupConfig.settings);

    // Helpers
    const getPlatformIcon = (platform: DeviceRegistryEntry['platform']) => {
        switch (platform) {
            case 'Windows': return Monitor;
            case 'macOS': return Laptop;
            case 'iOS': return Smartphone;
            case 'Android': return Tablet;
            default: return Monitor;
        }
    };

    const getStatusBadge = (status: DeviceStatus, isOnline: boolean) => {
        if (!isOnline) return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline</span>;
        if (status === 'ACTIVE') return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-600">Inactive</span>;
    };

    const getSyncStatusBadge = (status: SyncStatus) => {
        const styles: Record<SyncStatus, { bg: string; text: string; icon: any }> = {
            UP_TO_DATE: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Clock },
            CONFLICT: { bg: 'bg-red-100', text: 'text-red-600', icon: AlertCircle },
            SYNCING: { bg: 'bg-blue-100', text: 'text-blue-600', icon: RefreshCw },
            ERROR: { bg: 'bg-red-100', text: 'text-red-500', icon: XCircle }
        };
        const s = styles[status];
        const Icon = s.icon;
        return (
            <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${s.bg} ${s.text} flex items-center gap-2`}>
                <Icon className={`w-4 h-4 ${status === 'SYNCING' ? 'animate-spin' : ''}`} /> {status.replace('_', ' ')}
            </span>
        );
    };

    const getBackupStatusBadge = (status: BackupStatus) => {
        const styles: Record<BackupStatus, { bg: string; text: string; icon: any }> = {
            COMPLETED: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
            FAILED: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
            IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-600', icon: Loader2 },
            SCHEDULED: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Calendar }
        };
        const s = styles[status] || styles['COMPLETED'];
        const Icon = s.icon;
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.text} flex items-center gap-1`}>
                <Icon className={`w-3 h-3 ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} /> {status.replace('_', ' ')}
            </span>
        );
    };

    const getDestinationIcon = (dest: BackupDestination) => {
        switch (dest) {
            case 'LOCAL': return HardDrive;
            case 'GOOGLE_DRIVE': return Cloud;
            default: return Database;
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const syncDomainIcons: Record<string, any> = {
        invoices: Database, customers: Database, items: Database, reports: Database, inventory: Database, loyalty: Database, payments: Database
    };

    const backupModuleIcons: Record<string, any> = {
        invoices: Database, customers: Database, products: Database, inventory: Database, finance: Database, reports: Database, loyalty: Database, configuration: Database, users: Database
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Sync Intelligence Premium Portal */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-sm flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                            <Cpu className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Sync <span className="text-primary">Intelligence</span></h3>
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">Premium System</span>
                            </div>
                            <p className="text-slate-400 font-medium max-w-xl">Access transaction-level ledger, real-time node topology, and AI-driven sync anomaly detection.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => dispatch(setActiveTab('GROW_SYNC_DEVICE'))}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Activity className="w-4 h-4" /> Switch to Intelligence View
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Sync & Share</h1>
                    <p className="text-slate-500 mt-1">Manage device synchronization, backups, and data restoration.</p>
                </div>
                <div className="flex items-center gap-4">
                    {getSyncStatusBadge(isSyncing ? 'SYNCING' : syncConfig.syncStatus)}
                    <button
                        onClick={() => { setIsSyncing(true); setTimeout(() => setIsSyncing(false), 2000); }}
                        disabled={isSyncing}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-sm p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500">Last Sync</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{formatTimeAgo(syncConfig.lastSyncAt || '')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-500">Connected Devices</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{syncConfig.devices.filter(d => d.isOnline).length} / {syncConfig.devices.length}</p>
                    </div>
                    {syncConfig.conflicts.length > 0 && (
                        <div className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {syncConfig.conflicts.length} Conflict{syncConfig.conflicts.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit overflow-x-auto">
                {[
                    { id: 'device', label: 'Devices', icon: Monitor },
                    { id: 'backup', label: 'Backups', icon: HardDrive },
                    { id: 'restore', label: 'Restore', icon: RefreshCw },
                    { id: 'settings', label: 'Settings', icon: Settings2 },
                    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle, badge: syncConfig.conflicts.length }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleSectionChange(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeSection === tab.id ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge ? <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">{tab.badge}</span> : null}
                        </button>
                    );
                })}
            </div>

            {activeSection === 'device' && (
                <DevicesSection
                    devices={syncConfig.devices}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    onAddDevice={() => handleSectionChange('add')}
                    getPlatformIcon={getPlatformIcon}
                    getStatusBadge={getStatusBadge}
                    formatTimeAgo={formatTimeAgo}
                />
            )}

            {activeSection === 'add' && (
                <div className="max-w-2xl mx-auto text-center space-y-10">
                    <button onClick={() => handleSectionChange('device')} className="text-sm font-bold text-slate-500 hover:text-primary flex items-center gap-1 mx-auto">
                        ← Back to Devices
                    </button>
                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-12">
                        <div className="w-20 h-20 bg-indigo-100 rounded-sm flex items-center justify-center mx-auto mb-8">
                            <QrCode className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Add New Device</h2>
                        <p className="text-slate-500 mb-10">Scan this QR code from your new device to securely link it to your tenant.</p>
                        <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-sm mx-auto flex items-center justify-center mb-8 border-4 border-dashed border-slate-200 dark:border-slate-700">
                            <QrCode className="w-32 h-32 text-slate-300" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Code expires in 5:00</p>
                    </div>
                </div>
            )}

            {activeSection === 'backup' && (
                <BackupSection
                    backupConfig={backupConfig}
                    isBackingUp={isBackingUp}
                    onBackupNow={() => { setIsBackingUp(true); setTimeout(() => setIsBackingUp(false), 3000); }}
                    backupSettings={backupSettings}
                    setBackupSettings={setBackupSettings}
                    getBackupStatusBadge={getBackupStatusBadge}
                    formatBytes={formatBytes}
                    getDestinationIcon={getDestinationIcon}
                    backupModuleIcons={backupModuleIcons}
                />
            )}

            {activeSection === 'restore' && (
                <RestoreSection />
            )}

            {activeSection === 'settings' && (
                <SyncSettingsSection
                    settings={settings}
                    setSettings={setSettings}
                    syncDomainIcons={syncDomainIcons}
                />
            )}

            {activeSection === 'conflicts' && (
                <ConflictsSection
                    conflicts={syncConfig.conflicts}
                    formatTimeAgo={formatTimeAgo}
                />
            )}
        </div>
    );
};

export default Sync;
