import React from 'react';
import { Users, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, FileText, DollarSign, Wallet, ShieldCheck, Zap } from 'lucide-react';

interface SupplierStatsCardsProps {
    variant?: 'default' | 'inflow';
    // Default View Props
    totalSuppliers?: number;
    totalToCollect?: number;
    totalToPay?: number;

    // Inflow View Props
    totalInflow?: number;
    totalOutflow?: number;
    totalClosingBalance?: number;
    netChange?: number;
    activeSuppliers?: number;

    labels?: {
        suppliers?: string;
        collect?: string;
        pay?: string;
    };
    showSupplierCount?: boolean;
}

const SupplierStatsCards: React.FC<SupplierStatsCardsProps> = ({
    variant = 'default',
    totalSuppliers = 0,
    totalToCollect = 0,
    totalToPay = 0,
    totalInflow = 0,
    totalOutflow = 0,
    totalClosingBalance = 0,
    netChange = 0,
    activeSuppliers = 0,
    labels = {
        suppliers: "Entities",
        collect: "Receivable",
        pay: "Payable"
    },
    showSupplierCount = true
}) => {

    const formatCurrency = (val: number) => `₹ ${Math.abs(val).toLocaleString('en-IN')}`;

    if (variant === 'inflow') {
        const inflowStats = [
            { label: 'Aggregate Inflow', value: formatCurrency(totalInflow), icon: TrendingUp, color: 'blue', sub: 'Capital Entry' },
            { label: 'Aggregate Outflow', value: formatCurrency(totalOutflow), icon: TrendingDown, color: 'rose', sub: 'Capital Exit' },
            { label: 'Closing Position', value: formatCurrency(totalClosingBalance), icon: FileText, color: 'orange', sub: 'Net Liquidity' },
            { label: 'Period Oscillation', value: formatCurrency(netChange), icon: DollarSign, color: netChange >= 0 ? 'amber' : 'emerald', sub: 'Net Delta' },
            { label: 'Active Nodes', value: activeSuppliers, icon: Users, color: 'purple', sub: 'Trading Entities' }
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {inflowStats.map((stat, i) => (
                    <div key={i} className="erp-card rounded-[2.5rem] p-6 shadow-sm border-none relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none text-neutral-900 dark:text-white">
                            <stat.icon className="w-16 h-16" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{stat.label}</p>
                            <h3 className="text-xl font-black text-neutral-900 dark:text-main tracking-tighter italic">
                                {stat.value}
                            </h3>
                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-3">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const defaultStats = [
        ...(showSupplierCount ? [{ 
            label: labels.suppliers || 'Entities', 
            value: totalSuppliers, 
            icon: Users, 
            color: 'blue', 
            sub: 'Registered Nodes',
            status: 'Active'
        }] : []),
        { 
            label: labels.collect || 'Receivable', 
            value: formatCurrency(totalToCollect), 
            icon: ArrowDownLeft, 
            color: 'emerald', 
            sub: 'Inbound Claims',
            status: 'Liquid'
        },
        { 
            label: labels.pay || 'Payable', 
            value: formatCurrency(totalToPay), 
            icon: ArrowUpRight, 
            color: 'rose', 
            sub: 'Outbound Liability',
            status: 'Committed'
        }
    ];

    return (
        <div className={`grid grid-cols-1 ${showSupplierCount ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            {defaultStats.map((stat, i) => (
                <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none text-neutral-900 dark:text-white">
                        <stat.icon className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{stat.label}</p>
                            <h3 className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic">
                                {stat.value}
                            </h3>
                        </div>
                        <div className="mt-8 flex flex-col gap-2">
                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">{stat.sub}</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full bg-${stat.color}-500 animate-pulse`} />
                                <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none italic">{stat.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SupplierStatsCards;
