import React from 'react';
import { Zap, Store, BarChart2, Globe, TrendingUp, Star, ShoppingBag, Mail, MessageSquare, Share2, ArrowRight, Users, Package } from 'lucide-react';

const GrowMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-lime-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-15%] left-[15%] w-[55%] h-[55%] bg-lime-700/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-5%] right-[0%] w-[40%] h-[40%] bg-emerald-700/10 rounded-full blur-[140px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                            Grow Platform
                            <span className="px-3 py-1 bg-lime-500/10 border border-lime-500/20 text-lime-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Commerce Engine
                            </span>
                        </h1>
                        <p className="text-sm text-secondary mt-1 font-medium">Online store, marketing intelligence, and customer growth hub.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-card hover:bg-card text-main font-bold text-sm tracking-wide rounded-xl transition-all border border-default flex items-center gap-2">
                            <Globe className="w-4 h-4" /> View Storefront
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-main font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Launch Campaign
                        </button>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Online Orders (MTD)', val: '284', sub: '+38% vs last month', icon: ShoppingBag, color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/30' },
                        { label: 'Store Revenue', val: '₹12.4L', sub: 'Avg ₹4,366 / order', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                        { label: 'Active Campaigns', val: '7', sub: '3 email, 4 WhatsApp', icon: Mail, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
                        { label: 'Google Rating', val: '4.8 ★', sub: '1,240 reviews', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                    ].map((card, i) => (
                        <div key={i} className={`glass-panel backdrop-blur-md rounded-2xl p-6 border ${card.border} group hover:bg-card/80 transition-all cursor-pointer`}>
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}><card.icon className="w-5 h-5" /></div>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-black tracking-tighter mt-1 text-main">{card.val}</p>
                            <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Channel Hub Grid */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {[
                        {
                            title: 'Online Store', icon: Store, color: 'lime',
                            stats: [{ l: 'Products Synced', v: '840' }, { l: 'Pending Orders', v: '12' }, { l: 'Abandoned Carts', v: '24' }],
                            cta: 'Manage Store'
                        },
                        {
                            title: 'Marketing Hub', icon: BarChart2, color: 'sky',
                            stats: [{ l: 'Campaigns Live', v: '7' }, { l: 'Emails Sent', v: '12.4K' }, { l: 'Avg Open Rate', v: '68%' }],
                            cta: 'View Campaigns'
                        },
                        {
                            title: 'Google Business', icon: Globe, color: 'amber',
                            stats: [{ l: 'Profile Views', v: '8,240' }, { l: 'Direction Clicks', v: '1,840' }, { l: 'New Reviews', v: '42' }],
                            cta: 'Manage Profile'
                        },
                    ].map((ch, i) => (
                        <div key={i} className={`glass-panel backdrop-blur-xl border border-default rounded-3xl p-6 hover:bg-card/40 transition-all group cursor-pointer`}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl bg-${ch.color}-500/10 text-${ch.color}-400`}><ch.icon className="w-5 h-5" /></div>
                                    <h3 className="text-sm font-black text-main">{ch.title}</h3>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-lime-400 transition-colors" />
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-5">
                                {ch.stats.map((s, si) => (
                                    <div key={si} className="bg-card rounded-xl p-3 text-center">
                                        <p className="text-sm font-black text-main">{s.v}</p>
                                        <p className="text-[9px] font-black text-secondary uppercase tracking-widest mt-0.5">{s.l}</p>
                                    </div>
                                ))}
                            </div>
                            <button className={`w-full py-2.5 bg-${ch.color}-500/10 hover:bg-${ch.color}-500/20 border border-${ch.color}-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-${ch.color}-400 transition-all`}>{ch.cta}</button>
                        </div>
                    ))}
                </div>

                {/* Engagement Channels */}
                <div className="flex gap-6">
                    {[
                        { title: 'WhatsApp Marketing', icon: MessageSquare, color: 'emerald', delivered: '8,200', read: '7,740', reply: '1,840' },
                        { title: 'Social Media', icon: Share2, color: 'pink', delivered: '—', read: 'Instagram · Facebook', reply: '38 posts scheduled' },
                        { title: 'Customer Segments', icon: Users, color: 'violet', delivered: '12', read: '3,840 customers', reply: '6 auto-rules active' },
                        { title: 'Product Catalog', icon: Package, color: 'amber', delivered: '840', read: '24 out of stock', reply: '12 pending sync' },
                    ].map((ch, i) => (
                        <div key={i} className="flex-1 glass-panel backdrop-blur-xl border border-default rounded-3xl p-5 hover:bg-card/40 transition-all cursor-pointer group">
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`p-2 rounded-xl bg-${ch.color}-500/10 text-${ch.color}-400`}><ch.icon className="w-4 h-4" /></div>
                                <h3 className="text-xs font-black text-main uppercase tracking-wide">{ch.title}</h3>
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {[ch.delivered, ch.read, ch.reply].map((val, vi) => (
                                    <div key={vi} className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{['Primary', 'Secondary', 'Action'][vi]}</span>
                                        <span className="text-xs font-bold text-main">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default GrowMockUI;
