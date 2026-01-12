import React, { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    Send,
    CheckCircle2,
    Clock,
    AlertCircle,
    LayoutGrid,
    LayoutList,
    TrendingUp,
    Users,
    MousePointer2,
    ArrowRight,
    BarChart3,
    Zap,
    Sparkles,
    Eye,
    Download,
    Calendar,
    LayoutDashboard
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '../../../store';
import Campaigns from './Campaigns';

const EmailMarketing: React.FC = () => {
    const dispatch = useDispatch();
    const [viewMode, setViewMode] = useState<'manager' | 'builder'>('manager');

    const emailCampaigns = [
        {
            id: 'ec1',
            name: 'Welcome Series - New Subscribers',
            status: 'ACTIVE',
            audience: 'New Segments',
            openRate: '42.5%',
            ctr: '12.2%',
            bounces: '0.4%',
            lastSent: 'Automated',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            id: 'ec2',
            name: 'Monthly Flash Sale Launch',
            status: 'SCHEDULED',
            audience: 'All Customers',
            openRate: '0%',
            ctr: '0%',
            bounces: '0%',
            lastSent: 'Scheduled: Jan 24',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            id: 'ec3',
            name: 'Re-engagement Winback',
            status: 'ACTIVE',
            audience: 'Inactive (90 days)',
            openRate: '18.4%',
            ctr: '5.2%',
            bounces: '1.2%',
            lastSent: '2d ago',
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10'
        }
    ];

    if (viewMode === 'builder') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => setViewMode('manager')}
                        className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-indigo-600 font-black uppercase tracking-widest text-xs transition-colors"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to Email Manager
                    </button>
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                        Email Studio
                    </div>
                </div>
                <Campaigns />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none italic">
                        Email <span className="text-indigo-600">Marketing</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Build, automate, and analyze high-performance email campaigns.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setViewMode('builder')}
                        className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Start New Email
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('GROW_DASHBOARD'))}
                        className="flex items-center gap-2 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all text-sm font-black ml-2 shadow-sm"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Premium Email KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Total Subscribers</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-3xl font-black mb-1">12,450</h3>
                            <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> +12% growth
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Avg. Open Rate</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-3xl font-black mb-1">34.8%</h3>
                            <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Industry: 22%
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Eye className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Avg. CTR</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-3xl font-black mb-1">8.42%</h3>
                            <p className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-current" /> High Engagement
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                            <MousePointer2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Bounce Rate</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-3xl font-black mb-1">0.82%</h3>
                            <p className="text-[10px] font-bold text-slate-400 italic">Deliverability: 99.2%</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Email Campaign Manager */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black tracking-tight">Email Campaigns</h3>
                            <div className="inline-flex gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                                3 Active
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search emails..."
                                    className="pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold w-full md:w-48 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-400 scale-95 opacity-80">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Open Rate</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">CTR</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {emailCampaigns.map((camp) => (
                                    <tr key={camp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 ${camp.bg} ${camp.color} rounded-xl flex items-center justify-center`}>
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white truncate max-w-[200px]">{camp.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{camp.audience}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <p className="font-black text-sm">{camp.openRate}</p>
                                        </td>
                                        <td className="p-6 text-center">
                                            <p className="font-black text-sm text-indigo-600">{camp.ctr}</p>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors scale-90 group-hover:scale-100">
                                                    <BarChart3 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors scale-90 group-hover:scale-100">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                        <button className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">View All Email Campaigns</button>
                    </div>
                </div>

                {/* AI & Intelligence Side Panel */}
                <div className="space-y-8">
                    {/* AI Suggestions */}
                    <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest">AI Copywriter</h4>
                        </div>
                        <h3 className="text-xl font-black mb-4 tracking-tight leading-tight">Trending Subject Lines</h3>
                        <div className="space-y-4 relative z-10">
                            {[
                                "🔥 Your style, your terms. Last call for Summer.",
                                "Exclusive: 15% off just for being you!",
                                "Don't blink! The flash sale ends in 3 hours."
                            ].map((line, idx) => (
                                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group/line hover:bg-white/10 transition-colors cursor-pointer">
                                    <p className="text-xs font-medium text-slate-300 italic">"{line}"</p>
                                    <button className="text-indigo-400 group-hover/line:translate-x-1 transition-transform">
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Deliverability Insight */}
                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center gap-2 mb-4 opacity-80">
                            <Zap className="w-4 h-4 fill-current text-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Optimization Hint</span>
                        </div>
                        <h4 className="text-lg font-black mb-2">High Deliverability!</h4>
                        <p className="text-sm font-medium text-indigo-100 leading-relaxed opacity-90">
                            Your domains are 100% verified. Morning sends (9-10 AM) are resulting in 25% higher open rates for your "All Customers" segment.
                        </p>
                        <button className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-indigo-600 px-6 py-3.5 rounded-2xl hover:bg-neutral-50 active:scale-95 transition-all shadow-lg">
                            Adjust Schedule <Clock className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Subscriber Health */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Audience Growth</h4>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black">Active Audience</span>
                                    <span className="text-xs font-black">8,420</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full w-[78%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-slate-500">Unsubscribed</span>
                                    <span className="text-xs font-black">1.2%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full w-[1.2%]" />
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-8 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-600 transition-all flex items-center justify-center gap-2">
                            Manage Subscriber List <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailMarketing;
