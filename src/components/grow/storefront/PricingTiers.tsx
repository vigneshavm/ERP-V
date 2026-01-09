import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface PricingTiersProps {
    isEnabled: boolean;
    isLoading: boolean;
    currentPlan: string;
    onUpgrade: (plan: string) => void;
}

const PricingTiers: React.FC<PricingTiersProps> = ({ isEnabled, isLoading, currentPlan, onUpgrade }) => {
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
                            onClick={() => onUpgrade(plan.name)}
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
    );
};

export default PricingTiers;
