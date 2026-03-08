import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    color: string;
    trend?: 'up' | 'down' | 'flat';
    progress?: number;
    variant?: 'default' | 'dark';
    compact?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtext,
    icon: Icon,
    color,
    trend,
    progress,
    variant = 'default',
    compact = false
}) => {
    const isDark = variant === 'dark';

    return (
        <div className={`${isDark
            ? 'bg-neutral-950 dark:bg-[#020617] text-white border-neutral-800 shadow-2xl'
            : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 shadow-sm'
            } ${compact ? 'p-4 lg:p-5 rounded-2xl' : 'p-6 lg:p-8 rounded-[2rem]'} border relative overflow-hidden group transition-all hover:border-primary/50`}>

            {/* Ambient Background Glow */}
            <div className={`absolute top-0 right-0 ${compact ? 'w-20 h-20' : 'w-32 h-32'} bg-${color}-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />

            <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'} relative z-10`}>
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className={`${compact ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl'} flex items-center justify-center transition-all ${isDark
                        ? 'bg-primary/20 text-primary group-hover:bg-primary/30'
                        : `bg-${color}-100 dark:bg-${color}-900/20 text-${color}-600 group-hover:bg-${color}-500/10`
                        }`}>
                        <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
                    </div>
                    <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'
                            }`}>{title}</p>
                        <h3 className={`${compact ? 'text-xl' : 'text-3xl'} font-black tracking-tighter italic ${isDark ? 'text-white' : 'text-neutral-900 dark:text-white'
                            }`}>{value}</h3>
                    </div>
                </div>
            </div>

            {/* Progress Bar Visualization */}
            {progress !== undefined && (
                <div className={`${compact ? 'mt-3' : 'mt-4'} relative z-10`}>
                    <div className={`h-1 lg:h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-neutral-100 dark:bg-neutral-700'
                        }`}>
                        <div
                            className={`h-full bg-${color}-500 transition-all duration-1000 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Trend & Subtext Information */}
            {subtext && (
                <div className={`${compact ? 'mt-1.5' : 'mt-2'} relative z-10`}>
                    <p className={`text-[9px] font-bold flex items-center gap-1.5 ${trend === 'up' ? 'text-emerald-500' :
                        trend === 'down' ? 'text-rose-500' :
                            'text-neutral-400'
                        }`}>
                        {trend === 'up' && <TrendingUp size={10} strokeWidth={3} />}
                        {trend === 'down' && <TrendingDown size={10} strokeWidth={3} />}
                        {subtext}
                    </p>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
