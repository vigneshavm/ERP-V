import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Check, X, Zap, Shield, Crown, Building, Loader2, CreditCard, ChevronRight, Activity } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const SubscriptionTab = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { tenants } = useSelector((state) => state.tenant || { tenants: [] });
    // Normalize tenant id/id usage
    const currentTenant = (tenants || []).find(t => (t.id || t._id) === user?.tenantId);

    const handleSwitchPlan = async (planCode) => {
        try {
            const response = await api.put('/api/shop/settings', {
                plan: planCode,
            });
            if (response.data.success) {
                // Update local tenant details in Redux if needed
                dispatch({
                    type: 'tenant/updateTenantDetails',
                    payload: { id: user?.tenantId, updates: response.data.data }
                });
                toast.success(`Switched to ${planCode} plan successfully!`);
            }
        } catch (error) {
            console.error('Error switching plan:', error);
            toast.error(error.response?.data?.message || 'Failed to switch plan');
        }
    };

    const currentPlanCode = currentTenant?.planCode || 'FREE';

    const PLANS = [
        {
            code: 'FREE',
            name: 'Free',
            price: '₹0',
            desc: 'Basic features for small shops',
            icon: Building,
            color: 'slate',
            features: ['Up to 50 items', 'Basic reporting', 'Single user']
        },
        {
            code: 'STARTER',
            name: 'Starter Plan',
            price: '₹29',
            desc: 'Perfect for growing businesses',
            icon: Building,
            color: 'slate',
            features: ['Up to 500 items', 'Standard reporting', 'Multi-user', 'E-commerce enabled']
        },
        {
            code: 'PRO',
            name: 'Professional',
            price: '₹99',
            desc: 'Advanced features for established shops',
            icon: Crown,
            color: 'indigo',
            popular: true,
            features: ['Unlimited items', 'Advanced analytics', 'Custom domain', 'Priority support']
        },
        {
            code: 'ENTERPRISE',
            name: 'Enterprise',
            price: '₹499',
            desc: 'Custom solutions for large scale operations',
            icon: Zap,
            color: 'amber',
            features: ['Dedicated account manager', 'Custom integrations', 'SLA guaranteed', 'On-premise option']
        }
    ];

    return (
        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Active Subscription Summary */}
            <section className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Shield className="w-64 h-64 text-emerald-500" />
                </div>

                <div className="relative z-10 w-24 h-24 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 shrink-0">
                    <Activity className="w-12 h-12 text-white" />
                </div>

                <div className="relative z-10 flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black tracking-widest border border-emerald-500/20">ACTIVE SUBSCRIPTION</span>
                        <span className="text-slate-500 text-xs font-bold font-mono">ID: BZA-9284-X</span>
                    </div>
                    <h3 className="text-3xl font-black text-white leading-tight mb-2">
                        {PLANS.find(p => p.code === currentPlanCode)?.name || 'Standard Plan'}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-lg">
                        Your enterprise session is active and verified.
                        {currentTenant?.subscriptionEndDate ? (
                            <> The next billing cycle starts on <span className="text-white font-black">{new Date(currentTenant.subscriptionEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>.</>
                        ) : (
                            <> Standard billing cycle active.</>
                        )}
                    </p>
                </div>

                <div className="relative z-10 space-y-3 shrink-0">
                    <button className="w-full px-8 py-3.5 bg-white text-slate-900 rounded-2xl text-[11px] font-black tracking-widest shadow-lg active:scale-95 transition-all">
                        VIEW BILLING HISTORY
                    </button>
                    <button className="w-full px-8 py-3.5 bg-slate-800 text-slate-300 rounded-2xl text-[11px] font-black tracking-widest border border-slate-700 hover:bg-slate-700 transition-all">
                        CANCEL PLAN
                    </button>
                </div>
            </section>

            {/* Plan Comparison Grid */}
            <section>
                <div className="flex flex-col items-center text-center space-y-3 mb-10">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Scale your capabilities</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-md leading-relaxed">Choose a strategic plan tailored to your enterprise volume and feature requirements.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = currentPlanCode === plan.code;
                        return (
                            <div key={plan.code} className={`group relative p-8 rounded-[3rem] border transition-all duration-500 flex flex-col ${plan.popular
                                ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500 shadow-2xl scale-105 z-10'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                }`}>
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black tracking-[0.2em] shadow-lg">
                                        MOST ADOPTED
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className={`w-14 h-14 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${plan.popular ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">{plan.name}</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{plan.desc}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">{plan.price}</span>
                                        <span className="text-xs font-bold text-slate-400">/ MONTH</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 flex-1">
                                    {plan.features.map(f => (
                                        <div key={f} className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => !isCurrent && handleSwitchPlan(plan.code)}
                                    className={`w-full py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all ${isCurrent
                                        ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 dark:shadow-none'
                                        : plan.popular
                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-slate-900'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white'
                                        }`}
                                >
                                    {isCurrent ? 'CURRENTLY ACTIVE' : `SWITCH TO ${plan.code}`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Payment & Security Footer */}
            <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="flex -space-x-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                <CreditCard className="w-5 h-5 text-slate-400" />
                            </div>
                        ))}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800 dark:text-white leading-none">Global Secure Payments</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">PCI-DSS Compliant / 256-Bit SSL</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assistance</p>
                        <p className="text-xs font-bold text-indigo-600">Contact billing support</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionTab;
