import { useAuthStore } from '@repo/shared';
import { logger } from '@/shared/lib/logger';
import React, { useTransition } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Check, Zap, Shield, Crown, Building, Activity,
    CreditCard, Sparkles,
    Database, Users as UsersIcon, Smartphone
} from 'lucide-react';
import api from "@/shared/api/api";
import { toast } from 'react-toastify';
import { RootState } from "@/app/store/store";

interface Plan {
    code: string;
    name: string;
    price: string;
    desc: string;
    icon: any;
    color: string;
    features: string[];
    popular?: boolean;
}

const SubscriptionTab: React.FC = () => {
    const dispatch = useDispatch();
    const [isPending, startTransition] = useTransition();
    const {  user  } = useAuthStore();
    const { tenants } = useSelector((state: RootState) => state.tenant || { tenants: [] });

    const currentTenant = (tenants || []).find((t: any) => (t.id || t._id) === user?.tenantId);
    const currentPlanCode = currentTenant?.planCode || 'FREE';

    const handleSwitchPlan = (planCode: string) => {
        startTransition(async () => {
            try {
                const response = await api.put('/shop/settings', {
                    plan: planCode,
                });
                if (response.data.success) {
                    dispatch({
                        type: 'tenant/updateTenantDetails',
                        payload: { id: user?.tenantId, updates: response.data.data }
                    });
                    toast.success(`Switched to ${planCode} plan successfully!`);
                }
            } catch (error: any) {
                logger.error('Error switching plan:', error);
                toast.error(error.response?.data?.message || 'Failed to switch plan');
            }
        });
    };

    const PLANS: Plan[] = [
        {
            code: 'FREE',
            name: 'Standard Base',
            price: '₹0',
            desc: 'Essential tools for single-terminal operations.',
            icon: Building,
            color: 'slate',
            features: ['Up to 50 items', 'Basic reporting', 'Single user']
        },
        {
            code: 'STARTER',
            name: 'Growth Engine',
            price: '₹29',
            desc: 'Expanded capacity for emerging enterprises.',
            icon: Sparkles,
            color: 'indigo',
            features: ['Up to 500 items', 'Standard reporting', 'Multi-user', 'E-commerce enabled']
        },
        {
            code: 'PRO',
            name: 'Professional',
            price: '₹99',
            desc: 'Full-spectrum suite for high-volume trade.',
            icon: Crown,
            color: 'emerald',
            popular: true,
            features: ['Unlimited items', 'Advanced analytics', 'Custom domain', 'Priority support']
        },
        {
            code: 'ENTERPRISE',
            name: 'Apex Tier',
            price: '₹499',
            desc: 'Bespoke infrastructure for global scale.',
            icon: Zap,
            color: 'blue',
            features: ['Dedicated account manager', 'Custom integrations', 'SLA guaranteed', 'On-premise option']
        }
    ];

    // Simulated usage data
    const usage = [
        { label: 'Storage Payload', value: 45, total: 50, unit: 'Items', icon: Database },
        { label: 'Agent Seats', value: 3, total: 5, unit: 'Users', icon: UsersIcon },
        { label: 'Terminal Nodes', value: 2, total: 10, unit: 'Devices', icon: Smartphone }
    ];

    return (
        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Active Subscription Summary */}
            <section className="bg-[var(--erp-bg)] rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-default shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Shield className="w-64 h-64 text-emerald-500" />
                </div>

                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                    <Activity className="w-12 h-12 text-main animate-pulse" />
                </div>

                <div className="relative z-10 flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black tracking-[0.2em] border border-emerald-500/20">VALID SESSION ACTIVE</span>
                        <div className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                    </div>
                    <h3 className="text-4xl font-black text-main italic tracking-tighter uppercase mb-2">
                        {PLANS.find(p => p.code === currentPlanCode)?.name || 'Apex Tier'}
                    </h3>
                    <p className="text-muted font-medium text-lg max-w-lg">
                        Your enterprise ecosystem is currently operating under the <span className="text-emerald-400 font-black italic">{currentPlanCode} Protocol</span>.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-4 shrink-0">
                    <button className="px-8 py-4 bg-white hover:bg-[var(--erp-bg-sunken)] text-main rounded-2xl text-[11px] font-black tracking-widest shadow-xl active:scale-95 transition-all">
                        BILLING HUB
                    </button>
                    <button className="px-8 py-4 bg-[var(--erp-card)] hover:bg-slate-700 text-muted rounded-2xl text-[11px] font-black tracking-widest border border-default active:scale-95 transition-all">
                        DOCS
                    </button>
                </div>
            </section>

            {/* Usage HUD */}
            <div className="grid md:grid-cols-3 gap-8">
                {usage.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-default dark:border-default shadow-sm group hover:shadow-xl transition-all duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <item.icon className="w-6 h-6 text-muted group-hover:text-indigo-500" />
                            </div>
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">{item.label}</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <h4 className="text-3xl font-black text-main tabular-nums">{item.value}<span className="text-sm text-muted ml-1 font-bold">/ {item.total}</span></h4>
                                <span className="text-[10px] font-black text-muted uppercase">{item.unit}</span>
                            </div>
                            <div className="w-full h-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    style={{ width: `${(item.value / item.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Comparison Grid */}
            <section>
                <div className="flex flex-col items-center text-center space-y-4 mb-12">
                    <h3 className="text-3xl font-black text-main uppercase tracking-tighter italic">Tiered <span className="text-indigo-600">Infrastructure</span></h3>
                    <p className="text-muted font-medium text-lg max-w-xl">Provision additional capabilities for your business domain.</p>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = currentPlanCode === plan.code;
                        return (
                            <div key={plan.code} className={`group relative p-8 rounded-[3rem] border transition-all duration-500 flex flex-col ${plan.popular
                                    ? 'bg-indigo-600 border-indigo-500 shadow-2xl scale-105 z-10'
                                    : 'bg-white dark:bg-slate-950 border-default dark:border-default hover:border-indigo-300'
                                }`}>
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-white text-indigo-600 rounded-full text-[10px] font-black tracking-[0.2em] shadow-xl border border-indigo-100">
                                        OPTIMAL CHOICE
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className={`w-16 h-16 rounded-[1.5rem] mb-6 flex items-center justify-center transition-transform group-hover:rotate-6 duration-500 shadow-lg ${plan.popular ? 'bg-white text-indigo-600' : 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] text-muted'
                                        }`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h4 className={`text-2xl font-black italic uppercase tracking-tight mb-2 ${plan.popular ? 'text-main' : 'text-main'}`}>{plan.name}</h4>
                                    <p className={`text-xs font-medium leading-relaxed ${plan.popular ? 'text-indigo-100' : 'text-muted'}`}>{plan.desc}</p>
                                </div>

                                <div className="mb-10">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-black tracking-tighter ${plan.popular ? 'text-main' : 'text-main'}`}>{plan.price}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${plan.popular ? 'text-indigo-200' : 'text-muted'}`}>/ Unit</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-12 flex-1">
                                    {plan.features.map(f => (
                                        <div key={f} className={`flex items-center gap-4 text-xs font-bold ${plan.popular ? 'text-indigo-50' : 'text-secondary dark:text-muted'}`}>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${plan.popular ? 'bg-indigo-500/30 border-indigo-400/30 text-white' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 text-emerald-600'
                                                }`}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => !isCurrent && handleSwitchPlan(plan.code)}
                                    disabled={isPending}
                                    className={`w-full py-5 rounded-[1.5rem] text-[11px] font-black tracking-[0.2em] transition-all relative overflow-hidden active:scale-95 ${isCurrent
                                            ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                                            : plan.popular
                                                ? 'bg-white text-indigo-600 hover:bg-[var(--erp-bg-sunken)]'
                                                : 'bg-[var(--erp-bg)] text-white hover:bg-indigo-600 dark:bg-[var(--erp-card)]'
                                        }`}
                                >
                                    {isPending ? (
                                        <Activity className="w-5 h-5 animate-spin mx-auto" />
                                    ) : isCurrent ? (
                                        'ACTIVE PROTOCOL'
                                    ) : (
                                        `PROVISION ${plan.code}`
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Trust Footer */}
            <div className="bg-[var(--erp-bg-sunken)]/50 dark:bg-slate-950 p-10 border border-default dark:border-default rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-10 text-muted">
                    <div className="flex items-center gap-3 text-muted">
                        <Shield className="w-6 h-6 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Bank-Grade Encryption</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-3 text-muted">
                        <Smartphone className="w-6 h-6 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Auto-Scale Ready</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Global Transaction Support</p>
                        <p className="text-xs font-bold text-indigo-600 cursor-pointer hover:underline">Secure Billing Documentation →</p>
                    </div>
                    <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-12 h-12 rounded-xl bg-white dark:bg-[var(--erp-bg)] border border-default dark:border-default flex items-center justify-center shadow-lg transform hover:-translate-y-2 transition-all">
                                <CreditCard className="w-5 h-5 text-muted" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionTab;
