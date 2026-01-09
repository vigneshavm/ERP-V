import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    Smartphone,
    Monitor,
    Laptop,
    Tablet,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    XCircle,
    Plus,
    QrCode,
    Wifi,
    WifiOff,
    Clock,
    Settings2,
    ChevronRight,
    Power,
    Trash2,
    RotateCw,
    FileText,
    Users,
    Package,
    BarChart3,
    Heart,
    CreditCard,
    ShoppingCart,
    AlertTriangle,
    CheckCircle2,
    GitMerge,
    Edit3,
    HardDrive,
    Download,
    Upload,
    Cloud,
    Database,
    Eye,
    Calendar,
    Loader2,
    Archive,
    Settings
} from 'lucide-react';
import { SyncedDevice, SyncConfig, SyncConflict, DeviceStatus, SyncStatus, BackupConfig, BackupEntry, BackupStatus, BackupDestination } from '../types/tenant';

const SyncAndShare: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || (user?.role as string).toLowerCase() === 'admin';

    const [activeSection, setActiveSection] = useState<'devices' | 'add' | 'settings' | 'conflicts' | 'backup'>('devices');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    // Mock Sync Config
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
            syncDomains: {
                invoices: true,
                customers: true,
                items: true,
                reports: true,
                inventory: true,
                loyalty: true,
                payments: true
            }
        },
        lastSyncAt: new Date(Date.now() - 2 * 60000).toISOString(),
        syncStatus: 'UP_TO_DATE',
        conflicts: [
            { id: 'cf1', entity: 'Customer', field: 'phone', localValue: '+91-9876543210', remoteValue: '+91-9876543211', occurredAt: new Date(Date.now() - 30 * 60000).toISOString() }
        ]
    };

    // Mock Backup Config
    const backupConfig: BackupConfig = {
        tenantId: activeTenant?.id || '',
        settings: {
            autoBackupEnabled: true,
            scheduleTime: '02:00',
            retentionDays: 30,
            destination: 'LOCAL',
            modulesToBackup: {
                invoices: true,
                customers: true,
                products: true,
                inventory: true,
                finance: true,
                reports: true,
                loyalty: true,
                configuration: true,
                users: true
            }
        },
        history: [
            { id: 'b1', date: '2026-01-10', time: '02:00', size: 47395430, destination: 'LOCAL', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] },
            { id: 'b2', date: '2026-01-09', time: '02:00', size: 46123890, destination: 'LOCAL', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] },
            { id: 'b3', date: '2026-01-08', time: '02:00', size: 45234567, destination: 'GOOGLE_DRIVE', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] },
            { id: 'b4', date: '2026-01-07', time: '02:00', size: 0, destination: 'LOCAL', status: 'FAILED', modules: [], log: 'Disk space insufficient' },
            { id: 'b5', date: '2026-01-06', time: '02:00', size: 43876543, destination: 'LOCAL', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] }
        ],
        lastBackup: { id: 'b1', date: '2026-01-10', time: '02:00', size: 47395430, destination: 'LOCAL', status: 'COMPLETED', modules: ['invoices', 'customers', 'products', 'inventory'] },
        storage: {
            used: 182345678,
            total: 524288000,
            warningThreshold: 80
        }
    };

    const [settings, setSettings] = useState(syncConfig.settings);
    const [backupSettings, setBackupSettings] = useState(backupConfig.settings);

    const getPlatformIcon = (platform: SyncedDevice['platform']) => {
        switch (platform) {
            case 'Windows': return Monitor;
            case 'macOS': return Laptop;
            case 'iOS': return Smartphone;
            case 'Android': return Tablet;
            case 'Web': return Monitor;
            default: return Monitor;
        }
    };

    const getStatusBadge = (status: DeviceStatus, isOnline: boolean) => {
        if (!isOnline) return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline</span>;
        if (status === 'ACTIVE') return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-600">Inactive</span>;
    };

    const getSyncStatusBadge = (status: SyncStatus) => {
        const styles: Record<SyncStatus, { bg: string; text: string; icon: React.ElementType }> = {
            UP_TO_DATE: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Clock },
            CONFLICT: { bg: 'bg-red-100', text: 'text-red-600', icon: AlertCircle },
            SYNCING: { bg: 'bg-blue-100', text: 'text-blue-600', icon: RefreshCw }
        };
        const s = styles[status];
        return (
            <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${s.bg} ${s.text} flex items-center gap-2`}>
                <s.icon className={`w-4 h-4 ${status === 'SYNCING' ? 'animate-spin' : ''}`} /> {status.replace('_', ' ')}
            </span>
        );
    };

    const getBackupStatusBadge = (status: BackupStatus) => {
        const styles: Record<BackupStatus, { bg: string; text: string; icon: React.ElementType }> = {
            COMPLETED: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
            FAILED: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
            IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-600', icon: Loader2 },
            SCHEDULED: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Calendar }
        };
        const s = styles[status];
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.text} flex items-center gap-1`}>
                <s.icon className={`w-3 h-3 ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} /> {status.replace('_', ' ')}
            </span>
        );
    };

    const getDestinationIcon = (dest: BackupDestination) => {
        switch (dest) {
            case 'LOCAL': return HardDrive;
            case 'GOOGLE_DRIVE': return Cloud;
            case 'S3': return Database;
            case 'AZURE_BLOB': return Database;
            default: return HardDrive;
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

    const handleSyncNow = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000);
    };

    const handleBackupNow = () => {
        setIsBackingUp(true);
        setTimeout(() => setIsBackingUp(false), 3000);
    };

    const syncDomainIcons: Record<string, React.ElementType> = {
        invoices: FileText,
        customers: Users,
        items: Package,
        reports: BarChart3,
        inventory: ShoppingCart,
        loyalty: Heart,
        payments: CreditCard
    };

    const backupModuleIcons: Record<string, React.ElementType> = {
        invoices: FileText,
        customers: Users,
        products: Package,
        inventory: ShoppingCart,
        finance: CreditCard,
        reports: BarChart3,
        loyalty: Heart,
        configuration: Settings,
        users: Users
    };

    const storagePercent = Math.round((backupConfig.storage.used / backupConfig.storage.total) * 100);
    const isStorageWarning = storagePercent >= backupConfig.storage.warningThreshold;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Sync & Share</h1>
                    <p className="text-slate-500 mt-1">Manage device synchronization and backups across all devices.</p>
                </div>
                <div className="flex items-center gap-4">
                    {getSyncStatusBadge(isSyncing ? 'SYNCING' : syncConfig.syncStatus)}
                    <button
                        onClick={handleSyncNow}
                        disabled={isSyncing}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </div>

            {/* Last Sync Info */}
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

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit overflow-x-auto">
                {[
                    { id: 'devices', label: 'Devices', icon: Monitor },
                    { id: 'backup', label: 'Backups', icon: HardDrive },
                    { id: 'settings', label: 'Settings', icon: Settings2 },
                    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle, badge: syncConfig.conflicts.length }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeSection === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.badge ? <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">{tab.badge}</span> : null}
                    </button>
                ))}
            </div>

            {/* Devices Section */}
            {activeSection === 'devices' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Connected Devices</h2>
                        {isOwnerOrAdmin && (
                            <button
                                onClick={() => setActiveSection('add')}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add New Device
                            </button>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Device</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Platform</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Version</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Last Sync</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {syncConfig.devices.map((device) => {
                                    const PlatformIcon = getPlatformIcon(device.platform);
                                    return (
                                        <tr key={device.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.isOnline ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        <PlatformIcon className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-white">{device.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{device.platform}</td>
                                            <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">v{device.appVersion}</td>
                                            <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{formatTimeAgo(device.lastSyncAt)}</td>
                                            <td className="p-5">{getStatusBadge(device.status, device.isOnline)}</td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors" title="Force Resync">
                                                        <RotateCw className="w-4 h-4" />
                                                    </button>
                                                    {isOwnerOrAdmin && (
                                                        <>
                                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-yellow-600 transition-colors" title="Deactivate">
                                                                <Power className="w-4 h-4" />
                                                            </button>
                                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 transition-colors" title="Remove">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
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

            {/* Add Device Section */}
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

            {/* Backup Section */}
            {activeSection === 'backup' && (
                <div className="space-y-8">
                    {/* Backup Controls */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Backup Management</h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackupNow}
                                disabled={isBackingUp}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {isBackingUp ? 'Backing Up...' : 'Create Backup Now'}
                            </button>
                        </div>
                    </div>

                    {/* Last Backup & Storage */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Last Backup */}
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

                        {/* Storage Usage */}
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
                            {isStorageWarning && (
                                <div className="mt-4 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Storage is running low
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quick Actions</p>
                            <button className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                                <Download className="w-4 h-4" /> Download Latest Backup
                            </button>
                            <button className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                                <Archive className="w-4 h-4" /> View All Backups
                            </button>
                            <button className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-3">
                                <Trash2 className="w-4 h-4" /> Clean Old Backups
                            </button>
                        </div>
                    </div>

                    {/* Backup Settings */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Auto Backup Settings */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Automatic Backups</h3>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Enable Daily Backups</p>
                                    <p className="text-sm text-slate-500">Automatically backup data every day</p>
                                </div>
                                <button
                                    onClick={() => setBackupSettings(s => ({ ...s, autoBackupEnabled: !s.autoBackupEnabled }))}
                                    className={`w-14 h-8 rounded-full transition-all ${backupSettings.autoBackupEnabled ? 'bg-indigo-600' : 'bg-slate-200'} p-1`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${backupSettings.autoBackupEnabled ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Schedule Time</p>
                                    <p className="text-sm text-slate-500">When to run daily backup</p>
                                </div>
                                <input
                                    type="time"
                                    value={backupSettings.scheduleTime}
                                    onChange={(e) => setBackupSettings(s => ({ ...s, scheduleTime: e.target.value }))}
                                    className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-4 py-2 font-bold text-sm"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Retention Period</p>
                                    <p className="text-sm text-slate-500">Keep backups for</p>
                                </div>
                                <select
                                    value={backupSettings.retentionDays}
                                    onChange={(e) => setBackupSettings(s => ({ ...s, retentionDays: Number(e.target.value) as any }))}
                                    className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-4 py-2 font-bold text-sm"
                                >
                                    <option value={7}>7 days</option>
                                    <option value={30}>30 days</option>
                                    <option value={90}>90 days</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Destination</p>
                                    <p className="text-sm text-slate-500">Where to store backups</p>
                                </div>
                                <select
                                    value={backupSettings.destination}
                                    onChange={(e) => setBackupSettings(s => ({ ...s, destination: e.target.value as any }))}
                                    className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-4 py-2 font-bold text-sm"
                                >
                                    <option value="LOCAL">Local Storage</option>
                                    <option value="GOOGLE_DRIVE">Google Drive</option>
                                    <option value="S3" disabled>AWS S3 (Coming Soon)</option>
                                    <option value="AZURE_BLOB" disabled>Azure Blob (Coming Soon)</option>
                                </select>
                            </div>
                        </div>

                        {/* Modules to Backup */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">What to Backup</h3>

                            {Object.entries(backupSettings.modulesToBackup).map(([key, value]) => {
                                const Icon = backupModuleIcons[key] || Package;
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white capitalize">{key}</span>
                                        </div>
                                        <button
                                            onClick={() => setBackupSettings(s => ({ ...s, modulesToBackup: { ...s.modulesToBackup, [key]: !value } }))}
                                            className={`w-14 h-8 rounded-full transition-all ${value ? 'bg-indigo-600' : 'bg-slate-200'} p-1`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : ''}`} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Backup History Table */}
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
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
                <div className="space-y-8">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Sync Settings</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* General Settings */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">General</h3>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Auto Sync</p>
                                    <p className="text-sm text-slate-500">Automatically sync data in the background</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, autoSync: !s.autoSync }))}
                                    className={`w-14 h-8 rounded-full transition-all ${settings.autoSync ? 'bg-indigo-600' : 'bg-slate-200'} p-1`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.autoSync ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Sync Interval</p>
                                    <p className="text-sm text-slate-500">How often to check for updates</p>
                                </div>
                                <select
                                    value={settings.syncInterval}
                                    onChange={(e) => setSettings(s => ({ ...s, syncInterval: Number(e.target.value) as any }))}
                                    className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-4 py-2 font-bold text-sm"
                                >
                                    <option value={5}>5 minutes</option>
                                    <option value={10}>10 minutes</option>
                                    <option value={30}>30 minutes</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Sync on WiFi Only</p>
                                    <p className="text-sm text-slate-500">Mobile devices sync only on WiFi</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, syncOnWifiOnly: !s.syncOnWifiOnly }))}
                                    className={`w-14 h-8 rounded-full transition-all ${settings.syncOnWifiOnly ? 'bg-indigo-600' : 'bg-slate-200'} p-1`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.syncOnWifiOnly ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Background Sync</p>
                                    <p className="text-sm text-slate-500">Sync even when app is in background</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, backgroundSync: !s.backgroundSync }))}
                                    className={`w-14 h-8 rounded-full transition-all ${settings.backgroundSync ? 'bg-indigo-600' : 'bg-slate-200'} p-1`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.backgroundSync ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Sync Domains */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">What to Sync</h3>

                            {Object.entries(settings.syncDomains).map(([key, value]) => {
                                const Icon = syncDomainIcons[key] || Package;
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white capitalize">{key}</span>
                                        </div>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, syncDomains: { ...s.syncDomains, [key]: !value } }))}
                                            className={`w-14 h-8 rounded-full transition-all ${value ? 'bg-indigo-600' : 'bg-slate-200'} p-1`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : ''}`} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Conflicts Section */}
            {activeSection === 'conflicts' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Conflict Resolution</h2>

                    {syncConfig.conflicts.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No Conflicts</p>
                            <p className="text-slate-500">All your data is perfectly synced across devices.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {syncConfig.conflicts.map((conflict) => (
                                <div key={conflict.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                                <span className="font-black text-slate-900 dark:text-white">{conflict.entity} - {conflict.field}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-4">Conflict detected {formatTimeAgo(conflict.occurredAt)}</p>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Local Value</p>
                                                    <p className="font-bold text-slate-900 dark:text-white">{conflict.localValue}</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Remote Value</p>
                                                    <p className="font-bold text-slate-900 dark:text-white">{conflict.remoteValue}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> Use Latest
                                            </button>
                                            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2">
                                                <GitMerge className="w-3 h-3" /> Merge
                                            </button>
                                            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2">
                                                <Edit3 className="w-3 h-3" /> Manual
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SyncAndShare;
