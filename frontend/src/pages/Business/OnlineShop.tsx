import React, { useState, useEffect } from 'react';
import Layout from "../../components/shared/Layout/index.js";
import PageHeader from "../../components/shared/Layout/PageHeader.js";
import BusinessSubNav from './BusinessSubNav.js';
import api from "../../services/api.js";
import { toast } from 'react-toastify';

interface Feature {
    title: string;
    description: string;
    icon: string;
    status: string;
}

interface Plan {
    name: string;
    price: string;
    interval: string;
    features: string[];
    color: string;
    bg: string;
    button: string;
    popular?: boolean;
}

const OnlineShop: React.FC = () => {
    const [settings, setSettings] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadPageData = async () => {
            await Promise.all([fetchSettings(), fetchPlans()]);
            setLoading(false);
        };
        loadPageData();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/api/shop/settings');
            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching shop settings:', error);
            // toast.error('Failed to load shop settings');
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await api.get('/api/subscription-plans');
            if (response.data.success) {
                const mappedPlans = response.data.data.map((p: any) => ({
                    name: p.name,
                    price: `₹${p.price}`,
                    interval: p.billingCycle === 'lifetime' ? '/lifetime' : `/${p.billingCycle.replace('ly', '')}`,
                    features: p.features,
                    // Dynamic styling based on plan code/type
                    ...getPlanStyles(p.code),
                    popular: p.code === 'PRO' || p.name === 'Professional'
                }));
                setAvailablePlans(mappedPlans);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load subscription plans');
        }
    };

    const getPlanStyles = (code: string) => {
        switch (code) {
            case 'FREE':
                return {
                    color: 'border-gray-200',
                    bg: 'bg-white',
                    button: 'border-gray-600 text-gray-600 hover:bg-gray-50'
                };
            case 'STARTER':
                return {
                    color: 'border-blue-200',
                    bg: 'bg-white',
                    button: 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                };
            case 'PRO':
            case 'PROFESSIONAL':
                return {
                    color: 'border-indigo-600',
                    bg: 'bg-indigo-50',
                    button: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                };
            case 'ENTERPRISE':
                return {
                    color: 'border-purple-200',
                    bg: 'bg-white',
                    button: 'border-purple-600 text-purple-600 hover:bg-purple-50'
                };
            default:
                return {
                    color: 'border-gray-200',
                    bg: 'bg-white',
                    button: 'border-gray-600 text-gray-600 hover:bg-gray-50'
                };
        }
    };

    const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

    const handleUpdatePlan = async (planName: string) => {
        try {
            setUpdatingPlan(planName);
            const response = await api.put('/api/shop/settings', {
                plan: planName,
                shopEnabled: true // Enable shop when a plan is selected
            });
            if (response.data.success) {
                setSettings(response.data.data);
                toast.success(`${planName} plan activated successfully!`);
                // Optional: delay slightly to show success state
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update plan');
        } finally {
            setUpdatingPlan(null);
        }
    };

    const features: Feature[] = [
        { title: 'Custom Domain', description: 'Get your own branded domain name', icon: '🌐', status: 'Included' },
        { title: 'Product Catalog', description: 'Showcase unlimited products online', icon: '📦', status: 'Unlimited' },
        { title: 'Payment Gateway', description: 'Accept online payments securely', icon: '💳', status: '0% Fees' },
        { title: 'Order Management', description: 'Track and manage online orders', icon: '📋', status: 'Automated' },
        { title: 'Customer Portal', description: 'Let customers track their orders', icon: '👤', status: 'Self-serve' },
        { title: 'Mobile Responsive', description: 'Perfect on all devices', icon: '📱', status: 'Optimized' }
    ];

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* <PageHeader
                title="Online Store"
                description="Launch and manage your e-commerce business"
                breadcrumbs={[
                    { label: 'Dashboard', link: '/' },
                    { label: 'Business', link: '/business/online-shop' },
                    { label: 'Growth Tools', link: '/business/online-shop' },
                    { label: 'Online Store' }
                ]}
            /> */}
            {/* <BusinessSubNav /> */}

            {/* Hero Section - Refined with Glassmorphism */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 text-white mb-12 shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-indigo-400 opacity-10 rounded-full blur-3xl"></div>

                <div className="relative p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl text-center lg:text-left">
                        <div className="inline-flex items-center px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase mb-6 border border-white/20 shadow-inner">
                            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-ping"></span>
                            E-Commerce Solution
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                            Elevate Your <span className="text-indigo-200">Business</span> <br className="hidden md:block" /> Legacy Online 🚀
                        </h2>
                        <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-xl leading-relaxed opacity-90 font-medium">
                            Everything you need to build, manage, and scale your brand globally. Start your digital journey in minutes, not months.
                        </p>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-5">
                            <button
                                onClick={() => handleUpdatePlan('Free')}
                                className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 text-lg cursor-pointer"
                            >
                                {updatingPlan === 'Free' ? 'Processing...' : 'Start Free Trial'}
                            </button>
                            <button className="px-8 py-4 bg-indigo-800/40 backdrop-blur-md text-white border border-indigo-400/30 rounded-2xl font-bold hover:bg-indigo-700/50 transition-all hover:border-indigo-300">
                                View Demo Store
                            </button>
                        </div>
                    </div>
                    <div className="hidden lg:block relative group">
                        <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-72 h-80 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl rotate-3 transform group-hover:rotate-0 transition-all duration-700 ease-out flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-3 w-3 rounded-full bg-red-400/50"></div>
                                <div className="h-3 w-3 rounded-full bg-yellow-400/50"></div>
                                <div className="h-3 w-3 rounded-full bg-green-400/50"></div>
                            </div>
                            <div className="h-4 w-2/3 bg-white/20 rounded-md"></div>
                            <div className="flex gap-3">
                                <div className="h-24 w-1/2 bg-white/10 rounded-xl border border-white/5"></div>
                                <div className="h-24 w-1/2 bg-white/10 rounded-xl border border-white/5"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-3/4 bg-white/20 rounded"></div>
                                <div className="h-3 w-full bg-white/20 rounded"></div>
                                <div className="h-3 w-1/2 bg-white/20 rounded"></div>
                            </div>
                            <div className="mt-auto h-10 w-full bg-indigo-500/30 rounded-xl border border-white/10"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="mb-20">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Scale Without Limits</h3>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">Enterprise-grade tools optimized for speed and conversion. Included with every plan.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[100px] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="p-4 bg-indigo-50 rounded-2xl text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                        {feature.icon}
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200 shadow-sm">
                                        {feature.status}
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{feature.title}</h4>
                                <p className="text-gray-500 leading-relaxed text-sm font-medium">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Section - Dynamic Grid Implementation */}
            <div className="pb-20">
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black tracking-widest uppercase mb-4 border border-indigo-100">
                        Flexible Pricing
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tight italic">The Growth Architect</h3>
                    <p className="text-gray-500 text-lg">Transparent pricing that scales with your ambition.</p>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 ${availablePlans.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-8 max-w-[1400px] mx-auto px-4`}>
                    {availablePlans.map((plan, idx) => {
                        const isCurrent = settings?.plan === plan.name;
                        return (
                            <div
                                key={idx}
                                className={`relative flex flex-col p-8 rounded-[2.5rem] border-2 transition-all duration-500 h-full ${isCurrent
                                    ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-2xl scale-[1.03] z-20 bg-indigo-50/30'
                                    : plan.popular
                                        ? 'border-indigo-400 shadow-xl scale-[1.02] z-10 bg-white'
                                        : 'border-gray-100 bg-white hover:border-indigo-200 hover:shadow-2xl hover:-translate-y-2'
                                    }`}
                            >
                                {isCurrent && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
                                        <span className="flex items-center px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-lg border-2 border-white">
                                            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                            </svg>
                                            Active Plan
                                        </span>
                                    </div>
                                )}

                                {isCurrent && settings?.subscriptionEndDate && (
                                    <div className="mt-8 mb-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                        <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                                            <span className="text-indigo-400">Next Billing Cycle</span>
                                            <span className="text-indigo-600">
                                                {new Date(settings.subscriptionEndDate).toLocaleDateString(undefined, {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {!isCurrent && plan.popular && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
                                        <span className="px-6 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-lg border-2 border-white">
                                            Recommended
                                        </span>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className={`text-xl font-black uppercase tracking-wider ${isCurrent ? 'text-indigo-600' : 'text-gray-900'}`}>
                                            {plan.name}
                                        </h4>
                                        {isCurrent && (
                                            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-baseline">
                                        <span className={`text-5xl font-black tracking-tight ${isCurrent ? 'text-indigo-700' : 'text-gray-900'}`}>
                                            {plan.price}
                                        </span>
                                        <span className="text-gray-400 font-bold text-sm ml-2 uppercase tracking-widest">{plan.interval}</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-5 mb-10">
                                    {plan.features.map((feature, featureIdx) => (
                                        <li key={featureIdx} className="flex items-start list-none">
                                            <div className={`mt-1 mr-4 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isCurrent ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-emerald-500'}`}>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className={`text-sm font-semibold tracking-tight leading-snug ${isCurrent ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </div>

                                <button
                                    onClick={() => !isCurrent && handleUpdatePlan(plan.name)}
                                    disabled={isCurrent || updatingPlan === plan.name}
                                    className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.15em] transition-all duration-300 text-sm active:scale-95 ${isCurrent
                                        ? 'bg-indigo-100/50 text-indigo-400 cursor-default border-2 border-indigo-100/50'
                                        : plan.popular
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-200 border-2 border-indigo-600'
                                            : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white shadow-xl shadow-gray-100'
                                        }`}
                                >
                                    {isCurrent ? 'Current Selection' : (updatingPlan === plan.name ? 'Processing...' : 'Upgrade Plan')}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-20 p-10 rounded-[3rem] bg-gray-50 border border-gray-100 text-center max-w-4xl mx-auto shadow-inner">
                    <h4 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Need a custom plan?</h4>
                    <p className="text-gray-500 mb-8 font-medium">Join 500+ high-growth brands already using BizzAI Enterprise solutions.</p>
                    <button className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all hover:shadow-2xl">
                        Contact Sales
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default OnlineShop;

