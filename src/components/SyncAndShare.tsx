import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    Smartphone, Monitor, Laptop, Tablet, RefreshCw, CheckCircle, AlertCircle, XCircle,
    Clock, Settings2, RotateCw, FileText, Users, Package, BarChart3, Heart, CreditCard,
    ShoppingCart, AlertTriangle, GitMerge, Edit3, HardDrive, Download, Upload, Cloud,
    Database, Eye, Calendar, Loader2, Archive, Settings, QrCode, WifiOff
} from 'lucide-react';
import { SyncedDevice, SyncConfig, SyncConflict, DeviceStatus, SyncStatus, BackupConfig, BackupStatus, BackupDestination } from '../types/tenant';

// Sections
import DevicesSection from './sync/DevicesSection';
import BackupSection from './sync/BackupSection';
import SyncSettingsSection from './sync/SyncSettingsSection';
import ConflictsSection from './sync/ConflictsSection';

const SyncAndShare: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || (user?.role as string).toLowerCase() === 'admin';

    const [activeSection, setActiveSection] = useState<'devices' | 'add' | 'settings' | 'conflicts' | 'backup'>('devices');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    // Mock Data (Ideally these would come from Redux or a Hook)
    const syncConfig: SyncConfig = {
        tenantId: activeTenant?.id || '',
        devices: [
            { id: 'd1', name: 'Desktop – Office', platform: 'Windows', appVersion: '2.4.1', lastSyncAt: new Date(Date.now() - 2 * 60000).toISOString(), status: 'ACTIVE', isOnline: true },
            { id: 'd2', name: 'Laptop – Home', platform: 'macOS', appVersion: '2.4.0', lastSyncAt: new Date(Date.now() - 60 * 60000).toISOString(), status: 'ACTIVE', isOnline: true },
            { id: 'd3', name: 'Mobile – iPhone', platform: 'iOS', appVersion: '2.4.1', lastSyncAt: new Date(Date.now() - 5 * 60000).toISOString(), status: 'ACTIVE', isOnline: true },
            { id: 'd4', name: 'Tablet – Store', platform: 'Android', appVersion: '2.3.9', lastSyncAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(), status: 'INACTIVE', isOnline: false }
        ],
        settings: {
            autoSync: true,
            syncInterval: 5,
            syncOnWifiOnly: false,
            backgroundSync: true,
            syncDomains: { invoices: true, customers: true, items: true, reports: true, inventory: true, loyalty: true, payments: true }
        },
        lastSyncAt: new Date(Date.now() - 2 * 60000).toISOString(),
        syncStatus: 'UP_TO_DATE',
        conflicts: [
            { id: 'cf1', entity: 'Customer', field: 'phone', localValue: '+91-9876543210', remoteValue: '+91-9876543211', occurredAt: new Date(Date.now() - 30 * 60000).toISOString() }
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

    // Helper functions (could be moved to utils)
    const getPlatformIcon = (platform: SyncedDevice['platform']) => {
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
            SYNCING: { bg: 'bg-blue-100', text: 'text-blue-600', icon: RefreshCw }
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
        const s = styles[status];
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
        invoices: FileText, customers: Users, items: Package, reports: BarChart3, inventory: ShoppingCart, loyalty: Heart, payments: CreditCard
    };

    const backupModuleIcons: Record<string, any> = {
        invoices: FileText, customers: Users, products: Package, inventory: ShoppingCart, finance: CreditCard, reports: BarChart3, loyalty: Heart, configuration: Settings, users: Users
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Sync & Share</h1>
                    <p className="text-slate-500 mt-1">Manage device synchronization and backups across all devices.</p>
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

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-indigo-600">
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
                    { id: 'devices', label: 'Devices', icon: Monitor },
                    { id: 'backup', label: 'Backups', icon: HardDrive },
                    { id: 'settings', label: 'Settings', icon: Settings2 },
                    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle, badge: syncConfig.conflicts.length }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeSection === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge ? <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">{tab.badge}</span> : null}
                        </button>
                    );
                })}
            </div>

            {activeSection === 'devices' && (
                <DevicesSection
                    devices={syncConfig.devices}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    onAddDevice={() => setActiveSection('add')}
                    getPlatformIcon={getPlatformIcon}
                    getStatusBadge={getStatusBadge}
                    formatTimeAgo={formatTimeAgo}
                />
            )}

            {activeSection === 'add' && (
                <div className="max-w-2xl mx-auto text-center space-y-10">
                    <button onClick={() => setActiveSection('devices')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 mx-auto">
                        ← Back to Devices
                    </button>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12">
                        <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-8">
                            <QrCode className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Add New Device</h2>
                        <p className="text-slate-500 mb-10">Scan this QR code from your new device to securely link it to your tenant.</p>
                        <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-8 border-4 border-dashed border-slate-200 dark:border-slate-700">
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

export default SyncAndShare;
