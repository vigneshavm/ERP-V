import React from 'react';
import { TrendingUp, ShieldCheck, Zap, Database } from 'lucide-react';

interface PayablesAgingProfileProps {
    agingAnalysis: {
        current: number;
        '1-30': number;
        '31-60': number;
        '61-90': number;
        '90+': number;
    };
    totalPayable: number;
}

const PayablesAgingProfile: React.FC<PayablesAgingProfileProps> = ({
    agingAnalysis,
    totalPayable
}) => {
    const buckets = [
        { label: 'Current', key: 'current', color: 'bg-emerald-500', icon: ShieldCheck },
        { label: '1-30 Days', key: '1-30', color: 'bg-blue-500', icon: Database },
        { label: '31-60 Days', key: '31-60', color: 'bg-amber-400', icon: Zap },
        { label: '61-90 Days', key: '61-90', color: 'bg-orange-500', icon: TrendingUp },
        { label: '90+ Days', key: '90+', color: 'bg-rose-600', icon: Database }
    ];

    return (
        <div className="erp-card rounded-[2.5rem] p-8 border-none shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <TrendingUp className="w-64 h-64 text-emerald-500" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                     <div className="flex items-center gap-4 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none text-brand-colors">Fiscal Ageing Profile</h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Global Maturity Distribution Matrix</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-6">
                    {buckets.map((bucket) => {
                        const val = (agingAnalysis as any)[bucket.key] || 0;
                        const pct = totalPayable > 0 ? (val / totalPayable) * 100 : 0;
                        return (
                            <div key={bucket.key} className="text-right">
                                <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic mb-1">{bucket.label}</div>
                                <div className="text-sm font-black text-neutral-900 dark:text-neutral-100 italic">₹ {val.toLocaleString()}</div>
                                <div className={`text-[8px] font-black uppercase tracking-tighter mt-0.5 ${val > 0 ? bucket.color.replace('bg-', 'text-') : 'text-neutral-300'}`}>
                                    {pct.toFixed(1)}% Exposure
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cinematic Progress Bar */}
            <div className="relative h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-full flex overflow-hidden border border-default dark:border-neutral-800 p-0.5 shadow-inner">
                {buckets.map((bucket) => {
                    const val = (agingAnalysis as any)[bucket.key] || 0;
                    const pct = totalPayable > 0 ? (val / totalPayable) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                        <div 
                            key={bucket.key}
                            className={`h-full ${bucket.color} transition-all duration-1000 ease-out relative group/bucket`}
                            style={{ width: `${pct}%` }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bucket:opacity-100 transition-opacity" />
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
                {buckets.map((bucket) => (
                    <div key={bucket.label} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-default dark:border-neutral-800 transition-all hover:scale-[1.02]">
                        <div className={`w-8 h-8 rounded-xl ${bucket.color} flex items-center justify-center text-white shadow-sm`}>
                            <bucket.icon className="w-4 h-4" />
                        </div>
                        <div>
                             <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block leading-none">{bucket.label}</span>
                             <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 block leading-none ${bucket.color.replace('bg-', 'text-')}`}>Analysis Active</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PayablesAgingProfile;
