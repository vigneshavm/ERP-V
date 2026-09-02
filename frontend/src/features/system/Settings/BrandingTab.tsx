import React from 'react';
import { Palette, Sun, Moon, Shield, Upload, Info, Image as ImageIcon } from 'lucide-react';
import { BrandingTabProps } from './types';

const COLORS = [
    { name: 'Indigo Corporate', hex: '#4f46e5' },
    { name: 'Deep Emerald', hex: '#10b981' },
    { name: 'Modern Rose', hex: '#f43f5e' },
    { name: 'Amber Gold', hex: '#f59e0b' },
    { name: 'Royal Blue', hex: '#3b82f6' },
    { name: 'Violet Premium', hex: '#8b5cf6' },
    { name: 'Cyan Modern', hex: '#06b6d4' },
    { name: 'Slate Gray', hex: '#64748b' },
    { name: 'Power Black', hex: '#000000' },
    { name: 'Adidas Crimson', hex: '#E32B2B' },
    { name: 'Puma Onyx', hex: '#1E1E1E' },
];

const BrandingTab: React.FC<BrandingTabProps> = ({
    tenantTheme, setTenantTheme, primaryColor, setPrimaryColor, logoUrl, handleLogoUpload
}) => {
    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Visual Identity Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-violet-600 dark:text-accent" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Visual Identity</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Customize the interface to match your corporate brand</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                    {/* Theme Toggle */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Enterprise Interface Theme</label>
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-2 rounded-sm border border-slate-200 dark:border-slate-800 w-full shadow-inner">
                            <button
                                onClick={() => setTenantTheme('light')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black rounded-xl transition-all ${tenantTheme === 'light' ? 'bg-white text-primary shadow-xl' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                <Sun className="w-4 h-4" /> LIGHT
                            </button>
                            <button
                                onClick={() => setTenantTheme('dark')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black rounded-xl transition-all ${tenantTheme === 'dark' ? 'bg-slate-800 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                <Moon className="w-4 h-4" /> DARK
                            </button>
                            <button
                                onClick={() => setTenantTheme('system')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black rounded-xl transition-all ${tenantTheme === 'system' ? 'bg-white dark:bg-primary/20 text-primary dark:text-primary shadow-xl border border-indigo-100 dark:border-indigo-900/50' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                <Shield className="w-4 h-4" /> SYSTEM
                            </button>
                        </div>
                        <div className="flex items-start gap-2 ml-1">
                            <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">System theme automatically switches based on the operating system settings of the client terminal.</p>
                        </div>
                    </div>

                    {/* Color Palette */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Primary Signature Color</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setPrimaryColor(c.hex)}
                                    className={`w-10 h-10 rounded-full border-4 transition-all duration-300 ${primaryColor === c.hex ? 'border-indigo-100 dark:border-slate-600 scale-110 shadow-xl ring-2 ring-indigo-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                />
                            ))}
                            <div className="relative group">
                                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 opacity-0 absolute inset-0 cursor-pointer z-10" />
                                <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-pink-500 hover:opacity-90 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-white text-[10px] font-bold">+</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Asset Management Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Asset Management</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Manage brand logos and media resources</p>
                    </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="relative group">
                        <div className="w-48 h-48 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-8" />
                            ) : (
                                <div className="text-center space-y-2 opacity-20">
                                    <ImageIcon className="w-12 h-12 mx-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-tighter">No Active Logo</p>
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-600 text-white rounded-sm flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 animate-bounce">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-800 dark:text-white leading-none">Corporate Logo</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">This logo appears on all login screens, dashboards, and is automatically embedded in generated PDF invoices and reports.</p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-3 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-sm font-black transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95">
                                <Upload className="w-4 h-4" /> UPLOAD NEW ASSET
                            </label>
                            <button className="px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-sm text-sm font-black hover:bg-slate-50 transition-all">
                                REMOVE
                            </button>
                        </div>

                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">PNG / SVG</div>
                            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">MAX 2MB</div>
                            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">TRANSPARENT</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BrandingTab;
