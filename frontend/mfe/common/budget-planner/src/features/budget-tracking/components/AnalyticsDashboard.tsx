import React, { useMemo, useState } from 'react';
import { usePersonalFinance } from "@repo/shared";
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from "recharts";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

export const AnalyticsDashboard = () => {
    const { transactions, categories } = usePersonalFinance();

    const stats = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        return { income, expense, savings, savingsRate };
    }, [transactions]);

    const categoryData = useMemo(() => {
        const data: Record<string, { name: string; value: number; color: string }> = {};
        
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = categories.find(c => c.id === t.category);
            const name = cat?.name || 'Other';
            if (!data[name]) {
                data[name] = { name, value: 0, color: (cat as any)?.color || '#3498db' };
            }
            data[name].value += t.amount;
        });

        return Object.values(data).sort((a, b) => b.value - a.value);
    }, [transactions, categories]);

    const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Period Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex p-1 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                    {['week', 'month', 'quarter', 'year'].map((p) => (
                        <button 
                            key={p}
                            onClick={() => setPeriod(p as any)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-900'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-bl-3xl">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Total Income</p>
                    <h3 className="text-2xl font-black italic tracking-tighter text-neutral-900 dark:text-neutral-100">
                        ₹{stats.income.toLocaleString()}
                    </h3>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-bl-3xl">
                        <TrendingDown className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Total Expenses</p>
                    <h3 className="text-2xl font-black italic tracking-tighter text-neutral-900 dark:text-neutral-100">
                        ₹{stats.expense.toLocaleString()}
                    </h3>
                </div>

                <div className="bg-neutral-900 dark:bg-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 bg-white/10 dark:bg-black/10 text-white dark:text-black rounded-bl-3xl">
                        <Target className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Savings Rate</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black italic tracking-tighter text-white dark:text-neutral-900">
                            {Math.round(stats.savingsRate)}%
                        </h3>
                        <div className="flex-1 bg-neutral-800 dark:bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, stats.savingsRate)}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Horizontal Category Ranking */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-[32px] border border-neutral-100 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-lg font-black tracking-tight">Category Rankings</h4>
                            <p className="text-xs text-neutral-400 font-medium">Sorted by highest spend</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {categoryData.length === 0 ? (
                            <p className="text-center py-12 text-neutral-400 font-medium italic">No expenses recorded for this period</p>
                        ) : categoryData.map((cat, idx) => {
                            const percentage = (cat.value / stats.expense) * 100;
                            return (
                                <div key={cat.name} className="group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-neutral-300 w-4">0{idx + 1}</span>
                                            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black tracking-tight text-neutral-900 dark:text-neutral-100">₹{cat.value.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-neutral-400 ml-2">{Math.round(percentage)}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-neutral-50 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80" 
                                            style={{ 
                                                width: `${percentage}%`,
                                                backgroundColor: cat.color 
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Vertical Chart / Distribution */}
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-[32px] border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-8 self-start">Distribution</h4>
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => `₹${value.toLocaleString()}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Total</p>
                            <p className="text-xl font-black italic tracking-tighter">₹{stats.expense.toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="mt-8 space-y-2 w-full">
                         {categoryData.slice(0, 3).map(cat => (
                             <div key={cat.name} className="flex items-center justify-between px-4 py-2 bg-neutral-50/50 dark:bg-neutral-800/50 rounded-xl">
                                 <div className="flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                     <span className="text-[10px] font-bold text-neutral-500">{cat.name}</span>
                                 </div>
                                 <span className="text-[10px] font-black text-neutral-900 dark:text-neutral-100">{Math.round((cat.value / stats.expense) * 100)}%</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
