import React from 'react';
import { Settings, User, Shield, Bell, Palette, Globe, CreditCard, Building2, ChevronRight, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import settingsData from '../../../mockData/settingsData.json';

const IconMap: Record<string, React.ElementType> = {
    Building2, User, Shield, Bell, Palette, Globe, CreditCard
};

const SettingsMockUI: React.FC = () => {
    const sections = settingsData.sections;
    const toggles = settingsData.toggles;

    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-slate-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[20%] w-[50%] h-[40%] bg-card/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[0%] right-[5%] w-[35%] h-[35%] bg-slate-600/10 rounded-full blur-[140px]" />
            </div>
            <main className="relative z-10 flex-1 flex max-w-[1400px] w-full mx-auto px-8 py-8 gap-8">
                {/* Left Nav */}
                <aside className="w-64 flex-shrink-0">
                    <div className="mb-6">
                        <h1 className="text-2xl font-black tracking-tight text-main flex items-center gap-2">
                            <Settings className="w-6 h-6 text-muted" /> Settings
                        </h1>
                        <p className="text-xs text-secondary mt-1 font-medium">Configure your ERP workspace</p>
                    </div>
                    <nav className="flex flex-col gap-1">
                        {sections.map((s, i) => {
                            const Icon = IconMap[s.icon];
                            return (
                                <button key={s.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${i === 0 ? 'bg-card text-main border border-default' : 'text-muted hover:bg-card hover:text-main'}`}>
                                    <div className={`p-1.5 rounded-lg ${s.bg} ${s.color}`}>{Icon && <Icon className="w-3.5 h-3.5" />}</div>
                                    {s.label}
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-600" />
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Panel */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Business Profile Card */}
                    <div className="glass-panel backdrop-blur-xl border border-default rounded-3xl p-7">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Business Profile
                        </h2>
                        <div className="grid grid-cols-2 gap-5">
                            {settingsData.businessProfile.map((f, i) => (
                                <div key={i}>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-1.5">{f.label}</label>
                                    <input defaultValue={f.val} className="w-full bg-input border border-default rounded-xl px-4 py-2.5 text-sm text-main font-bold focus:outline-none focus:border-slate-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 flex justify-end">
                            <button className="h-10 px-6 bg-card hover:bg-slate-600 text-main font-bold text-sm rounded-xl flex items-center gap-2 transition-all border border-default">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="glass-panel backdrop-blur-xl border border-default rounded-3xl p-7">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Feature Toggles
                        </h2>
                        <div className="flex flex-col divide-y divide-default">
                            {toggles.map((t, i) => (
                                <div key={i} className="flex items-center justify-between py-4 group">
                                    <div>
                                        <p className="text-sm font-bold text-main">{t.label}</p>
                                        <p className="text-[11px] text-secondary mt-0.5">{t.sub}</p>
                                    </div>
                                    <button className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${t.on ? 'text-emerald-400' : 'text-slate-600'}`}>
                                        {t.on ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                        {t.on ? 'On' : 'Off'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsMockUI;
