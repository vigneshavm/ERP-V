
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateSettings, resetSettings } from '../store';
import { Save, RotateCcw, Upload, Settings as SettingsIcon, Palette, LayoutGrid, Type } from 'lucide-react';

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
    { name: 'Adidas Red', hex: '#E32B2B' }, // Example Brand
    { name: 'Puma Black', hex: '#1E1E1E' }, // Example Brand
];

const MODULES = [
    { id: 'pos', label: 'Point of Sale' },
    { id: 'inventory', label: 'Inventory Management' },
    { id: 'finance', label: 'Finance & Accounting' },
    { id: 'labor', label: 'Staff & Payroll' },
    { id: 'purchases', label: 'Purchase & AI' },
    { id: 'sales', label: 'Sales History' },
    { id: 'daily', label: 'Daily Tracker' },
    { id: 'storefront', label: 'Web Storefront' },
];

const SettingsManager: React.FC = () => {
    const dispatch = useDispatch();
    const settings = useSelector((state: RootState) => state.settings);

    // Local state for form management
    const [appName, setAppName] = useState(settings.appName);
    const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
    const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
    const [modules, setModules] = useState(settings.enabledModules);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setAppName(settings.appName);
        setLogoUrl(settings.logoUrl || '');
        setPrimaryColor(settings.primaryColor);
        setModules(settings.enabledModules);
    }, [settings]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleModuleToggle = (id: keyof typeof modules) => {
        setModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSave = () => {
        dispatch(updateSettings({
            appName,
            logoUrl,
            primaryColor,
            enabledModules: modules
        }));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleReset = () => {
        if (window.confirm("Reset all settings to default?")) {
            dispatch(resetSettings());
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-indigo-600" />
                        System Configuration
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Customize the ERP for your tenant (Branding, Features, UI).</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-bold transition-colors flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Save className="w-4 h-4" /> {isSaved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Branding Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-500" /> Branding & Theme
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={appName}
                                    onChange={e => setAppName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    placeholder="e.g. Adidas Store"
                                />
                                <Type className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-slate-400 text-xs">No Logo</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                    <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors">
                                        <Upload className="w-4 h-4" /> Upload Logo
                                    </label>
                                    <p className="text-[10px] text-slate-400 mt-2">Recommended: 200x200px PNG transparent.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Primary Brand Color</label>
                            <div className="flex flex-wrap gap-3">
                                {COLORS.map(c => (
                                    <button
                                        key={c.name}
                                        onClick={() => setPrimaryColor(c.hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${primaryColor === c.hex ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    />
                                ))}
                                <div className="relative group">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={e => setPrimaryColor(e.target.value)}
                                        className="w-8 h-8 opacity-0 absolute inset-0 cursor-pointer"
                                    />
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-pink-500">
                                        <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold">+</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Configuration */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-indigo-500" /> Module Configuration
                    </h3>

                    <div className="space-y-4">
                        {MODULES.map(mod => (
                            <div key={mod.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <span className="font-medium text-slate-700 dark:text-slate-200">{mod.label}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={modules[mod.id as keyof typeof modules]}
                                        onChange={() => handleModuleToggle(mod.id as keyof typeof modules)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-6 text-center">Disabled modules will be hidden from the sidebar and inaccessible to staff.</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;
