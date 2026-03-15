import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { useUiStore } from '@/shared/lib/store/uiStore';
import {
    Smartphone, Monitor, Laptop, Tablet, RefreshCw, CheckCircle, AlertCircle, Clock,
    Settings2, AlertTriangle, HardDrive, Database, QrCode, WifiOff, Loader2, Calendar, Archive, Cloud, XCircle,
    Cpu, Zap, Activity, Globe, Share2, Layers, ShieldCheck, ChevronRight, Sparkles, Server, Network
} from 'lucide-react';
import { DeviceRegistryEntry, SyncConfig, DeviceStatus, SyncStatus, BackupConfig, BackupStatus, BackupDestination } from "@/entities/session/model/sync";

// Components
import DevicesSection from './DevicesSection';
import BackupSection from './BackupSection';
import SyncSettingsSection from './SyncSettingsSection';
import ConflictsSection from './ConflictsSection';
import RestoreSection from './RestoreSection';

type SyncSection = 'device' | 'add' | 'settings' | 'conflicts' | 'backup' | 'restore' | 'devices';

/* ─── Node Topology Visualizer ────────────────────────────── */
const NodeTopology: React.FC<{ devices: DeviceRegistryEntry[] }> = ({ devices }) => {
    const onlineDevices = useMemo(() => devices.filter(d => d.isOnline), [devices]);
    
    return (
        <div className="relative w-full h-[300px] bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden group">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20" style={{ 
                backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', 
                backgroundSize: '24px 24px' 
            }} />
            
            {/* Radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)]" />

            {/* Central Cloud Node */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] border border-indigo-400/50 relative z-10">
                        <Cloud className="w-10 h-10" />
                    </div>
                </div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] text-center mt-3">Cloud Core</p>
            </div>

            {/* Device Nodes */}
            {devices.map((device, i) => {
                const angle = (i * (360 / devices.length)) * (Math.PI / 180);
                const radius = 100;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isOnline = device.isOnline;

                return (
                    <React.Fragment key={device.id}>
                        {/* Connecting Line */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <line 
                                x1="50%" y1="50%" 
                                x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`}
                                stroke={isOnline ? '#4f46e5' : '#334155'} 
                                strokeWidth="1" 
                                strokeDasharray="4 4"
                                className={isOnline ? 'animate-[dash_20s_linear_infinite]' : ''}
                                style={{ opacity: isOnline ? 0.4 : 0.1 }}
                            />
                        </svg>
                        
                        {/* Device Node */}
                        <div 
                            className="absolute transition-all duration-700 hover:scale-110 cursor-pointer"
                            style={{ 
                                left: `calc(50% + ${x}px)`, 
                                top: `calc(50% + ${y}px)`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                                isOnline 
                                    ? 'bg-slate-900 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]' 
                                    : 'bg-slate-900/50 border-slate-800 text-slate-600'
                            }`}>
                                {device.platform === 'Windows' && <Monitor className="w-6 h-6" />}
                                {device.platform === 'macOS' && <Laptop className="w-6 h-6" />}
                                {device.platform === 'iOS' && <Smartphone className="w-6 h-6" />}
                                {device.platform === 'Android' && <Tablet className="w-6 h-6" />}
                            </div>
                            {isOnline && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
                            )}
                        </div>
                    </React.Fragment>
                );
            })}
            
            <style>{`
                @keyframes dash {
                    to { stroke-dashoffset: -100; }
                }
            `}</style>
        </div>
    );
};

/* ─── Main Sync Component ──────────────────────────────────── */
const Sync: React.FC = () => {
    const dispatch = useDispatch();
    const {  user  } = useAuthStore();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { activeTab, setActiveTab } = useUiStore();

    const activeTenant = tenants.find((t: any) => t.id === user?.tenantId);
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
    const [syncProgress, setSyncProgress] = useState(0);

    const handleSync = useCallback(() => {
        setIsSyncing(true);
        setSyncProgress(0);
        const interval = setInterval(() => {
            setSyncProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsSyncing(false);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    }, []);

    const handleSectionChange = (newSection: SyncSection) => {
        const tabMap: Record<string, string> = {
            device: 'GROW_SYNC_DEVICE',
            backup: 'GROW_BACKUP',
            restore: 'GROW_RESTORE_DATA',
            settings: 'GROW_SYNC_LOGS'
        };

        if (tabMap[newSection]) {
            setActiveTab(tabMap[newSection] as any);
            setLocalSection(null);
        } else {
            setLocalSection(newSection);
        }
    };

    // Mock Data
    const syncConfig: SyncConfig = {
        tenantId: activeTenant?.id || '',
        devices: [
            // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
            { id: 'd1', name: 'Desktop – Office', branchId: 'BR-001', userId: 'user_01', platform: 'Windows', osVersion: '10', appVersion: '2.4.1', lastSyncAt: new Date(Date.now() - 2 * 60000).toISOString(), lastOnlineAt: new Date().toISOString(), ipAddress: '192.168.1.10', status: 'ACTIVE', isOnline: true, syncHealth: 98, errorRate: 0, pendingOps: 0 },
            // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
            { id: 'd2', name: 'Laptop – Home', branchId: 'BR-001', userId: 'user_01', platform: 'macOS', osVersion: '12', appVersion: '2.4.0', lastSyncAt: new Date(Date.now() - 60 * 60000).toISOString(), lastOnlineAt: new Date(Date.now() - 30 * 60000).toISOString(), ipAddress: '192.168.1.15', status: 'ACTIVE', isOnline: true, syncHealth: 85, errorRate: 2, pendingOps: 0 },
            // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
            { id: 'd3', name: 'Mobile – iPhone', branchId: 'BR-001', userId: 'user_01', platform: 'iOS', osVersion: '15', appVersion: '2.4.1', lastSyncAt: new Date(Date.now() - 5 * 60000).toISOString(), lastOnlineAt: new Date().toISOString(), ipAddress: '192.168.1.20', status: 'ACTIVE', isOnline: true, syncHealth: 99, errorRate: 0, pendingOps: 0 },
            // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
            { id: 'd4', name: 'Tablet – Store', branchId: 'BR-001', userId: 'user_02', platform: 'Android', osVersion: '11', appVersion: '2.3.9', lastSyncAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(), lastOnlineAt: new Date(Date.now() - 60 * 60000).toISOString(), ipAddress: '192.168.1.25', status: 'INACTIVE', isOnline: false, syncHealth: 45, errorRate: 15, pendingOps: 12 }
        ],
        settings: {
            autoSync: true,
            syncInterval: 5,
            syncOnWifiOnly: false,
            backgroundSync: true,
            syncDomains: { invoices: true, customers: true, items: true, reports: true, inventory: true, loyalty: true, payments: true, sales: true, finance: true }
        },
        // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
        lastSyncAt: new Date(Date.now() - 2 * 60000).toISOString(),
        syncStatus: 'UP_TO_DATE',
        conflicts: [
            // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
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
        if (!isOnline) return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline</span>;
        if (status === 'ACTIVE') return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">LIVE</span>;
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 font-bold">Inactive</span>;
    };

    const getSyncStatusBadge = (status: SyncStatus) => {
        const styles: Record<SyncStatus, { bg: string; text: string; icon: any }> = {
            UP_TO_DATE: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
            PENDING: { bg: 'bg-amber-100 dark:bg-amber-900/10', text: 'text-amber-600 dark:text-amber-400', icon: Clock },
            CONFLICT: { bg: 'bg-red-100 dark:bg-red-900/10', text: 'text-red-600', icon: AlertTriangle },
            SYNCING: { bg: 'bg-blue-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', icon: RefreshCw },
            ERROR: { bg: 'bg-red-100 dark:bg-red-900/10', text: 'text-red-500', icon: XCircle }
        };
        const s = styles[status];
        const Icon = s.icon;
        return (
            <span className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest ${s.bg} ${s.text} flex items-center gap-2 border border-black/5 dark:border-white/5`}>
                <Icon className={`w-4 h-4 ${status === 'SYNCING' ? 'animate-spin' : ''}`} /> {status.replace('_', ' ')}
            </span>
        );
    };

    const getBackupStatusBadge = (status: BackupStatus) => {
        const styles: Record<BackupStatus, { bg: string; text: string; icon: any }> = {
            COMPLETED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
            FAILED: { bg: 'bg-red-100 dark:bg-red-900/10', text: 'text-red-600', icon: XCircle },
            IN_PROGRESS: { bg: 'bg-blue-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', icon: Loader2 },
            SCHEDULED: { bg: 'bg-amber-100 dark:bg-amber-900/10', text: 'text-amber-600 dark:text-amber-400', icon: Calendar }
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
        // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
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
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Sync Intelligence Premium Portal */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Visualizer Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                    <Network className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Active <span className="text-indigo-400">Topology</span></h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Real-time Node Status</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                <Sparkles className="w-3 h-3" /> System Optimal
                            </div>
                        </div>

                        <NodeTopology devices={syncConfig.devices} />

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
                            {[
                                { label: 'Latency', value: '42ms', icon: Activity, color: 'text-indigo-400' },
                                { label: 'Bandwidth', value: '1.2 GB/s', icon: Zap, color: 'text-amber-400' },
                                { label: 'Integrity', value: '99.9%', icon: ShieldCheck, color: 'text-emerald-400' }
                            ].map(stat => (
                                <div key={stat.label} className="text-center">
                                    <stat.icon className={`w-4 h-4 mx-auto mb-1.5 ${stat.color}`} />
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-sm font-black text-white tabular-nums">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Hero / Stats */}
                <div className="space-y-6 flex flex-col justify-center">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">Data Sync <br/><span className="text-indigo-600">Cross-Platform Hub</span></h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">Seamlessly bridge your branch data between local terminals and the cloud core.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Last Sync</span>
                            </div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{formatTimeAgo(syncConfig.lastSyncAt || '')}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                    <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Devices</span>
                            </div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{syncConfig.devices.filter((d: any) => d.isOnline).length} / {syncConfig.devices.length} <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Live</span></p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="w-full sm:flex-1 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? `Syncing ${syncProgress}%` : 'Initiate Full Synchronize'}
                        </button>
                        <button 
                            onClick={() => handleSectionChange('settings')}
                            className="w-full sm:w-16 h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:scale-[1.02]"
                        >
                            <Settings2 className="w-6 h-6" />
                        </button>
                    </div>

                    {isSyncing && (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden rounded-full">
                            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 w-fit shadow-sm overflow-x-auto">
                {[
                    { id: 'device', label: 'Nodes & Devices', icon: Monitor },
                    { id: 'backup', label: 'Vault Backups', icon: HardDrive },
                    { id: 'restore', label: 'Data Recovery', icon: RefreshCw },
                    { id: 'settings', label: 'Engine Config', icon: Settings2 },
                    { id: 'conflicts', label: 'Resolution', icon: AlertTriangle, badge: syncConfig.conflicts.length }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleSectionChange(tab.id as any)}
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${activeSection === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge ? <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] rounded-full font-black animate-pulse">{tab.badge}</span> : null}
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Content Sections */}
            <div className="animate-in slide-in-from-bottom-4 duration-500">
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
                    <div className="max-w-2xl mx-auto text-center py-10">
                        <button onClick={() => handleSectionChange('device')} className="text-xs font-black text-slate-400 hover:text-indigo-600 flex items-center gap-2 mx-auto mb-10 transition-all uppercase tracking-widest">
                            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                        </button>
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-16 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
                            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-indigo-600">
                                <QrCode className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 italic uppercase">Link New <span className="text-indigo-600">Terminal</span></h2>
                            <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto">Authorize an additional node to your enterprise network by scanning this cryptographic token.</p>
                            
                            <div className="relative w-64 h-64 mx-auto mb-10 p-6 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-inner group">
                                <div className="w-full h-full border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                                    <QrCode className="w-40 h-40 text-slate-300" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none rounded-[2.5rem]" />
                            </div>
                            
                            <div className="flex flex-col items-center gap-3">
                                <span className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest">
                                    Expires in 04:59
                                </span>
                                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline underline-offset-4">Generate Manual Passcode</button>
                            </div>
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
            
            {/* Legend / Security Footer */}
            <div className="mt-12 p-8 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                    <ShieldCheck className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <p className="text-lg font-black text-slate-800 dark:text-white leading-none">Military-Grade Data Encryption</p>
                    <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">All synchronization payload is encrypted using AES-256-GCM before exiting your local terminal. Neither our servers nor unauthorized device nodes can decrypt your sensitive transaction ledgers.</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">E2E ENCRYPTION ACTIVE</span>
                </div>
            </div>
        </div>
    );
};

export default Sync;

/* ─── Extra Icons — placeholder for local usage ───────────── */
const ChevronLeft: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);
