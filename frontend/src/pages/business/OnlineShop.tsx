import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import BusinessSubNav from './BusinessSubNav';
import api from '../../services/api';
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
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/api/shop/settings');
            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching shop settings:', error);
            toast.error('Failed to load shop settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePlan = async (planName: string) => {
        try {
            const response = await api.put('/api/shop/settings', {
                plan: planName,
                shopEnabled: true // Enable shop when a plan is selected
            });
            if (response.data.success) {
                setSettings(response.data.data);
                toast.success(`${planName} plan activated successfully!`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update plan');
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

    const plans: Plan[] = [
        {
            name: 'Starter',
            price: '₹499',
            interval: '/month',
            features: ['Up to 50 products', 'Basic theme', 'Email support', 'Standard Analytics'],
            color: 'border-blue-200',
            bg: 'bg-white',
            button: 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
        },
        {
            name: 'Professional',
            price: '₹999',
            interval: '/month',
            features: ['Unlimited products', 'Premium themes', 'Priority support', 'Custom domain', 'Advanced Analytics'],
            color: 'border-indigo-600',
            bg: 'bg-indigo-50',
            popular: true,
            button: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
        },
        {
            name: 'Enterprise',
            price: '₹1999',
            interval: '/month',
            features: ['Everything in Pro', 'Multi-store', 'API access', 'Dedicated manager', 'White-labeling'],
            color: 'border-purple-200',
            bg: 'bg-white',
            button: 'border-purple-600 text-purple-600 hover:bg-purple-50'
        }
    ];

    return (
        <Layout>
            <PageHeader
                title="Online Store"
                description="Launch and manage your e-commerce business"
                breadcrumbs={[
                    { label: 'Dashboard', link: '/' },
                    { label: 'Business', link: '/business/online-shop' },
                    { label: 'Growth Tools', link: '/business/online-shop' },
                    { label: 'Online Store' }
                ]}
            />
            <BusinessSubNav />

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-indigo-600 text-white mb-10 shadow-xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-400 opacity-20 rounded-full blur-3xl"></div>

                <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <span className="inline-block px-3 py-1 bg-indigo-500/50 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wide uppercase mb-4 border border-indigo-400">
                            E-Commerce Solution
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                            Go Digital, Grow Faster! 🚀
                        </h2>
                        <p className="text-indigo-100 text-lg mb-8 max-w-lg leading-relaxed">
                            Launch your professional online store today. Reach customers 24/7 without any technical knowledge.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition shadow-lg hover:shadow-xl active:scale-95">
                                Start Free Trial
                            </button>
                            <button className="px-6 py-3 bg-indigo-700 text-white border border-indigo-500 rounded-lg font-bold hover:bg-indigo-600 transition">
                                View Demo Store
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:block w-64 h-64 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-2xl rotate-3 transform hover:rotate-0 transition-all duration-500">
                        {/* Abstract Mock UI */}
                        <div className="h-4 w-full bg-white/20 rounded mb-4"></div>
                        <div className="flex gap-2 mb-4">
                            <div className="h-20 w-1/2 bg-white/20 rounded"></div>
                            <div className="h-20 w-1/2 bg-white/20 rounded"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-3/4 bg-white/20 rounded"></div>
                            <div className="h-3 w-1/2 bg-white/20 rounded"></div>
                            <div className="h-3 w-full bg-white/20 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="mb-12">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">Everything you need to sell online</h3>
                    <p className="text-gray-500 mt-2">Professional tools included with every plan</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gray-50 rounded-lg text-2xl group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    {feature.status}
                                </span>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                            <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Section */}
            <div>
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-bold text-gray-900">Choose the perfect plan</h3>
                    <p className="text-gray-500 mt-2">Transparent pricing. No hidden fees.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative flex flex-col p-8 rounded-2xl border-2 transition-all duration-300 ${plan.bg} ${plan.popular
                                ? 'border-indigo-600 shadow-xl scale-105 z-10'
                                : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-md">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h4>
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-500 ml-1">{plan.interval}</span>
                                </div>
                            </div>

                            <ul className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature, featureIdx) => (
                                    <li key={featureIdx} className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-gray-600 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpdatePlan(plan.name)}
                                className={`w-full py-3.5 rounded-xl font-bold transition-all ${plan.button} border ${settings?.plan === plan.name ? 'ring-2 ring-indigo-600' : ''}`}
                            >
                                {settings?.plan === plan.name ? 'Current Plan' : 'Get Started'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default OnlineShop;
