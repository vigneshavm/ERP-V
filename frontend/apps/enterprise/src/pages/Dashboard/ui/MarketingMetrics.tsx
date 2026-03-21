import { useNavigation } from '@/app/providers/NavigationContext';

import React from 'react';
import {
    Megaphone,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    MessageCircle,
    Mail,
    Share2,
    DollarSign,
    Target,
    Users,
    Zap,
    LayoutDashboard,
    Calendar,
    Download,
    Archive,
    PieChart as PIE,
    MapPin
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useUiStore } from "@/shared/lib/store/uiStore";
import Layout, { PageShell } from "@/shared/ui/Layout";


const MarketingMetrics: React.FC = () => {
    const { navigate } = useNavigation();
    const dispatch = useDispatch();
    

    const mainMetrics = [
        { label: 'Total Marketing Spend', value: '₹12,450', change: '+5.2%', trend: 'up', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Gross Profit Impact', value: '₹58.2k', change: '+18.4%', trend: 'up', icon: PIE, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Inventory Velocity', value: '2.4x', change: '+0.8x', trend: 'up', icon: Archive, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Marketing ROI', value: '4.8x', change: '+0.3x', trend: 'up', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];

    const channelPerformance = [
        { name: 'WhatsApp Marketing', spend: '₹5,200', reach: '4,500', conversion: '5.2%', color: 'text-emerald-500', icon: MessageCircle },
        { name: 'Email Campaigns', spend: '₹2,100', reach: '8,200', conversion: '2.1%', color: 'text-blue-500', icon: Mail },
        { name: 'Social Media Ads', spend: '₹5,150', reach: '12,400', conversion: '1.8%', color: 'text-indigo-500', icon: Share2 },
    ];

    return (
        <Layout>
            <PageShell>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-main tracking-tight leading-none italic">Marketing Metrics</h1>
                    <p className="text-muted dark:text-muted mt-2 font-medium">Advanced campaign analytics and ROI intelligence.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl text-xs font-bold hover:bg-[var(--erp-bg-sunken)] transition-all shadow-sm">
                        <Calendar className="w-4 h-4" /> Custom Range
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button
                        onClick={() => navigate('DASHBOARD' as any)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] hover:bg-slate-200 dark:hover:bg-slate-700 text-secondary dark:text-slate-200 rounded-xl transition-all text-sm font-black ml-2"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mainMetrics.map((metric, idx) => (
                    <div key={idx} className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm group hover:border-indigo-500 transition-all cursor-pointer overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                        <div className={`w-12 h-12 ${metric.bg} rounded-2xl flex items-center justify-center ${metric.color} mb-4`}>
                            <metric.icon className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{metric.label}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-black text-main">{metric.value}</h3>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${metric.trend === 'up' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10' : 'bg-rose-100 text-rose-600 dark:bg-rose-400/10'}`}>
                                {metric.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Conversion Funnel */}
                <div className="lg:col-span-2 bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] p-8 border border-default dark:border-default shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-main tracking-tight">Campaign Conversion Funnel</h3>
                                <p className="text-sm text-muted font-medium">Tracking user journey from first contact to purchase.</p>
                            </div>
                            <Megaphone className="w-8 h-8 text-indigo-500 opacity-20" />
                        </div>

                        <div className="space-y-6">
                            {[
                                { stage: 'Total Impressions', count: '25,100', percentage: '100%', color: 'bg-[var(--erp-bg-sunken)] dark:bg-slate-700' },
                                { stage: 'Page Visits', count: '4,200', percentage: '16.7%', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
                                { stage: 'Product Views', count: '1,850', percentage: '7.3%', color: 'bg-indigo-200 dark:bg-indigo-900/50' },
                                { stage: 'Cart Additions', count: '420', percentage: '1.6%', color: 'bg-indigo-300 dark:bg-indigo-900/70' },
                                { stage: 'Successful Purchases', count: '158', percentage: '0.6%', color: 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' },
                            ].map((row, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-2 px-2">
                                        <span>{row.stage}</span>
                                        <div className="flex gap-4">
                                            <span className="text-muted italic">{row.percentage}</span>
                                            <span className="text-main">{row.count}</span>
                                        </div>
                                    </div>
                                    <div className={`h-12 w-full ${row.color} rounded-2xl flex items-center px-4 overflow-hidden relative`}>
                                        <div className="absolute inset-0 bg-[var(--erp-bg-sunken)] backdrop-blur-[1px]" />
                                    </div>
                                    {idx < 4 && (
                                        <div className="flex justify-center -my-1 relative z-20">
                                            <div className="w-px h-2 bg-slate-300 dark:bg-slate-700" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Channel ROI Breakdown */}
                <div className="space-y-8">
                    <div className="bg-[var(--erp-bg)] dark:bg-[var(--erp-bg)] rounded-[2.5rem] p-8 text-main shadow-xl border border-default relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                        <h3 className="text-lg font-black tracking-tight mb-8">Channel ROI Efficiency</h3>
                        <div className="space-y-8 relative z-10">
                            {channelPerformance.map((channel, idx) => (
                                <div key={idx} className="space-y-3 group/item">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-[var(--erp-bg-sunken)] ${channel.color}`}>
                                                <channel.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-muted">{channel.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-400">ROI: {idx === 0 ? '6.2x' : idx === 1 ? '4.5x' : '3.8x'}</span>
                                    </div>
                                    <div className="flex gap-1.5 h-1.5 w-full bg-[var(--erp-bg-sunken)] rounded-full overflow-hidden">
                                        <div className={`h-full ${channel.color.replace('text', 'bg')} transition-all duration-1000 rounded-full`} style={{ width: channel.conversion.replace('%', '') + '0%' }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-muted">
                                        <span>Reach: {channel.reach}</span>
                                        <span>Spend: {channel.spend}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Branch ROI Leaderboard */}
                    <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] p-8 border border-default dark:border-default shadow-sm relative overflow-hidden">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Branch Growth Performance
                        </h4>
                        <div className="space-y-6">
                            {[
                                { branch: 'Mumbai Hub', impact: '₹2.4L', color: 'bg-indigo-500' },
                                { branch: 'Pune Outlet', impact: '₹1.8L', color: 'bg-blue-500' },
                                { branch: 'Bangalore Flagship', impact: '₹3.1L', color: 'bg-emerald-500' }
                            ].map((b, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black">{b.branch}</span>
                                        <span className="text-xs font-black">{b.impact}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--erp-bg-sunken)] dark:bg-slate-700/50 rounded-full overflow-hidden">
                                        <div className={`${b.color} h-full transition-all duration-1000`} style={{ width: (parseInt(b.impact.replace('₹', '').replace('L', '')) / 4 * 100) + '%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Optimization Insight */}
                    <div className="bg-[var(--erp-bg)] rounded-[2rem] p-8 text-main shadow-xl relative overflow-hidden group">
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                        <div className="flex items-center gap-2 mb-4 opacity-80">
                            <Zap className="w-4 h-4 fill-current text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Wings ROI Engine</span>
                        </div>
                        <h4 className="text-lg font-black mb-2 leading-tight">Sync Boost Opportunity</h4>
                        <p className="text-sm font-medium text-muted leading-relaxed">
                            Your "Weekend Sale" items are moving 40% faster in Bangalore. We recommend increasing WhatsApp ad budget for this region to clear remaining stock.
                        </p>
                        <button className="mt-6 w-full py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-[var(--erp-bg-sunken)] transition-all active:scale-95 leading-none">
                            Execute Region Boost
                        </button>
                    </div>
                </div>
            </div>
            </div>
            </PageShell>
        </Layout>
    );
};

export default MarketingMetrics;
