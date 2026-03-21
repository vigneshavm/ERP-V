import React from 'react';
import { FileText, IndianRupee, CheckCircle, AlertCircle, TrendingUp, Wallet, ArrowUpRight, Clock } from 'lucide-react';

interface Props {
    billsCount: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const BillsStats: React.FC<Props> = ({ billsCount, totalAmount, paidAmount, outstandingAmount }) => {
    const stats = [
        { 
            label: 'Total Manifests', 
            value: billsCount, 
            icon: FileText, 
            color: 'blue', 
            sub: 'Active Records',
            status: 'Nominal'
        },
        { 
            label: 'Aggregate Liability', 
            value: formatCurrency(totalAmount), 
            icon: IndianRupee, 
            color: 'purple', 
            sub: 'Total Exposure',
            status: 'Calculated'
        },
        { 
            label: 'Liquidated Capital', 
            value: formatCurrency(paidAmount), 
            icon: CheckCircle, 
            color: 'emerald', 
            sub: 'Settled Funds',
            status: 'Secure',
            trend: true
        },
        { 
            label: 'Pending Settlement', 
            value: formatCurrency(outstandingAmount), 
            icon: Clock, 
            color: 'amber', 
            sub: 'Due to Vendors',
            status: outstandingAmount > 0 ? 'Action Required' : 'Cleared',
            alert: outstandingAmount > totalAmount * 0.5
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none text-neutral-900 dark:text-white">
                        <stat.icon className="w-20 h-20" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{stat.label}</p>
                            <h3 className="text-2xl font-black text-neutral-900 dark:text-main tracking-tighter italic whitespace-nowrap">
                                {stat.value}
                            </h3>
                        </div>
                        <div className="mt-6 flex flex-col gap-2">
                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{stat.sub}</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full bg-${stat.color}-500 ${stat.trend ? 'animate-pulse' : ''}`} />
                                <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${stat.alert ? 'text-rose-500' : 'text-neutral-400'}`}>
                                    {stat.status}
                                </span>
                                {stat.trend && <ArrowUpRight className="w-2.5 h-2.5 text-emerald-500" />}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BillsStats;
