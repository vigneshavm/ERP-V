import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    amount: number;
    description?: string;
    icon: LucideIcon;
    colorClass?: string;
    bgClass?: string;
    iconColorClass?: string;
    currency?: string;
    isLoading?: boolean;
}

const CashBankStatsCard: React.FC<StatsCardProps> = ({
    title,
    amount,
    description,
    icon: Icon,
    colorClass = 'text-indigo-600',
    bgClass = 'bg-white',
    iconColorClass = 'text-indigo-600',
    currency = '₹',
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <div className={`${bgClass} rounded-2xl p-6 shadow-sm border border-default animate-pulse`}>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </div>
        );
    }

    return (
        <div className={`${bgClass} rounded-2xl p-6 shadow-sm border border-default hover:shadow-md transition-shadow group relative overflow-hidden`}>
            <div className={`absolute -top-4 -right-4 w-20 h-20 opacity-5 group-hover:scale-110 transition-transform ${iconColorClass}`}>
                <Icon className="w-full h-full" />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{title}</p>
                <h3 className={`text-2xl font-black ${colorClass}`}>
                    {currency}{amount.toLocaleString('en-IN')}
                </h3>
                {description && (
                    <p className="text-[10px] font-bold text-muted mt-1 uppercase tracking-tight">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
};

export default CashBankStatsCard;
