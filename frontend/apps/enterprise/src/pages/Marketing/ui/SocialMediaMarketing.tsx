import React, { useState } from 'react';
import {
    Share2,
    Instagram,
    Facebook,
    Linkedin,
    TrendingUp,
    Users,
    Zap,
    Sparkles,
    Calendar,
    BarChart3,
    ArrowRight,
    Search,
    Filter,
    MoreHorizontal,
    Plus,
    LayoutDashboard,
    MessageCircle,
    Heart,
    Eye,
    Globe,
    Clock,
    Hash
} from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useNavigation } from '@/app/providers/NavigationContext';
import Layout, { PageShell } from "@/shared/ui/Layout";

const SocialMediaMarketing: React.FC = () => {
    const { navigate } = useNavigation();
    const [activePlatform, setActivePlatform] = useState<'ALL' | 'IG' | 'FB' | 'LI'>('ALL');

    const socialKpis = [
        { platform: 'Instagram', reach: '42.5K', engagement: '4.8%', followers: '12.2K', color: 'text-pink-500', icon: Instagram, trend: '+12%' },
        { platform: 'Facebook', reach: '28.1K', engagement: '2.4%', followers: '8.4K', color: 'text-blue-600', icon: Facebook, trend: '+5%' },
        { platform: 'LinkedIn', reach: '12.4K', engagement: '6.2%', followers: '3.1K', color: 'text-blue-700', icon: Linkedin, trend: '+8%' }
    ];

    const recentPosts = [
        {
            id: 'p1',
            platform: 'Instagram',
            type: 'Reel',
            caption: 'Our summer collection is finally here! ☀️ #fashion #summer2026',
            stats: { likes: '1.2K', comments: '42', reach: '18K' },
            score: 92,
            preview: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop'
        },
        {
            id: 'p2',
            platform: 'Facebook',
            type: 'Image',
            caption: 'The weekend flash sale starts in 3 hours. Tag a friend! 🏷️',
            stats: { likes: '840', comments: '124', reach: '12K' },
            score: 85,
            preview: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop'
        },
        {
            id: 'p3',
            platform: 'LinkedIn',
            type: 'Article',
            caption: 'How we scaled our sustainable manufacturing process. 🌿',
            stats: { likes: '310', comments: '18', reach: '5.4K' },
            score: 88,
            preview: 'https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?w=400&h=400&fit=crop'
        }
    ];

    return (
        <Layout>
            <PageShell>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tighter italic leading-none">
                        Social <span className="text-indigo-600 dark:text-indigo-400">Media</span>
                    </h1>
                    <p className="text-muted dark:text-muted mt-2 font-medium">Manage and optimize your global social presence in one unified command center.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Create Post
                    </button>
                    <button
                        onClick={() => navigate('DASHBOARD' as any)}
                        className="flex items-center gap-2 px-4 py-4 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-slate-700 text-secondary dark:text-slate-200 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Platform Selection & Global Reach */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] p-1.5 rounded-3xl border border-default dark:border-default">
                    {['ALL', 'IG', 'FB', 'LI'].map((plt) => (
                        <button
                            key={plt}
                            onClick={() => setActivePlatform(plt as any)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activePlatform === plt ? 'bg-white dark:bg-[var(--erp-card)] text-indigo-600 shadow-md border border-default dark:border-default' : 'text-muted hover:text-main dark:hover:text-main'}`}
                        >
                            {plt === 'ALL' ? 'Unified' : plt}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-6 px-8 py-3 bg-white dark:bg-[var(--erp-card)] rounded-3xl border border-default dark:border-default shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Total Reach</p>
                            <p className="text-sm font-black text-main">83,024</p>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-[var(--erp-bg-sunken)] dark:bg-slate-700 hidden sm:block" />
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-full flex items-center justify-center">
                            <Heart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Total Likes</p>
                            <p className="text-sm font-black text-main">12,450</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {socialKpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-[var(--erp-card)] p-8 rounded-[2.5rem] border border-default dark:border-default shadow-sm relative group overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 bg-current ${kpi.color}`} />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 ${kpi.color}`}>
                                    <kpi.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">{kpi.trend}</span>
                            </div>

                            <div>
                                <h3 className="text-xl font-black">{kpi.platform}</h3>
                                <p className="text-xs font-bold text-muted italic">Global Performance Index</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50 dark:border-default/50">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Reach</p>
                                    <p className="text-sm font-black">{kpi.reach}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Eng.</p>
                                    <p className="text-sm font-black text-indigo-600">{kpi.engagement}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Followers</p>
                                    <p className="text-sm font-black">{kpi.followers}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Content Intelligence Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[var(--erp-card)] rounded-[3rem] border border-default dark:border-default shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-default dark:border-default flex justify-between items-center bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-bg)]/50">
                            <h3 className="text-xl font-black italic tracking-tight">Content Intelligence</h3>
                            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700">View Gallery</button>
                        </div>

                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {recentPosts.map((post) => (
                                <div key={post.id} className="p-8 flex items-start gap-6 group hover:bg-[var(--erp-bg-sunken)]/30 dark:hover:bg-[var(--erp-bg)]/20 transition-all">
                                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-default dark:border-default shrink-0">
                                        <img src={post.preview} alt="Post preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-[var(--erp-bg)]/90 rounded-lg shadow-sm">
                                            {post.platform === 'Instagram' && <Instagram className="w-3 h-3 text-pink-500" />}
                                            {post.platform === 'Facebook' && <Facebook className="w-3 h-3 text-blue-600" />}
                                            {post.platform === 'LinkedIn' && <Linkedin className="w-3 h-3 text-blue-700" />}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2 py-0.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-[9px] font-black uppercase tracking-widest rounded-full">{post.type}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-muted">
                                                    <Heart className="w-3 h-3" /> <span className="text-[10px] font-bold">{post.stats.likes}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted">
                                                    <MessageCircle className="w-3 h-3" /> <span className="text-[10px] font-bold">{post.stats.comments}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-secondary dark:text-muted line-clamp-2 italic">"{post.caption}"</p>
                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex-1 h-1.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${post.score > 90 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${post.score}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-main">{post.score}% AI Score</span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col justify-between h-24">
                                        <button className="p-2 text-muted hover:text-indigo-600 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Resonate <Zap className="w-3 h-3 fill-current" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Automation & Insights Sidebar */}
                <div className="space-y-8">
                    {/* AI Post Generator */}
                    <div className="bg-[var(--erp-bg)] dark:bg-[var(--erp-bg)] rounded-[2.5rem] p-8 text-main shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-indigo-400 shadow-indigo-500/50" />
                            <h4 className="text-xs font-black uppercase tracking-widest">AI Content Lab</h4>
                        </div>
                        <h3 className="text-xl font-black mb-6 tracking-tight leading-tight italic">Generate Trending Captions</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="p-4 bg-[var(--erp-bg-sunken)] border border-default rounded-2xl cursor-pointer hover:bg-white/10 transition-colors group/ai">
                                <p className="text-[11px] font-medium text-muted italic mb-3 leading-relaxed">"Discover the secrets behind our eco-friendly process. Hand-stitched with love. 🌿 #SustainableFashion"</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        <div className="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center"><Instagram className="w-2.5 h-2.5 text-pink-500" /></div>
                                        <div className="w-4 h-4 rounded-full bg-blue-600/20 flex items-center justify-center"><Facebook className="w-2.5 h-2.5 text-blue-600" /></div>
                                    </div>
                                    <button className="text-[9px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1 group-hover/ai:translate-x-1 transition-transform">Use Caption <ArrowRight className="w-3 h-3" /></button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--erp-bg-sunken)] border border-default rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted">
                                <Hash className="w-3.5 h-3.5" /> #Trending: #Summer2026 #EcoLuxury
                            </div>
                        </div>
                        <button className="w-full mt-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[var(--erp-bg-sunken)] transition-all shadow-lg active:scale-95">
                            New Magic Draft
                        </button>
                    </div>

                    {/* Ad Performance Tracker */}
                    <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] p-8 border border-default dark:border-default shadow-sm overflow-hidden relative group">
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-6">Paid Campaign ROI</h4>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-black mb-1">8.4x</p>
                                    <p className="text-[10px] font-bold text-emerald-500 underline decoration-dash underline-offset-4 cursor-help">Avg. ROAS Index</p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-slate-100 dark:text-secondary" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-muted">Monthly Ad Spend</span>
                                    <span>$2,450 / $5,000</span>
                                </div>
                                <div className="h-2 w-full bg-[var(--erp-bg-sunken)] dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full w-[49%]" />
                                </div>
                                <p className="text-[10px] text-muted italic">Recommended: Increase LI budget by 12% next month.</p>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Posts/Scheduler */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] p-8 border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 italic">Upcoming Content</h4>
                            <Calendar className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: "Customer Spotlight", time: "Tomorrow, 10:00 AM", platform: "IG" },
                                { title: "New Blog Release", time: "Fri, Jan 23", platform: "LI" }
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 bg-white dark:bg-[var(--erp-card)] rounded-xl flex items-center justify-center font-black text-[10px] text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                                        {s.platform}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black">{s.title}</p>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">{s.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3.5 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-main transition-all shadow-sm">
                            Manage Full Scheduler
                        </button>
                    </div>
                </div>
            </div>
            </div>
            </PageShell>
        </Layout>
    );
};

export default SocialMediaMarketing;

