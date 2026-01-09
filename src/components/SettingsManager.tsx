import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateSettings, resetSettings, updateTenantDetails, updateBranchSettings, setUserPreferences } from '../store';
import { Save, RotateCcw, Settings as SettingsIcon, Store, Palette, LayoutGrid, Calculator, Sliders, Shield, User, CheckCircle, RotateCw } from 'lucide-react';
import { AppView, TaxMode } from '../types/common';
import { setStoredTheme, Theme } from '../utils/theme';
import { Tenant, Role } from '../types/tenant';

// Tabs
import GeneralTab from './settings/GeneralTab';
import BrandingTab from './settings/BrandingTab';
import ModulesTab from './settings/ModulesTab';
import FinanceTab from './settings/FinanceTab';
import MISControlsTab from './settings/MISControlsTab';
import SecurityTab from './settings/SecurityTab';
import PersonalizationTab from './settings/PersonalizationTab';

// --- Types ---
interface SettingsData {
    appName: string;
    logoUrl?: string;
    primaryColor: string;
    enabledModules: { [key: string]: boolean };
    defaultTaxMode: TaxMode;
    rolePermissions: { [key: string]: AppView[] };
    businessType?: string;
    natureOfBusiness?: string;
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
    userTheme?: 'light' | 'dark' | 'system';
    userColor?: string;
    userLogo?: string;
}

const SettingsManager: React.FC = () => {
    const dispatch = useDispatch();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { user, role } = useSelector((state: RootState) => state.auth);
    const settings = useSelector((state: RootState) => state.settings);
    const { roles } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(role === 'Owner' ? 'GENERAL' : 'PERSONAL');

    // Local States
    const [appName, setAppName] = useState(activeTenant?.name || settings.appName);
    const [logoUrl, setLogoUrl] = useState(activeTenant?.loginLogoUrl || settings.logoUrl || '');
    const [primaryColor, setPrimaryColor] = useState(activeTenant?.primaryColor || settings.primaryColor);
    const [modules, setModules] = useState(settings.enabledModules);
    const [taxMode, setTaxMode] = useState<TaxMode>((activeTenant?.systemConfig?.pricingMode as TaxMode) || settings.defaultTaxMode);
    const [permissions, setPermissions] = useState(settings.rolePermissions);
    const [tenantTheme, setTenantTheme] = useState<Theme>(activeTenant?.theme as Theme || 'light');

    // Tenant Detail States
    const [businessType, setBusinessType] = useState(activeTenant?.businessType || '');
    const [addressLine1, setAddressLine1] = useState(activeTenant?.companyDetails?.addressLine1 || '');
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

    // User Preferences
    const { userPreferences } = useSelector((state: RootState) => state.auth);
    const [userTheme, setUserTheme] = useState<'light' | 'dark' | 'system'>(userPreferences?.theme || 'system');
    const [userColor, setUserColor] = useState(userPreferences?.primaryColor || '');
    const [userLogo, setUserLogo] = useState(userPreferences?.loginLogoUrl || '');

    const handleSave = () => {
        const data: any = {
            appName, logoUrl, primaryColor, enabledModules: modules, defaultTaxMode: taxMode, rolePermissions: permissions,
            businessType, addressLine1, city, state, pincode, phone, email, website,
            gstin, pan, bankName, accNo, ifsc, accountHolderName,
            userTheme, userColor, userLogo
        };

        if (user?.tenantId) {
            dispatch(updateTenantDetails({
                id: user.tenantId,
                updates: {
                    name: appName,
                    primaryColor,
                    loginLogoUrl: logoUrl,
                    theme: tenantTheme,
                    businessType,
                    companyDetails: {
                        addressLine1, city, state, pincode, phone, email, website,
                        country: activeTenant?.companyDetails?.country || 'India'
                    } as any,
                    taxDetails: { gstin, pan } as any,
                    bankingDetails: { bankName, accountNumber: accNo, ifsc, accountHolderName } as any,
                }
            }));
        }

        dispatch(updateSettings(data));

        // Update user visual preferences in Redux & LocalStorage if changed
        if (user?.id) {
            dispatch(setUserPreferences({
                theme: userTheme,
                primaryColor: userColor,
                loginLogoUrl: userLogo
            }));
            if (userTheme !== 'system') {
                setStoredTheme(userTheme);
            }
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults?')) {
            dispatch(resetSettings());
            window.location.reload();
        }
    };

    const TabButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-indigo-600" />
                        System Configuration
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Customize your environment, branding, and policies.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleReset} className="px-4 py-2 text-slate-500 hover:text-red-500 dark:text-slate-400 font-bold flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all">
                        {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                {role === 'Owner' && (
                    <>
                        <TabButton id="GENERAL" label="General Info" icon={Store} />
                        <TabButton id="BRANDING" label="Branding & Theme" icon={Palette} />
                        <TabButton id="MODULES" label="Modules" icon={LayoutGrid} />
                        <TabButton id="FINANCE" label="Finance & Tax" icon={Calculator} />
                        <TabButton id="MIS" label="MIS Controls" icon={Sliders} />
                        <TabButton id="SECURITY" label="Security & Roles" icon={Shield} />
                    </>
                )}
                <TabButton id="PERSONAL" label="Personalization" icon={User} />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[500px]">
                {activeTab === 'GENERAL' && (
                    <GeneralTab
                        appName={appName} setAppName={setAppName}
                        businessType={businessType} setBusinessType={setBusinessType}
                        addressLine1={addressLine1} setAddressLine1={setAddressLine1}
                        city={city} setCity={setCity} state={state} setState={setState}
                        pincode={pincode} setPincode={setPincode}
                        phone={phone} setPhone={setPhone} email={email} setEmail={setEmail}
                        website={website} setWebsite={setWebsite}
                    />
                )}
                {activeTab === 'BRANDING' && (
                    <BrandingTab
                        tenantTheme={tenantTheme} setTenantTheme={setTenantTheme}
                        primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
                        logoUrl={logoUrl} handleLogoUpload={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setLogoUrl(reader.result as string);
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                )}
                {activeTab === 'MODULES' && (
                    <ModulesTab modules={modules} handleModuleToggle={(id) => setModules(prev => ({ ...prev, [id]: !prev[id] }))} />
                )}
                {activeTab === 'FINANCE' && (
                    <FinanceTab
                        taxMode={taxMode} setTaxMode={setTaxMode}
                        gstin={gstin} setGstin={setGstin} pan={pan} setPan={setPan}
                        bankName={bankName} setBankName={setBankName}
                        accNo={accNo} setAccNo={setAccNo} ifsc={ifsc} setIfsc={setIfsc}
                        accountHolderName={accountHolderName} setAccountHolderName={setAccountHolderName}
                    />
                )}
                {activeTab === 'MIS' && (
                    <MISControlsTab
                        misConfig={settings as any}
                        handleMisToggle={(key) => dispatch(updateSettings({ [key]: !((settings as any)[key]) }))}
                        setMaxDiscountPercent={(val) => dispatch(updateSettings({ maxDiscountPercent: val }))}
                    />
                )}
                {activeTab === 'SECURITY' && (
                    <SecurityTab
                        roles={roles}
                        permissions={permissions}
                        handlePermissionToggle={(roleCode, view) => {
                            const current = permissions[roleCode] || [];
                            const updated = current.includes(view) ? current.filter(v => v !== view) : [...current, view];
                            setPermissions({ ...permissions, [roleCode]: updated });
                        }}
                    />
                )}
                {activeTab === 'PERSONAL' && (
                    <PersonalizationTab
                        userTheme={userTheme} setUserTheme={setUserTheme}
                        userColor={userColor} setUserColor={setUserColor}
                        userLogo={userLogo} handleUserLogoUpload={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setUserLogo(reader.result as string);
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default SettingsManager;
