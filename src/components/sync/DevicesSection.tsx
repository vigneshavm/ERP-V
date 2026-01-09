import React from 'react';
import { Plus, RotateCw, Power, Trash2 } from 'lucide-react';
import { SyncedDevice, DeviceStatus } from '../../types/tenant';

interface DevicesSectionProps {
    devices: SyncedDevice[];
    isOwnerOrAdmin: boolean;
    onAddDevice: () => void;
    getPlatformIcon: (platform: SyncedDevice['platform']) => any;
    getStatusBadge: (status: DeviceStatus, isOnline: boolean) => React.ReactNode;
    formatTimeAgo: (date: string) => string;
}

const DevicesSection: React.FC<DevicesSectionProps> = ({
    devices, isOwnerOrAdmin, onAddDevice, getPlatformIcon, getStatusBadge, formatTimeAgo
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Connected Devices</h2>
                {isOwnerOrAdmin && (
                    <button
                        onClick={onAddDevice}
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
                        {devices.map((device) => {
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
    );
};

export default DevicesSection;
