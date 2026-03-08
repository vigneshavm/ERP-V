import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Clock, TrendingUp, Users, Zap, Download, Target, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HourlyBillingReportProps {
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
}

const HourlyBillingReport: React.FC<HourlyBillingReportProps> = ({ timeRange }) => {
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);

    const relevantSales = useMemo(() => {
        return (salesHistory || []).filter((s: any) => s.sector === currentSector);
    }, [salesHistory, currentSector]);

    const hourlyData = useMemo(() => {
        const hours: Record<number, { hour: number, revenue: number, transactions: number, label: string }> = {};
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
        <div className="space-y-10 animate-fade-in">
            {/* TACTICAL METRIC BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    label="Peak Load Temporal Node" 
                    value={peakHour?.label || 'N/A'} 
                    sub={`${peakHour?.transactions} Bills Generated`}
                    icon={Clock}
                    accent="indigo"
                />
                <MetricCard 
                    label="Max Hourly Flux" 
                    value={(() => {
                        const topRev = [...hourlyData].sort((a, b) => b.revenue - a.revenue)[0];
                        return `₹${(topRev?.revenue || 0).toLocaleString()}`;
                    })()} 
                    sub={`at ${([...hourlyData].sort((a, b) => b.revenue - a.revenue)[0]?.label || 'N/A')}`}
                    icon={Zap}
                    accent="emerald"
                />
                <MetricCard 
                    label="System Load Protocol" 
                    value={peakHour.transactions > avgTransactionsPerHour * 2 ? 'SURGE' : 'OPTIMAL'} 
                    sub="Staffing Allocation Logic"
                    icon={Users}
                    accent={peakHour.transactions > avgTransactionsPerHour * 2 ? 'rose' : 'amber'}
                />
            </div>

            {/* HIGH-FIDELITY ANALYTICS CORE */}
            <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] group">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary italic">Temporal Density Flux</h4>
                        <p className="text-[9px] font-black text-main uppercase tracking-widest mt-1">24-Hour Transaction distribution Vector</p>
                    </div>
                    <Target className="w-5 h-5 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyData}>
                            <defs>
                                <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 900 }}
                                interval={2}
                                className="text-secondary uppercase tracking-tighter"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 9 }}
                                className="text-neutral-400"
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: '#171717', color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="transactions"
                                stroke="#6366f1"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorTrans)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* HOURLY YIELD LEDGER */}
            <div className="bg-white dark:bg-neutral-900 rounded-[3rem] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div>
                        <h4 className="text-sm font-black text-main uppercase italic tracking-tighter leading-none">Temporal Ledger</h4>
                        <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-2">Chronological Transaction Density Matrix</p>
                    </div>
                    <button className="h-12 px-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95">
                        <Download className="w-4 h-4" /> Export Ledger
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900/80">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary">Temporal Slot</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-center">TXN Magnitude</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Capital Flow</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Avg Unit Val</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {hourlyData.filter(d => d.transactions > 0).map((stat, idx) => (
                                <tr key={stat.hour} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-black text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-black text-main uppercase tracking-tight">{stat.label}</span>
                                                <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-1">NODE-TM: {stat.hour}:00</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black tracking-widest uppercase">
                                            {stat.transactions} Bills
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right text-lg font-black text-main tabular-nums italic">
                                        ₹{stat.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-5">
                                            <span className="text-sm font-black text-main tabular-nums italic">₹{(stat.revenue / stat.transactions).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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

const MetricCard: React.FC<{ label: string; value: string; sub: string; icon: any; accent: 'indigo' | 'emerald' | 'amber' | 'rose' }> = ({ label, value, sub, icon: Icon, accent }) => {
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
            </div>
            
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">{label}</p>
            <h3 className="text-3xl font-black text-main tracking-tighter italic leading-none group-hover:translate-x-1 transition-transform duration-500">{value}</h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-4 flex items-center gap-2">
                 <div className="w-1 h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full" /> {sub}
            </p>
        </div>
    );
};

export default HourlyBillingReport;
