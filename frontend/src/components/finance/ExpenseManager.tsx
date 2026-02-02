import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TransactionType } from "../../types/common";
import { formatCurrency } from "../../utils/helpers";

interface ExpenseManagerProps {
    pieData: { name: string; value: number }[];
    sectorTx: any[];
    theme: string;
    COLORS: string[];
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ pieData, sectorTx, theme, COLORS }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-700 shadow-sm">
                <h3 className="text-lg font-black uppercase tracking-tight mb-8">Expense Distribution</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#171717' : '#fff',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-700 shadow-sm overflow-hidden flex flex-col">
                <h3 className="text-lg font-black uppercase tracking-tight mb-8">Burn Log</h3>
                <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                    <div className="space-y-4">
                        {sectorTx.filter((t: any) => t.type === TransactionType.EXPENSE).map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl group hover:scale-[1.02] transition-transform cursor-default">
                                <div>
                                    <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{tx.description || tx.category}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-100 dark:border-neutral-700">{tx.category}</span>
                                        <span className="text-[10px] font-medium text-neutral-400">{new Date(tx.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <p className="font-black text-error text-sm">-₹{formatCurrency(tx.amount)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseManager;
