import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  TrendingUp, 
  CreditCard,
  MoreVertical
} from 'lucide-react';
import { useExpenses } from "@/features/expense-tracking/lib/useExpenses";
import { useExpenseCategories } from "@/features/expense-tracking/lib/useExpenseCategories";
import Layout from "@/shared/ui/Layout";

const ExpenseDashboardPage = () => {
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
        const byCategory: Record<string, number> = {};
        expenses.forEach(e => {
            if (!byCategory[e.category]) byCategory[e.category] = 0;
            byCategory[e.category] += Number(e.amount || 0);
        });

        const categoryBreakdown = Object.entries(byCategory)
            .map(([name, amount]) => ({ name, amount, percentage: total > 0 ? (amount / total * 100).toFixed(1) : 0 }))
            .sort((a, b) => b.amount - a.amount);

        const largestCategory = categoryBreakdown[0] || { name: 'None', amount: 0, percentage: 0 };

        return {
            total,
            count,
            thisMonthTotal,
            thisMonthCount: thisMonthExpenses.length,
            lastMonthTotal,
            monthChange,
            categoryBreakdown,
            largestCategory
        };
    }, [expenses]);

    const formatCurrency = (val: number) => {
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
        return `₹${val.toLocaleString()}`;
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'Rent': '#6366f1',
            'Salaries': '#22c55e',
            'Utilities': '#3b82f6',
            'Marketing': '#f59e0b',
            'Admin': '#8b5cf6',
            'Fixed': '#ec4899',
            'Logistics': '#06b6d4',
            'Misc': '#64748b'
        };
        return colors[cat] || '#8b5cf6';
    };

    return (
        <Layout>
            <div className="premium-bg min-h-screen text-white p-6 sm:p-8 space-y-8 font-sans">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-1 opacity-95">Expense Tracker</h1>
                        <p className="text-sm font-medium text-white/40 flex items-center gap-2">
                            {formatCurrency(stats.thisMonthTotal)} spent • {stats.thisMonthCount} entries this month
                        </p>
                    </div>
                    <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 rounded-lg shadow-lg active:scale-95 transition-all">
                        <Plus size={16} />
                        Add Expense
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-white/20 font-bold uppercase tracking-[0.2em]">Loading Analytics...</div>
                ) : (
                    <>
                        {/* Top Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Total Expenses MTD */}
                            <div className="premium-card p-6 flex flex-col justify-between">
                                <span className="premium-stat-label mb-6 block">Total Expenses MTD</span>
                                <div>
                                    <div className="premium-stat-value mb-1">{formatCurrency(stats.thisMonthTotal)}</div>
                                    <div className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider ${Number(stats.monthChange) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {Number(stats.monthChange) > 0 ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
                                        {Math.abs(Number(stats.monthChange))}% vs last month
                                    </div>
                                </div>
                            </div>

                            {/* Largest Category */}
                            <div className="premium-card p-6 flex flex-col justify-between">
                                <span className="premium-stat-label mb-6 block">Largest Category</span>
                                <div>
                                    <div className="premium-stat-value mb-1">{stats.largestCategory.name}</div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                        ₹{Number(stats.largestCategory.amount).toLocaleString()} • {stats.largestCategory.percentage}%
                                    </div>
                                </div>
                            </div>

                            {/* Recurring Monthly */}
                            <div className="premium-card p-6 flex flex-col justify-between">
                                <span className="premium-stat-label mb-6 block">Recurring Monthly</span>
                                <div>
                                    <div className="premium-stat-value mb-1">₹68,000</div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                        6 active subscriptions
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Recent Expenses and By Category */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Expenses Table */}
                            <div className="lg:col-span-2 premium-card p-0 overflow-hidden">
                                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                                    <h3 className="text-lg font-bold tracking-tight">Recent Expenses</h3>
                                    <button className="text-[10px] font-bold text-white/40 hover:text-white transition-colors px-3 py-1 bg-white/5 rounded border border-white/5 uppercase tracking-widest">
                                        View All
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] bg-white/[0.02]">
                                            <tr>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-[11px] font-bold">
                                            {expenses.slice(0, 5).map((exp, idx) => (
                                                <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="px-6 py-4 text-white/40 whitespace-nowrap">
                                                        {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-white/90 truncate max-w-[150px]">
                                                        {exp.description || 'General Expense'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span 
                                                            className="premium-badge border"
                                                            style={{ 
                                                                backgroundColor: `${getCategoryColor(exp.category)}15`,
                                                                borderColor: `${getCategoryColor(exp.category)}30`,
                                                                color: getCategoryColor(exp.category)
                                                            }}
                                                        >
                                                            {exp.category?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-white tracking-tight">
                                                        ₹{Number(exp.amount).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {expenses.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-white/10 italic">No recent entries</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* By Category Progress Chart */}
                            <div className="premium-card p-6 flex flex-col">
                                <h3 className="text-lg font-bold mb-8 tracking-tight">By Category</h3>
                                <div className="space-y-6 flex-1">
                                    {stats.categoryBreakdown.slice(0, 5).map((cat, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-white/70">{cat.name}</span>
                                                <span className="text-[10px] font-black text-white/40 tracking-wider">
                                                    ₹{Number(cat.amount).toLocaleString()} • {cat.percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{ 
                                                        width: `${cat.percentage}%`,
                                                        backgroundColor: getCategoryColor(cat.name)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {stats.categoryBreakdown.length === 0 && (
                                        <div className="flex-1 flex items-center justify-center text-white/10 italic">No data</div>
                                    )}
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
