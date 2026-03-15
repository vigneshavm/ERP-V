import React, { useState, useCallback, useMemo, useOptimistic, useTransition } from 'react';
import {
    Palette, Sun, Moon, Shield, Upload, Info, Image as ImageIcon,
    Monitor, Smartphone, Eye, Sparkles, Check, X, Layers, RotateCcw
} from 'lucide-react';
import { BrandingTabProps, TenantTheme } from './types';

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

/* ─── Live Terminal Preview ────────────────────────────────── */
const LiveTerminalPreview: React.FC<{
    color: string; theme: TenantTheme; logo: string | null; appName?: string;
}> = ({ color, theme, logo, appName = 'BizzAI' }) => {
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const isDark = theme === 'dark';
    const bg = isDark ? '#0f172a' : '#ffffff';
    const panelBg = isDark ? '#1e293b' : '#f8fafc';
    const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
    const textMuted = isDark ? '#64748b' : '#94a3b8';
    const borderColor = isDark ? '#334155' : '#e2e8f0';

    return (
        <div className="relative">
            {/* Device Switcher */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Terminal Preview</span>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Preview Frame */}
            <div
                className={`rounded-3xl overflow-hidden border-2 transition-all duration-500 shadow-2xl ${previewMode === 'mobile' ? 'max-w-[280px] mx-auto' : 'w-full'}`}
                style={{ borderColor }}
            >
                {/* Title Bar */}
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: panelBg, borderBottom: `1px solid ${borderColor}` }}>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 text-center">
                        <div className="inline-block px-6 py-1 rounded-md text-[8px] font-bold" style={{ backgroundColor: bg, color: textMuted, border: `1px solid ${borderColor}` }}>
                            erp.bizzai.com/dashboard
                        </div>
                    </div>
                </div>

                {/* App Preview */}
                <div className="flex" style={{ backgroundColor: bg, minHeight: previewMode === 'mobile' ? 320 : 240 }}>
                    {/* Sidebar */}
                    <div
                        className={`${previewMode === 'mobile' ? 'hidden' : 'flex'} flex-col gap-2 p-3`}
                        style={{ backgroundColor: panelBg, borderRight: `1px solid ${borderColor}`, width: 56 }}
                    >
                        {/* Logo */}
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 overflow-hidden" style={{ backgroundColor: color }}>
                            {logo ? (
                                <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
                            ) : (
                                <span className="text-white text-[8px] font-black">{appName.substring(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-xl transition-all"
                                style={{
                                    backgroundColor: i === 0 ? `${color}20` : 'transparent',
                                    border: i === 0 ? `2px solid ${color}` : `1px solid ${borderColor}`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4 space-y-3">
                        {/* Header with brand color */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {previewMode === 'mobile' && (
                                    <div className="w-7 h-7 rounded-lg overflow-hidden" style={{ backgroundColor: color }}>
                                        {logo ? (
                                            <img src={logo} alt="" className="w-full h-full object-contain p-0.5" />
                                        ) : (
                                            <span className="flex items-center justify-center w-full h-full text-white text-[7px] font-black">{appName.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <div className="h-2.5 rounded-full w-20" style={{ backgroundColor: textPrimary, opacity: 0.7 }} />
                                    <div className="h-1.5 rounded-full w-12 mt-1.5" style={{ backgroundColor: textMuted, opacity: 0.3 }} />
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color, opacity: 0.15 }} />
                        </div>

                        {/* Stats Row */}
                        <div className={`grid ${previewMode === 'mobile' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                            {[...Array(previewMode === 'mobile' ? 2 : 3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl p-3"
                                    style={{ backgroundColor: panelBg, border: `1px solid ${borderColor}` }}
                                >
                                    <div className="w-6 h-6 rounded-lg mb-2" style={{ backgroundColor: `${color}20` }}>
                                        <div className="w-full h-full rounded-lg flex items-center justify-center">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full w-8" style={{ backgroundColor: textMuted, opacity: 0.2 }} />
                                    <div className="h-3 rounded-full w-12 mt-1" style={{ backgroundColor: textPrimary, opacity: 0.5 }} />
                                </div>
                            ))}
                        </div>

                        {/* Chart-like Area */}
                        <div className="rounded-2xl p-3" style={{ backgroundColor: panelBg, border: `1px solid ${borderColor}` }}>
                            <div className="flex gap-1 items-end h-12">
                                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 45].map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t transition-all"
                                        style={{
                                            height: `${h}%`,
                                            backgroundColor: color,
                                            opacity: 0.15 + (i % 3) * 0.15
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end">
                            <div
                                className="px-4 py-1.5 rounded-lg text-[7px] font-black text-white tracking-widest"
                                style={{ backgroundColor: color }}
                            >
                                NEW INVOICE
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shimmer overlay on color change */}
            <div
                className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"
                style={{ animationDuration: '3s' }}
            />
        </div>
    );
};

/* ─── Main BrandingTab ─────────────────────────────────────── */
const BrandingTab: React.FC<BrandingTabProps> = ({
    tenantTheme, setTenantTheme, primaryColor, setPrimaryColor, logoUrl, handleLogoUpload
}) => {
    const [isPending, startTransition] = useTransition();
    const [optimisticColor, setOptimisticColor] = useOptimistic(primaryColor);
    const [optimisticTheme, setOptimisticTheme] = useOptimistic(tenantTheme);

    const handleColorChange = useCallback((hex: string) => {
        startTransition(() => {
            setOptimisticColor(hex);
            setPrimaryColor(hex);
        });
    }, [setPrimaryColor, setOptimisticColor, startTransition]);

    const handleThemeChange = useCallback((theme: TenantTheme) => {
        startTransition(() => {
            setOptimisticTheme(theme);
            setTenantTheme(theme);
        });
    }, [setTenantTheme, setOptimisticTheme, startTransition]);

    const selectedColorName = useMemo(
        () => COLORS.find(c => c.hex === optimisticColor)?.name || 'Custom',
        [optimisticColor]
    );

    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Visual Identity Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Visual Identity</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Customize the interface to match your corporate brand</p>
                    </div>
                    {isPending && (
                        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Applying</span>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-5 gap-10">
                    {/* Left Column — Controls */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Theme Toggle */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Enterprise Interface Theme</label>
                            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-full shadow-inner">
                                <button
                                    onClick={() => handleThemeChange('light')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black rounded-xl transition-all ${optimisticTheme === 'light' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                >
                                    <Sun className="w-4 h-4" /> LIGHT
                                </button>
                                <button
                                    onClick={() => handleThemeChange('dark')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black rounded-xl transition-all ${optimisticTheme === 'dark' ? 'bg-slate-800 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                >
                                    <Moon className="w-4 h-4" /> DARK
                                </button>
                                <button
                                    onClick={() => handleThemeChange('system')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black rounded-xl transition-all ${optimisticTheme === 'system' ? 'bg-white dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 shadow-xl border border-indigo-100 dark:border-indigo-900/50' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
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
                            <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Primary Signature Color</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-700 shadow-sm transition-all" style={{ backgroundColor: optimisticColor }} />
                                    <span className="text-[10px] font-black text-slate-500">{selectedColorName}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {COLORS.map(c => (
                                    <button
                                        key={c.name}
                                        onClick={() => handleColorChange(c.hex)}
                                        className={`w-10 h-10 rounded-full border-4 transition-all duration-300 relative group ${optimisticColor === c.hex ? 'border-indigo-100 dark:border-slate-600 scale-110 shadow-xl ring-2 ring-indigo-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    >
                                        {optimisticColor === c.hex && (
                                            <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                                        )}
                                        {/* Tooltip */}
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[8px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                            {c.name}
                                        </span>
                                    </button>
                                ))}
                                <div className="relative group">
                                    <input type="color" value={optimisticColor} onChange={e => handleColorChange(e.target.value)} className="w-10 h-10 opacity-0 absolute inset-0 cursor-pointer z-10" />
                                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-pink-500 hover:opacity-90 transition-opacity">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-white text-[10px] font-bold">+</div>
                                    </div>
                                </div>
                            </div>

                            {/* Color Application Preview */}
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {['Button', 'Badge', 'Link'].map((label, i) => (
                                    <div key={label} className="rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                        <div
                                            className={`mx-auto rounded-lg mb-1.5 transition-all ${i === 0 ? 'px-4 py-1.5 text-white text-[8px] font-black' : i === 1 ? 'w-fit px-3 py-1 text-[8px] font-black rounded-full mx-auto' : 'underline text-[9px] font-bold'}`}
                                            style={{
                                                backgroundColor: i < 2 ? (i === 0 ? optimisticColor : `${optimisticColor}20`) : 'transparent',
                                                color: i === 0 ? '#fff' : optimisticColor,
                                            }}
                                        >
                                            {label}
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column — Live Preview */}
                    <div className="lg:col-span-3">
                        <LiveTerminalPreview
                            color={optimisticColor}
                            theme={optimisticTheme}
                            logo={logoUrl}
                        />
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
                        <div
                            className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 text-white"
                            style={{ backgroundColor: optimisticColor }}
                        >
                            <Sparkles className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-800 dark:text-white leading-none">Corporate Logo</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">This logo appears on all login screens, dashboards, and is automatically embedded in generated PDF invoices and reports.</p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            <label
                                htmlFor="logo-upload"
                                className="cursor-pointer inline-flex items-center gap-3 px-8 py-3.5 text-white rounded-2xl text-sm font-black transition-all shadow-lg hover:shadow-xl active:scale-95"
                                style={{ backgroundColor: optimisticColor }}
                            >
                                <Upload className="w-4 h-4" /> UPLOAD NEW ASSET
                            </label>
                            <button className="px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all">
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
