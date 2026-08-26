
import React, { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
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
    BarChart3
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '@/redux/slices/uiSlice';
import Campaigns from './Campaigns';

const MarketingCampaigns: React.FC = () => {
    const dispatch = useDispatch();
    const [viewMode, setViewMode] = useState<'manager' | 'builder'>('manager');

    const campaigns = [
        {
            id: 'c1',
            name: 'Summer Flash Sale',
            status: 'ACTIVE',
            channel: 'WhatsApp',
            reach: 4500,
            engagement: '12%',
            conversion: '3.2%',
            lastUpdated: '2h ago',
            color: 'text-success',
            bg: 'bg-success/10'
        },
        {
            id: 'c2',
            name: 'New Collection Buzz',
            status: 'SCHEDULED',
            channel: 'Email',
            reach: 12000,
            engagement: '0%',
            conversion: '0%',
            lastUpdated: '1d ago',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            id: 'c3',
            name: 'Weekend Loyalty Bonus',
            status: 'COMPLETED',
            channel: 'Multi-Channel',
            reach: 8200,
            engagement: '24%',
            conversion: '5.8%',
            lastUpdated: '3d ago',
            color: 'text-purple-500',
            bg: 'bg-accent/10'
        }
    ];

    if (viewMode === 'builder') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => setViewMode('manager')}
                        className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-primary font-black uppercase tracking-widest text-xs transition-colors"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to Manager
                    </button>
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                        Campaign Studio
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
                        Marketing <span className="text-primary">Campaigns</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Create, manage, and monitor your multi-channel growth campaigns.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setViewMode('builder')}
                        className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Start New Campaign
                    </button>
                </div>
            </div>

            {/* Campaign Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-sm flex items-center justify-center text-primary">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Reach</p>
                            <h3 className="text-2xl font-black">24,720</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full w-[65%]" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-sm flex items-center justify-center text-emerald-600">
                            <MousePointer2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Clicks</p>
                            <h3 className="text-2xl font-black">1,842</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[42%]" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-sm flex items-center justify-center text-purple-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conversions</p>
                            <h3 className="text-2xl font-black">312</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-[28%]" />
                    </div>
                </div>
            </div>

            {/* Campaign List Manager */}
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black tracking-tight">Campaign Manager</h3>
                        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
                            <button className="p-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-primary">
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-lg text-slate-400 opacity-50">
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search campaigns..."
                                className="pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold w-full md:w-64 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 scale-95 opacity-80">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign Name</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Channel</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Reach</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Engagement</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {campaigns.map((camp) => (
                                <tr key={camp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                    <td className="p-6">
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white truncate max-w-[200px]">{camp.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updated {camp.lastUpdated}</p>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${camp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600 dark:bg-success/10' :
                                                camp.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10' :
                                                    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                            {camp.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                            {camp.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{camp.channel}</span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <p className="font-black text-sm">{camp.reach.toLocaleString()}</p>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="font-black text-sm text-primary">{camp.engagement}</p>
                                            <div className="w-12 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="bg-indigo-500 h-full w-[65%]" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-colors scale-90 group-hover:scale-100">
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

                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Showing 3 of 12 global campaigns</p>
                    <div className="flex items-center gap-4">
                        <button className="text-xs font-black uppercase tracking-widest text-slate-400 opacity-50 cursor-not-allowed">Previous</button>
                        <button className="text-xs font-black uppercase tracking-widest text-primary hover:text-indigo-700 transition-colors">Next Page</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingCampaigns;

