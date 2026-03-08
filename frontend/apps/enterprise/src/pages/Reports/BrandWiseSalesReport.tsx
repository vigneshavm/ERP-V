import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Award, Download, TrendingUp, Star, Target, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BrandWiseSalesReportProps {
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
}

const BrandWiseSalesReport: React.FC<BrandWiseSalesReportProps> = ({ timeRange }) => {
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);

    const relevantSales = useMemo(() => {
        return (salesHistory || []).filter((s: any) => s.sector === currentSector);
    }, [salesHistory, currentSector]);

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
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

    return (
        <div className="space-y-10 animate-fade-in">
            {/* TACTICAL METRIC BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    label="Market Vector Entity" 
                    value={brandStats[0]?.name || 'N/A'} 
                    sub={`₹${(brandStats[0]?.revenue || 0).toLocaleString()} Revenue`}
                    icon={Award}
                    accent="indigo"
                />
                <MetricCard 
                    label="Volume Flux Magnitude" 
                    value={(() => {
                        const topMoving = [...brandStats].sort((a, b) => b.items - a.items)[0];
                        return topMoving?.name || 'N/A';
                    })()} 
                    sub={`${([...brandStats].sort((a, b) => b.items - a.items)[0]?.items || 0).toLocaleString()} Units Solidified`}
                    icon={Star}
                    accent="emerald"
                />
                <MetricCard 
                    label="Aggregate Period Flux" 
                    value={`₹${totalRevenue.toLocaleString()}`} 
                    sub="Consolidated Sector Data"
                    icon={TrendingUp}
                    accent="amber"
                />
            </div>

            {/* HIGH-FIDELITY ANALYTICS CORE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] group">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary italic">Revenue Contribution</h4>
                            <p className="text-[9px] font-black text-main uppercase tracking-widest mt-1">Brand-Level Capital Flux</p>
                        </div>
                        <Target className="w-5 h-5 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={brandStats.slice(0, 8)}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
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
                                    contentStyle={{ 
                                        borderRadius: '24px', 
                                        border: 'none', 
                                        backgroundColor: '#171717',
                                        color: '#fff',
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
                                    }}
                                />
                                <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                                    {brandStats.map((entry, index) => (
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
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary italic">Market Partition</h4>
                            <p className="text-[9px] font-black text-main uppercase tracking-widest mt-1">Volume Share Logic</p>
                        </div>
                        <Zap className="w-5 h-5 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={brandStats.slice(0, 6)}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="items"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {brandStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Total</p>
                            <p className="text-2xl font-black text-main italic">100%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILED DATA LEDGER */}
            <div className="bg-white dark:bg-neutral-900 rounded-[3rem] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div>
                        <h4 className="text-sm font-black text-main uppercase italic italic tracking-tighter leading-none">Intelligence Ledger</h4>
                        <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-2">Comprehensive Brand Hierarchy Analytics</p>
                    </div>
                    <button className="h-12 px-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95">
                        <Download className="w-4 h-4" /> Export Dossier
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900/80">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary">Entity Identifier</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-center">Volume Flux</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Capital Value</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Vector Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {brandStats.map((stat, idx) => (
                                <tr key={stat.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-black text-indigo-500 shadow-sm relative group-hover:scale-110 transition-transform">
                                                {stat.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="text-sm font-black text-main uppercase tracking-tight">{stat.name}</span>
                                                <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-1">UUID: BRN-{idx + 101}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center text-sm font-black text-main tabular-nums italic">
                                        {stat.items.toLocaleString()}
                                    </td>
                                    <td className="px-10 py-8 text-right text-lg font-black text-main tabular-nums italic">
                                        ₹{stat.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-5">
                                            <div className="text-right">
                                                <p className="text-xs font-black text-main italic">{((stat.revenue / totalRevenue) * 100).toFixed(1)}%</p>
                                                <p className="text-[8px] font-black text-emerald-500 uppercase mt-1">Optimal</p>
                                            </div>
                                            <div className="w-24 bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden shrink-0">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(stat.revenue / totalRevenue) * 100}%` }}
                                                    className="h-full bg-indigo-500"
                                                />
                                            </div>
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

const MetricCard: React.FC<{ label: string; value: string; sub: string; icon: any; accent: 'indigo' | 'emerald' | 'amber' }> = ({ label, value, sub, icon: Icon, accent }) => {
    const colors = {
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    };

    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] group hover:translate-y-[-4px] transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 rounded-full -mr-16 -mt-16 transition-all duration-700 group-hover:scale-150 ${accent === 'indigo' ? 'bg-indigo-500' : accent === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${colors[accent]} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="h-6 w-12 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${accent === 'indigo' ? 'bg-indigo-500 animate-pulse' : accent === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
            </div>
            
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">{label}</p>
            <h3 className="text-3xl font-black text-main tracking-tighter italic leading-none group-hover:translate-x-1 transition-transform duration-500">{value}</h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-4 flex items-center gap-2">
                 <div className="w-1 h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full" /> {sub}
            </p>
        </div>
    );
};

export default BrandWiseSalesReport;
