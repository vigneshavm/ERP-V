import React from 'react';
import { 
    Settings, Zap, Wifi, Globe, HardDrive, 
    Database, Clock, ChevronRight, ShieldCheck, 
    RefreshCw, Layers, Cpu, Network 
} from 'lucide-react';
import { SyncSettings } from "@/entities/session/model/sync";

interface SyncSettingsSectionProps {
    settings: SyncSettings;
    setSettings: React.Dispatch<React.SetStateAction<SyncSettings>>;
    syncDomainIcons: Record<string, any>;
}

const SyncSettingsSection: React.FC<SyncSettingsSectionProps> = ({
    settings, setSettings, syncDomainIcons
}) => {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-main italic uppercase tracking-tight">Engine <span className="text-indigo-600">Configurations</span></h2>
                    <p className="text-muted text-xs font-medium">Fine-tune the synchronization pulse and data priority protocols.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Propagation Policy */}
                <div className="bg-white dark:bg-[var(--erp-bg)] rounded-[2.5rem] border border-default dark:border-default p-10 space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-main uppercase tracking-tight">Propagation <span className="text-indigo-600">Policy</span></h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { 
                                id: 'autoSync', 
                                label: 'Real-time Propagation', 
                                desc: 'Enable continuous background synchronization', 
                                value: settings.autoSync,
                                icon: RefreshCw
                            },
                            { 
                                id: 'syncOnWifiOnly', 
                                label: 'Network Isolation', 
                                desc: 'Restrict sync payload to WiFi networks only', 
                                value: settings.syncOnWifiOnly,
                                icon: Wifi
                            },
                            { 
                                id: 'backgroundSync', 
                                label: 'Stealth Syncing', 
                                desc: 'Maintain connectivity even when app is suspended', 
                                value: settings.backgroundSync,
                                icon: Globe
                            }
                        ].map(item => (
                            <div key={item.id} className="flex items-center justify-between p-5 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)]/50 rounded-[1.5rem] transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="text-muted group-hover:text-indigo-500 transition-colors">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-main uppercase text-[10px] tracking-widest">{item.label}</p>
                                        <p className="text-[10px] text-muted font-bold mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSettings((s: any) => ({ ...s, [item.id]: !item.value }))}
                                    className={`w-12 h-7 rounded-full transition-all ${item.value ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'} p-1 shadow-inner`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${item.value ? 'translate-x-5' : ''} shadow-sm`} />
                                </button>
                            </div>
                        ))}

                        <div className="flex items-center justify-between p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[1.5rem] border border-indigo-100/50 dark:border-indigo-800/30">
                            <div className="flex items-center gap-4">
                                <div className="text-indigo-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-indigo-900 dark:text-indigo-400 uppercase text-[10px] tracking-widest">Update Frequency</p>
                                    <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Polling interval for state reconciliation</p>
                                </div>
                            </div>
                            <select
                                value={settings.syncInterval}
                                onChange={(e) => setSettings((s: any) => ({ ...s, syncInterval: Number(e.target.value) as any }))}
                                className="bg-white dark:bg-[var(--erp-card)] border border-indigo-100 dark:border-indigo-700/50 rounded-xl px-4 py-2 font-black text-[10px] text-main uppercase tracking-widest shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value={5}>05 MIN</option>
                                <option value={10}>10 MIN</option>
                                <option value={30}>30 MIN</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Domains - Asset Perimeter */}
                <div className="bg-white dark:bg-[var(--erp-bg)] rounded-[2.5rem] border border-default dark:border-default p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-main uppercase tracking-tight">Data <span className="text-emerald-600">Domains</span></h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(settings.syncDomains).map(([key, value]) => {
                            const Icon = syncDomainIcons[key] || Database;
                            const isSyncing = value;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSettings((s: any) => ({ ...s, syncDomains: { ...s.syncDomains, [key]: !value } }))}
                                    className={`flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 ${isSyncing ? 'bg-white dark:bg-[var(--erp-card)] border-indigo-200 dark:border-indigo-900/50 shadow-md translate-y-[-2px]' : 'bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/10 border-default dark:border-default opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSyncing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-muted'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isSyncing ? 'text-main' : 'text-muted'}`}>{key}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isSyncing ? 'bg-indigo-600 border-indigo-600' : 'border-default dark:border-default'}`}>
                                        {isSyncing && <ShieldCheck className="w-3.5 h-3.5 text-main" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tactical Footer Overlay */}
            <div className="relative p-10 bg-[var(--erp-bg)] rounded-[3rem] border border-default overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[var(--erp-card)] rounded-2xl flex items-center justify-center text-indigo-400 border border-default">
                            <Network className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-main italic uppercase tracking-tight leading-none">Global Ledger Consistency</p>
                            <p className="text-sm text-muted font-bold mt-2 max-w-md">Your configuration affects how conflict resolution heuristics and transaction serialization are prioritized across all nodes.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-[var(--erp-card)]/50 p-4 rounded-2xl border border-default/50">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div className="pr-4">
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest">Engine Status</p>
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mt-0.5">Stabilized</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyncSettingsSection;
