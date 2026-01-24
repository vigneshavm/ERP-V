import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
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
    Star
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
    const [activeTab, setActiveTab] = useState('general');

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

    const renderTabContent = () => {
        const componentProps = {
            general: { appName: "SmartERPAI", businessType: "Retail" },
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
                {/* Horizontal Navigation Bar */}
                <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 min-w-max">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl transition-all duration-300 whitespace-nowrap ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    <span className="text-xs font-black tracking-wide uppercase">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

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
                        <button className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all">
                            Save Changes
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
