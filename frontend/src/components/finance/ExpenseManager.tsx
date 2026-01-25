import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Search, Filter, Receipt, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

interface ExpenseManagerProps {
    pieData: Array<{ name: string; value: number }>;
    sectorTx: any[];
    theme: string;
    COLORS: string[];
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({
    pieData,
    sectorTx,
    theme,
    COLORS
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-2">Transaction Ledger</h4>
                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-700 overflow-hidden shadow-sm shadow-black/5">
                    <table className="w-full text-left text-sm tabular-nums">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px]">
                            <tr>
                                <th className="p-6">Entity / Date</th>
                                <th className="p-6">Category</th>
                                <th className="p-6 text-right">Value Impact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {sectorTx.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center">
                                        <p className="text-xs font-black text-neutral-300 uppercase tracking-widest italic">No pulse detected in ledger</p>
                                    </td>
                                </tr>
                            ) : (
                                sectorTx.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-bold text-neutral-900 dark:text-white uppercase tracking-tighter truncate max-w-[150px]">{tx.description || 'General Transaction'}</div>
                                            <div className="text-[10px] text-neutral-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="font-black text-lg text-error">- ₹{formatCurrency(tx.amount)}</div>
                                            <div className="text-[10px] text-error/60 font-black uppercase tracking-widest italic">verified</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-2">Burn Topology</h4>
                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-700 p-8 shadow-sm flex flex-col items-center">
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            className="outline-none hover:opacity-80 transition cursor-pointer"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#000000',
                                        border: 'none',
                                        borderRadius: '16px',
                                        padding: '12px 16px',
                                        color: '#ffffff',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        textTransform: 'uppercase'
                                    }}
                                    itemStyle={{ color: '#ffffff' }}
                                    formatter={(value: any) => `₹${formatCurrency(Number(value))}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-8">
                        {pieData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter truncate">{d.name}</span>
                                <span className="text-[10px] font-black text-neutral-900 dark:text-white ml-auto italic">₹{formatCurrency(d.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-neutral-950 text-white p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                    <Receipt className="absolute -top-10 -right-10 w-40 h-40 text-primary opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <h4 className="text-xl font-black italic mb-2 tracking-tight">Audit Ready.</h4>
                        <p className="text-xs font-bold text-neutral-400 leading-relaxed italic mb-6">
                            All expenses in this sector are tagged and verified against the current financial node policy.
                        </p>
                        <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            Generate Audit Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseManager;
