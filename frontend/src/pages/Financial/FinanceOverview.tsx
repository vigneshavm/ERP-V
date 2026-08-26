import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from "@/utils/helpers";

interface FinanceOverviewProps {
    totalSales: number;
    totalExpenses: number;
    sectorLaborCost: number;
    netProfit: number;
}

const FinanceOverview: React.FC<FinanceOverviewProps> = ({ totalSales, totalExpenses, sectorLaborCost, netProfit }) => {
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-sm p-8 border border-neutral-100 dark:border-neutral-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition duration-700" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Net Profit</p>
                    <h3 className={`text-4xl font-black italic tracking-tighter ${netProfit >= 0 ? 'text-primary' : 'text-error'}`}>
                        ₹{formatCurrency(netProfit)}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4 text-primary" /> : <ArrowDownRight className="w-4 h-4 text-error" />}
                        <span className={`text-xs font-bold ${netProfit >= 0 ? 'text-primary' : 'text-error'}`}>{profitMargin.toFixed(1)}% Margin</span>
                    </div>
                </div>

                <div>
                    <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Revenue</p>
                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white italic tracking-tighter">
                        ₹{formatCurrency(totalSales)}
                    </h3>
                </div>

                <div>
                    <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">OpEx (Burn)</p>
                    <h3 className="text-2xl font-black text-error italic tracking-tighter">
                        ₹{formatCurrency(totalExpenses)}
                    </h3>
                </div>

                <div>
                    <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Labor Cost</p>
                    <h3 className="text-2xl font-black text-orange-500 italic tracking-tighter">
                        ₹{formatCurrency(sectorLaborCost)}
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default FinanceOverview;
