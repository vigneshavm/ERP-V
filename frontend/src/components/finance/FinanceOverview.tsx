import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

interface FinanceOverviewProps {
    totalSales: number;
    totalExpenses: number;
    sectorLaborCost: number;
    netProfit: number;
}

const FinanceOverview: React.FC<FinanceOverviewProps> = ({
    totalSales,
    totalExpenses,
    sectorLaborCost,
    netProfit
}) => {
    const data = [
        { name: 'Revenue', value: totalSales, color: '#3b82f6' },
        { name: 'Expenses', value: totalExpenses, color: '#ef4444' },
        { name: 'Labor', value: sectorLaborCost, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    const margin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visual Analytics */}
                <div className="md:col-span-1 h-64 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Capital Distribution</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#000',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: any) => `₹${formatCurrency(value)}`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Detailed Breakdown */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Gross Inflow</span>
                        </div>
                        <h4 className="text-2xl font-black italic">₹{formatCurrency(totalSales)}</h4>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-success font-bold uppercase">
                            <TrendingUp size={12} /> Positive Velocity
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
                                <Wallet size={20} />
                            </div>
                            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">OpEx Burn</span>
                        </div>
                        <h4 className="text-2xl font-black italic text-error">₹{formatCurrency(totalExpenses)}</h4>
                        <div className="mt-2 text-[10px] text-neutral-400 font-bold uppercase italic">Includes Utilities & Material</div>
                    </div>

                    <div className="p-6 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                                <Users size={20} />
                            </div>
                            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Human Capital</span>
                        </div>
                        <h4 className="text-2xl font-black italic">₹{formatCurrency(sectorLaborCost)}</h4>
                        <div className="mt-2 text-[10px] text-neutral-400 font-bold uppercase italic">Sector Specific Attendance</div>
                    </div>

                    <div className="p-6 bg-neutral-900 dark:bg-neutral-950 text-white rounded-3xl shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Net Profit Pulse</span>
                            {netProfit >= 0 ? <ArrowUpRight className="text-primary" /> : <ArrowDownRight className="text-error" />}
                        </div>
                        <h4 className={`text-2xl font-black italic ${netProfit >= 0 ? 'text-white' : 'text-error'}`}>
                            ₹{formatCurrency(netProfit)}
                        </h4>
                        <p className="mt-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                            Margin: <span className="text-primary">{margin.toFixed(1)}%</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Insight Bar */}
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2rem] flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                    <TrendingUp size={24} />
                </div>
                <div className="flex-1">
                    <h5 className="text-sm font-black italic tracking-tight uppercase mb-1">Portfolio Intelligence Advisory</h5>
                    <p className="text-xs text-neutral-500 font-bold italic">
                        "Current operational efficiency is <span className="text-primary font-black">{margin > 20 ? 'OPTIMAL' : 'REDUCING'}</span>.
                        Optimize {totalExpenses > totalSales * 0.4 ? 'material procurement' : 'labor allocation'} for next-cycle growth."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FinanceOverview;
