import React, { useState, useMemo } from 'react';
import { APP_CONFIG } from '../config';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateSettings, resetSettings, updateTenantDetails, updateBranchSettings } from '../store';
import { Save, RotateCcw, Upload, Settings as SettingsIcon, Palette, LayoutGrid, Type, Shield, Lock, Calculator, Moon, Sun, Users, CheckCircle, Loader2, Store, User } from 'lucide-react';
import { AppView, SystemRole, TaxMode } from '../types/common';
import { useConfig } from './ConfigContext';
import { setUserPreferences, settingsReducer } from '../store/tenantSlice';
import { setStoredTheme, Theme } from '../utils/theme';
import { Tenant, Role } from '../types/tenant';
import StaffManager from './StaffManager';
import { isSecuredIdeally, securePassword } from '../utils/auth';
import { supabase } from '../lib/supabase';

// --- Constants ---
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

const PERMISSION_VIEWS: { id: AppView, label: string }[] = [
    { id: 'DASHBOARD', label: 'Dashboard' },
    { id: 'PROFIT_PULSE', label: 'Profit Pulse AI' },
    { id: 'POS', label: 'Point of Sale' },
    { id: 'INVENTORY', label: 'Inventory' },
    { id: 'PURCHASE', label: 'Purchases' },
    { id: 'FINANCE', label: 'Finance & P&L' },
    { id: 'SALES', label: 'Sales History' },
    { id: 'DAILY', label: 'Daily Tracker' },
    { id: 'LABOR', label: 'Labor Mgmt' },
    { id: 'STOREFRONT', label: 'Storefront' },
    { id: 'SETTINGS', label: 'Settings' },
    { id: 'VENDORS', label: 'Suppliers' },
    { id: 'VENDOR_FORM', label: 'Add/Edit Supplier' },
    { id: 'VENDOR_DETAILS', label: 'Supplier Details' },
];

// --- Types ---
interface SettingsData {
    appName: string;
    logoUrl?: string;
    primaryColor: string;
    enabledModules: {
        pos: boolean;
        inventory: boolean;
        finance: boolean;
        labor: boolean;
        purchases: boolean;
        sales: boolean;
        daily: boolean;
        storefront: boolean;
        [key: string]: boolean;
    };
    defaultTaxMode: TaxMode;
    rolePermissions: { [key: string]: AppView[] };

    // Multi-table fields
    businessType?: string;
    natureOfBusiness?: 'Retail' | 'Wholesale' | 'Services' | 'Manufacturing';
    tradeDescription?: string;

    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    website?: string;

    gstin?: string;
    pan?: string;

    bankName?: string;
    accNo?: string;
    ifsc?: string;
    accountHolderName?: string;

    // Personalization Overrides
    userTheme?: 'light' | 'dark' | 'system';
    userColor?: string;
    userLogo?: string;
}

interface SettingsFormProps {
    initialSettings: SettingsData;
    activeTenant?: Tenant;
    roles: Role[];
    onSave: (data: SettingsData & { tenantTheme: Theme }) => void;
    onReset: () => void;
    currentTheme: 'light' | 'dark';
    isSaved: boolean;
    onUpdateBranchSettings: (branchId: string, settings: Partial<SettingsData>) => void;
}

// --- Helper Components ---

const CheckToggle = ({ checked, onChange, disabled = false }: { checked: boolean, onChange?: () => void, disabled?: boolean }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
);

const SecurityMigrationManager: React.FC = () => {
    const { employees } = useSelector((state: RootState) => state.labor);
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState({ total: 0, done: 0 });

    const insecureUsers = useMemo(() => {
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
                let rawPin = user.pin;
                const isAnySecure = (p: string) => p.startsWith('enc_') || p.startsWith('$2a$') || p.startsWith('$2b$');

                if (isAnySecure(rawPin)) {
                    console.warn(`Skipping user ${user.name} - already has a secure format, cannot auto-convert without login.`);
                    continue;
                }

                const secured = await securePassword(rawPin);

                const { error } = await supabase
                    .from('tenant_users')
                    .update({
                        pin_hash: secured,
                        password_hash: secured // Also update password_hash to allow login
                    })
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

// --- Main Form Component ---

const SettingsForm: React.FC<SettingsFormProps> = ({ initialSettings, activeTenant, roles, onSave, onReset, currentTheme, isSaved, onUpdateBranchSettings }) => {
    // Top Level Tabs
    const { role } = useSelector((state: RootState) => state.auth);
    // Top Level Tabs
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'BRANDING' | 'MODULES' | 'FINANCE' | 'SECURITY' | 'PERSONAL'>(role === 'Owner' ? 'GENERAL' : 'PERSONAL');

    // Local State (initialized from Tenant or Settings)
    const [appName, setAppName] = useState(activeTenant?.name || initialSettings.appName);
    const [logoUrl, setLogoUrl] = useState(activeTenant?.loginLogoUrl || initialSettings.logoUrl || '');
    const [primaryColor, setPrimaryColor] = useState(activeTenant?.primaryColor || initialSettings.primaryColor);
    const [modules, setModules] = useState(initialSettings.enabledModules);
    const [taxMode, setTaxMode] = useState<TaxMode>(
        (activeTenant?.systemConfig?.pricingMode as TaxMode) || initialSettings.defaultTaxMode
    );
    const [permissions, setPermissions] = useState(initialSettings.rolePermissions);
    const [tenantTheme, setTenantTheme] = useState<Theme>(currentTheme || 'light');

    // Additional Tenant Fields
    const [businessType, setBusinessType] = useState(activeTenant?.businessType || '');
    const [natureOfBusiness, setNatureOfBusiness] = useState(activeTenant?.natureOfBusiness || '');
    const [tradeDescription, setTradeDescription] = useState(activeTenant?.tradeDescription || '');

    const [addressLine1, setAddressLine1] = useState(activeTenant?.companyDetails?.addressLine1 || '');
    const [addressLine2, setAddressLine2] = useState(activeTenant?.companyDetails?.addressLine2 || '');
    const [city, setCity] = useState(activeTenant?.companyDetails?.city || '');
    const [state, setState] = useState(activeTenant?.companyDetails?.state || '');
    const [pincode, setPincode] = useState(activeTenant?.companyDetails?.pincode || '');
    const [phone, setPhone] = useState(activeTenant?.companyDetails?.phone || '');
    const [email, setEmail] = useState(activeTenant?.companyDetails?.email || '');
    const [website, setWebsite] = useState(activeTenant?.companyDetails?.website || '');

    const [gstin, setGstin] = useState(activeTenant?.taxDetails?.gstin || '');
    const [pan, setPan] = useState(activeTenant?.taxDetails?.pan || '');
    const [bankName, setBankName] = useState(activeTenant?.bankingDetails?.bankName || '');
    const [accNo, setAccNo] = useState(activeTenant?.bankingDetails?.accountNumber || '');
    const [ifsc, setIfsc] = useState(activeTenant?.bankingDetails?.ifsc || '');
    const [accountHolderName, setAccountHolderName] = useState(activeTenant?.bankingDetails?.accountHolderName || '');

    // User Specific Preferences
    const [userTheme, setUserTheme] = useState<'light' | 'dark' | 'system'>(initialSettings.userTheme || 'system');
    const [userColor, setUserColor] = useState(initialSettings.userColor || '');
    const [userLogo, setUserLogo] = useState(initialSettings.userLogo || '');

    // Branch Override
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

    const handlePermissionToggle = (roleCode: string, view: AppView) => {
        if (roleCode === 'owner') return;
        setPermissions(prev => {
            const current = prev[roleCode] || [];
            const updated = current.includes(view) ? current.filter(v => v !== view) : [...current, view];
            return { ...prev, [roleCode]: updated };
        });
    };

    const triggerSave = () => {
        // Construct updated data
        onSave({
            appName,
            logoUrl,
            primaryColor,
            enabledModules: modules,
            defaultTaxMode: taxMode,
            rolePermissions: permissions,
            tenantTheme,
            // Extra data passed to handler to update Tenant details
            businessType, natureOfBusiness, tradeDescription,
            addressLine1, addressLine2, city, state, pincode, phone, email, website,
            gstin, pan, bankName, accNo, ifsc, accountHolderName,
            userTheme, userColor, userLogo
        });
    };

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition-all w-full md:w-auto ${activeTab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-indigo-600" />
                        System Configuration
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Customize your tenant environment, branding, and security policies.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Branch Override Selector */}
                    {!isBranchMode && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Branch Override</span>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSelectedBranchId(e.target.value);
                                        setIsBranchMode(true);
                                        // Logic to load branch specific settings would go here
                                    }
                                }}
                                className="bg-transparent text-xs font-bold outline-none border-none dark:text-white cursor-pointer"
                                value=""
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
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"
                        >
                            Exit Override
                        </button>
                    )}

                    <button
                        onClick={onReset}
                        className="px-4 py-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-bold transition-colors flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button
                        onClick={isBranchMode ? () => onUpdateBranchSettings(selectedBranchId, { defaultTaxMode: taxMode }) : triggerSave}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaved ? 'Saved!' : isBranchMode ? 'Apply Override' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Warning if in Branch Mode */}
            {isBranchMode && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-4 text-amber-700 dark:text-amber-400 animate-pulse">
                    <Shield className="w-6 h-6 shrink-0" />
                    <div>
                        <p className="text-sm font-bold uppercase tracking-tight">Branch-specific Override Active</p>
                        <p className="text-xs opacity-80">You are currently editing settings only for <strong>{selectedBranchId}</strong>. Other branches will continue to use global defaults.</p>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                {role === 'Owner' && (
                    <>
                        <TabButton id="GENERAL" label="General Info" icon={Store} />
                        <TabButton id="BRANDING" label="Branding & Theme" icon={Palette} />
                        <TabButton id="MODULES" label="Modules" icon={LayoutGrid} />
                        <TabButton id="FINANCE" label="Finance & Tax" icon={Calculator} />
                        <TabButton id="SECURITY" label="Security & Roles" icon={Shield} />
                    </>
                )}
                <TabButton id="PERSONAL" label="Personalization" icon={User} />
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[500px]">

                {/* GENERAL TAB */}
                {activeTab === 'GENERAL' && (
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Store className="w-5 h-5 text-indigo-500" /> General Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tenant Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={appName}
                                            onChange={e => setAppName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                            placeholder="e.g. Acme Retail"
                                        />
                                        <Type className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Business Type / Sector</label>
                                    <input
                                        type="text"
                                        value={businessType}
                                        onChange={e => setBusinessType(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        placeholder="e.g. Retail, Healthcare, Manufacturing"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" /> Company Contact & Address
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Address Line 1</label>
                                    <input type="text" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Street, Building No." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City</label>
                                    <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">State / Province</label>
                                    <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pincode / Zip</label>
                                    <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Business Phone</label>
                                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Official Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Website</label>
                                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" /> Staff Management
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">Manage your workforce, create accounts, and assign branches.</p>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <StaffManager />
                            </div>
                        </div>
                    </div>
                )}

                {/* BRANDING TAB */}
                {activeTab === 'BRANDING' && (
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
                )}

                {/* MODULES TAB */}
                {activeTab === 'MODULES' && (
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-indigo-500" /> Feature Modules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MODULES.map(mod => (
                                    <div key={mod.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${modules[mod.id as keyof typeof modules] ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${modules[mod.id as keyof typeof modules] ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                            <span className={`font-bold ${modules[mod.id as keyof typeof modules] ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-500'}`}>{mod.label}</span>
                                        </div>
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
                            <p className="text-xs text-slate-400 mt-6 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 inline-block">
                                <span className="font-bold">Note:</span> Disabling a module hides it from the sidebar for ALL users immediately. Data remains intact.
                            </p>
                        </div>
                    </div>
                )}

                {/* FINANCE TAB */}
                {activeTab === 'FINANCE' && (
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-500" /> Tax & Pricing
                            </h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Default Tax Logic</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button onClick={() => setTaxMode('EXCLUSIVE')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${taxMode === 'EXCLUSIVE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                            Exclusive (+ Tax)
                                        </button>
                                        <button onClick={() => setTaxMode('INCLUSIVE')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${taxMode === 'INCLUSIVE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                            Inclusive (Inc. Tax)
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">New products will use this default unless specified otherwise.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">GSTIN / VAT Number</label>
                                        <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 29ABCDE1234F1Z5" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">PAN Number</label>
                                        <input type="text" value={pan} onChange={e => setPan(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. ABCDE1234F" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Store className="w-5 h-5 text-indigo-500" /> Banking Details (For Invoices)
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bank Name</label>
                                    <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. HDFC Bank" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Number</label>
                                    <input type="text" value={accNo} onChange={e => setAccNo(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 50100..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">IFSC / Swift Code</label>
                                    <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. HDFC0001234" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Holder Name</label>
                                    <input type="text" value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'SECURITY' && (
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-500" /> Role Based Access
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-6 py-4">Module / View</th>
                                            {roles.map(role => (
                                                <th key={role.id} className={`px-6 py-4 text-center ${role.code === 'owner' ? 'text-emerald-600' : ''}`}>
                                                    {role.code.charAt(0).toUpperCase() + role.code.slice(1)}
                                                    {role.code === 'owner' && <span className="block text-[9px] text-slate-400">Full Access</span>}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {PERMISSION_VIEWS.map(view => (
                                            <tr key={view.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{view.label}</td>
                                                {roles.map(role => (
                                                    <td key={role.id} className="px-6 py-4 text-center">
                                                        <CheckToggle
                                                            checked={role.code === 'owner' ? true : (permissions[role.code] || []).includes(view.id)}
                                                            disabled={role.code === 'owner'}
                                                            onChange={() => handlePermissionToggle(role.code, view.id)}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-indigo-500" /> Data Security & Migrations
                            </h3>
                            <SecurityMigrationManager />
                        </div>
                    </div>
                )}

                {/* PERSONALIZATION TAB */}
                {activeTab === 'PERSONAL' && (
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-500" /> Personalization Overrides
                            </h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Your Theme Preference</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                                        <button onClick={() => setUserTheme('light')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${userTheme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                            <Sun className="w-4 h-4" /> Light
                                        </button>
                                        <button onClick={() => setUserTheme('dark')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${userTheme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                            <Moon className="w-4 h-4" /> Dark
                                        </button>
                                        <button onClick={() => setUserTheme('system')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${userTheme === 'system' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-200 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                            <Shield className="w-4 h-4" /> System
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Overrides the tenant default theme for your account.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Personal Primary Color</label>
                                    <div className="flex flex-wrap gap-3">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => setUserColor(c.hex)}
                                                className={`w-10 h-10 rounded-full border-4 transition-all ${userColor === c.hex ? 'border-indigo-100 dark:border-slate-600 scale-110 shadow-md ring-2 ring-indigo-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                                style={{ backgroundColor: c.hex }}
                                                title={c.name}
                                            />
                                        ))}
                                        <button
                                            onClick={() => setUserColor('')}
                                            className={`px-3 py-1 text-[10px] font-bold border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 ${!userColor ? 'bg-slate-100 dark:bg-slate-900 border-indigo-500 text-indigo-600' : ''}`}
                                        >
                                            REVERT TO DEFAULT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- Container Component ---

const SettingsManager: React.FC = () => {
    const dispatch = useDispatch();
    const settings = useSelector((state: RootState) => state.settings);
    const tenantsList = useSelector((state: RootState) => state.tenant.tenants);
    const roles = useSelector((state: RootState) => state.tenant.roles);
    const { role, user, userPreferences } = useSelector((state: RootState) => state.auth);
    const { tenantId, theme: currentTheme } = useConfig();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const activeTenant = tenantsList.find(t => t.id === tenantId);

    const handleSave = async (updatedSettings: SettingsData & { tenantTheme: Theme, gstin?: string, pan?: string, bankName?: string, accNo?: string }) => {
        setIsSaving(true);
        try {
            // Update User Preferences in Redux IMMEDIATELY for instant UI feedback
            dispatch(setUserPreferences({
                theme: updatedSettings.userTheme,
                primaryColor: updatedSettings.userColor,
                loginLogoUrl: updatedSettings.userLogo
            }));

            // 1. Update Redux Settings state
            dispatch(updateSettings({
                appName: updatedSettings.appName,
                logoUrl: updatedSettings.logoUrl,
                primaryColor: updatedSettings.primaryColor,
                enabledModules: updatedSettings.enabledModules,
                defaultTaxMode: updatedSettings.defaultTaxMode,
                rolePermissions: updatedSettings.rolePermissions
            }));

            // 2. Update Tenant Details (Branding, Tax, Banking, Company)
            if (tenantId) {
                const currentTenant = tenantsList.find(t => t.id === tenantId);
                if (currentTenant) {
                    const updatedTenantData: Tenant = {
                        ...currentTenant,
                        name: updatedSettings.appName,
                        loginLogoUrl: updatedSettings.logoUrl,
                        primaryColor: updatedSettings.primaryColor,
                        theme: updatedSettings.tenantTheme,
                        // Modules
                        modules: Object.entries(updatedSettings.enabledModules)
                            .filter(([_, enabled]) => enabled)
                            .map(([key]) => key.toUpperCase() as any),

                        businessType: updatedSettings.businessType,
                        natureOfBusiness: updatedSettings.natureOfBusiness,
                        tradeDescription: updatedSettings.tradeDescription,

                        companyDetails: {
                            ...currentTenant.companyDetails,
                            addressLine1: updatedSettings.addressLine1 || '',
                            addressLine2: updatedSettings.addressLine2 || '',
                            city: updatedSettings.city || '',
                            state: updatedSettings.state || '',
                            country: currentTenant.companyDetails?.country || 'India',
                            pincode: updatedSettings.pincode || '',
                            phone: updatedSettings.phone || '',
                            email: updatedSettings.email || '',
                            website: updatedSettings.website || ''
                        },

                        // Tax & Banking
                        taxDetails: {
                            ...currentTenant.taxDetails,
                            gstin: updatedSettings.gstin || '',
                            pan: updatedSettings.pan || '',
                            taxSystem: updatedSettings.gstin ? 'GST' : 'NONE',
                            isGstEnabled: !!updatedSettings.gstin
                        },
                        bankingDetails: {
                            ...currentTenant.bankingDetails,
                            bankName: updatedSettings.bankName || '',
                            accountNumber: updatedSettings.accNo || '',
                            accountHolderName: updatedSettings.accountHolderName || updatedSettings.appName,
                            ifsc: updatedSettings.ifsc || ''
                        },
                        systemConfig: {
                            ...currentTenant.systemConfig,
                            pricingMode: updatedSettings.defaultTaxMode === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE',
                            isPosEnabled: updatedSettings.enabledModules['pos'],
                            isInventoryEnabled: updatedSettings.enabledModules['inventory'],
                        }
                    };

                    dispatch(updateTenantDetails(updatedTenantData));

                    // 3. Persist to Supabase across multiple tables
                    if (supabase && APP_CONFIG.USE_SUPABASE) {
                        const baseTenantUpdate = supabase
                            .from('tenants')
                            .update({
                                name: updatedTenantData.name
                            })
                            .eq('id', tenantId);

                        // Module Sync Logic
                        const syncModules = async () => {
                            try {
                                const { data: systemModules, error: getErr } = await supabase.from('system_modules').select('id, code');
                                if (getErr) return { error: getErr };

                                if (systemModules) {
                                    const activeModuleIds = updatedTenantData.modules
                                        .map((code: string) => systemModules.find((m: any) => m.code === code)?.id)
                                        .filter(Boolean);

                                    // 1. Remove existing mappings
                                    const { error: delErr } = await supabase.from('tenant_active_modules').delete().eq('tenant_id', tenantId);
                                    if (delErr) return { error: delErr };

                                    // 2. Insert new mappings
                                    if (activeModuleIds.length > 0) {
                                        const { error: insErr } = await supabase.from('tenant_active_modules').insert(
                                            activeModuleIds.map((mid: string) => ({
                                                tenant_id: tenantId,
                                                module_id: mid,
                                                status: 'ACTIVE'
                                            }))
                                        );
                                        if (insErr) return { error: insErr };
                                    }
                                }
                                return { error: null };
                            } catch (e) {
                                return { error: e };
                            }
                        };

                        const businessUpsert = supabase
                            .from('tenant_business_info')
                            .upsert({
                                tenant_id: tenantId,
                                business_type: updatedSettings.businessType,
                                nature_of_business: updatedSettings.natureOfBusiness,
                                trade_description: updatedSettings.tradeDescription
                            });

                        const companyUpsert = supabase
                            .from('tenant_company_details')
                            .upsert({
                                tenant_id: tenantId,
                                address_line1: updatedSettings.addressLine1,
                                address_line2: updatedSettings.addressLine2,
                                city: updatedSettings.city,
                                state: updatedSettings.state,
                                pincode: updatedSettings.pincode,
                                phone: updatedSettings.phone,
                                email: updatedSettings.email,
                                website: updatedSettings.website,
                                country: updatedTenantData.companyDetails?.country
                            });

                        const taxUpsert = supabase
                            .from('tenant_tax_details')
                            .upsert({
                                tenant_id: tenantId,
                                tax_system: updatedTenantData.taxDetails?.taxSystem,
                                gstin: updatedTenantData.taxDetails?.gstin,
                                pan: updatedTenantData.taxDetails?.pan,
                                is_gst_enabled: updatedTenantData.taxDetails?.isGstEnabled,
                                is_einvoice_enabled: updatedTenantData.taxDetails?.isEInvoiceEnabled,
                                is_eway_bill_enabled: updatedTenantData.taxDetails?.isEWayBillEnabled
                            });

                        const bankingUpsert = supabase
                            .from('tenant_banking_details')
                            .upsert({
                                tenant_id: tenantId,
                                bank_name: updatedTenantData.bankingDetails?.bankName,
                                account_number: updatedTenantData.bankingDetails?.accountNumber,
                                account_holder_name: updatedTenantData.bankingDetails?.accountHolderName,
                                ifsc: updatedTenantData.bankingDetails?.ifsc,
                                books_start_date: updatedTenantData.bankingDetails?.booksStartDate,
                                financial_year_closing: updatedTenantData.bankingDetails?.financialYearClosing
                            });

                        const systemUpsert = supabase
                            .from('tenant_system_config')
                            .upsert({
                                tenant_id: tenantId,
                                is_pos_enabled: updatedTenantData.systemConfig?.isPosEnabled,
                                is_inventory_enabled: updatedTenantData.systemConfig?.isInventoryEnabled,
                                is_loyalty_enabled: updatedTenantData.systemConfig?.isLoyaltyEnabled,
                                is_multibranch_enabled: updatedTenantData.systemConfig?.isMultiBranch,
                                is_ecommerce_enabled: updatedTenantData.systemConfig?.isEcommerceEnabled,
                                pricing_mode: updatedTenantData.systemConfig?.pricingMode
                            });

                        const integrationsUpsert = supabase
                            .from('tenant_integrations')
                            .upsert({
                                tenant_id: tenantId,
                                payment_gateway_key: updatedTenantData.integrations?.paymentGatewayKey,
                                sms_provider_key: updatedTenantData.integrations?.smsProviderKey,
                                email_provider_key: updatedTenantData.integrations?.emailProviderKey,
                                webhook_url: updatedTenantData.integrations?.webhookUrl
                            });

                        const userVisualUpsert = supabase
                            .from('tenant_user_visual_identity')
                            .upsert({
                                tenant_id: tenantId,
                                user_id: user?.id,
                                theme: updatedSettings.userTheme,
                                primary_color: updatedSettings.userColor,
                                login_logo_url: updatedSettings.userLogo,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'tenant_id,user_id' });

                        const results = await Promise.all([
                            baseTenantUpdate,
                            businessUpsert,
                            companyUpsert,
                            taxUpsert,
                            bankingUpsert,
                            systemUpsert,
                            integrationsUpsert,
                            userVisualUpsert,
                            syncModules()
                        ]);

                        const firstError = results.find(r => r && r.error)?.error;
                        if (firstError) throw firstError;
                    }
                }
            }

            // Persist theme to localStorage for immediate and consistent application
            setStoredTheme(updatedSettings.tenantTheme);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);

            // Optional: Show success alert or toast
            // alert('Settings saved successfully!');

        } catch (err: any) {
            console.error('Failed to save settings:', err);
            alert(`Error saving settings: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
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

    const enrichedSettings: SettingsData = useMemo(() => {
        const base = activeTenant ? {
            ...settings,
            appName: activeTenant.name,
            logoUrl: activeTenant.loginLogoUrl,
            primaryColor: activeTenant.primaryColor,
            businessType: activeTenant.businessType,
            natureOfBusiness: activeTenant.natureOfBusiness as any,
            tradeDescription: activeTenant.tradeDescription,
            addressLine1: activeTenant.companyDetails?.addressLine1,
            addressLine2: activeTenant.companyDetails?.addressLine2,
            city: activeTenant.companyDetails?.city,
            state: activeTenant.companyDetails?.state,
            pincode: activeTenant.companyDetails?.pincode,
            phone: activeTenant.companyDetails?.phone,
            email: activeTenant.companyDetails?.email,
            website: activeTenant.companyDetails?.website,
            gstin: activeTenant.taxDetails?.gstin,
            pan: activeTenant.taxDetails?.pan,
            bankName: activeTenant.bankingDetails?.bankName,
            accNo: activeTenant.bankingDetails?.accountNumber,
            accountHolderName: activeTenant.bankingDetails?.accountHolderName,
            ifsc: activeTenant.bankingDetails?.ifsc
        } : settings;

        return {
            ...base,
            userTheme: userPreferences?.theme,
            userColor: userPreferences?.primaryColor,
            userLogo: userPreferences?.loginLogoUrl
        };
    }, [activeTenant, settings, userPreferences]);

    // Key includes settings version and theme/tenant props to ensure form resets when external data changes
    const formKey = `${tenantId}-${currentTheme}-${JSON.stringify(enrichedSettings)}`;

    return (
        <SettingsForm
            key={formKey}
            initialSettings={enrichedSettings}
            activeTenant={activeTenant}
            roles={roles}
            currentTheme={currentTheme || 'light'}
            onSave={handleSave}
            onReset={handleReset}
            onUpdateBranchSettings={handleUpdateBranchSettings}
            isSaved={isSaved}
        />
    );
};

export default SettingsManager;
