import React from 'react';
import { Check, Zap, Globe, Shield } from 'lucide-react';

interface PricingTiersProps {
    currentPlan: string;
    onUpgrade: (plan: string) => void;
}

const PricingTiers: React.FC<PricingTiersProps> = ({ currentPlan, onUpgrade }) => {
    const tiers = [
        {
            id: 'STARTER',
            name: 'Starter',
            price: 'Free',
            period: 'forever',
            description: 'Perfect for new businesses just getting started.',
            icon: Globe,
            features: [
                'Up to 50 Products',
                'Basic Storefront',
                '5% Transaction Fee',
                'Standard Support'
            ],
            color: 'slate',
            popular: false
        },
        {
            id: 'GROWTH',
            name: 'Growth',
            price: '₹999',
            period: '/ month',
            description: 'Everything you need to scale your online presence.',
            icon: Zap,
            features: [
                'Unlimited Products',
                'Custom Domain',
                '2% Transaction Fee',
                'Priority Support',
                'WhatsApp Integration',
                'Abandoned Cart Recovery'
            ],
            color: 'indigo',
            popular: true
        },
        {
            id: 'SCALE',
            name: 'Scale',
            price: '₹2499',
            period: '/ month',
            description: 'Advanced tools for high-volume sellers.',
            icon: Shield,
            features: [
                'All Growth Features',
                '0% Transaction Fee',
                'Advanced Analytics',
                'Dedicated Account Manager',
                'API Access',
                'Wholesale Capabilities'
            ],
            color: 'emerald',
            popular: false
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
                <div
                    key={tier.id}
                    className={`relative p-8 rounded-sm border transition-all duration-300 ${tier.popular
                            ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-105 z-10'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                >
                    {tier.popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                            Most Popular
                        </div>
                    )}

                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center mb-6 ${tier.color === 'indigo' ? 'bg-indigo-50 text-primary dark:bg-primary/20' :
                            tier.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-success/20' :
                                'bg-slate-50 text-slate-600 dark:bg-slate-700'
                        }`}>
                        <tier.icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{tier.price}</span>
                        <span className="text-sm text-slate-500 font-medium">{tier.period}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        {tier.description}
                    </p>

                    <div className="space-y-4 mb-8">
                        {tier.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                                {feature}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onUpgrade(tier.id)}
                        disabled={currentPlan === tier.id}
                        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${currentPlan === tier.id
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : tier.popular
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 hover:scale-[1.02]'
                                    : 'bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-900'
                            }`}
                    >
                        {currentPlan === tier.id ? 'Current Plan' : `Upgrade to ${tier.name}`}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default PricingTiers;
