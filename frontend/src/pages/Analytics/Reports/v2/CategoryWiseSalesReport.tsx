import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Download, Tag, TrendingUp, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';

interface CategoryWiseSalesReportProps {
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
}

const CategoryWiseSalesReport: React.FC<CategoryWiseSalesReportProps> = ({ timeRange }) => {
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);

    // Filter sales by sector
    const relevantSales = useMemo(() => {
        return salesHistory.filter(s => s.sector === currentSector);
    }, [salesHistory, currentSector]);

    // Aggregate data by Category
    const categoryStats = useMemo(() => {
        const stats: Record<string, { revenue: number, count: number, items: number, name: string }> = {};

        relevantSales.forEach(sale => {
            sale.items.forEach(item => {
                const category = item.category || 'Uncategorized';
                if (!stats[category]) {
                    stats[category] = { revenue: 0, count: 0, items: 0, name: category };
                }
                stats[category].revenue += (item.price * item.qty);
                stats[category].items += item.qty;
                stats[category].count += 1;
            });
        });

        return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
    }, [relevantSales]);

    const totalRevenue = categoryStats.reduce((acc, s) => acc + s.revenue, 0);
    const totalItems = categoryStats.reduce((acc, s) => acc + s.items, 0);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Tag className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Top Category</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{categoryStats[0]?.name || 'N/A'}</h3>
                    <p className="text-xs text-emerald-500 font-medium mt-1">₹{categoryStats[0]?.revenue.toLocaleString()} revenue</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Total Items Sold</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalItems.toLocaleString()}</h3>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Revenue Share</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{totalRevenue.toLocaleString()}</h3>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-6">Revenue by Category</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-6">Sales Volume Distribution</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="items"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Category Performance Matrix</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Category Name</th>
                                <th className="px-6 py-3 text-center">Items Sold</th>
                                <th className="px-6 py-3 text-right">Revenue</th>
                                <th className="px-6 py-3 text-right">Avg Item Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {categoryStats.map((stat, idx) => (
                                <tr key={stat.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                            <span className="font-bold text-slate-900 dark:text-white">{stat.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-slate-600 dark:text-slate-400">
                                        {stat.items.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                                        ₹{stat.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                                        ₹{(stat.revenue / (stat.items || 1)).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CategoryWiseSalesReport;
