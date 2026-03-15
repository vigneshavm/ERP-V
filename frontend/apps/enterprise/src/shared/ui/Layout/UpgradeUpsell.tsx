import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight, Zap } from 'lucide-react';


interface UpgradeUpsellProps {
    moduleName: string;
    description?: string;
    features?: string[];
}

const UpgradeUpsell: React.FC<UpgradeUpsellProps> = ({
    moduleName,
    description = "Unlock powerful enterprise features to scale your business operations.",
    features = [
        "Advanced Analytics & BI",
        "Multi-branch Synchronization",
        "Automated Workflows",
        "Priority 24/7 Support"
    ]
}) => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex items-center justify-center p-6 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-3xl shadow-xl shadow-primary/5 border border-neutral-200 dark:border-neutral-700 p-8 text-center relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 blur-3xl rounded-full"></div>

                <div className="relative">
                    <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>

                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">
                        {moduleName} Module Locked
                    </h2>

                    <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
                        {description}
                    </p>

                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-6 mb-8 text-left border border-neutral-100 dark:border-neutral-800">
                        <div className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Included in Pro Plans
                        </div>
                        <ul className="space-y-3">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-3 h-3 text-success fill-success" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group"
                        onClick={() => navigate('/settings/subscription')}
                    >
                        Learn More & Upgrade
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
                        Contact your account manager for tailored enterprise solutions.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeUpsell;
