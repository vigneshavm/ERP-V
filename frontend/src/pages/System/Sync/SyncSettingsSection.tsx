import React from 'react';
import { SyncSettings } from "../../../types/tenant";

interface SyncSettingsSectionProps {
    settings: SyncSettings;
    setSettings: React.Dispatch<React.SetStateAction<SyncSettings>>;
    syncDomainIcons: Record<string, any>;
}

const SyncSettingsSection: React.FC<SyncSettingsSectionProps> = ({
    settings, setSettings, syncDomainIcons
}) => {
    return (
        <div className="space-y-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Sync Settings</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6">
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
                            className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-4 py-2 font-bold text-sm text-slate-900 dark:text-white"
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

                <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">What to Sync</h3>

                    {Object.entries(settings.syncDomains).map(([key, value]) => {
                        const Icon = syncDomainIcons[key] || (() => null);
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
    );
};

export default SyncSettingsSection;
