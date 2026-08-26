import React, { useState, useMemo } from 'react';
import { 
    Megaphone, Plus, Search, Filter, Mail, MessageSquare, 
    Share2, Tag, Zap, BarChart2, Users, ArrowRight, 
    MoreHorizontal, Send, MousePointer2, PieChart,
    ChevronRight, Globe, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customers, salesInvoices } from '../../data';
import Layout from '../../components/shared/Layout';

const MarketingMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const metrics = useMemo(() => {
        const totalCustomers = customers.length;
        return [
            { label: 'Audience Reach', val: totalCustomers.toLocaleString(), sub: 'ACTIVE PROFILES', icon: Users, color: 'text-pink-500', bg: 'bg-pink-500/10' },
            { label: 'Engagement Rate', val: '12.4%', sub: 'AVG INTERACTION', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Campaign Nodes', val: '08', sub: 'ACTIVE DEPLOYMENTS', icon: Megaphone, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Conversion Index', val: '4.2%', sub: 'ROI EFFICIENCY', icon: Target, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' }
        ];
    }, []);

    const channels = [
        { name: 'Email Broadcast', icon: Mail, color: 'pink', reach: '8.4k', status: 'Optimal' },
        { name: 'WhatsApp Bot', icon: MessageSquare, color: 'emerald', reach: '4.2k', status: 'Syncing' },
        { name: 'Social Nexus', icon: Share2, color: 'sky', reach: '12k', status: 'Active' },
        { name: 'Direct SMS', icon: Send, color: 'orange', reach: '2.1k', status: 'Ready' }
    ];

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Marketing <span className="text-pink-500">Command</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Growth Orchestration Core // Node M-4
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <BarChart2 className="w-4 h-4 text-pink-500" /> Intelligence
                        </button>
                        <button className="h-12 px-8 bg-pink-600 text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-pink-500/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Deploy Campaign
                        </button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-pink-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black ${card.color} uppercase tracking-[0.2em]`}>Live Metrics</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                                <p className={`text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-2`}>{card.sub}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Channel Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {channels.map((ch, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-5 flex flex-col gap-4 group hover:border-pink-500/50 transition-all shadow-sm">
                            <div className="flex justify-between items-center">
                                <div className={`p-2.5 rounded-sm bg-${ch.color}-500/10 text-${ch.color}-500 border border-${ch.color}-500/20`}>
                                    <ch.icon className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full bg-${ch.color}-500 animate-pulse`} />
                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{ch.status}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-widest">{ch.name}</h4>
                                <p className="text-lg font-display font-black text-neutral-900 dark:text-white mt-1 tabular-nums tracking-tight">{ch.reach}</p>
                                <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-1">TOTAL REACH</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Campaign Table */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-pink-500" /> Active Deployments
                            </h3>
                            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden lg:block" />
                            <div className="relative w-64">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input 
                                    type="text" 
                                    placeholder="FILTER BY CAMPAIGN..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-2 pl-10 pr-4 text-[9px] font-black tracking-widest uppercase focus:border-pink-500 outline-none" 
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="h-10 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-pink-500 transition-all flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Global Filters
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Deployment Node</th>
                                    <th className="px-8 py-5">Classification</th>
                                    <th className="px-8 py-5">Audience Node</th>
                                    <th className="px-8 py-5 text-right">Throughput</th>
                                    <th className="px-8 py-5 text-center">Protocol state</th>
                                    <th className="px-8 py-5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {[
                                    { name: 'Summer Solstice FY26', cat: 'Seasonal Push', audience: 'VIP Tier 1', reach: '4.2k', status: 'DEPLOYED', color: 'pink' },
                                    { name: 'Node Reactivation V2', cat: 'Churn Defense', audience: 'At-Risk Nodes', reach: '1.8k', status: 'SCHEDULED', color: 'orange' },
                                    { name: 'Global Store Launch', icon: Globe, cat: 'Brand Expansion', audience: 'Mass Market', reach: '12.4k', status: 'DEPLOYED', color: 'sky' }
                                ].map((c, idx) => (
                                    <tr key={idx} className="hover:bg-pink-500/[0.02] transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-sm bg-${c.color}-500/10 border border-${c.color}-500/20 flex items-center justify-center text-${c.color}-500 group-hover:bg-${c.color}-500 group-hover:text-white transition-all`}>
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500">
                                                {c.cat}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                            {c.audience}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="font-mono text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">
                                                {c.reach}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${c.status === 'DEPLOYED' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button className="p-2 text-neutral-300 hover:text-pink-500 transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
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

export default MarketingMockUI;
