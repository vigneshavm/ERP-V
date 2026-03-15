import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { DollarSign, FileText, Calendar, TrendingUp, LayoutDashboard, PieChart, Target, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useExpenses } from "@/features/expense-tracking/lib/useExpenses";
import { useExpenseCategories } from "@/features/expense-tracking/lib/useExpenseCategories";
import Layout from "@/shared/ui/Layout";

const ExpenseDashboardPage = () => {
    const { user } = useSelector((state) => state.auth);
    const { expenses, loading } = useExpenses();
    const { categories } = useExpenseCategories();

    const stats = useMemo(() => {
        const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const count = expenses.length;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const thisMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const monthChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;

        // Category breakdown
        const byCategory = {};
        expenses.forEach(e => {
            if (!byCategory[e.category]) byCategory[e.category] = 0;
            byCategory[e.category] += Number(e.amount || 0);
        });

        const categoryBreakdown = Object.entries(byCategory)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            total,
            count,
            thisMonthTotal,
            thisMonthCount: thisMonthExpenses.length,
            lastMonthTotal,
            monthChange,
            categoryBreakdown,
            avgPerEntry: count > 0 ? Math.round(total / count) : 0
        };
    }, [expenses]);

    return (
        <Layout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/20">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                            Expense Dashboard
                        </h1>
                        <p className="text-sm text-neutral-500">Overview of your expense analytics</p>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-neutral-400">Loading dashboard...</div>
                ) : (
                    <>
                        {/* Main Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Lifetime</p>
                                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white">₹{stats.total.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">This Month</p>
                                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white">₹{stats.thisMonthTotal.toLocaleString()}</h3>
                                        <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${Number(stats.monthChange) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {Number(stats.monthChange) > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {Math.abs(stats.monthChange)}% vs last month
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Entries</p>
                                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white">{stats.count}</h3>
                                    </div>
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Average / Entry</p>
                                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white">₹{stats.avgPerEntry.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Category Breakdown */}
                            <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <PieChart className="w-5 h-5 text-violet-500" />
                                    <h3 className="font-black text-neutral-900 dark:text-white">Top Categories</h3>
                                </div>
                                <div className="space-y-4">
                                    {stats.categoryBreakdown.map((cat, idx) => (
                                        <div key={cat.name} className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{cat.name}</span>
                                                    <span className="text-sm font-bold text-neutral-900 dark:text-white">₹{cat.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                                                        style={{ width: `${Math.min((cat.amount / stats.total) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.categoryBreakdown.length === 0 && (
                                        <p className="text-neutral-400 text-sm text-center py-4">No category data available</p>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl shadow-xl shadow-violet-500/20 p-6 text-white">
                                <div className="flex items-center gap-2 mb-6">
                                    <Target className="w-5 h-5" />
                                    <h3 className="font-black">Budget Overview</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/10 rounded-xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Active Categories</p>
                                        <p className="text-2xl font-black">{categories.length}</p>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Monthly Target</p>
                                        <p className="text-2xl font-black">₹{categories.reduce((sum, c) => sum + (c.monthly_budget || 0), 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Last Month Total</p>
                                        <p className="text-2xl font-black">₹{stats.lastMonthTotal.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ExpenseDashboardPage;
