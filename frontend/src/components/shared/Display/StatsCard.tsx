import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    iconBgColor?: string;
    iconColor?: string;
    trend?: string;
    trendUp?: boolean;
    className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    iconBgColor = 'bg-primary-soft',
    iconColor = 'text-primary',
    trend,
    trendUp,
    className = ''
}) => {
    return (
        <div className={`bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-sm p-5 shadow-sm hover:shadow-md transition-all ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>

                    {trend && (
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${trendUp === true
                                    ? 'bg-success-soft text-success dark:bg-success-soft'
                                    : trendUp === false
                                        ? 'bg-danger-soft text-danger dark:bg-danger-soft'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                }`}>
                                {trend}
                            </span>
                        </div>
                    )}
                </div>

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgColor} ${iconColor}`}>
                    <div className="w-6 h-6">
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
