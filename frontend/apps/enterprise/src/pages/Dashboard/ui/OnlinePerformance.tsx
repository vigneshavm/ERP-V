import React from 'react';
import { useNavigation } from '@/app/providers/NavigationContext';
import Layout, { PageShell } from "@/shared/ui/Layout";
import {
    TrendingUp,
    Users,
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
    Globe,
    Smartphone,
    Monitor,
    MousePointer2,
    Calendar,
    Filter,
    Download,
    LayoutDashboard
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useUiStore } from "@/shared/lib/store/uiStore";
const OnlinePerformance: React.FC = () => {
    const dispatch = useDispatch();
    const { navigate } = useNavigation();

    const metrics = [
        { label: 'Conversion Rate', value: '3.24%', change: '+0.8%', trend: 'up', icon: MousePointer2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { label: 'Avg. Session Duration', value: '2m 45s', change: '+15s', trend: 'up', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Bounce Rate', value: '42.5%', change: '-2.1%', trend: 'down', icon: Filter, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    ];

    const deviceBreakdown = [
        { device: 'Mobile', sessions: '65%', icon: Smartphone, color: 'bg-indigo-500' },
        { device: 'Desktop', sessions: '30%', icon: Monitor, color: 'bg-emerald-500' },
        { device: 'Tablet', sessions: '5%', icon: Globe, color: 'bg-amber-500' },
    ];

    return (
        <Layout>
            <PageShell>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-main tracking-tight leading-none">Online Performance</h1>
                    <p className="text-muted dark:text-muted mt-2 font-medium">Detailed analytics and conversion metrics for your digital storefront.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl text-xs font-bold hover:bg-[var(--erp-bg-sunken)] transition-all">
                        <Calendar className="w-4 h-4" /> Last 30 Days
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                    <button
                        onClick={() => navigate('DASHBOARD' as any)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] hover:bg-slate-200 dark:hover:bg-slate-700 text-secondary dark:text-slate-200 rounded-xl transition-all text-sm font-bold ml-2"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>
            </div>

            {/* Granular Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 ${metric.bg} rounded-2xl flex items-center justify-center ${metric.color}`}>
                                <metric.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted dark:text-muted uppercase tracking-widest">{metric.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-black text-main">{metric.value}</h3>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${metric.trend === 'up' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10' : 'bg-rose-100 text-rose-600 dark:bg-rose-400/10'}`}>
                                        {metric.change}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="h-1 lg:h-1.5 w-full bg-[var(--erp-bg-sunken)] dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${metric.color.replace('text', 'bg')} transition-all duration-1000 w-[65%]`}
                                style={{ width: idx === 0 ? '78%' : idx === 1 ? '54%' : '42%' }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Trend Chart Block */}
                <div className="lg:col-span-2 bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] p-8 border border-default dark:border-default shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-main tracking-tight">Traffic & Conversion Trends</h3>
                            <p className="text-sm text-muted font-medium">Correlation between visitor volume and successful checkouts.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Visitors</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Sales</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-80 flex flex-col items-center justify-center bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 rounded-3xl border-2 border-dashed border-default dark:border-default animate-pulse">
                        <TrendingUp className="w-16 h-16 mb-4 text-slate-200 dark:text-main" />
                        <p className="font-bold text-sm uppercase tracking-[0.2em] text-muted opacity-60 italic">Processing Analytics Stream...</p>
                        <p className="text-[10px] mt-2 text-muted opacity-40">Connecting to E-commerce API endpoint...</p>
                    </div>
                </div>

                {/* Device & Acquisition */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] p-8 border border-default dark:border-default shadow-sm">
                        <h3 className="text-lg font-black text-main mb-6">Device Breakdown</h3>
                        <div className="space-y-6">
                            {deviceBreakdown.map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <item.icon className="w-4 h-4 text-muted" />
                                            <span>{item.device}</span>
                                        </div>
                                        <span className="text-main">{item.sessions}</span>
                                    </div>
                                    <div className="h-2 w-full bg-[var(--erp-bg-sunken)] dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: item.sessions }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="text-sm font-black uppercase tracking-widest mb-2 opacity-80">AI Insight</h4>
                        <p className="text-sm font-medium leading-relaxed">
                            "Mobile traffic is up 32%. Consider optimizing your product images for faster loading on cellular networks to boost tablet conversion."
                        </p>
                        <button className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
                            Apply Optimization <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
            </div>
            </PageShell>
        </Layout>
    );
};

export default OnlinePerformance;
