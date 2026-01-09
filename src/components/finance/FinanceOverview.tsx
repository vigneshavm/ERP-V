import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface FinanceOverviewProps {
    totalSales: number;
    totalExpenses: number;
    sectorLaborCost: number;
    netProfit: number;
}

const FinanceOverview: React.FC<FinanceOverviewProps> = ({
    totalSales, totalExpenses, sectorLaborCost, netProfit
}) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Total Sales Revenue</p>
                    <h3 className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">₹{totalSales.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Total Expenses (Ops + Stock)</p>
                    <h3 className="text-3xl font-bold text-red-500 dark:text-red-400">₹{totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Est. Labor Cost (Accrued)</p>
                    <h3 className="text-3xl font-bold text-orange-500 dark:text-orange-400">₹{sectorLaborCost.toLocaleString()}</h3>
                </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-800 to-slate-800 dark:from-indigo-900 dark:to-slate-900 p-8 rounded-2xl border border-indigo-700 dark:border-indigo-800 shadow-xl flex items-center justify-between text-white">
                <div>
                    <p className="text-indigo-200 font-medium mb-1">Real-Time P&L (Net Profit)</p>
                    <h2 className="text-5xl font-bold">₹{netProfit.toLocaleString()}</h2>
                    <p className="text-xs text-indigo-300 mt-2 opacity-70">*Revenue - Expenses - Labor Liability</p>
                </div>
                <div className={`p-4 rounded-full ${netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {netProfit >= 0 ? <ArrowUpRight className="w-12 h-12 text-emerald-400" /> : <ArrowDownLeft className="w-12 h-12 text-red-400" />}
                </div>
            </div>
        </div>
    );
};

export default FinanceOverview;
