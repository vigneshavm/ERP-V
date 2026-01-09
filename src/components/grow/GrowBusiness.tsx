import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
    Rocket,
    Globe,
    ShoppingBag,
    Zap,
    Users,
    Smartphone,
    BarChart3,
    CheckCircle2,
    ArrowRight,
    Star,
    LayoutGrid,
    Globe2,
    Quote,
    Lightbulb,
    TrendingUp,
    MousePointer2,
    Eye
} from 'lucide-react';
import { activateEcommerce, upgradeEcommercePlan, syncGoogleProfile } from '../../store/tenantSlice';
import { EcommercePlan } from '../../types/tenant';
import GoogleProfileManager from './GoogleProfileManager';
import MarketingTools from './MarketingTools';

const GrowBusiness: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const ecomConfig = activeTenant?.ecommerceConfig;
    const isEnabled = ecomConfig?.isEnabled || false;
    const currentPlan = ecomConfig?.plan || 'STARTER';

    // Trial status simulation
    const trialDaysLeft = 14;

    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'storefront' | 'google' | 'marketing'>('storefront');

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

    const features = [
        { id: 'domain', title: 'Custom Domain', icon: Globe, description: 'Connect your own branded domain or use a free subdomain.', starter: false, pro: true, ent: true },
        { id: 'catalog', title: 'Product Catalog', icon: ShoppingBag, description: 'Manage and display your full range of products online.', starter: true, pro: true, ent: true },
        { id: 'payments', title: 'Payment Gateway', icon: Zap, description: 'Securely accept credit cards and local payment methods.', starter: false, pro: true, ent: true },
        { id: 'orders', title: 'Order Management', icon: BarChart3, description: 'Centralized dashboard for all your online and POS orders.', starter: true, pro: true, ent: true },
        { id: 'portal', title: 'Customer Portal', icon: Users, description: 'Allow customers to track orders and manage their profiles.', starter: false, pro: true, ent: true },
        { id: 'mobile', title: 'Mobile Responsive', icon: Smartphone, description: 'Optimized shopping experience for all screen sizes.', starter: true, pro: true, ent: true },
    ];

    const plans = [
        {
            name: 'Starter',
            price: '499',
            features: ['Up to 50 items', 'Standard theme', 'Email support', 'Real-time Sync'],
            highlight: false
        },
        {
            name: 'Professional',
            price: '999',
            features: ['Unlimited items', 'Premium themes', '24/7 Priority support', 'Custom Domain', 'Sales Analytics'],
            highlight: true
        },
        {
            name: 'Enterprise',
            price: '1999',
            features: ['Multi-store access', 'Full API support', 'Dedicated Manager', 'Custom Logic', 'SLA Guarantee'],
            highlight: false
        }
    ];

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
                    {/* Cinematic Hero Section */}
                    <header
                        className="relative overflow-hidden bg-[#020617] border-b border-slate-800 pt-20 pb-40 px-6 lg:px-12 text-center lg:text-left rounded-b-[4rem] shadow-2xl"
                        role="banner"
                    >
                        {/* Subtle Animated Background - Opacity and Transform only */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#4F46E5]/10 blur-[120px] rounded-full -mr-48 -mt-48 motion-safe:animate-pulse transition-opacity duration-300" aria-hidden="true" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#22C55E]/5 blur-[100px] rounded-full -ml-32 -mb-32 transition-opacity duration-300" aria-hidden="true" />

                        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F46E5]/10 rounded-full border border-[#4F46E5]/20 text-[#4F46E5] dark:text-indigo-300 text-xs font-black uppercase tracking-widest mb-8">
                                    <Rocket className="w-4 h-4" aria-hidden="true" />
                                    Used by Global Stores
                                </div>

                                <h1 className="text-5xl lg:text-[4.5rem] font-black text-[#F8FAFC] tracking-tight leading-[1.1] mb-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 duration-200">
                                    Launch Your <br />
                                    <span className="text-[#4F46E5]">Digital Empire</span>
                                </h1>

                                <p className="text-[#64748B] text-xl lg:text-2xl font-medium leading-relaxed max-w-xl mb-12 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-6 duration-200">
                                    Turn your store into a 24×7 online business in minutes. Reach global customers with integrated POS and inventory management.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    {!isEnabled ? (
                                        <button
                                            onClick={handleActivate}
                                            disabled={isLoading}
                                            aria-label="Start ecommerce free trial"
                                            className="w-full sm:w-auto px-10 py-5 bg-[#4F46E5] text-white rounded-xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all duration-200 focus:ring-4 focus:ring-[#4F46E5]/40 focus:outline-none flex items-center justify-center gap-4 group"
                                        >
                                            {isLoading ? 'Activating...' : 'Start Free Trial'}
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
                                        </button>
                                    ) : (
                                        <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#22C55E]/10 rounded-xl border border-[#22C55E]/30 text-[#22C55E] font-black uppercase tracking-widest text-xs">
                                            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                                            Empire Active: {currentPlan} Tier
                                        </div>
                                    )}
                                    <span className="text-[#64748B] text-xs font-bold uppercase tracking-widest">Global Ready</span>
                                </div>
                            </div>

                            <div className="hidden xl:block w-full max-w-md" aria-hidden="true">
                                <div className="relative aspect-square bg-[#020617] rounded-[3rem] border border-slate-800 p-8 shadow-inner overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/20 to-transparent" />
                                    <div className="relative h-full flex flex-col justify-center items-center text-center">
                                        <ShoppingBag className="w-24 h-24 text-[#F8FAFC] mb-8" />
                                        <div className="space-y-4 w-full px-12">
                                            <div className="h-2 w-full bg-slate-800 rounded-full" />
                                            <div className="h-2 w-2/3 bg-slate-800/50 rounded-full mx-auto" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Feature Matrix - Glassmorphic & Accessible */}
                    <main className="max-w-7xl mx-auto px-6 lg:px-12 -mt-16" aria-label="Enterprise Features Matrix">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature) => {
                                const isAvailable = isEnabled && (
                                    (currentPlan === 'STARTER' && feature.starter) ||
                                    (currentPlan === 'PROFESSIONAL' && feature.pro) ||
                                    (currentPlan === 'ENTERPRISE' && feature.ent)
                                );

                                return (
                                    <div
                                        key={feature.id}
                                        role="region"
                                        aria-label={`Feature: ${feature.title}`}
                                        className="group bg-white/70 dark:bg-[#020617]/70 backdrop-blur-md rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 hover:border-[#4F46E5]/40 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#4F46E5] focus-within:ring-offset-2 dark:focus-within:ring-offset-[#0F172A]"
                                    >
                                        <div className="flex items-start justify-between mb-8">
                                            <div
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${isAvailable ? 'bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/20' : 'bg-slate-100 dark:bg-slate-800 text-[#64748B]'}`}
                                                aria-hidden="true"
                                            >
                                                <feature.icon className="w-7 h-7" />
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isAvailable ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-slate-100 dark:bg-slate-800 text-[#64748B]'}`}>
                                                {isAvailable ? 'Available' : 'Locked'}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-[#020617] dark:text-[#F8FAFC] mb-4 tracking-tight leading-none">{feature.title}</h3>
                                        <p className="text-[#64748B] text-sm font-medium leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </main>

                    {/* Testimonials - Building Trust */}
                    <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-40" aria-label="Customer Success Stories">
                        <div className="bg-[#020617] rounded-[4rem] p-12 lg:p-24 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#4F46E5]/10 blur-[100px] rounded-full" aria-hidden="true" />

                            <div className="relative z-10">
                                <h2 className="text-3xl lg:text-5xl font-black text-[#F8FAFC] tracking-tight mb-16 text-center">
                                    Trusted by <span className="text-[#4F46E5]">Empire Builders</span>
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { quote: "Since launching our digital storefront, our sales have increased by 40%. The integration with our physical store is flawless.", author: "Sarah", role: "Boutique Owner" },
                                        { quote: "The Google Business Profile sync is a game changer. We've seen a massive spike in foot traffic.", author: "John", role: "Cafe Manager" },
                                        { quote: "Easy to set up, and the premium design immediately wowed our customers. Highly recommend!", author: "Emily", role: "Jewelry Designer" }
                                    ].map((t, i) => (
                                        <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between">
                                            <div>
                                                <Quote className="w-10 h-10 text-[#4F46E5] mb-6 opacity-50" />
                                                <p className="text-[#F8FAFC] text-lg font-medium leading-relaxed mb-8 italic">"{t.quote}"</p>
                                            </div>
                                            <div>
                                                <p className="text-[#F8FAFC] font-black uppercase tracking-widest text-xs">{t.author}</p>
                                                <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest mt-1">{t.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Tiers - Optimized & Accessible */}
                    <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-40" aria-label="Select Plan">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl lg:text-6xl font-black text-[#020617] dark:text-[#F8FAFC] tracking-tight mb-6">
                                Select Your <span className="text-[#4F46E5]">Growth Path</span>
                            </h2>
                            <p className="text-[#64748B] text-lg font-bold max-w-2xl mx-auto uppercase tracking-widest opacity-80">
                                Choose the tier that fuels your business.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-end">
                            {plans.map((plan) => (
                                <article
                                    key={plan.name}
                                    className={`relative bg-white dark:bg-[#020617] rounded-[3.5rem] p-12 border transition-all duration-200 group ${plan.highlight
                                        ? 'border-[#4F46E5] shadow-2xl scale-105 z-10'
                                        : 'border-slate-200 dark:border-slate-800 shadow-xl'}`}
                                >
                                    {plan.highlight && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-[#4F46E5] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="mb-12">
                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${plan.highlight ? 'text-[#4F46E5]' : 'text-[#64748B]'}`}>{plan.name}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-black text-[#020617] dark:text-[#F8FAFC] tracking-tighter">₹{plan.price}</span>
                                            <span className="text-[#64748B] font-bold text-sm tracking-widest">/MO</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-16" role="list">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-start gap-4">
                                                <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${plan.highlight ? 'text-[#4F46E5]' : 'text-[#22C55E]'}`} aria-hidden="true" />
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-tight">{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleUpgrade(plan.name)}
                                        disabled={isLoading || (isEnabled && currentPlan === plan.name.toUpperCase())}
                                        aria-label={`Choose ${plan.name} Plan`}
                                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-200 focus:ring-4 focus:outline-none focus:ring-[#4F46E5]/40 ${(isEnabled && currentPlan === plan.name.toUpperCase())
                                            ? 'bg-slate-100 dark:bg-slate-800 text-[#64748B] cursor-default'
                                            : plan.highlight
                                                ? 'bg-[#4F46E5] text-white hover:bg-opacity-90 shadow-lg shadow-[#4F46E5]/20'
                                                : 'bg-[#020617] dark:bg-[#F8FAFC] text-white dark:text-[#020617] hover:bg-opacity-90'
                                            }`}
                                    >
                                        {isLoading ? 'Processing...' : (isEnabled && currentPlan === plan.name.toUpperCase()) ? 'Active Core' : 'Get Started'}
                                    </button>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* Performance Tips - Actionable Advice */}
                    <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-40 pb-20" aria-label="Performance Optimization Tips">
                        <div className="bg-white dark:bg-[#020617] rounded-[4rem] border border-slate-200 dark:border-slate-800 p-12 lg:p-20 shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#4F46E5] via-[#22C55E] to-[#4F46E5]" />

                            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
                                <div className="max-w-xl text-center lg:text-left">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B]/10 rounded-full text-[#F59E0B] text-xs font-black uppercase tracking-widest mb-6">
                                        <Lightbulb className="w-4 h-4" /> Expansion Intelligence
                                    </div>
                                    <h2 className="text-3xl lg:text-5xl font-black text-[#020617] dark:text-[#F8FAFC] tracking-tight leading-none">
                                        Performance <span className="text-[#4F46E5]">Insights</span>
                                    </h2>
                                </div>
                                <div className="hidden lg:block">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-16 h-16 rounded-full border-4 border-white dark:border-[#020617] bg-slate-200 overflow-hidden shadow-lg">
                                                <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="Expert" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs font-bold text-[#64748B] text-center mt-4 uppercase tracking-widest">Expert Advice Team</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[
                                    { title: "Boost Trust", tip: "Add customer testimonials to showcase real product experiences.", icon: Quote },
                                    { title: "Visual Impact", tip: "Use high-quality product images to increase conversion rates.", icon: Star },
                                    { title: "Clear Path", tip: "Include clear call-to-action buttons for frictionless shopping.", icon: MousePointer2 },
                                    { title: "Mobile Ready", tip: "Optimize your layout specifically for mobile-first customers.", icon: Smartphone },
                                    { title: "Optimized Copy", tip: "A/B test different headlines to find what resonates best.", icon: TrendingUp },
                                    { title: "Visual Engagement", tip: "Monitor your profile views and clicks to adjust strategy.", icon: Eye }
                                ].map((item, idx) => (
                                    <div key={idx} className="group p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-[#4F46E5]/30 transition-all">
                                        <div className="w-12 h-12 bg-white dark:bg-[#020617] rounded-xl flex items-center justify-center text-[#4F46E5] shadow-md group-hover:scale-110 transition-transform mb-6">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-black text-[#020617] dark:text-[#F8FAFC] mb-2">{item.title}</h3>
                                        <p className="text-sm font-medium text-[#64748B] leading-relaxed">{item.tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            ) : activeTab === 'google' ? (
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GoogleProfileManager />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MarketingTools />
                </div>
            )}
        </div>
    );
};

export default GrowBusiness;
