import React from 'react';
import { Check, X, Info } from 'lucide-react';

const FeatureMatrix = () => {
    const features = [
        {
            category: "Core Commerce",
            items: [
                { name: "Product Listings", free: "50 Products", pro: "Unlimited", enterprise: "Unlimited" },
                { name: "Transaction Fee", free: "5%", pro: "2%", enterprise: "0%" },
                { name: "Custom Domain", free: false, pro: true, enterprise: true },
                { name: "Inventory Sync", free: true, pro: true, enterprise: true },
            ]
        },
        {
            category: "Marketing & Growth",
            items: [
                { name: "Discount Codes", free: true, pro: true, enterprise: true },
                { name: "Abandoned Cart Recovery", free: false, pro: true, enterprise: true },
                { name: "SEO Tools", free: "Basic", pro: "Advanced", enterprise: "Advanced" },
                { name: "WhatsApp Integration", free: false, pro: true, enterprise: true },
            ]
        },
        {
            category: "Support & Analytics",
            items: [
                { name: "Analytics Dashboard", free: "Basic", pro: "Full Suite", enterprise: "Custom Reports" },
                { name: "Support Priority", free: "Email", pro: "Priority Chat", enterprise: "24/7 Dedicated" },
            ]
        }
    ];

    const renderValue = (val: string | boolean) => {
        if (typeof val === 'boolean') {
            return val ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-muted mx-auto" />;
        }
        return <span className="text-sm font-medium text-secondary dark:text-muted">{val}</span>;
    };

    return (
        <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default overflow-hidden shadow-sm">
            <div className="p-6 border-b border-default dark:border-default">
                <h3 className="text-lg font-bold text-main">Feature Comparison</h3>
                <p className="text-muted dark:text-muted text-sm">Detailed breakdown of platform capabilities per plan</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50">
                            <th className="p-4 w-1/3 text-xs font-bold text-muted uppercase tracking-wider">Feature</th>
                            <th className="p-4 w-1/6 text-center text-xs font-bold text-muted uppercase tracking-wider">Starter</th>
                            <th className="p-4 w-1/6 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50/50 dark:bg-indigo-900/20 border-t-2 border-indigo-500">Growth</th>
                            <th className="p-4 w-1/6 text-center text-xs font-bold text-muted uppercase tracking-wider">Scale</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {features.map((section, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/50">
                                    <td colSpan={4} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-muted">
                                        {section.category}
                                    </td>
                                </tr>
                                {section.items.map((item, itemIdx) => (
                                    <tr key={itemIdx} className="hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-secondary dark:text-slate-200 flex items-center gap-2">
                                            {item.name}
                                            <Info className="w-3.5 h-3.5 text-muted cursor-help" />
                                        </td>
                                        <td className="p-4 text-center">{renderValue(item.free)}</td>
                                        <td className="p-4 text-center bg-indigo-50/10 dark:bg-indigo-900/10 font-bold border-x border-default dark:border-default">
                                            {renderValue(item.pro)}
                                        </td>
                                        <td className="p-4 text-center">{renderValue(item.enterprise)}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FeatureMatrix;
