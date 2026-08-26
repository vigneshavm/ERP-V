import React, { useMemo } from 'react';
import { Heart, Plus, Search, Filter, MessageSquare, Mail, Gift, Star, ThumbsUp, ThumbsDown, MoreHorizontal, ArrowRight, Users } from 'lucide-react';
import { customers } from '../../data';
import Layout from '../../components/shared/Layout';

const IconMap: Record<string, React.ElementType> = {
    Gift, Star, ThumbsUp, ThumbsDown, Mail, MessageSquare
};

const CustomerEngagementMockUI: React.FC = () => {
    const metrics = useMemo(() => [
        { label: 'Engagement Score', val: '92.4%', sub: '+4.2% this month', iconName: 'Star', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
        { label: 'Active Retention', val: '88%', sub: '2,401 users active', iconName: 'Heart', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
        { label: 'Response Rate', val: '14m', sub: '-2m avg speed', iconName: 'MessageSquare', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
        { label: 'Referral Alpha', val: '412', sub: '+12 today', iconName: 'Gift', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' }
    ], []);

    const tools = useMemo(() => [
        {
            title: 'NPS Campaigns',
            iconName: 'ThumbsUp',
            color: 'primary',
            stats: [{ val: '4.8k', label: 'Sent' }, { val: '1.2k', label: 'Opened' }, { val: '840', label: 'Responded' }],
            rate: '70%',
            rateLabel: 'SCORE'
        },
        {
            title: 'Email Automation',
            iconName: 'Mail',
            color: 'danger',
            stats: [{ val: '12', label: 'Active' }, { val: '84k', label: 'Delivered' }, { val: '22%', label: 'Click Rate' }],
            rate: '98%',
            rateLabel: 'HEALTH'
        },
        {
            title: 'Loyalty Protocol',
            iconName: 'Star',
            color: 'warning',
            stats: [{ val: '24k', label: 'Tier 1' }, { val: '1.2k', label: 'Tier 2' }, { val: '₹4.2L', label: 'Value' }],
            rate: '12%',
            rateLabel: 'GROWTH'
        }
    ], []);

    const feedbackData = useMemo(() => {
        return customers.slice(0, 8).map((c, i) => ({
            customer: c.name,
            channel: i % 2 === 0 ? 'Email' : 'In-App',
            rating: 5 - (i % 2),
            feedback: i % 3 === 0 ? 'Excellent service and premium quality products!' : 'Fast delivery and great support team.',
            date: 'Today',
            sentiment: i % 2 === 0 ? 'POSITIVE' : 'NEUTRAL',
            color: i % 2 === 0 ? 'success' : 'warning'
        }));
    }, []);

    return (
        <Layout>
            <div className="space-y-8 pt-4">
                <header className="flex justify-between items-center mb-8">
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-danger rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                        <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                            Customer <span className="text-danger italic">Engagement</span>
                            <span className="px-3 py-1 bg-danger/10 border border-danger/20 text-danger rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5" /> Retention Protocol
                            </span>
                        </h1>
                        <p className="text-[10px] text-neutral-500 mt-1 font-black uppercase tracking-[0.2em] opacity-70">Orchestrating Loyalty and Feedback Loops</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-main font-black uppercase tracking-widest text-[10px] rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-2">
                            <Users className="w-4 h-4 text-danger" /> Segments
                        </button>
                        <button className="h-11 px-6 bg-danger text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-lg shadow-danger/20 flex items-center gap-2 hover:opacity-90">
                            <Plus className="w-4 h-4" /> New Campaign
                        </button>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((card, i) => {
                        const Icon = IconMap[card.iconName];
                        return (
                            <div key={i} className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 group hover:border-danger/30 transition-all cursor-pointer relative overflow-hidden shadow-sm`}>
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} w-fit mb-4 border border-current/10`}>
                                    {Icon && <Icon className="w-5 h-5" />}
                                </div>
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest relative z-10">{card.label}</p>
                                <p className="text-3xl font-display font-black tracking-tighter mt-1 text-main relative z-10">{card.val}</p>
                                <p className={`text-[9px] mt-2 font-black uppercase tracking-widest ${card.color} relative z-10 italic`}>{card.sub}</p>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-current/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            </div>
                        );
                    })}
                </div>

                {/* Engagement Tools Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {tools.map((tool, i) => {
                        const Icon = IconMap[tool.iconName];
                        const toolColorClass = tool.color === 'primary' ? 'primary' : tool.color === 'danger' ? 'danger' : 'warning';
                        return (
                            <div key={i} className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 hover:border-${toolColorClass}/50 transition-all group cursor-pointer shadow-sm relative overflow-hidden`}>
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-sm bg-${toolColorClass === 'primary' ? 'blue-500' : toolColorClass === 'danger' ? 'rose-500' : 'amber-500'}/10 text-${toolColorClass === 'primary' ? 'blue-500' : toolColorClass === 'danger' ? 'rose-500' : 'amber-500'} border border-current/20`}>
                                            {Icon && <Icon className="w-5 h-5" />}
                                        </div>
                                        <h3 className="text-sm font-black text-main uppercase tracking-widest italic">{tool.title}</h3>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-danger group-hover:translate-x-1 transition-all" />
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                                    {tool.stats.map((s, si) => (
                                        <div key={si} className="bg-neutral-50 dark:bg-neutral-950 rounded-sm p-4 text-center border border-neutral-100 dark:border-neutral-800">
                                            <p className="text-lg font-display font-black text-main tracking-tighter">{s.val}</p>
                                            <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mt-1 opacity-60">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className={`flex items-center justify-between px-6 py-4 bg-${toolColorClass === 'primary' ? 'blue-500' : toolColorClass === 'danger' ? 'rose-500' : 'amber-500'}/5 border border-${toolColorClass === 'primary' ? 'blue-500' : toolColorClass === 'danger' ? 'rose-500' : 'amber-500'}/20 rounded-sm relative z-10`}>
                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{tool.rateLabel}</span>
                                    <span className={`text-2xl font-display font-black text-${toolColorClass === 'primary' ? 'blue-500' : toolColorClass === 'danger' ? 'rose-500' : 'amber-500'} tracking-tighter`}>{tool.rate}</span>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-current/5 rounded-full blur-3xl opacity-50" />
                            </div>
                        );
                    })}
                </div>

                {/* Feedback Table */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-danger rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                            Recent Intelligence Feedback
                        </h3>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input type="text" placeholder="FILTER BY CUSTOMER..." className="w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm py-2.5 pl-12 pr-4 text-[9px] font-black tracking-widest focus:outline-none focus:border-danger/30 transition-all text-main uppercase" />
                            </div>
                            <button className="h-10 px-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black text-neutral-500 flex items-center gap-2 hover:text-danger transition-all uppercase tracking-widest">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    {['Customer Entity', 'Channel', 'Rating', 'Feedback Intelligence', 'Timestamp', 'Sentiment', 'Actions'].map(h => (
                                        <th key={h} className={`px-8 py-5 text-[9px] font-black uppercase tracking-[0.15em] text-neutral-400 ${h === 'Rating' || h === 'Sentiment' || h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {feedbackData.map((fb, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-sm bg-danger/10 border border-danger/20 flex items-center justify-center text-danger font-black text-xs uppercase tracking-tighter">{fb.customer.split(' ').map(n => n[0]).join('')}</div>
                                                <span className="text-sm font-black text-main uppercase tracking-tight group-hover:text-danger transition-colors cursor-pointer">{fb.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6"><span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{fb.channel}</span></td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-1">
                                                {Array.from({ length: 5 }).map((_, s) => (
                                                    <Star key={s} className={`w-3.5 h-3.5 ${s < fb.rating ? 'text-warning fill-amber-400' : 'text-neutral-200 dark:text-neutral-800'}`} />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6"><p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed">{fb.feedback}</p></td>
                                        <td className="px-8 py-6"><span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{fb.date}</span></td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-sm text-[8px] font-black uppercase tracking-[0.2em] border ${fb.sentiment === 'POSITIVE' ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}`}>
                                                    {fb.sentiment}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button className="p-2.5 text-neutral-400 hover:text-danger transition-all bg-neutral-100 dark:bg-neutral-800 rounded-sm"><MoreHorizontal className="w-4 h-4" /></button>
                                            </div>
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

export default CustomerEngagementMockUI;
