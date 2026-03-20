import React, { useState } from 'react';
import {
    MessageSquare,
    Star,
    TrendingUp,
    Users,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Clock,
    Zap,
    Search,
    Filter,
    Settings,
    Plus,
    LayoutDashboard,
    Smartphone,
    Mail,
    Globe,
    ThumbsUp,
    ThumbsDown,
    Flag,
    ChevronRight,
    ArrowRight,
    MoreHorizontal,
    Smile,
    Frown,
    Meh,
    CreditCard,
    Image as ImageIcon
} from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';

const FeedbackEngagement: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'STREAM' | 'ESCALATIONS' | 'BENCHMARKS'>('OVERVIEW');

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none italic uppercase">
                            Experience <span className="text-emerald-600">Intelligence</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Analyze sentiment, protect brand reputation, and automate CX escalations with AI.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => useNavigation().navigate('GROW')}
                        className="p-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all shadow-sm"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-3 px-6 py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                        <Zap className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-fit shadow-sm">
                {(['OVERVIEW', 'STREAM', 'ESCALATIONS', 'BENCHMARKS'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveSection(tab)}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeSection === 'OVERVIEW' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* CX Pulse Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Overall NPS', value: '72', change: '+5 pts', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'CSAT Score', value: '4.8', change: 'from 2.4k users', icon: Smile, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Detractor Rate', value: '4.2%', change: '-1.2% Risk', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                            { label: 'Resolution Time', value: '1.4h', change: '92% Sla Hit', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                        ].map((kpi, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bg} dark:opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
                                <kpi.icon className={`w-8 h-8 ${kpi.color} mb-4 relative z-10`} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">{kpi.label}</p>
                                <h3 className="text-3xl font-black mb-1 relative z-10">{kpi.value}</h3>
                                <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 relative z-10">{kpi.change}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Sentiment Heatmap */}
                        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black italic uppercase tracking-tight">Sentiment Category Heatmap</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Positive</span>
                                    <span className="w-3 h-3 bg-rose-500 rounded-full ml-2" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Negative</span>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { label: 'Staff Behavior', score: 88, issues: 12 },
                                    { label: 'Product Quality', score: 72, issues: 45 },
                                    { label: 'Store Pricing', score: 64, issues: 68 },
                                    { label: 'Order Delay', score: 42, issues: 94 },
                                    { label: 'Cleanliness', score: 94, issues: 4 }
                                ].map((row, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <p className="text-sm font-black uppercase tracking-tight italic">{row.label}</p>
                                            <p className={`text-xs font-black ${row.score > 70 ? 'text-emerald-500' : 'text-rose-500'}`}>{row.score}% CSAT</p>
                                        </div>
                                        <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${row.score}%` }} />
                                            <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${100 - row.score}%` }} />
                                        </div>
                                        <div className="flex justify-between">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sentiment: {row.score > 80 ? 'Strongly Positive' : row.score > 60 ? 'Positive' : 'Critical'}</p>
                                            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">{row.issues} AI Identified Issues</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reputation Protection AI */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">
                            <div className="bg-slate-900 dark:bg-indigo-950 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                                <div className="flex items-center gap-2 mb-6 text-emerald-400">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Reputation Guard</h4>
                                </div>
                                <h3 className="text-xl font-black mb-6 tracking-tight leading-tight italic">Reputation Growth Opportunity</h3>
                                <div className="space-y-4">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                        <h4 className="text-2xl font-black text-emerald-400 mb-1">124</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4">Promoters Ready for Review</p>
                                        <button className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20">
                                            Send Google Review Invites
                                        </button>
                                    </div>
                                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2 italic">Detractor Alert</p>
                                        <p className="text-xs font-medium italic mb-1">1 Detractor with "Consumer Court" mention.</p>
                                        <p className="text-xs text-slate-400 font-medium italic">Route to VIP resolution immediately.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'STREAM' && (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div>
                            <h3 className="text-xl font-black italic uppercase tracking-tight">Intelligence Feed</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time multi-channel CX feed</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by keywords..."
                                    className="pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold w-64 outline-none"
                                />
                            </div>
                            <button className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-500 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {[
                            { name: 'Aditi Sharma', rating: 9, channel: 'WHATSAPP', comment: 'Loved the prompt service at the counter. Staff was very polite.', sentiment: 'POSITIVE', tags: ['STAFF'], time: '2m ago' },
                            { name: 'Vikram Malhotra', rating: 2, channel: 'KIOSK', comment: 'Wait time was too long. The store was messy near the exit.', sentiment: 'NEGATIVE', tags: ['DELAY', 'CLEANLINESS'], time: '14m ago' },
                            { name: 'Neha Kapoor', rating: 10, channel: 'POS', comment: 'Great quality products as always. Highly recommend!', sentiment: 'POSITIVE', tags: ['QUALITY'], time: '1h ago' },
                            { name: 'Rahul Khanna', rating: 5, channel: 'QR_CODE', comment: 'Pricing seems a bit high compare to others.', sentiment: 'NEUTRAL', tags: ['PRICING'], time: '3h ago' }
                        ].map((row, idx) => (
                            <div key={idx} className="p-8 hover:bg-slate-50/50 transition-colors group cursor-pointer relative overflow-hidden">
                                {row.sentiment === 'NEGATIVE' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-start gap-6">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${row.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-600' : row.sentiment === 'NEGATIVE' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-500/10 text-slate-600'}`}>
                                                {row.rating}
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">NPS</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.name}</h4>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    {row.channel === 'WHATSAPP' && <Smartphone className="w-3 h-3" />}
                                                    {row.channel === 'POS' && <CreditCard className="w-3 h-3" />}
                                                    {row.channel === 'KIOSK' && <LayoutDashboard className="w-3 h-3" />}
                                                    {row.channel === 'QR_CODE' && <Globe className="w-3 h-3" />}
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">{row.channel}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium italic text-slate-600 dark:text-slate-300 max-w-2xl mb-4 leading-relaxed">"{row.comment}"</p>
                                            <div className="flex items-center gap-2">
                                                {row.tags.map(tag => (
                                                    <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                        #{tag}
                                                    </span>
                                                ))}
                                                {row.sentiment === 'NEGATIVE' && (
                                                    <span className="px-3 py-1 bg-rose-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <Zap className="w-2.5 h-2.5" /> High Urgency
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.time}</p>
                                        <div className="flex gap-2">
                                            <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                        <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 mx-auto">
                            Load historical intelligence <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackEngagement;
