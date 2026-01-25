import React from 'react';
import { Settings, Globe, ShieldCheck } from 'lucide-react';

const CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
];

export const BrandingTab: React.FC<{
    newTenant: any, setNewTenant: any,
    logoInput: string, setLogoInput: (val: string) => void
}> = ({ newTenant, setNewTenant, logoInput, setLogoInput }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Visual Preferences */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    Visual Preferences
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Theme</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none capitalize"
                            value={newTenant.theme}
                            onChange={e => setNewTenant({ ...newTenant, theme: e.target.value as 'light' | 'dark' })}
                        >
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Layout Density</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none capitalize"
                            value={newTenant.layout}
                            onChange={e => setNewTenant({ ...newTenant, layout: e.target.value as 'standard' | 'compact' })}
                        >
                            <option value="standard">Standard (Relaxed)</option>
                            <option value="compact">Compact (Data Heavy)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Primary Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                className="h-9 w-12 rounded cursor-pointer border border-slate-200 p-0.5"
                                value={newTenant.primaryColor || '#4f46e5'}
                                onChange={e => setNewTenant({ ...newTenant, primaryColor: e.target.value })}
                            />
                            <input
                                type="text"
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                value={newTenant.primaryColor || '#4f46e5'}
                                onChange={e => setNewTenant({ ...newTenant, primaryColor: e.target.value })}
                                maxLength={7}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Regional Settings */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    Regional Settings
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Base Currency</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.currency}
                            onChange={e => setNewTenant({ ...newTenant, currency: e.target.value })}
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Date Format</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.dateFormat}
                            onChange={e => setNewTenant({ ...newTenant, dateFormat: e.target.value })}
                        >
                            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (UK/India)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-indigo-900">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold">Login Page Customization</p>
                    <p className="text-xs opacity-80">Provide publicly accessible image URLs for the tenant's login portal.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo URL</label>
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 space-y-2">
                            <input
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={logoInput}
                                onChange={e => setLogoInput(e.target.value)}
                                onBlur={() => setNewTenant({ ...newTenant, loginLogoUrl: logoInput })}
                                placeholder="https://example.com/logo.png"
                            />
                            <p className="text-[10px] text-slate-400">Recommended: Square PNG with transparency. Preview updates after you click away.</p>
                        </div>
                        {newTenant.loginLogoUrl && (
                            <div className="w-[200px] h-[200px] border-2 border-dashed border-slate-200 rounded-2xl p-2 bg-slate-50/50 flex items-center justify-center overflow-hidden shrink-0 mx-auto group relative">
                                <img
                                    src={newTenant.loginLogoUrl}
                                    alt="Logo"
                                    className="w-[200px] h-[200px] object-contain transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold text-slate-500 uppercase border border-slate-100 shadow-sm">200 x 200</div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Login Background Image URL</label>
                    <div className="space-y-2">
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={newTenant.loginBgUrl}
                            onChange={e => setNewTenant({ ...newTenant, loginBgUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                        />
                        {newTenant.loginBgUrl && (
                            <div className="aspect-video w-full rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative">
                                <img src={newTenant.loginBgUrl} alt="Background" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">Preview</span>
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] text-slate-400">High Resolution (1920x1080px or higher) landscape images work best.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
