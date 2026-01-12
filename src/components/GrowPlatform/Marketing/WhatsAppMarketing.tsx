import React, { useState } from 'react';
import {
    MessageSquare,
    CheckCircle2,
    Clock,
    Users,
    Filter,
    RefreshCw,
    Plus,
    Send,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    XCircle,
    BarChart3,
    Zap,
    TrendingUp,
    LayoutDashboard,
    ArrowRight,
    Sparkles,
    Smartphone,
    ShieldCheck
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '../../../store';
import Campaigns from './Campaigns';

const WhatsAppMarketing: React.FC = () => {
    const dispatch = useDispatch();
    const [viewMode, setViewMode] = useState<'manager' | 'create'>('manager');
    const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);

    const waConfig = {
        isConnected: true,
        phoneNumber: '+91-9876543210',
        lastSyncAt: new Date().toISOString(),
        metrics: { totalSent: 12450, totalDelivered: 11890, totalRead: 9234, totalFailed: 560, cost: 3120 },
        campaigns: [
            { id: 'c1', name: 'Summer Sale 2026', status: 'COMPLETED', sentAt: '2026-01-05T10:00:00Z', audienceType: 'All Customers', recipientCount: 2500, read: 1890, failed: 80, cost: 625 },
            { id: 'c2', name: 'Loyalty Upgrade', status: 'COMPLETED', sentAt: '2026-01-02T10:00:00Z', audienceType: 'Loyalty Members', recipientCount: 850, read: 800, failed: 0, cost: 212 },
            { id: 'c3', name: 'Holiday Greetings', status: 'SCHEDULED', sentAt: '2026-01-20T10:00:00Z', audienceType: 'Active Buyers', recipientCount: 1200, read: 0, failed: 0, cost: 300 },
        ]
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'SCHEDULED': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'SENDING': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'FAILED': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        }
    };

    if (viewMode === 'create') {
        return (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => setViewMode('manager')}
                        className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-indigo-600 font-black uppercase tracking-widest text-xs transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Manager
                    </button>
                    <div className="flex items-center gap-6">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${createStep >= step ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    {step}
                                </div>
                                {step < 4 && <div className={`w-8 h-0.5 rounded-full ${createStep > step ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                    <div className="relative z-10 text-center space-y-8">
                        <div>
                            <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Step {createStep}: Configuration</span>
                            <h2 className="text-3xl font-black tracking-tight">Launch New Campaign</h2>
                            <p className="text-slate-500 dark:text-slate-400">Configure your broadcast audience and message content.</p>
                        </div>

                        <div className="py-10 border-y border-slate-100 dark:border-slate-800">
                            {/* Placeholder for actual wizard content */}
                            <p className="text-xl font-bold italic text-slate-400 italic">"Wizard intelligence loading..."</p>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button
                                onClick={() => setCreateStep(Math.max(1, createStep - 1) as any)}
                                className="px-10 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => {
                                    if (createStep === 4) setViewMode('manager');
                                    else setCreateStep(Math.min(4, createStep + 1) as any);
                                }}
                                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                            >
                                {createStep === 4 ? 'Launch Campaign' : 'Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header & API Widget */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                        WhatsApp <span className="text-emerald-500">Marketing</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Connect directly with your customers on their favorite platform.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-4">
                        <div className="relative">
                            <Smartphone className="w-5 h-5 text-emerald-600" />
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">API Connected</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{waConfig.phoneNumber}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setViewMode('create')}
                        className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> New Broadcast
                    </button>

                    <button
                        onClick={() => dispatch(setActiveTab('GROW_DASHBOARD'))}
                        className="flex items-center gap-2 px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Broadcasts Sent', value: waConfig.metrics.totalSent, icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-500/5', trend: '+18% growth' },
                    { label: 'Delivery Rate', value: '95.5%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/5', trend: 'Optimal health' },
                    { label: 'Read Ratio', value: '74.2%', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-500/5', trend: 'High engagement' },
                    { label: 'Estimated Cost', value: `₹${waConfig.metrics.cost}`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-500/5', trend: 'ROI: 12.4x' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${kpi.bg} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">{kpi.label}</p>
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="text-3xl font-black mb-1">{kpi.value}</h3>
                                    <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                        {kpi.trend}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 ${kpi.bg.replace('/5', '/20')} rounded-2xl flex items-center justify-center ${kpi.color}`}>
                                    <kpi.icon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaign Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black tracking-tight leading-none italic">Active Broadcasts</h3>
                            <div className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                {waConfig.campaigns.length} Campaigns
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 transition-all">
                                <Filter className="w-4 h-4" />
                            </button>
                            <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 transition-all">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Broadcast Campaign</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Audience</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Read Ratio</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {waConfig.campaigns.map((camp) => (
                                    <tr key={camp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all duration-300">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                                                    <MessageSquare className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white truncate max-w-[200px]">{camp.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent {new Date(camp.sentAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex flex-col">
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-300">{camp.recipientCount.toLocaleString()}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{camp.audienceType}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-black text-indigo-600">{camp.recipientCount ? Math.round((camp.read / camp.recipientCount) * 100) : 0}%</span>
                                                <div className="w-16 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500"
                                                        style={{ width: `${camp.recipientCount ? (camp.read / camp.recipientCount) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(camp.status)}`}>
                                                {camp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Automation & Insights */}
                <div className="space-y-8">
                    {/* Template Library Quick Links */}
                    <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest">WhatsApp Intelligence</h4>
                        </div>
                        <h3 className="text-xl font-black mb-4 tracking-tight leading-tight italic">Recommended Content</h3>
                        <div className="space-y-4 relative z-10">
                            {[
                                { title: "Stock Clearance Media", ctr: "12.4%", type: "Video" },
                                { title: "Loyalty Rewind Card", ctr: "9.8%", type: "Interactive" }
                            ].map((rec, idx) => (
                                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group/item">
                                    <div>
                                        <p className="text-xs font-black mb-1">{rec.title}</p>
                                        <span className="text-[9px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-full tracking-widest">{rec.type}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-indigo-400">{rec.ctr}</p>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest uppercase">Est. CTR</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => dispatch(setActiveTab('GROW_MARKETING_TEMPLATES'))}
                            className="w-full mt-6 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                            Open Media Studio <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Cost Analytics */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Spend Control</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Monthly Budget</span>
                                <span className="text-xs font-black">₹5,000</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[62%]" />
                            </div>
                            <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                                You are tracking at 62% of your budget. Recommended to launch one more "High ROI" campaign this week.
                            </p>
                        </div>
                    </div>

                    {/* Audience Segments */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Audience segments</h4>
                            <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: "Loyalty Gold", count: "850", color: "bg-amber-500" },
                                { name: "Recent (30d)", count: "1,200", color: "bg-indigo-500" },
                                { name: "Win-back", count: "420", color: "bg-emerald-500" }
                            ].map((seg, idx) => (
                                <div key={idx} className="flex items-center justify-between group/seg cursor-pointer px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${seg.color}`} />
                                        <p className="text-xs font-black text-slate-600 dark:text-slate-400 group-hover/seg:text-slate-900 dark:group-hover/seg:text-white transition-colors">{seg.name}</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">{seg.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppMarketing;
