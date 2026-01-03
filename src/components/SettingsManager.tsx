import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateSettings, resetSettings, updateTenantDetails, updateBranchSettings } from '../store';
import { Save, RotateCcw, Upload, Settings as SettingsIcon, Palette, LayoutGrid, Type, Shield, Lock, Calculator, Moon, Sun, Users, CheckCircle, Loader2 } from 'lucide-react';
import { AppView, SystemRole, TaxMode } from '../types/common';
import { useConfig } from './ConfigContext';
import { setStoredTheme } from '../utils/theme';
import { Tenant } from '../types/tenant';
import StaffManager from './StaffManager';

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

// Mapping readable labels to View IDs for Permissions
const PERMISSION_VIEWS: { id: AppView, label: string }[] = [
    { id: 'DASHBOARD', label: 'Dashboard' },
    { id: 'PROFIT_PULSE', label: 'Profit Pulse AI' }, // Added Profit Pulse
    { id: 'POS', label: 'Point of Sale' },
    { id: 'INVENTORY', label: 'Inventory' },
    { id: 'PURCHASE', label: 'Purchases' },
    { id: 'FINANCE', label: 'Finance & P&L' },
    { id: 'SALES', label: 'Sales History' },
    { id: 'DAILY', label: 'Daily Tracker' },
    { id: 'LABOR', label: 'Labor Mgmt' },
    { id: 'STOREFRONT', label: 'Storefront' },
    { id: 'SETTINGS', label: 'Settings' },
];

interface SettingsData {
    appName: string;
    logoUrl?: string;
    primaryColor: string;
    enabledModules: { [key: string]: boolean };
    defaultTaxMode: TaxMode;
    rolePermissions: { [key in SystemRole]: AppView[] };
}

interface SettingsFormProps {
    initialSettings: SettingsData;
    activeTenant?: Tenant;
    onSave: (data: SettingsData & { tenantTheme: 'light' | 'dark' }) => void;
    onReset: () => void;
    currentTheme: 'light' | 'dark';
    isSaved: boolean;
    onUpdateBranchSettings: (branchId: string, settings: Partial<SettingsData>) => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ initialSettings, activeTenant, onSave, onReset, currentTheme, isSaved, onUpdateBranchSettings }) => {
    // Initialize state from props. using 'key' in parent will force re-init when props change.
    const [appName, setAppName] = useState(initialSettings.appName);
    const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || '');
    const [primaryColor, setPrimaryColor] = useState(activeTenant?.primaryColor || initialSettings.primaryColor);
    const [modules, setModules] = useState(initialSettings.enabledModules);
    const [taxMode, setTaxMode] = useState<TaxMode>(initialSettings.defaultTaxMode);
    const [permissions, setPermissions] = useState(initialSettings.rolePermissions);
    const [tenantTheme, setTenantTheme] = useState<'light' | 'dark'>(currentTheme || 'light');

    // Navigation State
    const [activeSection, setActiveSection] = useState<'SYSTEM' | 'STAFF'>('SYSTEM');

    // Branch Override State
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [isBranchMode, setIsBranchMode] = useState(false);

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

    const handlePermissionToggle = (roleKey: SystemRole, view: AppView) => {
        if (roleKey === 'Owner') return; // Owner always has access
        setPermissions(prev => {
            const current = prev[roleKey] || [];
            const updated = current.includes(view)
                ? current.filter(v => v !== view)
                : [...current, view];
            return { ...prev, [roleKey]: updated };
        });
    };

    const triggerSave = () => {
        onSave({
            appName,
            logoUrl,
            primaryColor,
            enabledModules: modules,
            defaultTaxMode: taxMode,
            rolePermissions: permissions,
            tenantTheme
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-indigo-600" />
                        {isBranchMode ? 'Branch Configuration' : 'System Configuration'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {activeSection === 'STAFF' ? 'Manage your team and terminal assignments.' : isBranchMode ? `Managing overrides for branch: ${selectedBranchId} ` : 'Customize branding, features, and security.'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mr-4">
                        <button
                            onClick={() => setActiveSection('SYSTEM')}
                            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSection === 'SYSTEM' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'} `}
                        >
                            <SettingsIcon className="w-4 h-4" /> Configuration
                        </button>
                        <button
                            onClick={() => setActiveSection('STAFF')}
                            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSection === 'STAFF' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'} `}
                        >
                            <Users className="w-4 h-4" /> Team & Staff
                        </button>
                    </div>

                    {!isBranchMode && activeSection === 'SYSTEM' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Override per Branch</span>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSelectedBranchId(e.target.value);
                                        setIsBranchMode(true);
                                        // Find branch settings
                                        const loc = activeTenant?.locations?.find(l => l.branches.some(b => b.id === e.target.value));
                                        const branch = loc?.branches.find(b => b.id === e.target.value);
                                        if (branch?.settings) {
                                            setTaxMode(branch.settings.defaultTaxMode || initialSettings.defaultTaxMode);
                                        }
                                    }
                                }}
                                className="bg-transparent text-xs font-bold outline-none border-none dark:text-white"
                            >
                                <option value="">Select Branch...</option>
                                {activeTenant?.locations?.flatMap(l => l.branches).map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {isBranchMode && (
                        <button
                            onClick={() => setIsBranchMode(false)}
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold"
                        >
                            Back to Global
                        </button>
                    )}
                    <button
                        onClick={onReset}
                        className="px-4 py-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-bold transition-colors flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button
                        onClick={activeSection === 'STAFF' ? () => { } : isBranchMode ? () => onUpdateBranchSettings(selectedBranchId, { defaultTaxMode: taxMode }) : triggerSave}
                        className={`px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 ${activeSection === 'STAFF' ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <Save className="w-4 h-4" /> {isSaved ? 'Saved!' : isBranchMode ? 'Apply Override' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Warning if in Branch Mode */}
            {isBranchMode && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-4 text-amber-700 dark:text-amber-400">
                    <Shield className="w-6 h-6 shrink-0" />
                    <div>
                        <p className="text-sm font-bold uppercase tracking-tight">Branch-specific Override Active</p>
                        <p className="text-xs opacity-80">You are currently editing settings only for <strong>{selectedBranchId}</strong>. Other branches will continue to use global defaults.</p>
                    </div>
                </div>
            )}

            {activeSection === 'STAFF' ? (
                <StaffManager />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Theme</label>
                                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                                    <button
                                        onClick={() => setTenantTheme('light')}
                                        className={`flex items - center gap - 2 px - 4 py - 2 text - sm font - bold rounded - md transition - all ${tenantTheme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'} `}
                                    >
                                        <Sun className="w-4 h-4" /> Light
                                    </button>
                                    <button
                                        onClick={() => setTenantTheme('dark')}
                                        className={`flex items - center gap - 2 px - 4 py - 2 text - sm font - bold rounded - md transition - all ${tenantTheme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'} `}
                                    >
                                        <Moon className="w-4 h-4" /> Dark
                                    </button>
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
                                            className={`w - 8 h - 8 rounded - full border - 2 transition - all ${primaryColor === c.hex ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'} `}
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
                        <p className="text-xs text-slate-400 mt-6 text-center">Disabled modules will be hidden globally.</p>
                    </div>

                    {/* Financial Defaults */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-indigo-500" /> Financial Defaults
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Default Tax Mode</label>
                                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setTaxMode('EXCLUSIVE')}
                                        className={`flex - 1 py - 2 text - sm font - bold rounded - md transition - all ${taxMode === 'EXCLUSIVE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'} `}
                                    >
                                        Exclusive (+ Tax)
                                    </button>
                                    <button
                                        onClick={() => setTaxMode('INCLUSIVE')}
                                        className={`flex - 1 py - 2 text - sm font - bold rounded - md transition - all ${taxMode === 'INCLUSIVE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'} `}
                                    >
                                        Inclusive (Inc. Tax)
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">This will be the default selection for new POS sessions.</p>
                            </div>
                        </div>
                    </div>


                    {/* Security & Data Maintenance */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-indigo-500" /> Security & Maintenance
                        </h3>
                        <SecurityMigrationManager />
                    </div>

                    {/* Role Access Control (Full Width) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-500" /> Role Access Control
                        </h3>


                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3">Module / View</th>
                                        <th className="px-6 py-3 text-center text-emerald-600">Owner <span className="block text-[9px] text-slate-400">Full Access</span></th>
                                        <th className="px-6 py-3 text-center">Manager</th>
                                        <th className="px-6 py-3 text-center">Staff</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {PERMISSION_VIEWS.map(view => (
                                        <tr key={view.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{view.label}</td>
                                            <td className="px-6 py-4 text-center">
                                                <CheckToggle checked={true} disabled />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <CheckToggle
                                                    checked={permissions['Manager'].includes(view.id)}
                                                    onChange={() => handlePermissionToggle('Manager', view.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <CheckToggle
                                                    checked={permissions['Staff'].includes(view.id)}
                                                    onChange={() => handlePermissionToggle('Staff', view.id)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Helper Component for Migration ---
import { isSecuredIdeally, securePassword } from '../utils/auth';
import { supabase } from '../lib/supabase';

const SecurityMigrationManager: React.FC = () => {
    // We access employees from labor slice or where they are stored globally
    const { employees } = useSelector((state: RootState) => state.labor);
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState({ total: 0, done: 0 });

    // Identify users who need migration (Not in ideal format)
    const insecureUsers = React.useMemo(() => {
        return employees.filter(e => e.pin && !isSecuredIdeally(e.pin));
    }, [employees]);

    const handleMigrateAll = async () => {
        if (!confirm(`Are you sure you want to secure ${insecureUsers.length} passwords? This operation cannot be undone.`)) return;

        setIsMigrating(true);
        setProgress({ total: insecureUsers.length, done: 0 });

        let successCount = 0;
        let failCount = 0;

        for (const user of insecureUsers) {
            try {
                // 1. Secure the existing plain text (or re-secure/re-hash)
                // Note: user.pin might be an old hash or encrypted string if we are switching modes. 
                // Wait, if it's already a hash/encrypted but NOT the ideal one, we can't easily re-secure it 
                // unless we have the plain text.
                // However, the `insecureUsers` check relies on `isSecuredIdeally`.
                // If I am in HASH mode, and I have an `enc_` password, `isSecuredIdeally` returns false.
                // But I CANNOT convert `enc_` to Hash without decrypting first.
                // This tool assumes we are migrating PLAIN TEXT primarily.
                // If we want to support Mode Switching (Encrypt -> Hash), we need the plain text.
                // We can't get plain text from Hash.
                // We CAN get plain text from Encrypt (if we have the key).

                // For safety: This specific batch tool is risky if we are migrating FROM a secure format TO another without decryption logic here.
                // But `isSecuredIdeally` handles generic "is it good?".
                // If `user.pin` is `enc_` and we are in HASH mode, `securePassword` will try to HASH the `enc_` string!
                // That results in double-wrapping invalidly.
                // Let's refine this tool to only migrate PLAIN text for safety in this iteration, 
                // OR attempt detection.

                let rawPin = user.pin;
                // If it looks like encryption and we can decrypt it, do so?
                // `comparePassword` does this logic but returns bool.
                // `auth.ts` doesn't export decrypt.
                // For now, let's assume this tool deals with PLAIN text legacy users. 
                // If the user is already "secure" in a different format, we might skip them to avoid corrupting, 
                // OR we trust the admin knows what they are doing.
                // Let's stick to migrating PLAIN TEXT (length < 20 usually, hashes are long).
                // Or better: check if it starts with enc_ or $2a$. If so, SKIP automated migration here 
                // because we can't know the plain text securely.

                // Helper to check if it looks like ANY secure format
                const isAnySecure = (p: string) => p.startsWith('enc_') || p.startsWith('$2a$') || p.startsWith('$2b$');

                if (isAnySecure(rawPin)) {
                    // It is secure, just not "ideally" (e.g. Encrypted when we want Hash). 
                    // We skip batch migration for these to avoid data loss.
                    // They will be auto-migrated on login!
                    console.warn(`Skipping user ${user.name} - already has a secure format, cannot auto-convert without login.`);
                    continue;
                }

                const secured = await securePassword(rawPin);

                // 2. Update Supabase
                const { error } = await supabase
                    .from('employees')
                    .update({ pin: secured })
                    .eq('id', user.id);

                if (error) throw error;

                successCount++;
            } catch (err) {
                console.error(`Failed to migrate user ${user.name}:`, err);
                failCount++;
            }
            setProgress(prev => ({ ...prev, done: prev.done + 1 }));
        }

        alert(`Migration Complete.\nSecured: ${successCount}\nSkipped/Failed: ${insecureUsers.length - successCount}`);
        setIsMigrating(false);
        window.location.reload();
    };

    if (insecureUsers.length === 0) {
        return (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-6 h-6 shrink-0" />
                <div>
                    <p className="font-bold text-sm">System Secure</p>
                    <p className="text-xs opacity-80">All {employees.length} user passwords are hashed and secured.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-100 dark:border-amber-800">
                <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-sm">Security Action Required</p>
                        <p className="text-xs mt-1 mb-3 opacity-90">
                            Found <strong>{insecureUsers.length}</strong> users with legacy insecure passwords.
                            These should be migrated to the new hashing standard immediately.
                        </p>
                        <button
                            onClick={handleMigrateAll}
                            disabled={isMigrating}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            {isMigrating ? `Securing ${progress.done}/${progress.total}...` : 'Secure All Passwords Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsManager: React.FC = () => {
    const dispatch = useDispatch();
    const settings = useSelector((state: RootState) => state.settings);
    const tenantsList = useSelector((state: RootState) => state.tenant.tenants);
    const { role } = useSelector((state: RootState) => state.auth);
    const { tenantId, theme: currentTheme } = useConfig();
    const [isSaved, setIsSaved] = useState(false);

    const activeTenant = tenantsList.find(t => t.id === tenantId);

    const handleSave = (updatedSettings: SettingsData & { tenantTheme: 'light' | 'dark' }) => {
        dispatch(updateSettings({
            appName: updatedSettings.appName,
            logoUrl: updatedSettings.logoUrl,
            primaryColor: updatedSettings.primaryColor,
            enabledModules: updatedSettings.enabledModules,
            defaultTaxMode: updatedSettings.defaultTaxMode,
            rolePermissions: updatedSettings.rolePermissions
        }));

        // Update Tenant Theme & Primary Color
        if (tenantId) {
            const currentTenant = tenantsList.find(t => t.id === tenantId);
            if (currentTenant) {
                dispatch(updateTenantDetails({
                    ...currentTenant,
                    theme: updatedSettings.tenantTheme,
                    primaryColor: updatedSettings.primaryColor
                }));
            }
        }

        // Persist theme to localStorage for immediate and consistent application
        setStoredTheme(updatedSettings.tenantTheme);

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleUpdateBranchSettings = (branchId: string, updatedSettings: Partial<SettingsData>) => {
        if (!tenantId) return;
        dispatch(updateBranchSettings({
            tenantId,
            branchId,
            settings: updatedSettings
        }));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleReset = () => {
        if (window.confirm("Reset all settings to default?")) {
            dispatch(resetSettings());
        }
    };

    if (role !== 'Owner') {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <Lock className="w-12 h-12 mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">Access Restricted</h2>
                <p>Only the System Owner can modify settings.</p>
            </div>
        );
    }

    // Key includes settings version (derived from settings object) and theme/tenant props
    // to ensure form resets when external data changes
    const formKey = `${tenantId} -${currentTheme} -${JSON.stringify(settings)} `;

    return (
        <SettingsForm
            key={formKey}
            initialSettings={settings}
            activeTenant={activeTenant}
            currentTheme={currentTheme || 'light'}
            onSave={handleSave}
            onReset={handleReset}
            onUpdateBranchSettings={handleUpdateBranchSettings}
            isSaved={isSaved}
        />
    );
};

const CheckToggle = ({ checked, onChange, disabled = false }: { checked: boolean, onChange?: () => void, disabled?: boolean }) => (
    <label className={`relative inline - flex items - center cursor - pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} `}>
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
);

export default SettingsManager;
