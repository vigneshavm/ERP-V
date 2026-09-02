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
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[3rem] p-12 mb-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                <Icon className="w-64 h-64" />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <Activity className="w-4 h-4 text-success animate-pulse" />
                        {title}
                    </div>
                    <h2 className="text-6xl font-black tracking-tighter">{value}</h2>
                    {subtitle && <p className="text-indigo-200 text-sm font-bold mt-2">{subtitle}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-8">
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
