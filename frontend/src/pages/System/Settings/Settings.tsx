import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Layout from "../../../components/shared/Layout/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from "../../../redux/store";
import { updateSettings, resetSettings } from "../../../redux/slices/settingsSlice";
import { updateTenantDetails } from "../../../redux/slices/tenantSlice";
import { updateProfile } from "../../../redux/slices/authSlice";
import { SettingsState } from "../../../types/settings";
import { Tenant } from "../../../types/tenant";
import { TaxMode, AppView } from "../../../types/common";
import { setStoredTheme } from "../../../utils/theme";
import {
    Settings as SettingsIcon,
    Building,
    Palette,
    CreditCard,
    Puzzle,
    ShieldCheck,
    Share2,
    Lock,
    User,
    Star,
    Loader2,
    RotateCcw,
    Save,
    CheckCircle
} from 'lucide-react';

// Import Tabs
import GeneralTab from './GeneralTab';
import BranchSettingsTab from './BranchSettingsTab';
import BrandingTab from './BrandingTab';
import FinanceTab from './FinanceTab';
import IntegrationsTab from './IntegrationsTab';
import MISControlsTab from './MISControlsTab';
import ModulesTab from './ModulesTab';
import PersonalizationTab from './PersonalizationTab';
import SecurityTab from './SecurityTab';
import SubscriptionTab from './SubscriptionTab';
import { GeneralSettings, MISConfig, ModulesConfig, TenantTheme } from './types';

const Settings: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const tabs = [
        { id: 'general', label: 'General', icon: Building, desc: 'Company profile & contact' },
        { id: 'branches', label: 'Branches', icon: Building, desc: 'Manage locations & counters' },
        { id: 'branding', label: 'Branding', icon: Palette, desc: 'Themes & visual identity' },
        { id: 'finance', label: 'Finance', icon: CreditCard, desc: 'Taxes, billing & banking' },
        { id: 'modules', label: 'Modules', icon: Puzzle, desc: 'Enable/disable ERP features' },
        { id: 'mis', label: 'MIS Controls', icon: ShieldCheck, desc: 'Management & audit logs' },
        { id: 'integrations', label: 'Integrations', icon: Share2, desc: 'WhatsApp & external APIs' },
        { id: 'security', label: 'Security', icon: Lock, desc: 'Roles & access control' },
        { id: 'personalization', label: 'Personalization', icon: User, desc: 'User-specific preferences' },
        { id: 'subscription', label: 'Subscription', icon: Star, desc: 'Your current plan & billing' }
    ];

    const { tab } = useParams<{ tab: string }>();
    const activeTab = tabs.find(t => t.id === tab) ? tab : 'general';

    const dispatch = useDispatch<AppDispatch>();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { user, role } = useSelector((state: RootState) => state.auth);
    const settings = useSelector((state: RootState) => state.settings);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);

    // -- Local State Initialized from Redux --

    // General
    const [appName, setAppName] = useState(activeTenant?.name || settings.appName);
    const [businessType, setBusinessType] = useState(activeTenant?.businessType || 'Retail');
    const [addressLine1, setAddressLine1] = useState(activeTenant?.companyDetails?.addressLine1 || '');
    const [city, setCity] = useState(activeTenant?.companyDetails?.city || '');
    const [state, setState] = useState(activeTenant?.companyDetails?.state || '');
    const [pincode, setPincode] = useState(activeTenant?.companyDetails?.pincode || '');
    const [phone, setPhone] = useState(activeTenant?.companyDetails?.phone || '');
    const [email, setEmail] = useState(activeTenant?.companyDetails?.email || '');
    const [website, setWebsite] = useState(activeTenant?.companyDetails?.website || '');

    // Branding & Personalization
    const [primaryColor, setPrimaryColor] = useState<string>(activeTenant?.primaryColor || settings.primaryColor || '#4f46e5');
    const [tenantTheme, setTenantTheme] = useState<TenantTheme>(activeTenant?.theme as TenantTheme || 'light');
    const [logoUrl, setLogoUrl] = useState<string | null>(activeTenant?.loginLogoUrl || settings.logoUrl || null);

    const [userTheme, setUserTheme] = useState<'light' | 'dark' | 'system'>(user?.theme || 'system');
    const [userColor, setUserColor] = useState(user?.primaryColor || '');
    const [userLogo, setUserLogo] = useState(user?.loginLogoUrl || '');

    // Finance & Tax
    const [taxMode, setTaxMode] = useState<string>((activeTenant?.systemConfig?.pricingMode) || settings.defaultTaxMode || 'EXCLUSIVE');
    const [gstin, setGstin] = useState(activeTenant?.taxDetails?.gstin || '');
    const [pan, setPan] = useState(activeTenant?.taxDetails?.pan || '');
    const [bankName, setBankName] = useState(activeTenant?.bankingDetails?.bankName || '');
    const [accNo, setAccNo] = useState(activeTenant?.bankingDetails?.accountNumber || '');
    const [ifsc, setIfsc] = useState(activeTenant?.bankingDetails?.ifsc || '');
    const [accountHolderName, setAccountHolderName] = useState(activeTenant?.bankingDetails?.accountHolderName || '');

    // Modules & Config
    const [modules, setModules] = useState<ModulesConfig>(settings.enabledModules as any || { pos: true, inventory: true, finance: true });
    const [misConfig, setMisConfig] = useState<MISConfig>((settings as any) || {});
    const [isSaved, setIsSaved] = useState(false);

    // Save Settings Handler (Redux)
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Settings Slice Update
            const settingsPayload: Partial<SettingsState> = {
                appName,
                logoUrl: logoUrl || undefined,
                primaryColor,
                enabledModules: modules,
                defaultTaxMode: taxMode as TaxMode,
                // rolePermissions: ... // handled in SecurityTab if needed, or separate
            };

            // 2. Tenant Details Update
            const tenantUpdates: Partial<Tenant> = {
                name: appName,
                primaryColor,
                loginLogoUrl: logoUrl || undefined,
                theme: tenantTheme,
                businessType,
                companyDetails: {
                    addressLine1, city, state, pincode, phone, email, website,
                    country: activeTenant?.companyDetails?.country || 'India',
                    stateCode: activeTenant?.companyDetails?.stateCode || '29'
                },
                taxDetails: {
                    gstin, pan,
                    taxSystem: activeTenant?.taxDetails?.taxSystem || 'GST',
                    isGstEnabled: activeTenant?.taxDetails?.isGstEnabled ?? true
                },
                bankingDetails: { bankName, accountNumber: accNo, ifsc, accountHolderName },
            };

            if (user?.tenantId) {
                dispatch(updateTenantDetails({
                    id: user.tenantId,
                    updates: tenantUpdates
                }));
            }

            dispatch(updateSettings(settingsPayload));

            // 3. User Profile Update
            if (user?.id) {
                dispatch(updateProfile({
                    theme: userTheme,
                    primaryColor: userColor,
                    loginLogoUrl: userLogo || undefined
                }));
                if (userTheme !== 'system') {
                    setStoredTheme(userTheme);
                }
            }

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            toast.success("All settings saved successfully!");
        } catch (error: any) {
            console.error("Save error", error);
            toast.error(error.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults? This will reload the application.')) {
            dispatch(resetSettings());
            window.location.reload();
        }
    };

    const [permissions, setPermissions] = useState(settings.rolePermissions);

    const renderTabContent = () => {
        const componentProps = {
            general: {
                appName, setAppName,
                businessType, setBusinessType,
                addressLine1, setAddressLine1,
                city, setCity,
                state, setState,
                pincode, setPincode,
                phone, setPhone,
                email, setEmail,
                website, setWebsite
            },
            branding: {
                tenantTheme, setTenantTheme, primaryColor, setPrimaryColor,
                logoUrl, handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setLogoUrl(URL.createObjectURL(e.target.files[0])); }
            },
            finance: {
                taxMode, setTaxMode,
                gstin, setGstin, pan, setPan,
                bankName, setBankName, accNo, setAccNo, ifsc, setIfsc, accountHolderName, setAccountHolderName
            },
            modules: { modules, handleModuleToggle: (id: string) => setModules(prev => ({ ...prev, [id]: !prev[id] })) },
            mis: {
                misConfig: { ...misConfig, ...settings } as unknown as MISConfig,
                handleMisToggle: (k: string) => dispatch(updateSettings({ [k]: !((settings as any)[k]) })),
                setMaxDiscountPercent: (v: number) => dispatch(updateSettings({ sales: { ...settings.sales, defaultDiscount: v } }))
            },
            security: {
                roles: [], permissions,
                handlePermissionToggle: (roleCode: string, view: string | AppView) => {
                    const viewId = view as AppView;
                    const current = permissions[roleCode] || [];
                    const updated = current.includes(viewId) ? current.filter(v => v !== viewId) : [...current, viewId];
                    setPermissions({ ...permissions, [roleCode]: updated });
                }
            },
            personalization: {
                userTheme, setUserTheme, userColor, setUserColor,
                userLogo, handleUserLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setUserLogo(URL.createObjectURL(e.target.files[0])); }
            }
        };

        if (isLoading && activeTab === 'general') {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p className="text-sm font-medium">Loading settings...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'general': return <GeneralTab {...componentProps.general} />;
            case 'branches': return <BranchSettingsTab />;
            case 'branding': return <BrandingTab {...componentProps.branding} />;
            case 'finance': return <FinanceTab {...componentProps.finance} />;
            case 'modules': return <ModulesTab {...componentProps.modules} />;
            case 'mis': return <MISControlsTab {...componentProps.mis} />;
            case 'integrations': return <IntegrationsTab />;
            case 'security': return <SecurityTab {...componentProps.security} />;
            case 'personalization': return <PersonalizationTab {...componentProps.personalization} />;
            case 'subscription': return <SubscriptionTab />;
            default: return <GeneralTab {...componentProps.general} />;
        }
    };

    return (
        <Layout>
            <PageHeader
                title="System Settings"
                description="Configure your enterprise environment, manage users, and customize your experience."
            />

            <div className="flex flex-col gap-6">
                {/* Horizontal Navigation Bar Removed */}

                {/* Main Content Area */}
                <div className="w-full min-h-[calc(100vh-250px)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                    <div className="border-b border-slate-100 dark:border-slate-800 px-8 py-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                {(() => {
                                    const Icon = tabs.find(t => t.id === activeTab)?.icon || SettingsIcon;
                                    return <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
                                })()}
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white leading-none">
                                    {tabs.find(t => t.id === activeTab)?.label} Settings
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                                    System / Configuration / {activeTab}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 text-slate-500 hover:text-red-500 dark:text-slate-400 font-bold flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ${isSaved ? 'bg-emerald-600 dark:bg-emerald-600' : ''}`}
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSaved ? <CheckCircle className="w-4 h-4" /> : !isSaving && <Save className="w-4 h-4" />}
                                {isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    <div className="relative overflow-y-auto flex-1">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
