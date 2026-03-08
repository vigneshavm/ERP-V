import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Store, Download, TrendingUp, ArrowUpRight, Target, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CounterWiseSalesReportProps {
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
}

const CounterWiseSalesReport: React.FC<CounterWiseSalesReportProps> = ({ timeRange }) => {
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);
    const { branches } = useSelector((state: RootState) => state.tenant);

    const relevantSales = useMemo(() => {
        return (salesHistory || []).filter(s => s.sector === currentSector);
    }, [salesHistory, currentSector]);

    const counterStats = useMemo(() => {
        const stats: Record<string, { revenue: number, count: number, name: string }> = {};
        (branches || []).filter((b: any) => b.sector === currentSector).forEach((b: any) => {
            stats[b.id] = { revenue: 0, count: 0, name: b.name };
        });
        relevantSales.forEach((sale: any) => {
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
        <div className="space-y-10 animate-fade-in">
            {/* TACTICAL METRIC BAR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard 
                    label="Yield Magnitude" 
                    value={`₹${totalRevenue.toLocaleString()}`} 
                    sub="+12.4% vs Baseline"
                    icon={TrendingUp}
                    accent="indigo"
                    trend="+12%"
                />
                <MetricCard 
                    label="Active Nodes" 
                    value={counterStats.filter(s => s.count > 0).length.toString()} 
                    sub="Operational Counters"
                    icon={Store}
                    accent="emerald"
                />
                <MetricCard 
                    label="TXN Resolution" 
                    value={`₹${(totalRevenue / (totalTransactions || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                    sub="Average Ticket Value"
                    icon={Target}
                    accent="amber"
                />
                <MetricCard 
                    label="Entry Volume" 
                    value={totalTransactions.toString()} 
                    sub="Consolidated Bills"
                    icon={Zap}
                    accent="rose"
                />
            </div>

            {/* HIGH-FIDELITY ANALYTICS CORE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] group">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary italic">Node Performance</h4>
                            <p className="text-[9px] font-black text-main uppercase tracking-widest mt-1">Counter-Level Revenue Flux</p>
                        </div>
                        <Target className="w-5 h-5 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={counterStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 900 }} 
                                    className="text-secondary uppercase tracking-tighter"
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'currentColor', fontSize: 9 }} 
                                    tickFormatter={(val) => `₹${val / 1000}k`}
                                    className="text-neutral-400"
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: '#171717', color: '#fff' }}
                                />
                                <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                                    {counterStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] group">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary italic">Contribution Matrix</h4>
                            <p className="text-[9px] font-black text-main uppercase tracking-widest mt-1">Cross-Counter Sector Share</p>
                        </div>
                        <PieChart className="w-5 h-5 text-indigo-500 opacity-20" />
                    </div>
                    <div className="h-80 relative flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={counterStats}
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={10}
                                    dataKey="revenue"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {counterStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-48 space-y-4 pr-10">
                            {counterStats.slice(0, 4).map((stat, idx) => (
                                <div key={stat.name} className="space-y-1">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-secondary truncate max-w-[80px]">{stat.name}</span>
                                        <span className="text-main italic">{((stat.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${(stat.revenue / totalRevenue) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* NODE LEDGER */}
            <div className="bg-white dark:bg-neutral-900 rounded-[3rem] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div>
                        <h4 className="text-sm font-black text-main uppercase italic tracking-tighter leading-none">Node Ledger</h4>
                        <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-2">Comprehensive Counter Infrastructure Performance</p>
                    </div>
                    <button className="h-12 px-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95">
                        <Download className="w-4 h-4" /> Export Ledger
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900/80">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary">Node Alias</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-center">TXN Magnitude</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Capital Flow</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Yield Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {counterStats.map((stat, idx) => (
                                <tr key={stat.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-black text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                                                {stat.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="text-sm font-black text-main uppercase tracking-tight">{stat.name}</span>
                                                <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-1">NODE-ID: {idx + 301}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center text-sm font-black text-main tabular-nums italic">
                                        {stat.count.toLocaleString()}
                                    </td>
                                    <td className="px-10 py-8 text-right text-lg font-black text-main tabular-nums italic">
                                        ₹{stat.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase ${idx === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-100 dark:bg-neutral-800 text-secondary'}`}>
                                                {((stat.revenue / totalRevenue) * 100).toFixed(1)}% Flux
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 transition-transform" />
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

const MetricCard: React.FC<{ label: string; value: string; sub: string; icon: any; accent: 'indigo' | 'emerald' | 'amber' | 'rose'; trend?: string }> = ({ label, value, sub, icon: Icon, accent, trend }) => {
    const colors = {
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    };

    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] group hover:translate-y-[-4px] transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 rounded-full -mr-16 -mt-16 transition-all duration-700 group-hover:scale-150 ${accent === 'indigo' ? 'bg-indigo-500' : accent === 'emerald' ? 'bg-emerald-500' : accent === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />
            
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${colors[accent]} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className="flex items-center text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> {trend}
                    </span>
                )}
            </div>
            
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">{label}</p>
            <h3 className="text-3xl font-black text-main tracking-tighter italic leading-none group-hover:translate-x-1 transition-transform duration-500">{value}</h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-4 flex items-center gap-2">
                 <div className="w-1 h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full" /> {sub}
            </p>
        </div>
    );
};

export default CounterWiseSalesReport;
