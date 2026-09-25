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

const colorClasses: Record<string, {
    glow: string;
    icon: string;
    progress: string;
}> = {
    primary: {
        glow: 'bg-primary/10',
        icon: 'bg-primary/10 dark:bg-primary/20 text-primary group-hover:bg-primary/20',
        progress: 'bg-primary'
    },
    blue: {
        glow: 'bg-blue-500/10',
        icon: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 group-hover:bg-blue-500/10',
        progress: 'bg-blue-500'
    },
    indigo: {
        glow: 'bg-indigo-500/10',
        icon: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 group-hover:bg-indigo-500/10',
        progress: 'bg-indigo-500'
    },
    emerald: {
        glow: 'bg-emerald-500/10',
        icon: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 group-hover:bg-emerald-500/10',
        progress: 'bg-emerald-500'
    },
    rose: {
        glow: 'bg-rose-500/10',
        icon: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 group-hover:bg-rose-500/10',
        progress: 'bg-rose-500'
    },
    slate: {
        glow: 'bg-slate-500/10',
        icon: 'bg-slate-100 dark:bg-slate-900/20 text-slate-600 group-hover:bg-slate-500/10',
        progress: 'bg-slate-500'
    }
};

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
    const classes = colorClasses[color] || colorClasses.primary;

    return (
        <div className={`${isDark
            ? 'bg-neutral-950 dark:bg-card text-white border-neutral-800 shadow-2xl'
            : 'bg-card text-main border-default shadow-sm'
            } ${compact ? 'p-4 lg:p-5 rounded-sm' : 'p-6 lg:p-8 rounded-metric'} border relative overflow-hidden group transition-all hover:border-primary/50`}>

            {/* Ambient Background Glow */}
            <div className={`absolute top-0 right-0 ${compact ? 'w-20 h-20' : 'w-32 h-32'} ${classes.glow} rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />

            <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'} relative z-10`}>
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className={`${compact ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-sm'} flex items-center justify-center transition-all ${isDark
                        ? 'bg-primary/20 text-primary group-hover:bg-primary/30'
                        : classes.icon
                        }`}>
                        <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
                    </div>
                    <div>
                        <p className={`micro mb-0.5 ${isDark ? 'text-neutral-500' : 'text-secondary opacity-60'
                            }`}>{title}</p>
                        <h3 className={`${compact ? 'text-xl' : 'metric-value'} font-black tracking-tighter italic ${isDark ? 'text-white' : 'text-main'
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
                            className={`h-full ${classes.progress} transition-all duration-1000 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Trend & Subtext Information */}
            {subtext && (
                <div className={`${compact ? 'mt-1.5' : 'mt-2'} relative z-10`}>
                    <p className={`micro flex items-center gap-1.5 ${trend === 'up' ? 'text-success' :
                        trend === 'down' ? 'text-danger' :
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
