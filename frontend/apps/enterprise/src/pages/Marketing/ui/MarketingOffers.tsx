import React, { useState } from 'react';
import {
    Gift,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    TrendingUp,
    Zap,
    Sparkles,
    Calendar,
    BarChart3,
    ArrowRight,
    MousePointer2,
    CheckCircle2,
    Share2,
    LayoutDashboard,
    Tag,
    Clock,
    Target,
    Layers,
    Flashlight
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '@/redux/slices/uiSlice';

const MarketingOffers: React.FC = () => {
    const dispatch = useDispatch();

    const activeOffers = [
        {
            id: 'of1',
            title: 'Flash Sale: Midnight Madness',
            type: 'FLASH_SALE',
            redemptions: 420,
            revenue: '₹84,000',
            roi: '14.2x',
            status: 'LIVE',
            endsIn: '4h 12m',
            color: 'text-rose-600',
            bg: 'bg-rose-500/10'
        },
        {
            id: 'of2',
            title: 'Weekend Tiered Rewards',
            type: 'TIERED',
            redemptions: 124,
            revenue: '₹52,000',
            roi: '8.4x',
            status: 'LIVE',
            endsIn: '2d 6h',
            color: 'text-indigo-600',
            bg: 'bg-indigo-500/10'
        },
        {
            id: 'of3',
            title: 'Festival BOGO Extravaganza',
            type: 'BOGO',
            redemptions: 0,
            revenue: '₹0',
            roi: '-',
            status: 'SCHEDULED',
            endsIn: 'Starts in 4d',
            color: 'text-emerald-600',
            bg: 'bg-emerald-500/10'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                        Marketing <span className="text-emerald-600 dark:text-emerald-400">Offers</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Engineer high-converting deals with AI-powered margin optimization.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> New Offer Architect
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('GROW_DASHBOARD'))}
                        className="flex items-center gap-2 px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Premium Offer KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Redemption Velocity', value: '42 / hr', icon: Zap, color: 'text-amber-600', trend: 'Trending Up', sub: 'Real-time activity' },
                    { label: 'Incremental Sales', value: '₹2,14,500', icon: TrendingUp, color: 'text-emerald-600', trend: '+18.4% lift', sub: 'Last 7 days' },
                    { label: 'Offer Efficiency (ROI)', value: '9.2x', icon: BarChart3, color: 'text-indigo-600', trend: 'Optimal Margin', sub: 'Spend vs Revenue' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{kpi.label}</p>
                                <h3 className="text-3xl font-black mb-1">{kpi.value}</h3>
                                <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> {kpi.trend}
                                </p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 ${kpi.color}`}>
                                <kpi.icon className="w-7 h-7" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Offer Command Center */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-xl font-black italic tracking-tight">Active Command Center</h3>
                            <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> View Full Timeline
                            </button>
                        </div>

                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {activeOffers.map((offer) => (
                                <div key={offer.id} className="p-8 flex items-center gap-6 group hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-all">
                                    <div className={`w-16 h-16 rounded-2xl ${offer.bg} ${offer.color} flex items-center justify-center shrink-0 border border-current opacity-70 group-hover:scale-110 transition-transform`}>
                                        <Tag className="w-8 h-8" />
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-black text-lg tracking-tight">{offer.title}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${offer.status === 'LIVE' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                {offer.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <MousePointer2 className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{offer.redemptions} Redemptions</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-indigo-600">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                <span className="text-xs font-black">{offer.revenue} Revenue</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold italic">{offer.endsIn}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-400">ROI Index</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">{offer.roi}</p>
                                        </div>
                                        <button className="p-2 text-slate-300 hover:text-emerald-600 transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Omni-channel Blast Interface */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                            <div className="space-y-4 max-w-sm">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Layers className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Omni-Channel Blast</span>
                                </div>
                                <h3 className="text-3xl font-black italic tracking-tighter leading-none">Distribute Deals Globally</h3>
                                <p className="text-sm font-medium text-slate-400 italic">Push your active offers to Social, Email, and WhatsApp in a single synchronized strike.</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {['Instagram', 'Facebook', 'WhatsApp', 'Email'].map((ch) => (
                                    <div key={ch} className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 group/ch hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500/50" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{ch} Ready</span>
                                    </div>
                                ))}
                            </div>

                            <button className="flex items-center gap-3 px-8 py-5 bg-white text-slate-900 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95">
                                Launch Blast <Flashlight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Automation & Insights Sidebar */}
                <div className="space-y-8">
                    {/* AI Margin Optimizer */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="w-5 h-5 text-indigo-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Margin Guard AI</h4>
                        </div>
                        <h3 className="text-xl font-black mb-6 tracking-tight leading-tight italic">Optimal Discount: 18%</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic mb-8">
                            "Reducing Midnight Madness discount from 25% to 18% is predicted to maintain volume while increasing total gross profit by 14.2%."
                        </p>
                        <button className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                            Apply AI Adjustment <Sparkles className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Conversion Funnel */}
                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-8">Offer Conversion Funnel</h4>
                        <div className="space-y-6">
                            {[
                                { stage: 'Views', value: '12.4K', percent: '100%', color: 'bg-white/30' },
                                { stage: 'Clicks', value: '3.1K', percent: '25%', color: 'bg-white/60' },
                                { stage: 'Claimed', value: '1.2K', percent: '9.6%', color: 'bg-white/90' }
                            ].map((st, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest">{st.stage}</span>
                                        <span className="text-sm font-black">{st.value}</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${st.color}`}
                                            style={{ width: st.percent }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Avg. Conversion</span>
                            <span className="text-xl font-black tracking-tighter">9.6%</span>
                        </div>
                    </div>

                    {/* Upcoming Seasonal Slots */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Upcoming Slots</h4>
                        <div className="space-y-4">
                            {[
                                { time: 'Feb 14', name: 'Valentines Bundle', status: 'Reserved' },
                                { time: 'Mar 10', name: 'Spring Refresh', status: 'Open' }
                            ].map((slot, idx) => (
                                <div key={idx} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-emerald-500/50 transition-all">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{slot.time}</p>
                                        <p className="text-xs font-black">{slot.name}</p>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${slot.status === 'Reserved' ? 'text-indigo-500' : 'text-emerald-500 animate-pulse'}`}>
                                        {slot.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">
                            Manage Seasonal Planner
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingOffers;

