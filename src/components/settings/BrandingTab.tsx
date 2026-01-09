import React from 'react';
import { Palette, Sun, Moon, Shield, Upload } from 'lucide-react';
import { Theme } from '../../utils/theme';

interface BrandingTabProps {
    tenantTheme: Theme;
    setTenantTheme: (t: Theme) => void;
    primaryColor: string;
    setPrimaryColor: (c: string) => void;
    logoUrl: string;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const COLORS = [
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Slate', hex: '#64748b' },
    { name: 'Black', hex: '#000000' },
    { name: 'Adidas Red', hex: '#E32B2B' },
    { name: 'Puma Black', hex: '#1E1E1E' },
];

const BrandingTab: React.FC<BrandingTabProps> = ({
    tenantTheme, setTenantTheme, primaryColor, setPrimaryColor, logoUrl, handleLogoUpload
}) => {
    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-500" /> Visual Identity
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Theme</label>
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                            <button onClick={() => setTenantTheme('light')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${tenantTheme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                <Sun className="w-4 h-4" /> Light
                            </button>
                            <button onClick={() => setTenantTheme('dark')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${tenantTheme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                <Moon className="w-4 h-4" /> Dark
                            </button>
                            <button onClick={() => setTenantTheme('system')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${tenantTheme === 'system' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-200 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                <Shield className="w-4 h-4" /> System
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-balance">Choose the default appearance for all terminals. Users can override this locally if allowed.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Brand Color</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setPrimaryColor(c.hex)}
                                    className={`w-10 h-10 rounded-full border-4 transition-all ${primaryColor === c.hex ? 'border-indigo-100 dark:border-slate-600 scale-110 shadow-md ring-2 ring-indigo-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                />
                            ))}
                            <div className="relative group">
                                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 opacity-0 absolute inset-0 cursor-pointer" />
                                <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-pink-500 hover:opacity-90 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold">+</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Login & Dashboard Logo</label>
                        <div className="flex items-center gap-6">
                            <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                                ) : (
                                    <span className="text-slate-400 text-xs font-medium">No Logo</span>
                                )}
                            </div>
                            <div className="space-y-3">
                                <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-bold transition-colors">
                                    <Upload className="w-4 h-4" /> Upload New Logo
                                </label>
                                <p className="text-xs text-slate-400 max-w-xs">Recommended: 400x400px PNG with transparent background. Max size 2MB.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandingTab;
