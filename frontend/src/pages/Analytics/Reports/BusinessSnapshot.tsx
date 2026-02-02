import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../../redux/store";
import Layout from "../../../components/shared/Layout";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    Wallet,
    BarChart as BarChartIcon,
    Calendar
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';

const BusinessSnapshotPage: React.FC = () => {
    const { transactions, dailyFinanceRecords } = useSelector((state: RootState) => state.finance);
    const { currentSector, theme } = useSelector((state: RootState) => state.auth);

    // -- Data Processing --
    const sectorTransactions = (transactions || []).filter((t: any) => t.sector === currentSector);

    // Helper: Get Date Range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Current Month Metrics
    const currentMonthTransactions = sectorTransactions.filter((t: any) => new Date(t.date) >= startOfMonth);
    const currentMonthDailyRecords = (dailyFinanceRecords || []).filter((r: any) => new Date(r.date) >= startOfMonth);

    const monthIncome = currentMonthTransactions
        .filter((t: any) => t.type === 'INCOME' || t.type === 'Sale')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0) +
        currentMonthDailyRecords.reduce((acc: number, curr: any) => acc + (curr.totalSales || 0), 0);

    const monthExpenses = currentMonthTransactions
        .filter((t: any) => t.type === 'EXPENSE' || t.type === 'Purchase' || t.type === 'Salary')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const monthProfit = monthIncome - monthExpenses;

    // 2. Chart Data: Income vs Expense (Last 6 Months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        d.setDate(1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const nextMonth = new Date(d);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const periodTrans = sectorTransactions.filter((t: any) => {
            const tDate = new Date(t.date);
            return tDate >= d && tDate < nextMonth;
        });

        const income = periodTrans
            .filter((t: any) => t.type === 'INCOME' || t.type === 'Sale')
            .reduce((acc: number, curr: any) => acc + curr.amount, 0);

        const expense = periodTrans
            .filter((t: any) => t.type === 'EXPENSE' || t.type === 'Purchase' || t.type === 'Salary')
            .reduce((acc: number, curr: any) => acc + curr.amount, 0);

        monthlyData.push({
            name: monthName,
            income,
            expense,
            profit: income - expense
        });
    }

    // 3. Expense Categorization for Pie Chart
    const expenseCategories = sectorTransactions
        .filter((t: any) => t.type === 'EXPENSE')
        .reduce((acc: Record<string, number>, curr: any) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.keys(expenseCategories).map(key => ({
        name: key,
        value: expenseCategories[key]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // -- UI Components --
    const MetricCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-${color}-500/20 transition-all`}></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">₹{value.toLocaleString()}</h3>
                    {subtext && <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-neutral-400'}`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {subtext}
                    </p>}
                </div>
                <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <BarChartIcon className="w-6 h-6 text-primary" />
                            Business Snapshot
                        </h2>
                        <p className="text-neutral-500 text-sm mt-1">Financial overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> This Month
                        </button>
                    </div>
                </div>

                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Income"
                        value={monthIncome}
                        subtext="+12% from last month"
                        icon={DollarSign}
                        color="success"
                        trend="up"
                    />
                    <MetricCard
                        title="Total Expenses"
                        value={monthExpenses}
                        subtext="+5% from last month"
                        icon={CreditCard}
                        color="error"
                        trend="down"
                    />
                    <MetricCard
                        title="Net Profit"
                        value={monthProfit}
                        subtext="Healthy Margin"
                        icon={Wallet}
                        color="primary"
                        trend="up"
                    />
                    <MetricCard
                        title="Avg Daily Sales"
                        value={Math.round(monthIncome / new Date().getDate())}
                        subtext="Based on current month"
                        icon={TrendingUp}
                        color="warning"
                        trend="up"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Financial Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6">Income vs Expense (6 Months)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                                    <XAxis dataKey="name" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} />
                                    <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                                    />
                                    <Legend />
                                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6">Expense Breakdown</h3>
                        <div className="h-64">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Cost']} />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-neutral-400">
                                    No expense data available
                                </div>
                            )}
                        </div>
                        {/* Legend List */}
                        <div className="mt-4 space-y-2">
                            {pieData.map((entry, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-neutral-600 dark:text-neutral-400">{entry.name}</span>
                                    </div>
                                    <span className="font-bold text-neutral-900 dark:text-neutral-200">₹{entry.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Profit Trend */}
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6">Profit Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                                <XAxis dataKey="name" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} />
                                <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '8px' }} />
                                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BusinessSnapshotPage;
