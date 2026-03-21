import React from 'react';
import { DollarSign, AlertCircle, Clock, Building2, TrendingUp, ShieldCheck } from 'lucide-react';
import { AgedBill } from '../hooks/useOutstandingPayables';

interface PayablesStatsProps {
    totalPayable: number;
    totalOverdue: number;
    processedBills: AgedBill[];
    dueSoonAmount: number;
    criticalVendorsCount: number;
}

const PayablesStats: React.FC<PayablesStatsProps> = ({
    totalPayable,
    totalOverdue,
    processedBills,
    dueSoonAmount,
    criticalVendorsCount
}) => {
    const statItems = [
        { label: 'Aggregate Liability', value: `₹ ${totalPayable.toLocaleString('en-IN')}`, icon: DollarSign, color: 'blue', sub: `${processedBills.length} Pending Nodes` },
        { label: 'Critical Overdue', value: `₹ ${totalOverdue.toLocaleString('en-IN')}`, icon: AlertCircle, color: 'rose', sub: 'Immediate Settlement' },
        { label: 'Upcoming (7D)', value: `₹ ${dueSoonAmount.toLocaleString('en-IN')}`, icon: Clock, color: 'amber', sub: 'Provision Required' },
        { label: 'Exposed Entities', value: criticalVendorsCount, icon: Building2, color: 'indigo', sub: 'High-Risk Partners' }
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
                            <h3 className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic whitespace-nowrap">
                                {item.value}
                            </h3>
                        </div>
                        <div className="mt-8 flex flex-col gap-2">
                            <p className={`text-[8px] font-black text-${item.color === 'blue' ? 'blue' : item.color === 'rose' ? 'rose' : item.color === 'amber' ? 'amber' : 'indigo'}-500 uppercase tracking-widest leading-none`}>{item.sub}</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full bg-${item.color === 'blue' ? 'blue' : item.color === 'rose' ? 'rose' : item.color === 'amber' ? 'amber' : 'indigo'}-500 animate-pulse`} />
                                <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none italic">Active Matrix</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PayablesStats;
