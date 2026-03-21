import { useAuthStore } from '@repo/shared';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Award, Download, TrendingUp, Package, Star } from 'lucide-react';

interface BrandWiseSalesReportProps {
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
}

const BrandWiseSalesReport: React.FC<BrandWiseSalesReportProps> = ({ timeRange }) => {
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const {  currentSector  } = useAuthStore();

    // Filter sales by sector
    const relevantSales = useMemo(() => {
        return (salesHistory || []).filter((s: any) => s.sector === currentSector);
    }, [salesHistory, currentSector]);

    // Aggregate data by Brand
    const brandStats = useMemo(() => {
        const stats: Record<string, { revenue: number, count: number, items: number, name: string }> = {};

        relevantSales.forEach((sale: any) => {
            (sale.items || []).forEach((item: any) => {
                const brand = item.brand || 'No Brand';
                if (!stats[brand]) {
                    stats[brand] = { revenue: 0, count: 0, items: 0, name: brand };
                }
                stats[brand].revenue += (item.price * item.qty);
                stats[brand].items += item.qty;
                stats[brand].count += 1;
            });
        });

        return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
    }, [relevantSales]);

    const totalRevenue = brandStats.reduce((acc, s) => acc + s.revenue, 0);
    const totalItems = brandStats.reduce((acc, s) => acc + s.items, 0);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[var(--erp-card)] p-5 rounded-2xl border border-default dark:border-default shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Award className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-muted dark:text-muted uppercase tracking-wider">Market Leader</p>
                    <h3 className="text-2xl font-bold text-main mt-1">{brandStats[0]?.name || 'N/A'}</h3>
                    <p className="text-xs text-emerald-500 font-medium mt-1">₹{brandStats[0]?.revenue.toLocaleString()} (Highest Revenue)</p>
                </div>

                <div className="bg-white dark:bg-[var(--erp-card)] p-5 rounded-2xl border border-default dark:border-default shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Star className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-muted dark:text-muted uppercase tracking-wider">Top Moving Brand</p>
                    {(() => {
                        const topMoving = [...brandStats].sort((a, b) => b.items - a.items)[0];
                        return (
                            <>
                                <h3 className="text-2xl font-bold text-main mt-1">{topMoving?.name || 'N/A'}</h3>
                                <p className="text-xs text-blue-500 font-medium mt-1">{topMoving?.items.toLocaleString() || 0} units sold</p>
                            </>
                        );
                    })()}
                </div>

                <div className="bg-white dark:bg-[var(--erp-card)] p-5 rounded-2xl border border-default dark:border-default shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-muted dark:text-muted uppercase tracking-wider">Total Sales (Period)</p>
                    <h3 className="text-2xl font-bold text-main mt-1">₹{totalRevenue.toLocaleString()}</h3>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-2xl border border-default dark:border-default shadow-sm">
                    <h4 className="font-bold text-main mb-6">Revenue Contribution by Brand</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={brandStats.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={(val) => `₹${val / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                    {brandStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-2xl border border-default dark:border-default shadow-sm">
                    <h4 className="font-bold text-main mb-6">Market Share (Volume)</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={brandStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="items"
                                    nameKey="name"
                                >
                                    {brandStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default overflow-hidden shadow-sm">
                <div className="p-4 border-b border-default dark:border-default flex justify-between items-center bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-bg)]/20">
                    <h4 className="font-bold text-main text-sm">Comprehensive Brand Analysis</h4>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                        <Download className="w-3.5 h-3.5" /> Export Data
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 text-muted uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Brand Identifier</th>
                                <th className="px-6 py-3 text-center">Items Sold</th>
                                <th className="px-6 py-3 text-right">Revenue</th>
                                <th className="px-6 py-3 text-right">Contribution %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {brandStats.map((stat, idx) => (
                                <tr key={stat.name} className="hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] flex items-center justify-center font-bold text-muted">
                                                {stat.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-main">{stat.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-secondary dark:text-muted">
                                        {stat.items.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-main font-mono">
                                        ₹{stat.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-[10px] font-bold text-main font-mono">{((stat.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                                            <div className="w-16 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] h-1.5 rounded-full overflow-hidden hidden sm:block">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${(stat.revenue / totalRevenue) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
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

export default BrandWiseSalesReport;
