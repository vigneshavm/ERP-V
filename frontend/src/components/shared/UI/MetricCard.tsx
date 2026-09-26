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

type MetricTone = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

// Tiles take their colour from the shared tokens in index.css. Older colour
// names are kept as aliases so existing callers keep working.
const toneClasses: Record<MetricTone, { glow: string; icon: string; progress: string }> = {
    brand: {
        glow: 'bg-primary/10',
        icon: 'bg-primary-soft text-primary',
        progress: 'bg-primary'
    },
    success: {
        glow: 'bg-success/10',
        icon: 'bg-success-soft text-success',
        progress: 'bg-success'
    },
    danger: {
        glow: 'bg-danger/10',
        icon: 'bg-danger-soft text-danger',
        progress: 'bg-danger'
    },
    warning: {
        glow: 'bg-warning/10',
        icon: 'bg-warning-soft text-warning',
        progress: 'bg-warning'
    },
    info: {
        glow: 'bg-info/10',
        icon: 'bg-info-soft text-info',
        progress: 'bg-info'
    },
    neutral: {
        glow: 'bg-secondary/10',
        icon: 'bg-input text-secondary',
        progress: 'bg-secondary'
    }
};

const colorAlias: Record<string, MetricTone> = {
    primary: 'brand', brand: 'brand', indigo: 'brand', blue: 'brand', violet: 'brand', purple: 'brand',
    success: 'success', emerald: 'success', green: 'success',
    danger: 'danger', rose: 'danger', red: 'danger',
    warning: 'warning', amber: 'warning', orange: 'warning', yellow: 'warning',
    info: 'info', sky: 'info', cyan: 'info', teal: 'info',
    neutral: 'neutral', slate: 'neutral', gray: 'neutral'
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
    const classes = toneClasses[colorAlias[color] ?? 'brand'];

    return (
        <div className={`${isDark
            ? 'bg-slate-950 dark:bg-card text-white border-slate-800 shadow-2xl'
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
                        <p className={`micro mb-0.5 ${isDark ? 'text-slate-500' : 'text-muted'
                            }`}>{title}</p>
                        <h3 className={`${compact ? 'text-xl' : 'metric-value'} font-black tracking-tighter italic ${isDark ? 'text-white' : 'text-main'
                            }`}>{value}</h3>
                    </div>
                </div>
            </div>

            {/* Progress Bar Visualization */}
            {progress !== undefined && (
                <div className={`${compact ? 'mt-3' : 'mt-4'} relative z-10`}>
                    <div className={`h-1 lg:h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-700'
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
                            'text-muted'
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
