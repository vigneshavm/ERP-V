import React from 'react';
import { 
    Plus, RotateCw, Power, Trash2, Shield, Signal, 
    Wifi, WifiOff, Activity, Cpu, Monitor, Laptop, 
    Smartphone, Tablet, ChevronRight, MoreVertical, Clock 
} from 'lucide-react';
import { DeviceRegistryEntry, DeviceStatus } from "@/entities/session/model/sync";

interface DevicesSectionProps {
    devices: DeviceRegistryEntry[];
    isOwnerOrAdmin: boolean;
    onAddDevice: () => void;
    getPlatformIcon: (platform: DeviceRegistryEntry['platform']) => any;
    getStatusBadge: (status: DeviceStatus, isOnline: boolean) => React.ReactNode;
    formatTimeAgo: (date: string) => string;
}

const DevicesSection: React.FC<DevicesSectionProps> = ({
    devices, isOwnerOrAdmin, onAddDevice, getPlatformIcon, getStatusBadge, formatTimeAgo
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-main italic uppercase tracking-tight">Active <span className="text-indigo-600">Nodes</span></h2>
                    <p className="text-muted text-xs font-medium">Manage authorized terminals within your enterprise perimeter.</p>
                </div>
                {isOwnerOrAdmin && (
                    <button
                        onClick={onAddDevice}
                        className="group px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        Authorize New Node
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {devices.map((device) => {
                    const PlatformIcon = getPlatformIcon(device.platform);
                    const isOnline = device.isOnline;
                    
                    return (
                        <div 
                            key={device.id} 
                            className={`group relative bg-white dark:bg-[var(--erp-bg)] rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
                                isOnline 
                                    ? 'border-default dark:border-default' 
                                    : 'border-default dark:border-default/50 opacity-80'
                            }`}
                        >
                            {/* Header Status Bar */}
                            <div className="flex items-center justify-between px-8 pt-8">
                                <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 border ${
                                    isOnline 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                        : 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] border-default dark:border-default text-muted'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{isOnline ? 'Live Node' : 'Disconnected'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mr-2 tabular-nums">
                                        v{device.appVersion}
                                    </div>
                                    <button className="p-2 text-muted hover:text-indigo-500 transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Device Identity */}
                                <div className="flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${
                                        isOnline 
                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                                            : 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-muted'
                                    }`}>
                                        <PlatformIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-main leading-tight">{device.name}</h4>
                                        <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1 opacity-60">
                                            {device.platform} {device.osVersion} • {device.ipAddress}
                                        </p>
                                    </div>
                                </div>

                                {/* Health & Activity */}
                                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-default/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Sync Health</span>
                                        </div>
                                        <span className={`text-sm font-black tabular-nums ${
                                            device.syncHealth > 90 ? 'text-emerald-500' : 'text-amber-500'
                                        }`}>{device.syncHealth}%</span>
                                    </div>
                                    <div className="w-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${
                                                device.syncHealth > 90 ? 'bg-indigo-500' : 'bg-amber-500'
                                            }`} 
                                            style={{ width: `${device.syncHealth}%` }} 
                                        />
                                    </div>
                                </div>

                                {/* Last Activity Footer */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-muted" />
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                                            {isOnline ? `Synced ${formatTimeAgo(device.lastSyncAt)}` : `Last seen ${formatTimeAgo(device.lastOnlineAt)}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-muted hover:text-indigo-600 rounded-xl transition-all" title="Force Synchronize">
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                        {isOwnerOrAdmin && (
                                            <button className="p-2.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] hover:bg-red-50 dark:hover:bg-red-900/30 text-muted hover:text-red-500 rounded-xl transition-all" title="Revoke Authorization">
                                                <Power className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Signal Wave for Online Devices */}
                            {isOnline && (
                                <div className="absolute -bottom-8 -left-8 pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                    <Signal className="w-48 h-48 rotate-45" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Secure Empty Slot */}
                {isOwnerOrAdmin && (
                    <button 
                        onClick={onAddDevice}
                        className="relative group bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-bg)]/30 rounded-[2.5rem] border-2 border-dashed border-default dark:border-default p-12 flex flex-col items-center justify-center gap-6 transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800/50"
                    >
                        <div className="w-20 h-20 bg-white dark:bg-[var(--erp-card)] rounded-[2rem] shadow-sm flex items-center justify-center text-muted group-hover:text-indigo-500 transition-all group-hover:scale-110">
                            <Plus className="w-10 h-10" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-xl font-black text-muted group-hover:text-indigo-600 transition-colors italic uppercase">Add Node</h4>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-2">Expansion slot available</p>
                        </div>
                        <Shield className="absolute top-8 right-8 w-6 h-6 text-slate-200 dark:text-main" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default DevicesSection;
