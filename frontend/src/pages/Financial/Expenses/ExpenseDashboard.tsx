
import React, { useMemo } from 'react';
import { DollarSign, FileText, Calendar, TrendingUp } from 'lucide-react';
import { Expense } from "../../../hooks/useExpenses";

interface ExpenseDashboardProps {
    expenses: Expense[];
}

const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ expenses }) => {
    const stats = useMemo(() => {
        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const count = expenses.length;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const thisMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Calculate top category
        const categoryTotals = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount || 0);
            return acc;
        }, {} as Record<string, number>);

        const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
        const topCategory = topCategoryEntry ? topCategoryEntry[0] : 'None';

        return { total, count, thisMonthTotal, thisMonthCount: thisMonthExpenses.length, topCategory };
    }, [expenses]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                <div className="absolute -bottom-2 -right-2 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                    <DollarSign className="w-16 h-16" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Lifetime</p>
                    <h3 className="text-2xl font-black tabular-nums text-red-600">₹{stats.total.toLocaleString()}</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-neutral-500 font-bold text-[10px] uppercase">
                        {stats.count} Total Entries
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                <div className="absolute -bottom-2 -right-2 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                    <Calendar className="w-16 h-16" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">This Month</p>
                    <h3 className="text-2xl font-black tabular-nums text-neutral-900 dark:text-white">₹{stats.thisMonthTotal.toLocaleString()}</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-primary font-bold text-[10px] uppercase">
                        {stats.thisMonthCount} Entries this month
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                <div className="absolute -bottom-2 -right-2 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                    <TrendingUp className="w-16 h-16" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Top Category</p>
                    <h3 className="text-2xl font-black tracking-tight text-purple-600">{stats.topCategory}</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-neutral-500 font-bold text-[10px] uppercase">
                        Highest spending area
                    </div>
                </div>
            </div>

            <div className="bg-neutral-900 text-white p-6 rounded-[2rem] shadow-xl border border-neutral-800 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <FileText className="w-16 h-16" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Efficiency Score</p>
                    <h3 className="text-2xl font-black tabular-nums">₹{stats.count ? Math.round(stats.total / stats.count).toLocaleString() : 0}</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-neutral-400 font-bold text-[10px] uppercase">
                        Average per entry
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseDashboard;
