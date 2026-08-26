import React, { useState } from 'react';
import { 
    Settings, User, Shield, Bell, Palette, Globe, 
    CreditCard, Building2, ChevronRight, Save, 
    ToggleLeft, ToggleRight, Lock, Eye, Database,
    Smartphone, Mail, MapPin, Activity, Zap
} from 'lucide-react';
import Layout from '../../../components/shared/Layout';

const SettingsMockUI: React.FC = () => {
    const [activeSection, setActiveSection] = useState('profile');

    const sections = [
        { id: 'profile', label: 'Business Profile', icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
        { id: 'security', label: 'Security & Access', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'notifications', label: 'Communications', icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'appearance', label: 'Interface Design', icon: Palette, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { id: 'billing', label: 'Subscription & Billing', icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'backup', label: 'Data & Backups', icon: Database, color: 'text-cyan-500', bg: 'bg-cyan-500/10' }
    ];

    const toggles = [
        { id: 'biometric', label: 'Biometric Authentication', sub: 'Require fingerprint for sensitive operations', on: true },
        { id: 'ai_assist', label: 'AI Operational Insights', sub: 'Enable real-time predictive analytics', on: true },
        { id: 'dark_mode', label: 'Auto Dark Mode', sub: 'Sync interface with system preferences', on: false },
        { id: 'multi_tenant', label: 'Multi-Tenant Isolation', sub: 'Strict data partitioning across branches', on: true }
    ];

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            System <span className="text-primary">Architecture</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Enterprise Configuration // Global Control Plane
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Save className="w-4 h-4" /> Commit Configurations
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex gap-8 min-h-0">
                    {/* Sidebar Nav */}
                    <aside className="w-72 flex-shrink-0 space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-2 shadow-sm">
                            <nav className="flex flex-col gap-1">
                                {sections.map((s) => (
                                    <button 
                                        key={s.id} 
                                        onClick={() => setActiveSection(s.id)}
                                        className={`flex items-center gap-4 px-4 py-3.5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all text-left group ${activeSection === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'}`}
                                    >
                                        <div className={`p-2 rounded-sm transition-colors ${activeSection === s.id ? 'bg-white/20 text-white' : `${s.bg} ${s.color} border border-current/10 group-hover:bg-white group-hover:text-primary group-hover:border-primary/20`}`}>
                                            <s.icon className="w-3.5 h-3.5" />
                                        </div>
                                        {s.label}
                                        {activeSection === s.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 p-6 rounded-sm space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                                <Activity className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Health Index</span>
                            </div>
                            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[98%] shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
                            </div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-relaxed">System performing within optimal parameters. Last audit: 12m ago.</p>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-4">
                        {/* Section Content */}
                        <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-900 dark:text-white">Business Intelligence Profile</h2>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">Primary Legal Identity & Operational Metadata</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-2 gap-8">
                                {[
                                    { label: 'Corporate Entity Name', val: 'Antigravity Solutions Pvt Ltd', icon: Building2 },
                                    { label: 'Global Operational Email', val: 'ops@antigravity.io', icon: Mail },
                                    { label: 'Registered HQ Address', val: 'Tech Park, Floor 14, Bangalore, KA 560001', icon: MapPin },
                                    { label: 'Tax Identification (GSTIN)', val: '29AAAAA0000A1Z5', icon: Shield },
                                    { label: 'Primary Contact Node', val: '+91 80 4928 2901', icon: Smartphone },
                                    { label: 'Operational Currency', val: 'INR (Indian Rupee)', icon: CreditCard }
                                ].map((f, i) => (
                                    <div key={i} className="space-y-3 group">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 block group-focus-within:text-primary transition-colors flex items-center gap-2">
                                            <f.icon className="w-3 h-3" /> {f.label}
                                        </label>
                                        <div className="relative">
                                            <input 
                                                defaultValue={f.val} 
                                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm px-5 py-3.5 text-xs text-neutral-900 dark:text-white font-black tracking-wide focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all shadow-inner" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Feature Toggles */}
                        <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-900 dark:text-white flex items-center gap-3">
                                    <Zap className="w-4 h-4 text-primary" /> Feature Protocol Toggles
                                </h2>
                            </div>
                            <div className="flex flex-col">
                                {toggles.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-8 group hover:bg-neutral-50 dark:hover:bg-neutral-950/50 transition-all border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-sm flex items-center justify-center border shadow-sm transition-all ${t.on ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'}`}>
                                                {t.id === 'biometric' ? <Lock className="w-6 h-6" /> : t.id === 'ai_assist' ? <Activity className="w-6 h-6" /> : t.id === 'dark_mode' ? <Eye className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{t.label}</p>
                                                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1 italic">{t.sub}</p>
                                            </div>
                                        </div>
                                        <button className={`relative w-16 h-8 rounded-full transition-all duration-300 outline-none ${t.on ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-neutral-200 dark:bg-neutral-800'}`}>
                                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 transform shadow-md ${t.on ? 'left-9' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SettingsMockUI;
