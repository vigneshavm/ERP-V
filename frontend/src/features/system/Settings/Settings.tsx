import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from "../../../components/shared/Layout/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from "../../../redux/store";
import { updateSettings, resetSettings } from "../../../redux/slices/settingsSlice";
import { fetchTenantSettings, saveTenantSettings } from "../../../redux/slices/tenantSlice";
import { updateProfile } from "../../../redux/slices/authSlice";
import { SettingsState } from "../../../types/settings";
import { Tenant } from "../../../types/tenant/index";
import { TaxMode, AppView } from "../../../types/common";
import { setStoredTheme } from "../../../utils/theme";
import { getStoredLanguage, setStoredLanguage, Language } from "../../../utils/language";
import api from "../../../services/api";
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
    CheckCircle,
    Printer
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
import PrintSettingsTab from './PrintSettingsTab';
import SecurityTab from './SecurityTab';
import SubscriptionTab from './SubscriptionTab';
import { MISConfig, ModulesConfig, TenantTheme, PrintSettings } from './types';
import { DEFAULT_MIS_CONFIG } from '../../../types/tenant/mis';
import { DEFAULT_PRINT_SETTINGS } from '../../../types/tenant/printSettings';

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
        { id: 'print', label: 'Print Settings', icon: Printer, desc: 'Bill header/footer & GRN numbering' },
        { id: 'integrations', label: 'Integrations', icon: Share2, desc: 'WhatsApp & external APIs' },
        { id: 'security', label: 'Security', icon: Lock, desc: 'Roles & access control' },
        { id: 'personalization', label: 'Personalization', icon: User, desc: 'User-specific preferences' },
        { id: 'subscription', label: 'Subscription', icon: Star, desc: 'Your current plan & billing' }
    ];

    const { tab } = useParams<{ tab: string }>();
    const activeTab = tabs.find(t => t.id === tab) ? tab : 'general';
    const navigate = useNavigate();

    const dispatch = useDispatch<AppDispatch>();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { user, role: _role } = useSelector((state: RootState) => state.auth);
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
    const [userLanguage, setUserLanguage] = useState<Language>((user?.language as Language) || getStoredLanguage() || 'en');

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
    // MIS Controls (Settings -> MIS Controls tab). Previously this was a static
    // `useState` snapshot (no setter) whose displayed values actually came from
    // `settings` (local-Redux-only, never persisted) via `{ ...misConfig, ...settings }`
    // in componentProps.mis below -- so toggling a control never round-tripped to the
    // server. Now `misConfig` is the single source of truth: initialized from the
    // tenant's persisted `misConfig` (falling back to DEFAULT_MIS_CONFIG for any field
    // never saved), edited directly via setMisConfig, and included in tenantUpdates on
    // Save so it actually persists to MongoDB via PUT /api/settings.
    const [misConfig, setMisConfig] = useState<MISConfig>({
        ...DEFAULT_MIS_CONFIG,
        ...(activeTenant?.misConfig || {})
    } as MISConfig);
    // Print Settings (Settings -> Print Settings tab) -- same pattern as misConfig above:
    // initialized from the tenant's persisted printSettings (falling back to
    // DEFAULT_PRINT_SETTINGS for any field never saved), included in tenantUpdates on Save.
    const [printSettings, setPrintSettings] = useState<PrintSettings>({
        ...DEFAULT_PRINT_SETTINGS,
        ...(activeTenant?.printSettings || {})
    } as PrintSettings);
    const [isSaved, setIsSaved] = useState(false);

    // ---- Load flow: MongoDB -> GET /api/settings -> Redux -> UI ----
    // On mount, pull the authoritative tenant record from the backend rather
    // than trusting whatever (possibly stale/mock) data is already sitting in
    // Redux. fetchTenantSettings's fulfilled reducer merges the DB response
    // into state.tenants; the effect below then re-hydrates the local form
    // fields whenever that merge happens (tracked via activeTenant.updatedAt),
    // which also covers the "save on device A, refresh on device B" case.
    useEffect(() => {
        setIsLoading(true);
        dispatch(fetchTenantSettings())
            .unwrap()
            .catch((err: any) => {
                console.error("Failed to load settings from server", err);
                toast.error(typeof err === 'string' ? err : "Failed to load settings");
            })
            .finally(() => setIsLoading(false));
         
    }, [dispatch]);

    useEffect(() => {
        if (!activeTenant) return;
        setAppName(activeTenant.name || settings.appName);
        setBusinessType(activeTenant.businessType || 'Retail');
        setAddressLine1(activeTenant.companyDetails?.addressLine1 || '');
        setCity(activeTenant.companyDetails?.city || '');
        setState(activeTenant.companyDetails?.state || '');
        setPincode(activeTenant.companyDetails?.pincode || '');
        setPhone(activeTenant.companyDetails?.phone || '');
        setEmail(activeTenant.companyDetails?.email || '');
        setWebsite(activeTenant.companyDetails?.website || '');
        setPrimaryColor(activeTenant.primaryColor || settings.primaryColor || '#4f46e5');
        setTenantTheme((activeTenant.theme as TenantTheme) || 'light');
        setLogoUrl(activeTenant.loginLogoUrl || settings.logoUrl || null);
        setTaxMode((activeTenant.systemConfig?.pricingMode) || settings.defaultTaxMode || 'EXCLUSIVE');
        setGstin(activeTenant.taxDetails?.gstin || '');
        setPan(activeTenant.taxDetails?.pan || '');
        setBankName(activeTenant.bankingDetails?.bankName || '');
        setAccNo(activeTenant.bankingDetails?.accountNumber || '');
        setIfsc(activeTenant.bankingDetails?.ifsc || '');
        setAccountHolderName(activeTenant.bankingDetails?.accountHolderName || '');
        setMisConfig({ ...DEFAULT_MIS_CONFIG, ...(activeTenant.misConfig || {}) } as MISConfig);
        setPrintSettings({ ...DEFAULT_PRINT_SETTINGS, ...(activeTenant.printSettings || {}) } as PrintSettings);
        // Only re-sync when the tenant record actually changes server-side
        // (initial load or a completed save) -- not on every keystroke.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTenant?.updatedAt]);

    // ---- Save flow: Validation -> API -> Backend -> MongoDB -> Response -> Redux -> Toast ----
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 0. Client-side validation -- fail fast before any network call.
            if (!appName || !appName.trim()) {
                toast.error("Business / company name cannot be empty");
                setIsSaving(false);
                return;
            }

            // 1. Settings Slice Update (local UI cache only -- not persisted to DB)
            const settingsPayload: Partial<SettingsState> = {
                appName,
                logoUrl: logoUrl || undefined,
                primaryColor,
                enabledModules: modules,
                defaultTaxMode: taxMode as TaxMode,
                // rolePermissions: ... // handled in SecurityTab if needed, or separate
            };

            // 1b. Resolve the short Sector code (e.g. 'Textile') that matches
            // the selected Business Sector display name (e.g. 'Textile &
            // Garments Retail'). tenant.sector - not businessType - is what
            // POS template selection and the Inventory Categories page's
            // sector filter actually key off of, so without this the two
            // stay out of sync: businessType changes here, sector doesn't,
            // and sector-mapped categories/templates never update.
            //
            // This used to only run when businessType was actually being
            // *changed* on this save (`businessType !== activeTenant?.businessType`).
            // That left any tenant whose sector was never backfilled --
            // created before this resolution logic existed, or who simply
            // never touched the dropdown since -- permanently stuck with a
            // blank tenant.sector: every subsequent save looked like "no
            // change" and skipped the resolution, so nothing ever set it.
            // Also resolving whenever sector is currently blank (regardless
            // of whether businessType changed) backfills it on the tenant's
            // very next save instead of requiring them to re-pick the same
            // Business Sector value to trigger it.
            let resolvedSector: string | undefined = activeTenant?.sector;
            if (businessType && (businessType !== activeTenant?.businessType || !resolvedSector)) {
                try {
                    const sectorsRes = await api.get('/api/business-sectors');
                    const match = (sectorsRes.data?.data || []).find((s: any) => s.name === businessType);
                    if (match?.shortCode) {
                        resolvedSector = match.shortCode;
                    }
                } catch (err) {
                    console.warn('Could not resolve sector short code for', businessType, err);
                }
            }

            // 2. Tenant Details Update -- this is the real persistence call:
            // it PUTs to /api/settings, which writes the Tenant document in
            // MongoDB and returns the saved record. Redux (state.tenants) is
            // only updated from that server response (see tenantSlice's
            // saveTenantSettings.fulfilled handler) -- never optimistically --
            // so Redux never shows a value as "saved" before it actually is.
            const tenantUpdates: Partial<Tenant> = {
                name: appName,
                primaryColor,
                loginLogoUrl: logoUrl || undefined,
                theme: tenantTheme,
                businessType,
                sector: resolvedSector as any,
                systemConfig: {
                    isPosEnabled: true,
                    isInventoryEnabled: true,
                    isLoyaltyEnabled: true,
                    isMultiBranch: false,
                    ...activeTenant?.systemConfig,
                    pricingMode: taxMode as any
                },
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
                misConfig,
                printSettings,
            };

            await dispatch(saveTenantSettings(tenantUpdates)).unwrap();

            dispatch(updateSettings(settingsPayload));

            // 3. User Profile Update (already a real, working thunk -- PUT /api/users/:id)
            if (user?.id) {
                await dispatch(updateProfile({
                    theme: userTheme,
                    primaryColor: userColor,
                    loginLogoUrl: userLogo || undefined,
                    language: userLanguage
                })).unwrap();
                if (userTheme !== 'system') {
                    setStoredTheme(userTheme);
                }
                // POS reads this localStorage key directly (see LanguageProvider), so the
                // billing screen picks up the new language immediately, not just after the
                // profile round-trip completes.
                setStoredLanguage(userLanguage);
            }

            // Toast fires only after every persistence call above has actually
            // resolved successfully -- never optimistically.
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            toast.success("All settings saved successfully!");
        } catch (error: any) {
            // Local form state (useState above) is left untouched on failure,
            // so the user's unsaved edits are never lost.
            console.error("Save error", error);
            const message = typeof error === 'string' ? error : (error?.message || "Failed to save settings");
            toast.error(message);
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
                misConfig,
                handleMisToggle: (k: string) => setMisConfig(prev => ({ ...prev, [k]: !prev[k] } as MISConfig)),
                setMaxDiscountPercent: (v: number) => setMisConfig(prev => ({ ...prev, maxDiscountPercent: v }))
            },
            print: {
                printSettings,
                setPrintSettings: (updater: (prev: PrintSettings) => PrintSettings) => setPrintSettings(updater)
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
                userLogo, handleUserLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setUserLogo(URL.createObjectURL(e.target.files[0])); },
                userLanguage, setUserLanguage
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
            case 'print': return <PrintSettingsTab {...componentProps.print} />;
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
                {/* Horizontal Navigation Bar */}
                <div className="w-full bg-white dark:bg-neutral-900 rounded-sm shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <div className="flex overflow-x-auto custom-scrollbar">
                        {tabs.map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => navigate(`/settings/${t.id}`)}
                                    className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                                        isActive 
                                        ? 'border-primary text-primary bg-primary/5' 
                                        : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-neutral-400'}`} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="w-full min-h-[calc(100vh-250px)] bg-white dark:bg-neutral-900 rounded-sm shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                    <div className="border-b border-neutral-100 dark:border-neutral-800 px-8 py-6 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                                {(() => {
                                    const Icon = tabs.find(t => t.id === activeTab)?.icon || SettingsIcon;
                                    return <Icon className="w-6 h-6 text-primary" />;
                                })()}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-neutral-900 dark:text-white leading-none">
                                    {tabs.find(t => t.id === activeTab)?.label} Settings
                                </h2>
                                <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">
                                    System / Configuration / {activeTab}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 text-neutral-500 hover:text-error dark:text-neutral-400 font-bold flex items-center gap-2 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-6 py-2.5 bg-neutral-900 dark:bg-primary text-white rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ${isSaved ? 'bg-success dark:bg-success' : 'hover:bg-neutral-800 dark:hover:bg-primary/90'}`}
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
