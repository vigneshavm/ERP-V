import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveTab } from '../../redux/slices/uiSlice';
import Layout from '../../components/shared/Layout';
import { 
    Activity, Users, Box, Banknote, 
    ShieldCheck, Clock, ChevronRight, TrendingUp, TrendingDown, 
    Package, Zap 
} from 'lucide-react';
import { salesInvoices, purchases, inventory, customers, suppliers, MockPurchase, MockSupplier } from '../../data';

const DashboardMockUI: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeTimeframe, setActiveTimeframe] = useState<string>('1W');

    const now = new Date();
    const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    const metrics = useMemo(() => {
        const totalSales = salesInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalExpenses = purchases.reduce((sum, p) => sum + p.total, 0);
        const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
        const totalCustomers = customers.length;

        return [
            { label: 'Revenue Flow', val: `₹${(totalSales/100000).toFixed(2)}L`, trend: '+12.4%', isUp: true, color: 'text-success', icon: Banknote },
            { label: 'Capital Outflow', val: `₹${(totalExpenses/100000).toFixed(2)}L`, trend: '+4.2%', isUp: false, color: 'text-danger', icon: Zap },
            { label: 'Customer Base', val: totalCustomers.toLocaleString(), trend: '+8.1%', isUp: true, color: 'text-primary', icon: Users },
            { label: 'Stock Capacity', val: totalStock.toLocaleString(), trend: '-2.4%', isUp: false, color: 'text-warning', icon: Package }
        ];
    }, []);

    const chartData = useMemo(() => {
        return {
            timeFrames: ['1W', '1M', '3M', '1Y'],
            values: {
                '1W': [42, 58, 45, 62, 55, 70, 68],
                '1M': [180, 210, 195, 240],
                '3M': [580, 620, 690],
                '1Y': [6200, 7100, 6800, 8200, 7500, 9100, 8800, 9500, 10200, 9800, 11000, 12400]
            },
            labels: {
                '1W': ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
                '1M': ['WEEK 1', 'WEEK 2', 'WEEK 3', 'WEEK 4'],
                '3M': ['OCT', 'NOV', 'DEC'],
                '1Y': ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
            }
        };
    }, []);

    const shopFloorAlerts = [
        { title: 'Urgent Replenishment', desc: 'Saree Section: 3 items stock out today.', colorClass: 'text-danger border-danger/30 bg-danger/10', icon: Box },
        { title: 'Counter Cash Limit', desc: 'Counter 1 reached ₹50k. Transfer to safe.', colorClass: 'text-warning border-warning/30 bg-warning/10', icon: Banknote },
        { title: 'Pending Delivery', desc: 'A. Mudaliar order due for pickup at 4 PM.', colorClass: 'text-blue-500 border-blue-500/30 bg-blue-500/10', icon: Clock },
        { title: 'Shift Handover', desc: 'Verify closing balance for Morning Shift.', colorClass: 'text-success border-success/30 bg-success/10', icon: ShieldCheck },
    ];

    const recentTransactions = useMemo(() => {
        return (purchases as MockPurchase[]).slice(0, 5).map(p => {
            const supplier = (suppliers as MockSupplier[]).find(s => s.id === p.supplier_id) || suppliers[0];
            return {
                vendor: supplier.name,
                mobile: supplier.phone,
                amount: `₹${p.total.toLocaleString()}`,
                status: p.status,
                date: p.date
            };
        });
    }, []);

    return (
        <Layout>
            <div className="space-y-8 pt-8">
                {/* Page Header */}
                <div className="relative overflow-hidden glass-panel p-8 mb-8 group border-t-2 border-t-success/30">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-success/5 rounded-full blur-[120px] -mr-64 -mt-64 animate-aura opacity-50" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -ml-32 -mb-32 animate-aura" style={{ animationDelay: '5s' }} />
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-sm bg-success/20 border border-success/40 flex items-center justify-center glow-success">
                                <Activity className="w-8 h-8 text-success" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-5xl font-display font-black text-main tracking-tighter uppercase mb-1 drop-shadow-sm italic">Shop Summary</h1>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-success/20 text-success text-[10px] font-black uppercase rounded-sm border border-success/30 tracking-[0.2em]">
                                        Protocol V4 Active
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] opacity-70">
                                        Live Operations View
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest opacity-50 mb-1">Current Period</p>
                            <p className="text-2xl font-display font-black text-main tracking-tighter uppercase">{monthLabel}</p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] opacity-60">Today's Snapshot</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {metrics.map((kpi, i) => (
                            <div key={i} className={`card-interactive p-6 flex flex-col justify-between min-h-[160px] border-l-4 ${kpi.color === 'text-success' ? 'border-l-success' : kpi.color === 'text-danger' ? 'border-l-danger' : kpi.color === 'text-primary' ? 'border-l-primary' : 'border-l-warning'} group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden`}>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`p-3 rounded-sm ${kpi.color === 'text-success' ? 'bg-success/10 text-success' : kpi.color === 'text-danger' ? 'bg-danger/10 text-danger' : kpi.color === 'text-primary' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'} border border-current/10`}>
                                        <kpi.icon className="w-5 h-5" />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-sm border ${kpi.isUp ? 'text-success bg-success/10 border-success/30' : 'text-danger bg-danger/10 border-danger/30'}`}>
                                        {kpi.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {kpi.trend}
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className={`text-3xl font-display font-black tracking-tighter mb-1 ${kpi.color}`}>{kpi.val}</p>
                                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest opacity-70">{kpi.label}</p>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-current/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Charts + Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Trend Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-sm shadow-sm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 animate-aura opacity-50" />
                        <div className="flex items-center justify-between mb-8 relative z-10 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                            <div>
                                <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4 italic">
                                    <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.5)]" />
                                    Sales Trends
                                </h3>
                                <p className="text-[11px] text-neutral-500 font-black uppercase tracking-[0.3em] opacity-50 mt-1">Institutional Performance Over Time</p>
                            </div>
                            <div className="flex gap-2">
                                {chartData.timeFrames.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTimeframe(t)}
                                        className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border ${activeTimeframe === t ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-primary/30 hover:text-main'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[280px] flex items-end gap-2 pb-8 pt-4 relative z-10">
                            {chartData.values[activeTimeframe as keyof typeof chartData.values].map((v: number, i: number) => {
                                const maxVal = Math.max(...chartData.values[activeTimeframe as keyof typeof chartData.values]) || 1;
                                const h = (v / maxVal) * 100;
                                return (
                                    <div key={i} className="flex-1 group/bar relative flex flex-col justify-end" style={{ height: '100%' }}>
                                        <div
                                            className={`w-full rounded-t-sm transition-all duration-1000 ${i === chartData.values[activeTimeframe as keyof typeof chartData.values].length - 1 ? 'bg-primary shadow-[0_0_20px_rgba(var(--color-primary),0.4)]' : 'bg-neutral-100 dark:bg-neutral-800 group-hover/bar:bg-primary/50'}`}
                                            style={{ height: `${h}%` }}
                                        />
                                        <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-black px-2 py-1 rounded-sm shadow-xl transition-opacity z-20 whitespace-nowrap">
                                            ₹{v}k
                                        </div>
                                        <div className="text-center text-[9px] font-black text-neutral-400 mt-3 uppercase tracking-widest absolute -bottom-6 left-1/2 -translate-x-1/2 w-full truncate">
                                            {chartData.labels[activeTimeframe as keyof typeof chartData.labels][i]}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Shop Floor Alerts */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-sm shadow-sm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-danger/5 rounded-full blur-3xl -mr-24 -mt-24 animate-aura opacity-50" />
                        <div className="flex items-center justify-between mb-6 relative z-10 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                            <div>
                                <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4 italic">
                                    <div className="w-2 h-8 bg-danger rounded-full shadow-[0_0_15px_rgba(var(--color-error),0.5)]" />
                                    Floor Alerts
                                </h3>
                                <p className="text-[11px] text-neutral-500 font-black uppercase tracking-[0.3em] opacity-50 mt-1">Immediate Tactical Tasks</p>
                            </div>
                            <span className="w-7 h-7 bg-danger/10 text-danger rounded-sm border border-danger/20 flex items-center justify-center text-[11px] font-black animate-pulse">
                                {shopFloorAlerts.length}
                            </span>
                        </div>
                        <div className="flex-1 space-y-3 relative z-10">
                            {shopFloorAlerts.map((alert, i) => (
                                <div key={i} className={`p-4 rounded-sm border border-neutral-100 dark:border-neutral-800 hover:border-primary/50 transition-all cursor-pointer group/alert flex items-start gap-4 hover:translate-x-1 duration-200`}>
                                    <div className={`p-2 rounded-sm border mt-0.5 ${alert.colorClass}`}>
                                        <alert.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[12px] font-black text-main uppercase tracking-tight group-hover/alert:text-primary transition-colors">{alert.title}</h4>
                                        <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed opacity-80 font-bold uppercase tracking-widest">{alert.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => { dispatch(setActiveTab('AUDIT_LOGS')); navigate('/settings/audit'); }}
                            className="w-full mt-6 py-3 rounded-sm border border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 relative z-10"
                        >
                            View All Activity <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Recent Vendor Transactions */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-sm shadow-sm overflow-hidden relative">
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -ml-48 -mb-48 animate-aura opacity-50" />
                    <div className="flex items-center justify-between mb-8 relative z-10 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                        <div>
                            <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4 italic">
                                <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.5)]" />
                                Vendor Purchase Log
                            </h3>
                            <p className="text-[11px] text-neutral-500 font-black uppercase tracking-[0.3em] opacity-50 mt-1">Latest procurement & supply nodes</p>
                        </div>
                        <button
                            onClick={() => navigate('/purchase')}
                            className="px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all rounded-sm"
                        >
                            Full Register
                        </button>
                    </div>
                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Vendor Node</th>
                                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Identity Node</th>
                                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Throughput</th>
                                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-center">Protocol State</th>
                                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                                {recentTransactions.map((txn, i) => (
                                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group/row">
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-black text-main uppercase tracking-tight group-hover/row:text-primary transition-colors">{txn.vendor}</p>
                                        </td>
                                        <td className="py-4 px-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{txn.mobile}</td>
                                        <td className="py-4 px-4 text-sm font-black text-main tabular-nums">{txn.amount}</td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${txn.status === 'COMPLETED' ? 'bg-success/10 border-success/30 text-success' : 'bg-warning/10 border-warning/30 text-warning'}`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-[10px] font-black text-neutral-400 text-right uppercase tracking-widest">{txn.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardMockUI;
