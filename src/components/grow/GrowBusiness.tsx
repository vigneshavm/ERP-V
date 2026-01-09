import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, activateEcommerce, upgradeEcommercePlan } from '../../store';
import {
    Rocket,
    Zap,
    Users,
    LayoutGrid,
    Globe2
} from 'lucide-react';
import { EcommercePlan } from '../../types/tenant';
import GoogleProfileManager from './GoogleProfileManager';
import MarketingTools from './MarketingTools';
import WhatsAppMarketing from './WhatsAppMarketing';

// Storefront sub-components
import GrowHero from './storefront/GrowHero';
import FeatureMatrix from './storefront/FeatureMatrix';
import GrowTestimonials from './storefront/GrowTestimonials';
import PricingTiers from './storefront/PricingTiers';
import PerformanceTips from './storefront/PerformanceTips';

const GrowBusiness: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const ecomConfig = activeTenant?.ecommerceConfig;
    const isEnabled = ecomConfig?.isEnabled || false;
    const currentPlan = ecomConfig?.plan || 'STARTER';

    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'storefront' | 'google' | 'marketing' | 'whatsapp'>('storefront');

    const handleActivate = async () => {
        if (!user?.tenantId) return;
        setIsLoading(true);
        await dispatch(activateEcommerce(user.tenantId));
        setIsLoading(false);
    };

    const handleUpgrade = async (planName: string) => {
        if (!user?.tenantId) return;
        setIsLoading(true);
        await dispatch(upgradeEcommercePlan(user.tenantId, planName.toUpperCase() as EcommercePlan));
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-32 selection:bg-[#4F46E5]/30 selection:text-[#4F46E5]">
            {/* Tab Navigation */}
            <div className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#4F46E5] rounded-2xl shadow-lg shadow-[#4F46E5]/20">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#020617] dark:text-[#F8FAFC] tracking-tighter leading-none">Grow Platform</h2>
                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mt-1">Expansion Ecosystem</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('storefront')}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'storefront' ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Digital Storefront
                        </button>
                        <button
                            onClick={() => setActiveTab('google')}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'google' ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                        >
                            <Globe2 className="w-4 h-4" />
                            Google Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('marketing')}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'marketing' ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                        >
                            <Zap className="w-4 h-4" />
                            Marketing
                        </button>
                        <button
                            onClick={() => setActiveTab('whatsapp')}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'whatsapp' ? 'bg-white dark:bg-[#020617] text-[#22C55E] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                        >
                            <Users className="w-4 h-4" />
                            WhatsApp
                        </button>
                    </div>

                    <div className="hidden lg:flex items-center gap-4">
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#64748B]">
                            <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
                            Live Systems
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'storefront' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GrowHero
                        isEnabled={isEnabled}
                        isLoading={isLoading}
                        currentPlan={currentPlan}
                        onActivate={handleActivate}
                    />

                    <FeatureMatrix
                        isEnabled={isEnabled}
                        currentPlan={currentPlan}
                    />

                    <GrowTestimonials />

                    <PricingTiers
                        isEnabled={isEnabled}
                        isLoading={isLoading}
                        currentPlan={currentPlan}
                        onUpgrade={handleUpgrade}
                    />

                    <PerformanceTips />
                </div>
            ) : activeTab === 'google' ? (
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GoogleProfileManager />
                </div>
            ) : activeTab === 'marketing' ? (
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MarketingTools />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <WhatsAppMarketing />
                </div>
            )}
        </div>
    );
};

export default GrowBusiness;
