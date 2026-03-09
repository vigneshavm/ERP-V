import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: string;
    variant?: 'default' | 'highlight' | 'rose' | 'emerald' | 'amber' | 'indigo';
    progress?: number;
    subtext?: string;
    trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon: Icon,
    color = 'primary',
    variant = 'default',
    progress,
    subtext,
    trend,
}) => {
    const colorMap: Record<string, string> = {
        primary: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    };

    const progressColorMap: Record<string, string> = {
        primary: 'bg-indigo-500',
        emerald: 'bg-emerald-500',
        rose: 'bg-rose-500',
        amber: 'bg-amber-500',
        blue: 'bg-blue-500',
    };

    return (
        <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 group-hover:text-indigo-600 transition-colors">
                        {value}
                    </h3>
                </div>
                <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.primary}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {progress !== undefined && (
                <div className="mt-4 h-1 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${progressColorMap[color] || progressColorMap.primary}`}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}
            {subtext && (
                <div className="mt-3 text-xs font-medium text-neutral-500">{subtext}</div>
            )}
        </div>
    );
};

export default MetricCard;
