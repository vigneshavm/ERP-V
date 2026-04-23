import React from 'react';
import { Megaphone, Plus, Search, Filter, Mail, MessageSquare, Share2, Tag, Zap, BarChart2, Users, ArrowRight, MoreHorizontal } from 'lucide-react';

const MarketingMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#040810] text-slate-200 font-sans selection:bg-pink-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-15%] right-[5%] w-[50%] h-[50%] bg-pink-700/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-5%] left-[10%] w-[40%] h-[40%] bg-orange-700/10 rounded-full blur-[140px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            Marketing Command
                            <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Growth Engine
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Orchestrate campaigns across email, WhatsApp, SMS, and social channels.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm tracking-wide rounded-xl transition-all border border-slate-700 flex items-center gap-2">
                            <BarChart2 className="w-4 h-4" /> Analytics
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Campaign
                        </button>
                    </div>
                </header>

                {/* Channel Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Email Campaigns', val: '24', sub: '68% avg open rate', icon: Mail, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
                        { label: 'WhatsApp Blasts', val: '11', sub: '94% delivery rate', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                        { label: 'Social Scheduled', val: '38', sub: 'Next: Today 6 PM', icon: Share2, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
                        { label: 'Active Coupons', val: '7', sub: '₹2.4L redeemed', icon: Tag, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                    ].map((card, i) => (
                        <div key={i} className={`bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border ${card.border} group hover:bg-slate-800/80 transition-all cursor-pointer`}>
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-black tracking-tighter mt-1 text-white">{card.val}</p>
                            <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Campaigns Table */}
                <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-800/60 flex justify-between items-center bg-black/20">
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input type="text" placeholder="Search campaigns..." className="w-72 bg-black/50 border border-slate-700/50 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-pink-500 transition-colors text-slate-200 placeholder:text-slate-600" />
                            </div>
                            <button className="h-10 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Email', 'WhatsApp', 'SMS', 'Social'].map((tab, idx) => (
                                <button key={tab} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${idx === 0 ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900/80 sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    {['Campaign', 'Channel', 'Audience', 'Sent', 'Open Rate', 'Status', 'Actions'].map(h => (
                                        <th key={h} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/60 ${h === 'Actions' ? 'text-right' : h === 'Open Rate' || h === 'Status' ? 'text-center' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {[
                                    { name: 'Diwali Mega Sale 2026', channel: 'Email', audience: '12,400', sent: '12,180', rate: '71%', status: 'Live', color: 'emerald', chIcon: Mail },
                                    { name: 'New Arrivals — Oct Drop', channel: 'WhatsApp', audience: '8,200', sent: '8,200', rate: '89%', status: 'Completed', color: 'sky', chIcon: MessageSquare },
                                    { name: 'Loyalty Reward Reminder', channel: 'SMS', audience: '5,500', sent: '5,490', rate: '—', status: 'Completed', color: 'sky', chIcon: Megaphone },
                                    { name: 'Instagram — Weekend Flash', channel: 'Social', audience: '—', sent: '—', rate: '—', status: 'Scheduled', color: 'amber', chIcon: Share2 },
                                    { name: 'Re-engagement: Dormant', channel: 'Email', audience: '3,100', sent: '0', rate: '—', status: 'Draft', color: 'slate', chIcon: Mail },
                                ].map((c, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{c.name}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <c.chIcon className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-400">{c.channel}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5"><div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-500" /><span className="text-sm font-bold text-slate-300">{c.audience}</span></div></td>
                                        <td className="px-8 py-5"><span className="font-mono text-sm font-bold text-white">{c.sent}</span></td>
                                        <td className="px-8 py-5 text-center"><span className="font-mono text-sm font-bold text-pink-400">{c.rate}</span></td>
                                        <td className="px-8 py-5"><div className="flex justify-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-${c.color}-500/10 text-${c.color}-400 border-${c.color}-500/20`}>{c.status}</span></div></td>
                                        <td className="px-8 py-5"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-pink-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"><ArrowRight className="w-4 h-4" /></button>
                                            <button className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
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

export default MarketingMockUI;
