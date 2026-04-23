import React from 'react';
import { Heart, Plus, Search, Filter, MessageSquare, Mail, Gift, Star, ThumbsUp, ThumbsDown, MoreHorizontal, ArrowRight, Users } from 'lucide-react';

const CustomerEngagementMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-rose-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[10%] w-[50%] h-[50%] bg-rose-700/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[0%] left-[5%] w-[38%] h-[38%] bg-pink-800/10 rounded-full blur-[140px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                            Customer Engagement
                            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Heart className="w-3 h-3" /> Retention Hub
                            </span>
                        </h1>
                        <p className="text-sm text-secondary mt-1 font-medium">Drive loyalty, gather feedback, and nurture customer relationships at scale.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-card hover:bg-card text-main font-bold text-sm tracking-wide rounded-xl transition-all border border-default flex items-center gap-2">
                            <Users className="w-4 h-4" /> Segments
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-main font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Campaign
                        </button>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Loyalty Members', val: '3,840', sub: '+124 this week', icon: Gift, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
                        { label: 'Avg Satisfaction', val: '4.6 / 5', sub: 'Based on 1,200 reviews', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                        { label: 'Positive Feedback', val: '89%', sub: '342 reviews this month', icon: ThumbsUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                        { label: 'Negative Feedback', val: '11%', sub: '42 issues raised', icon: ThumbsDown, color: 'text-muted', bg: 'bg-slate-500/10', border: 'border-default' },
                    ].map((card, i) => (
                        <div key={i} className={`glass-panel backdrop-blur-md rounded-2xl p-6 border ${card.border} group hover:bg-card/80 transition-all cursor-pointer`}>
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-black tracking-tighter mt-1 text-main">{card.val}</p>
                            <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Engagement Tools Grid */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {[
                        {
                            title: 'Email Engagement', icon: Mail, color: 'sky',
                            stats: [{ label: 'Sent', val: '12,400' }, { label: 'Opened', val: '8,432' }, { label: 'Clicked', val: '2,180' }],
                            rate: '68%', rateLabel: 'Open Rate'
                        },
                        {
                            title: 'WhatsApp Engagement', icon: MessageSquare, color: 'emerald',
                            stats: [{ label: 'Delivered', val: '8,200' }, { label: 'Read', val: '7,740' }, { label: 'Replied', val: '1,840' }],
                            rate: '94%', rateLabel: 'Read Rate'
                        },
                        {
                            title: 'Loyalty Program', icon: Gift, color: 'rose',
                            stats: [{ label: 'Points Issued', val: '4,82,000' }, { label: 'Redeemed', val: '1,24,000' }, { label: 'Expiring Soon', val: '28,400' }],
                            rate: '₹1.24L', rateLabel: 'Redeemed Value'
                        },
                    ].map((tool, i) => (
                        <div key={i} className={`glass-panel backdrop-blur-xl border border-default rounded-3xl p-6 hover:bg-card/40 transition-all group cursor-pointer`}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl bg-${tool.color}-500/10 text-${tool.color}-400`}>
                                        <tool.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black text-main">{tool.title}</h3>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 transition-colors" />
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {tool.stats.map((s, si) => (
                                    <div key={si} className="bg-card rounded-xl p-3 text-center">
                                        <p className="text-sm font-black text-main">{s.val}</p>
                                        <p className="text-[9px] font-black text-secondary uppercase tracking-widest mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className={`flex items-center justify-between px-4 py-3 bg-${tool.color}-500/5 border border-${tool.color}-500/20 rounded-xl`}>
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">{tool.rateLabel}</span>
                                <span className={`text-lg font-black text-${tool.color}-400`}>{tool.rate}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Feedback Table */}
                <div className="flex-1 glass-panel backdrop-blur-xl border border-default rounded-3xl flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-default flex justify-between items-center bg-card">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400" /> Recent Customer Feedback
                        </h3>
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                <input type="text" placeholder="Search feedback..." className="w-60 bg-input border border-default rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-rose-500 transition-colors text-main placeholder:text-slate-600" />
                            </div>
                            <button className="h-9 px-4 bg-card hover:bg-card border border-default rounded-xl text-xs font-bold text-main flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5" /> Filter
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    {['Customer', 'Channel', 'Rating', 'Feedback', 'Date', 'Sentiment', 'Actions'].map(h => (
                                        <th key={h} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default ${h === 'Rating' || h === 'Sentiment' || h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {[
                                    { customer: 'Rahul Nair', channel: 'WhatsApp', rating: 5, feedback: 'Excellent service, delivery was on time!', date: 'Oct 18, 2026', sentiment: 'Positive', color: 'emerald' },
                                    { customer: 'Anita Joshi', channel: 'Email', rating: 4, feedback: 'Good product but packaging could improve.', date: 'Oct 17, 2026', sentiment: 'Positive', color: 'emerald' },
                                    { customer: 'Mohan Das', channel: 'SMS', rating: 2, feedback: 'Delayed delivery, very disappointing.', date: 'Oct 16, 2026', sentiment: 'Negative', color: 'rose' },
                                    { customer: 'Divya Menon', channel: 'WhatsApp', rating: 5, feedback: 'Best quality I have seen. Will order again.', date: 'Oct 15, 2026', sentiment: 'Positive', color: 'emerald' },
                                    { customer: 'Suresh Kumar', channel: 'Email', rating: 3, feedback: 'Average experience. Support was slow.', date: 'Oct 14, 2026', sentiment: 'Neutral', color: 'amber' },
                                ].map((fb, idx) => (
                                    <tr key={idx} className="hover:bg-card/30 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-black text-xs">{fb.customer.split(' ').map(n => n[0]).join('')}</div>
                                                <span className="text-sm font-bold text-main">{fb.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4"><span className="text-xs font-bold text-muted">{fb.channel}</span></td>
                                        <td className="px-8 py-4"><div className="flex justify-center gap-0.5">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className={`w-3.5 h-3.5 ${s < fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />)}</div></td>
                                        <td className="px-8 py-4"><p className="text-sm text-muted max-w-xs truncate">{fb.feedback}</p></td>
                                        <td className="px-8 py-4"><span className="text-sm font-bold text-muted">{fb.date}</span></td>
                                        <td className="px-8 py-4"><div className="flex justify-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-${fb.color}-500/10 text-${fb.color}-400 border-${fb.color}-500/20`}>{fb.sentiment}</span></div></td>
                                        <td className="px-8 py-4"><div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-muted hover:text-rose-400 bg-card hover:bg-card rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomerEngagementMockUI;
