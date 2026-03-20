
import React, { useMemo } from 'react';
import {
    DollarSign,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Car,
    Coffee,
    Home,
    ShoppingBag,
    Heart,
    Utensils,
    Globe,
    Zap,
    Briefcase,
    MoreVertical,
    Wallet,
    Info,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { Expense } from "../../../features/expense-tracking/lib/useExpenses";

interface PremiumExpenseDashboardProps {
    expenses: Expense[];
}

const CATEGORY_MAP: Record<string, { icon: any, color: string, bgColor: string, textColor: string }> = {
    'Transportation': { icon: Car, color: '#3B82F6', bgColor: 'bg-blue-500/10', textColor: 'text-blue-600' },
    'Food': { icon: Utensils, color: '#EF4444', bgColor: 'bg-red-500/10', textColor: 'text-red-600' },
    'Utilities': { icon: Zap, color: '#F59E0B', bgColor: 'bg-amber-500/10', textColor: 'text-amber-600' },
    'Shopping': { icon: ShoppingBag, color: '#EC4899', bgColor: 'bg-pink-500/10', textColor: 'text-pink-600' },
    'Entertainment': { icon: ShoppingBag, color: '#8B5CF6', bgColor: 'bg-purple-500/10', textColor: 'text-purple-600' },
    'Healthcare': { icon: Heart, color: '#10B981', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-600' },
    'Housing': { icon: Home, color: '#6366F1', bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-600' },
    'Office': { icon: Briefcase, color: '#14B8A6', bgColor: 'bg-teal-500/10', textColor: 'text-teal-600' },
    'Travel': { icon: Globe, color: '#0EA5E9', bgColor: 'bg-sky-500/10', textColor: 'text-sky-600' },
    'Others': { icon: DollarSign, color: '#6B7280', bgColor: 'bg-gray-500/10', textColor: 'text-gray-600' },
};

const DEFAULT_CATEGORY = { icon: Info, color: '#6B7280', bgColor: 'bg-gray-500/10', textColor: 'text-gray-600' };

const PremiumExpenseDashboard: React.FC<PremiumExpenseDashboardProps> = ({ expenses }) => {
    const stats = useMemo(() => {
        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Previous month stats
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
        });
        const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        const growth = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

        // Category breakdown for Pie
        const categoryDataMap: Record<string, number> = {};
        expenses.forEach(e => {
            categoryDataMap[e.category] = (categoryDataMap[e.category] || 0) + Number(e.amount);
        });

        const pieData = Object.entries(categoryDataMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Top categories for the grid
        const topCategories = pieData.slice(0, 6).map(item => ({
            ...item,
            ...(CATEGORY_MAP[item.name] || DEFAULT_CATEGORY)
        }));

        // Chart Data (Last 7 days or current month)
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyData = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dateStr = date.toISOString().split('T')[0];

            const totalForDay = expenses
                .filter(e => e.date.startsWith(dateStr))
                .reduce((sum, e) => sum + Number(e.amount), 0);

            return {
                name: date.getDate().toString(),
                amount: totalForDay,
                fullDate: dateStr
            };
        });

        return { total, monthTotal, growth, pieData, topCategories, dailyData };
    }, [expenses]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 bg-neutral-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-neutral-900/20"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Wallet className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Total Expense Base</span>
                            <div className="h-px flex-1 bg-neutral-800"></div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h2 className="text-5xl font-black tracking-tighter tabular-nums mb-1 italic">
                                    ₹{stats.monthTotal.toLocaleString()}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className={`flex items-center text-xs font-bold ${stats.growth <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stats.growth <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                        {Math.abs(stats.growth).toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-neutral-500 font-medium">vs last month</span>
                                </div>
                            </div>

                            <div className="h-24 w-full md:w-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.dailyData}>
                                        <defs>
                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                        {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((period) => (
                            <button key={period} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${period === 'Monthly' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                                {period}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-neutral-800 rounded-[2.5rem] p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Distribution</h3>
                        <PieChartIcon className="w-4 h-4 text-neutral-400" />
                    </div>

                    <div className="h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_MAP[entry.name]?.color || '#6B7280'} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">Spent</span>
                            <span className="text-xl font-black tabular-nums">100%</span>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {stats.pieData.slice(0, 3).map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_MAP[item.name]?.color || '#6B7280' }}></div>
                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{item.name}</span>
                                </div>
                                <span className="text-xs font-black tabular-nums">{Math.round((item.value / stats.total) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.topCategories.map((cat, idx) => (
                    <motion.div
                        variants={itemVariants}
                        key={cat.name}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-100 dark:border-neutral-700 shadow-sm flex flex-col items-center text-center group cursor-pointer transition-all hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-black/20"
                    >
                        <div className={`w-12 h-12 ${cat.bgColor} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500`}>
                            <cat.icon className={`w-6 h-6 ${cat.textColor}`} />
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{cat.name}</p>
                        <p className="text-sm font-black tabular-nums">₹{cat.value.toLocaleString()}</p>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Analytics */}
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-neutral-800 rounded-[2.5rem] p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black tracking-tight">Spending Performance</h3>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">30-Day Velocity Analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                        </button>
                        <button className="p-2 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                            <MoreVertical className="w-4 h-4 text-neutral-400" />
                        </button>
                    </div>
                </div>

                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#A3A3A3' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#A3A3A3' }}
                                tickFormatter={(val) => `₹${val}`}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar
                                dataKey="amount"
                                fill="#8b5cf6"
                                radius={[6, 6, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PremiumExpenseDashboard;
