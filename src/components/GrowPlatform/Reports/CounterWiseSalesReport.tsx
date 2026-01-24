import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, TrendingUp, ArrowUpRight, ArrowDownRight, Store } from 'lucide-react';

interface CounterWiseSalesReportProps {
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
}

const CounterWiseSalesReport: React.FC<CounterWiseSalesReportProps> = ({ timeRange }) => {
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);
    const { branches } = useSelector((state: RootState) => state.tenant);

    // Filter sales by sector
    const relevantSales = useMemo(() => {
        return salesHistory.filter(s => s.sector === currentSector);
    }, [salesHistory, currentSector]);

    // Aggregate data by Branch/Counter
    const counterStats = useMemo(() => {
        const stats: Record<string, { revenue: number, count: number, name: string }> = {};

        // Bootstrap with branches
        branches.filter(b => b.sector === currentSector).forEach(b => {
            stats[b.id] = { revenue: 0, count: 0, name: b.name };
        });

        relevantSales.forEach(sale => {
            const branchId = sale.branchId || 'Main';
            if (!stats[branchId]) {
                stats[branchId] = { revenue: 0, count: 0, name: branchId === 'Main' ? 'Main Counter' : branchId };
            }
            stats[branchId].revenue += sale.total;
            stats[branchId].count += 1;
        });

        return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
    }, [relevantSales, branches, currentSector]);

    const totalRevenue = counterStats.reduce((acc, s) => acc + s.revenue, 0);
    const totalTransactions = counterStats.reduce((acc, s) => acc + s.count, 0);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%
                        </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Total Sales (Period)</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{totalRevenue.toLocaleString()}</h3>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Store className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Active Counters</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{counterStats.filter(s => s.count > 0).length}</h3>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                            <Download className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Avg Transaction</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{(totalRevenue / (totalTransactions || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Total Bills</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalTransactions}</h3>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-900 dark:text-white">Revenue by Counter</h4>
                        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={counterStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                    tickFormatter={(val) => `₹${val / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                                    {counterStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart / Table */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-6">Counter Contribution</h4>
                    <div className="h-80 flex flex-col md:flex-row items-center">
                        <div className="flex-1 h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={counterStats}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="revenue"
                                    >
                                        {counterStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-48 space-y-3 mt-4 md:mt-0">
                            {counterStats.slice(0, 5).map((stat, idx) => (
                                <div key={stat.name} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                            <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{stat.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">{((stat.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(stat.revenue / totalRevenue) * 100}%`,
                                                backgroundColor: COLORS[idx % COLORS.length]
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Detailed Performance Summary</h4>
                    <button className="text-xs text-indigo-600 font-bold hover:underline">Export CSV</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Counter / Branch Name</th>
                                <th className="px-6 py-3 text-center">Transactions</th>
                                <th className="px-6 py-3 text-right">Revenue</th>
                                <th className="px-6 py-3 text-right">Contribution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {counterStats.map((stat, idx) => (
                                <tr key={stat.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                {stat.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">{stat.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-slate-600 dark:text-slate-400">
                                        {stat.count}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                                        ₹{stat.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${idx === 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                                            {((stat.revenue / totalRevenue) * 100).toFixed(1)}%
                                        </span>
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

export default CounterWiseSalesReport;
