
import React, { useMemo } from 'react';
import { DollarSign, FileText, Calendar, TrendingUp } from 'lucide-react';
import { Expense } from '../../hooks/useExpenses';

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

        return { total, count, thisMonthTotal, thisMonthCount: thisMonthExpenses.length };
    }, [expenses]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Lifetime</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">₹{stats.total.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">This Month</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">₹{stats.thisMonthTotal.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <Calendar className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Entries</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stats.count}</h3>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Average / Entry</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">₹{stats.count ? Math.round(stats.total / stats.count).toLocaleString() : 0}</h3>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600 dark:text-yellow-400">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseDashboard;
