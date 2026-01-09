import React from 'react';
import { Globe, ShoppingBag, Zap, BarChart3, Users, Smartphone } from 'lucide-react';

interface FeatureMatrixProps {
    isEnabled: boolean;
    currentPlan: string;
}

const FeatureMatrix: React.FC<FeatureMatrixProps> = ({ isEnabled, currentPlan }) => {
    const features = [
        { id: 'domain', title: 'Custom Domain', icon: Globe, description: 'Connect your own branded domain or use a free subdomain.', starter: false, pro: true, ent: true },
        { id: 'catalog', title: 'Product Catalog', icon: ShoppingBag, description: 'Manage and display your full range of products online.', starter: true, pro: true, ent: true },
        { id: 'payments', title: 'Payment Gateway', icon: Zap, description: 'Securely accept credit cards and local payment methods.', starter: false, pro: true, ent: true },
        { id: 'orders', title: 'Order Management', icon: BarChart3, description: 'Centralized dashboard for all your online and POS orders.', starter: true, pro: true, ent: true },
        { id: 'portal', title: 'Customer Portal', icon: Users, description: 'Allow customers to track orders and manage their profiles.', starter: false, pro: true, ent: true },
        { id: 'mobile', title: 'Mobile Responsive', icon: Smartphone, description: 'Optimized shopping experience for all screen sizes.', starter: true, pro: true, ent: true },
    ];

    return (
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
    );
};

export default FeatureMatrix;
