import React from 'react';
import { Package, CheckCircle, Clock, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';

interface GRNStatsProps {
    stats: {
        total: number;
        totalExpected: number;
        totalReceived: number;
        pendingVerification: number;
        disputed: number;
    };
}

const GRNStats: React.FC<GRNStatsProps> = ({ stats }) => {
    const statItems = [
        { label: 'Total Receipts', value: stats.total, icon: Package, color: 'blue', sub: 'Matrix Entries' },
        { label: 'Fulfillment Delta', value: `${Math.round((stats.totalReceived / (stats.totalExpected || 1)) * 100)}%`, icon: TrendingUp, color: 'emerald', sub: 'Inbound Velocity' },
        { label: 'Stasis Points', value: stats.pendingVerification, icon: Clock, color: 'amber', sub: 'Pending Audit' },
        { label: 'Variance Alert', value: stats.disputed, icon: AlertTriangle, color: 'rose', sub: 'Material Conflict' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statItems.map((item, i) => (
                <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none text-neutral-900 dark:text-white">
                        <item.icon className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{item.label}</p>
                            <h3 className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic">
                                {item.value}
                            </h3>
                        </div>
                        <div className="mt-8 flex flex-col gap-2">
                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">{item.sub}</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full bg-${item.color === 'blue' ? 'blue' : item.color === 'emerald' ? 'emerald' : item.color === 'amber' ? 'amber' : 'rose'}-500 animate-pulse`} />
                                <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none italic">Active Sync</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GRNStats;
