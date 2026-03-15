import React from 'react';
import { TrendingUp, TrendingDown, PieChart, Zap } from 'lucide-react';

const PLRow: React.FC<{ label: string; value: number; isBold?: boolean; isMain?: boolean; isSuccess?: boolean; textLarge?: boolean }> = ({ label, value, isBold, isMain, isSuccess, textLarge }) => (
    <div className={`flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${isBold ? 'font-black' : 'font-bold'} ${textLarge ? 'text-lg' : 'text-xs'}`}>
        <span className={`${isMain ? 'text-neutral-900 dark:text-white uppercase tracking-widest' : 'text-neutral-500'}`}>{label}</span>
        <span className={`${isSuccess ? 'text-emerald-600' : value < 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'} tabular-nums`}>
            {value < 0 ? `(₹${Math.abs(value).toLocaleString()})` : `₹${value.toLocaleString()}`}
        </span>
    </div>
);

const SectionHeader = ({ title, amount, colorClass = "text-neutral-900 dark:text-white" }: { title: string, amount: number, colorClass?: string }) => (
    <div className="flex justify-between items-center mb-4 mt-6 first:mt-0 border-b-2 border-neutral-100 dark:border-neutral-800 pb-2">
        <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${colorClass}`}>{title}</h4>
        <span className="font-mono text-xs font-black">₹{amount.toLocaleString()}</span>
    </div>
);

export const ProfitLossReport: React.FC<{ data: any }> = ({ data }) => {
    // Ported from BusinessReportsHub.tsx
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Gross Profit" value={`₹${(data.gross_profit / 100000).toFixed(2)}L`} change="+12.5%" isPositive={true} sub="vs last month" />
                <StatCard label="EBITDA" value={`₹${(data.ebitda / 100000).toFixed(2)}L`} sub="Earnings Before Interest, Taxes..." />
                <StatCard label="Net MARGIN" value={`${data.ratios.net_margin}%`} change="-2.1%" isPositive={false} sub="Efficiency ratio" />
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-xl overflow-hidden">
                <div className="p-8 lg:p-12 space-y-12">
                    {/* Revenue Section */}
                    <div>
                        <SectionHeader title="Operating Revenue" amount={data.revenue.total} colorClass="text-indigo-600" />
                        <div className="space-y-1 pl-4 border-l-2 border-indigo-50">
                            {data.revenue.breakdown.map((item: any, i: number) => (
                                <PLRow key={i} label={item.category} value={item.amount} />
                            ))}
                        </div>
                    </div>

                    {/* COGS Section */}
                    <div>
                        <SectionHeader title="Cost of Goods Sold" amount={data.cogs.total} colorClass="text-red-500" />
                        <div className="space-y-1 pl-4 border-l-2 border-red-50">
                            <PLRow label="Direct Material Costs" value={data.cogs.material} />
                            <PLRow label="Direct Labor" value={data.cogs.labor} />
                            <PLRow label="Freight & Handling" value={data.cogs.freight} />
                        </div>
                    </div>

                    <div className="py-6 px-8 bg-neutral-900 rounded-3xl text-white transform hover:scale-[1.01] transition-transform">
                        <PLRow label="Gross Profit" value={data.gross_profit} isBold isMain textLarge />
                    </div>

                    {/* Operating Expenses */}
                    <div>
                        <SectionHeader title="Operating Expenses" amount={data.expenses.total} />
                        <div className="space-y-1 pl-4 border-l-2 border-neutral-100">
                            {data.expenses.breakdown.map((item: any, i: number) => (
                                <PLRow key={i} label={item.category} value={item.amount} />
                            ))}
                        </div>
                    </div>

                    {/* Bottom Line */}
                    <div className="space-y-4 pt-8 border-t-4 border-neutral-900 dark:border-white/20">
                        <PLRow label="Operating Income (EBIT)" value={data.ebit} isBold />
                        <PLRow label="Interest & Tax" value={-(data.interest + data.tax)} />
                        <div className="py-8 px-10 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/30">
                            <PLRow label="Net Profit For Period" value={data.net_profit} isBold isMain textLarge isSuccess />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const BalanceSheetReport: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Debt to Equity</p>
                        <h3 className="text-2xl font-black">{data.ratios.debt_equity}</h3>
                    </div>
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Zap className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-neutral-900 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Working Capital</p>
                        <h3 className="text-2xl font-black text-emerald-400">₹{(data.ratios.working_capital / 1000000).toFixed(2)}M</h3>
                    </div>
                    <PieChart className="w-8 h-8 opacity-20" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets Side */}
                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                    <div className="p-6 bg-neutral-900 text-white flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest">Assets side</h4>
                        <span className="text-xs font-black font-mono">₹{data.assets.total.toLocaleString()}</span>
                    </div>
                    <div className="p-8 space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-50 pb-1">Current Assets</p>
                            <div className="space-y-4">
                                {data.assets.current.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-neutral-500">{item.name}</span>
                                        <span className="font-black tabular-nums">₹{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 border-b border-neutral-50 pb-1">Fixed Assets</p>
                            <div className="space-y-4">
                                {data.assets.fixed.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-neutral-500">{item.name}</span>
                                        <span className="font-black tabular-nums">₹{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liabilities & Equity Side */}
                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                    <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest">Liabilities & Equity</h4>
                        <span className="text-xs font-black font-mono">₹{(data.liabilities.total + data.equity.total).toLocaleString()}</span>
                    </div>
                    <div className="p-8 space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 border-b border-red-50 pb-1">Liabilities</p>
                            <div className="space-y-4">
                                {[...data.liabilities.current, ...data.liabilities.long_term].map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-neutral-500">{item.name}</span>
                                        <span className="font-black tabular-nums">₹{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-50 pb-1">Equity & Capital</p>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-neutral-500">Share Capital</span>
                                    <span className="font-black tabular-nums">₹{data.equity.capital.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-neutral-500">Retained Earnings</span>
                                    <span className="font-black tabular-nums">₹{data.equity.retained_earnings.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 mt-2">
                                    <span className="text-xs font-black text-emerald-600">Current Period Profit</span>
                                    <span className="text-xs font-black text-emerald-600 tabular-nums">₹{data.equity.current_profit.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string; change?: string; isPositive?: boolean; sub?: string }> = ({ label, value, change, isPositive, sub }) => (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black tabular-nums group-hover:text-indigo-600 transition-colors">{value}</h3>
        {change && (
            <div className={`flex items-center gap-1.5 mt-2 font-bold text-[10px] uppercase ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change} {sub && <span className="text-neutral-400 text-[8px] tracking-normal">({sub})</span>}
            </div>
        )}
        {!change && sub && (
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-2">{sub}</p>
        )}
    </div>
);
