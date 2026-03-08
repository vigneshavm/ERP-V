import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Tag, Download, TrendingUp, Package, Target, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryWiseSalesReportProps {
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
}

const CategoryWiseSalesReport: React.FC<CategoryWiseSalesReportProps> = ({ timeRange }) => {
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);

    const relevantSales = useMemo(() => {
        return (salesHistory || []).filter((s: any) => s.sector === currentSector);
    }, [salesHistory, currentSector]);

    const categoryStats = useMemo(() => {
        const stats: Record<string, { revenue: number, count: number, items: number, name: string }> = {};
        relevantSales.forEach((sale: any) => {
            (sale.items || []).forEach((item: any) => {
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
        <div className="space-y-10 animate-fade-in">
            {/* TACTICAL METRIC BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    label="Vertical Dominance" 
                    value={categoryStats[0]?.name || 'N/A'} 
                    sub={`₹${(categoryStats[0]?.revenue || 0).toLocaleString()} Yield`}
                    icon={Tag}
                    accent="indigo"
                />
                <MetricCard 
                    label="Operational Volume" 
                    value={totalItems.toLocaleString()} 
                    sub="Aggregate Item Departure"
                    icon={Package}
                    accent="emerald"
                />
                <MetricCard 
                    label="Yield Magnitude" 
                    value={`₹${totalRevenue.toLocaleString()}`} 
                    sub="Consolidated Segment Rev"
                    icon={TrendingUp}
                    accent="amber"
                />
            </div>

            {/* HIGH-FIDELITY ANALYTICS CORE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] group">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary italic">Segment Performance</h4>
                            <p className="text-[9px] font-black text-main uppercase tracking-widest mt-1">Cross-Category Revenue Flux</p>
                        </div>
                        <Target className="w-5 h-5 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryStats.slice(0, 8)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 9 }} className="text-neutral-400" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 900 }}
                                    width={100}
                                    className="text-secondary uppercase tracking-tighter"
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: '#171717', color: '#fff' }}
                                />
                                <Bar dataKey="revenue" radius={[0, 10, 10, 0]}>
                                    {categoryStats.map((entry, index) => (
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
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary italic">Volume Saturation</h4>
                            <p className="text-[9px] font-black text-main uppercase tracking-widest mt-1">Item Distribution Logic</p>
                        </div>
                        <Zap className="w-5 h-5 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryStats.slice(0, 6)}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="items"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SEGMENT LEDGER */}
            <div className="bg-white dark:bg-neutral-900 rounded-[3rem] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div>
                        <h4 className="text-sm font-black text-main uppercase italic tracking-tighter leading-none">Segment Matrix</h4>
                        <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-2">Comprehensive Category Performance Grid</p>
                    </div>
                    <button className="h-12 px-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95">
                        <Download className="w-4 h-4" /> Export Matrix
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900/80">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary">Segment Alias</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-center">Departure Qty</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Capital Yield</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Avg Unit Val</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {categoryStats.map((stat, idx) => (
                                <tr key={stat.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-2 h-8 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: COLORS[idx % COLORS.length], color: COLORS[idx % COLORS.length] }}></div>
                                            <div>
                                                <span className="text-sm font-black text-main uppercase tracking-tight">{stat.name}</span>
                                                <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-1">CODE: CT-{idx + 201}</p>
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
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-main tabular-nums italic">₹{(stat.revenue / (stat.items || 1)).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-12 bg-neutral-100 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-neutral-300" />
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

export default CategoryWiseSalesReport;
