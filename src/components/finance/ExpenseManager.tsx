import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../../types/finance';

interface ExpenseManagerProps {
    pieData: { name: string; value: number }[];
    sectorTx: Transaction[];
    theme: string;
    COLORS: string[];
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({
    pieData, sectorTx, theme, COLORS
}) => {
    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
            <div className="lg:w-1/3 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-fit transition-colors">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Breakdown by Category</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={theme === 'dark' ? "#1e293b" : "#ffffff"} />)}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                                    color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                                }}
                                itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                                formatter={(value) => `₹${Number(value).toLocaleString()}`}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {sectorTx.filter(t => t.type === 'EXPENSE').map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-700 dark:text-slate-300">{t.category}</span></td>
                                    <td className="p-4 text-slate-800 dark:text-slate-200">{t.description}</td>
                                    <td className="p-4 text-right font-bold text-red-500 dark:text-red-400">-₹{t.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {sectorTx.filter(t => t.type === 'EXPENSE').length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No expenses recorded.</div>
                    ) : (
                        sectorTx.filter(t => t.type === 'EXPENSE').map(t => (
                            <div key={t.id} className="p-4 bg-white dark:bg-slate-800">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white">{t.description}</h4>
                                    <span className="font-bold text-red-500 dark:text-red-400">-₹{t.amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                    <span>{new Date(t.date).toLocaleDateString()}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{t.category}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpenseManager;
