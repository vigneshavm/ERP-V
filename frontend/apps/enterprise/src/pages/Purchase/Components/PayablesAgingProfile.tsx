import React from 'react';
import { TrendingUp } from 'lucide-react';

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
    return (
        <div className="bg-white dark:bg-[var(--erp-bg)] p-6 rounded-2xl border border-default dark:border-default shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-main uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" /> Payables Aging Profile
                </h3>
                <div className="flex gap-4">
                    {Object.entries(agingAnalysis).map(([key, val]) => (
                        <div key={key} className="text-right">
                            <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">{key}</div>
                            <div className="text-[11px] font-black text-secondary dark:text-slate-200">₹{val.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="h-3 w-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-full flex overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(agingAnalysis.current / totalPayable) * 100}%` }} title="Current" />
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(agingAnalysis['1-30'] / totalPayable) * 100}%` }} title="1-30 Days" />
                <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(agingAnalysis['31-60'] / totalPayable) * 100}%` }} title="31-60 Days" />
                <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(agingAnalysis['61-90'] / totalPayable) * 100}%` }} title="61-90 Days" />
                <div className="h-full bg-[var(--erp-bg)] transition-all duration-500" style={{ width: `${(agingAnalysis['90+'] / totalPayable) * 100}%` }} title="90+ Days" />
            </div>
            <div className="mt-4 flex justify-center gap-6">
                {[
                    { label: 'Current', color: 'bg-emerald-500' },
                    { label: '1-30 Days', color: 'bg-amber-400' },
                    { label: '31-60 Days', color: 'bg-orange-500' },
                    { label: '61-90 Days', color: 'bg-rose-500' },
                    { label: '90+ Days', color: 'bg-[var(--erp-bg)]' }
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-[10px] font-bold text-muted">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PayablesAgingProfile;
