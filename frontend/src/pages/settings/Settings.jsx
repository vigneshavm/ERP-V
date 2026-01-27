import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';
import { toast } from 'react-toastify';
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
    Loader2
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

const Settings = () => {
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

    const { tab } = useParams();
    const activeTab = tabs.find(t => t.id === tab) ? tab : 'general';

    // General Tab State
    const [generalSettings, setGeneralSettings] = useState({
        appName: '',
        businessType: 'Retail',
        addressLine1: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        website: ''
    });

    // Mock states for props that the tabs expect
    const [tenantTheme, setTenantTheme] = useState('light');
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');
    const [logoUrl, setLogoUrl] = useState(null);
    const [taxMode, setTaxMode] = useState('EXCLUSIVE');
    const [misConfig, setMisConfig] = useState({
        allowNegativeStock: false,
        allowSaleBelowCost: false,
        enableCreditSales: true,
        enableVendorPayables: true,
        enableCustomerReceivables: true,
        allowPriceOverride: true,
        allowDiscountOverride: true,
        maxDiscountPercent: 10,
        enableAuditTrail: true,
    });
    const [modules, setModules] = useState({
        pos: true,
        inventory: true,
        finance: true,
    });

    // Fetch Settings
    useEffect(() => {
        const fetchSettings = async () => {
            if (activeTab === 'general') {
                setIsLoading(true);
                try {
                    const response = await api.get('/settings');
                    if (response.data && response.data.success) {
                        setGeneralSettings(prev => ({
                            ...prev,
                            ...response.data.data
                        }));
                    }
                } catch (error) {
                    console.error("Failed to fetch settings", error);
                    toast.error("Failed to load settings");
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchSettings();
    }, [activeTab]);

    // Save Settings
    const handleSave = async () => {
        setIsSaving(true);
        try {
            let payload = {};
            let endpoint = '';

            if (activeTab === 'general') {
                payload = generalSettings;
                endpoint = '/settings';
            } else {
                toast.info("Saving for this tab is not yet implemented.");
                setIsSaving(false);
                return;
            }

            const response = await api.put(endpoint, payload);
            if (response.data && response.data.success) {
                toast.success(response.data.message || "Settings updated successfully");
            }
        } catch (error) {
            console.error("Save error", error);
            toast.error(error.response?.data?.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const updateGeneralSetting = (key, value) => {
        setGeneralSettings(prev => ({ ...prev, [key]: value }));
    };

    const renderTabContent = () => {
        const componentProps = {
            general: {
                appName: generalSettings.appName, setAppName: (v) => updateGeneralSetting('appName', v),
                businessType: generalSettings.businessType, setBusinessType: (v) => updateGeneralSetting('businessType', v),
                addressLine1: generalSettings.addressLine1, setAddressLine1: (v) => updateGeneralSetting('addressLine1', v),
                city: generalSettings.city, setCity: (v) => updateGeneralSetting('city', v),
                state: generalSettings.state, setState: (v) => updateGeneralSetting('state', v),
                pincode: generalSettings.pincode, setPincode: (v) => updateGeneralSetting('pincode', v),
                phone: generalSettings.phone, setPhone: (v) => updateGeneralSetting('phone', v),
                email: generalSettings.email, setEmail: (v) => updateGeneralSetting('email', v),
                website: generalSettings.website, setWebsite: (v) => updateGeneralSetting('website', v)
            },
            branding: {
                tenantTheme, setTenantTheme, primaryColor, setPrimaryColor,
                logoUrl, handleLogoUpload: (e) => setLogoUrl(URL.createObjectURL(e.target.files[0]))
            },
            finance: { taxMode, setTaxMode },
            modules: { modules, handleModuleToggle: (id) => setModules(prev => ({ ...prev, [id]: !prev[id] })) },
            mis: { misConfig, handleMisToggle: (k) => setMisConfig(prev => ({ ...prev, [k]: !prev[k] })), setMaxDiscountPercent: (v) => setMisConfig(p => ({ ...p, maxDiscountPercent: v })) },
            security: { roles: [], permissions: {}, handlePermissionToggle: () => { } },
            personalization: { userTheme: "light", setUserTheme: () => { }, userColor: "#4f46e5", setUserColor: () => { }, userLogo: null, handleUserLogoUpload: () => { } }
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
            default: return <GeneralTab />;
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
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
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
