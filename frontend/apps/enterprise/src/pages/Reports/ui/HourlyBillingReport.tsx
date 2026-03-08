import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Clock, TrendingUp, Users, Zap, Calendar } from 'lucide-react';

interface HourlyBillingReportProps {
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
}

const HourlyBillingReport: React.FC<HourlyBillingReportProps> = ({ timeRange }) => {
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);

    // Filter sales by sector
    const relevantSales = useMemo(() => {
        return (salesHistory || []).filter((s: any) => s.sector === currentSector);
    }, [salesHistory, currentSector]);

    // Aggregate data by Hour
    const hourlyData = useMemo(() => {
        const hours: Record<number, { hour: number, revenue: number, transactions: number, label: string }> = {};

        // Initialize 24 hours
        for (let i = 0; i < 24; i++) {
            hours[i] = {
                hour: i,
                revenue: 0,
                transactions: 0,
                label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
            };
        }

        relevantSales.forEach((sale: any) => {
            const date = new Date(sale.date);
            const hour = date.getHours();
            if (hours[hour]) {
                hours[hour].revenue += sale.total;
                hours[hour].transactions += 1;
            }
        });

        return Object.values(hours);
    }, [relevantSales]);

    const peakHour = useMemo(() => {
        return [...hourlyData].sort((a, b) => b.transactions - a.transactions)[0];
    }, [hourlyData]);

    const totalTransactions = relevantSales.length;
    const avgTransactionsPerHour = totalTransactions / 24;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Insights</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Peak Traffic Hour</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{peakHour?.label || 'N/A'}</h3>
                    <p className="text-xs text-slate-500 mt-1">{peakHour?.transactions} bills generated in this hour</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Zap className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Highest Hourly Revenue</p>
                    {(() => {
                        const topRev = [...hourlyData].sort((a, b) => b.revenue - a.revenue)[0];
                        return (
                            <>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{topRev?.revenue.toLocaleString()}</h3>
                                <p className="text-xs text-indigo-500 font-medium mt-1">at {topRev?.label}</p>
                            </>
                        );
                    })()}
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Load Recommendation</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {peakHour.transactions > avgTransactionsPerHour * 2 ? 'High Staffing' : 'Normal Staffing'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Based on peak vs average load</p>
                </div>
            </div>

            {/* Main Trend Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Transaction Density (24h)</h4>
                        <p className="text-xs text-slate-500">Identifying peak business hours across the selected period</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span className="text-xs font-medium text-slate-600">Transactions</span>
                        </div>
                    </div>
                </div>

                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                interval={2}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                            />
                            <Tooltip
                                cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="transactions"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTrans)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hourly Revenue Breakdown */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white mb-6">Revenue Spread by Hour</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 9 }}
                                interval={1}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '12px', border: 'none' }}
                            />
                            <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                                {hourlyData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.revenue === Math.max(...hourlyData.map(d => d.revenue)) ? '#10b981' : '#cbd5e1'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Time slot Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Hourly Transaction Ledger</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Time Slot</th>
                                <th className="px-6 py-3 text-center">Transactions</th>
                                <th className="px-6 py-3 text-right">Revenue</th>
                                <th className="px-6 py-3 text-right">Avg / Bill</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {hourlyData.filter(d => d.transactions > 0).map((stat) => (
                                <tr key={stat.hour} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                        {stat.label}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
                                            {stat.transactions}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                                        ₹{stat.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                                        ₹{(stat.revenue / stat.transactions).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

export default HourlyBillingReport;
