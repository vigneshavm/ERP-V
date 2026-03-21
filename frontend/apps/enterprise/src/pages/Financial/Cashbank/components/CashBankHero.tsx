import React from 'react';
import { LucideIcon, Activity } from 'lucide-react';

interface CashBankHeroProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: LucideIcon;
    stats?: React.ReactNode;
    extraActions?: React.ReactNode;
}

const CashBankHero: React.FC<CashBankHeroProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    stats,
    extraActions
}) => {
    return (
        <div className="erp-card p-6 sm:p-10 lg:p-12 mb-6 sm:mb-8 shadow-2xl relative overflow-hidden group border border-default">
            <div className={`absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-all duration-700 pointer-events-none`}></div>
            <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-1000 pointer-events-none">
                <Icon className="w-48 h-48 sm:w-64 sm:h-64" />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] mb-3 sm:mb-4 italic">
                        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                        {title}
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-slate-200 font-mono italic">{value}</h2>
                    {subtitle && <p className="text-muted text-xs sm:text-sm font-bold mt-2 sm:mt-3 tracking-wide">{subtitle}</p>}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                        {stats}
                    </div>
                </div>
                <div className="hidden lg:flex flex-col gap-3">
                    {extraActions}
                </div>
            </div>
        </div>
    );
};

export default CashBankHero;
