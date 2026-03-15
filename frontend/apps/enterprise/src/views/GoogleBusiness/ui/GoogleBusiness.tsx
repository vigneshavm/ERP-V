import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import {
    Globe, Phone, MapPin, Camera, Plus, Trash2, CheckCircle,
    AlertCircle, RefreshCw, ExternalLink, Share2, QrCode, Save,
    Star, Image as ImageIcon, BarChart3, Clock,
    ChevronRight, Edit3, MessageCircle, MessageSquare, Heart, Eye,
    TrendingUp, Filter, Calendar, Layout, ArrowUpRight
} from 'lucide-react';
import { syncGoogleProfile } from '../../redux';
import { GoogleReview, GooglePost, GooglePhoto, BusinessHour, Tenant } from "@/entities/session/model/core";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const GoogleBusiness: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { activeTab: globalActiveTab } = useSelector((state: RootState) => state.ui);

    const activeTenant = tenants.find((t: Tenant) => t.id === user?.tenantId);
    const gbpConfig = activeTenant?.googleBusinessConfig;

    const [isLoading, setIsLoading] = useState(false);

    const getInitialTab = () => {
        if (globalActiveTab === 'GROW_GOOGLE_REVIEWS') return 'reviews';
        if (globalActiveTab === 'GROW_GOOGLE_POSTS') return 'posts';
        if (globalActiveTab === 'GROW_GOOGLE_INSIGHTS') return 'insights';
        if (globalActiveTab === 'GROW_GOOGLE_PHOTOS') return 'photos';
        return 'profile';
    };

    const [activeTab, setActiveTab] = useState<'profile' | 'reviews' | 'posts' | 'photos' | 'insights'>(getInitialTab());

    useEffect(() => {
        const tab = getInitialTab();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
        if (tab !== activeTab) setActiveTab(tab);
    }, [globalActiveTab]);

    // Mock Data
    const mockReviews: GoogleReview[] = [
        { id: 'r1', reviewerName: 'Arun Kumar', rating: 5, comment: 'Excellent hospitality and collection! Highly recommend for weddings.', status: 'REPLIED', reply: 'Thank you Arun! We love serving you.', createdAt: '2026-01-10T10:00:00Z' },
        { id: 'r2', reviewerName: 'Priya Mani', rating: 4, comment: 'Good quality clothes, but the store was a bit crowded on weekends.', status: 'PENDING', createdAt: '2026-01-08T15:30:00Z' },
        { id: 'r3', reviewerName: 'Suresh Raina', rating: 5, comment: 'Best pricing in the city. The staff is very helpful.', status: 'REPLIED', reply: 'Glad to hear that, Suresh!', createdAt: '2026-01-05T09:20:00Z' },
    ];

    const mockPosts: GooglePost[] = [
        { id: 'p1', content: 'New Pongal Collection is live! Visit us for exclusive discounts.', type: 'OFFER', publishedAt: '2026-01-12T08:00:00Z', status: 'LIVE' },
        { id: 'p2', content: 'We are expanding! New branch opening soon in Anna Nagar.', type: 'UPDATE', publishedAt: '2026-01-10T11:00:00Z', status: 'LIVE' },
        { id: 'p3', content: 'Wedding Special Sale ending this Sunday.', type: 'EVENT', publishedAt: '2026-01-05T14:00:00Z', status: 'EXPIRED' },
    ];

    const handleSync = async () => {
        if (!user?.tenantId) return;
        setIsLoading(true);
        await dispatch(syncGoogleProfile(user.tenantId));
        setIsLoading(false);
    };

    if (!gbpConfig?.isConnected) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                    <div className="relative w-32 h-32 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/50 dark:border-slate-800/50">
                        <Globe className="w-16 h-16 text-indigo-600" />
                    </div>
                </div>
                <h2 className="text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter italic">
                    Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">Local Dominance</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-12 text-xl leading-relaxed max-w-2xl mx-auto font-medium">
                    Bridge the gap between your store and the web. Connect your Google Business Profile to orchestrate search, maps, and reviews from a single premium command center.
                </p>
                <button
                    onClick={handleSync}
                    disabled={isLoading}
                    className="px-12 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20 flex items-center gap-6"
                >
                    {isLoading ? <RefreshCw className="animate-spin w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    Initialize Connection
                </button>
            </div>
        );
    }

    const renderProfile = () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="lg:col-span-8 space-y-8">
                {/* Business Architect Card */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white dark:border-slate-800 rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/5">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-3xl font-black tracking-tight italic uppercase">Identity <span className="text-indigo-600">Architect</span></h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Configure your online presence</p>
                        </div>
                        <button className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all group">
                            <Save className="w-4 h-4 group-hover:scale-125 transition-transform" /> Sync Changes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { label: 'Business Identity', val: gbpConfig.businessName, icon: Layout },
                            { label: 'Primary Category', val: gbpConfig.category, icon: Star },
                            { label: 'Contact Line', val: gbpConfig.phone, icon: Phone },
                            { label: 'Digital Hub (URL)', val: gbpConfig.website, icon: Globe },
                        ].map((field, i) => (
                            <div key={i} className="space-y-3 group">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-500 transition-colors flex items-center gap-2">
                                    <field.icon className="w-3 h-3" /> {field.label}
                                </label>
                                <div className="relative">
                                    <input type="text" defaultValue={field.val} className="w-full p-5 bg-slate-50 dark:bg-black/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all pr-12" />
                                    <Edit3 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </div>
                        ))}
                        <div className="space-y-3 md:col-span-2 group">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-500 transition-colors flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Geographical Presence (Full Address)
                            </label>
                            <input type="text" defaultValue={gbpConfig.address} className="w-full p-5 bg-slate-50 dark:bg-black/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all" />
                        </div>
                        <div className="space-y-3 md:col-span-2 group">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-500 transition-colors flex items-center gap-2">
                                <Edit3 className="w-3 h-3" /> Brand Narrative (Description)
                            </label>
                            <textarea defaultValue={gbpConfig.description} rows={5} className="w-full p-6 bg-slate-50 dark:bg-black/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all resize-none" />
                        </div>
                    </div>
                </div>

                {/* Operations Clock */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white dark:border-slate-800 rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/5 overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
                    <h3 className="text-3xl font-black tracking-tight italic uppercase mb-10">Operations <span className="text-indigo-600">Blueprint</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DAYS.map((day) => (
                            <div key={day} className="flex items-center justify-between p-5 bg-white dark:bg-black/40 border border-slate-50 dark:border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                <span className="font-black text-slate-700 dark:text-slate-300 text-sm">{day}</span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <input type="text" defaultValue="09:00" className="w-16 text-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[10px] font-black focus:ring-1 focus:ring-indigo-500 outline-none" />
                                        <span className="text-slate-300">-</span>
                                        <input type="text" defaultValue="21:00" className="w-16 text-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[10px] font-black focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="w-10 h-5 bg-indigo-500/10 rounded-full relative p-1 cursor-pointer">
                                        <div className="absolute right-1 w-3 h-3 bg-indigo-500 rounded-full shadow-lg" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
                {/* Profile Health [Premium Glass] */}
                <div className="relative group perspective-1000">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[3rem] p-10 shadow-2xl border border-white/20 overflow-hidden transform-gpu transition-all duration-700 hover:rotate-y-2">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl animate-pulse" />
                        <h3 className="text-xl font-black mb-10 flex items-center gap-3 italic uppercase tracking-widest">
                            <TrendingUp className="w-6 h-6" /> Vital Health
                        </h3>
                        <div className="text-center mb-10">
                            <div className="relative inline-block">
                                <svg className="w-48 h-48 transform -rotate-90">
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.92} strokeDashoffset={552.92 * (1 - gbpConfig.completeness / 100)} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-out" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-6xl font-black tabular-nums">{gbpConfig.completeness}%</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100">Synchronized</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-indigo-50 leading-relaxed font-bold italic mb-8 opacity-80">
                            "Elite status profile. Ranking 42% higher than local competitors this month."
                        </p>
                        <button className="w-full py-5 bg-white text-indigo-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-xl">
                            Unlock Full Potential
                        </button>
                    </div>
                </div>

                {/* Satellite Controls */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white dark:border-slate-800 rounded-[3rem] p-8 shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 ml-2">Proprietary Controls</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { icon: Share2, label: 'Broadcast Link', color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
                            { icon: QrCode, label: 'Visual Access (QR)', color: 'text-violet-600', bg: 'bg-violet-500/10' },
                            { icon: ExternalLink, label: 'Maps Live Feed', color: 'text-fuchsia-600', bg: 'bg-fuchsia-500/10' },
                            { icon: ArrowUpRight, label: 'Ads Manager', color: 'text-amber-600', bg: 'bg-amber-500/10' }
                        ].map((item, idx) => (
                            <button key={idx} className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-white dark:bg-black/50 border border-slate-50 dark:border-slate-800 hover:border-indigo-500/30 hover:scale-[1.02] transition-all group overflow-hidden">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{item.label}</span>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReviews = () => (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <h3 className="text-6xl font-black tracking-tight italic uppercase italic">Review <span className="text-indigo-600">Architect</span></h3>
                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px]">Curate your public testimony</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                    { label: 'Reputation Score', val: '4.9', icon: Star, color: 'text-amber-500' },
                    { label: 'Total Testimonials', val: '1,280', icon: MessageSquare, color: 'text-indigo-500' },
                    { label: 'Response Pulse', val: '98%', icon: TrendingUp, color: 'text-emerald-500' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-slate-800 p-8 rounded-[2rem] text-center shadow-lg group hover:border-indigo-500/30 transition-all">
                        <div className={`w-12 h-12 ${kpi.color} bg-white dark:bg-black rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                            <kpi.icon className="w-6 h-6" />
                        </div>
                        <h4 className="text-4xl font-black mb-1">{kpi.val}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {mockReviews.map((review) => (
                    <div key={review.id} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[3rem] blur opacity-0 group-hover:opacity-10 transition duration-500" />
                        <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm transition-all">
                            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900 rounded-[2rem] flex items-center justify-center font-black text-2xl text-indigo-600 shadow-inner">
                                        {review.reviewerName.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{review.reviewerName}</h4>
                                        <div className="flex items-center justify-center md:justify-start gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200 dark:text-slate-800'}`} />
                                            ))}
                                            <span className="text-[10px] text-slate-400 ml-4 font-black italic">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${review.status === 'REPLIED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${review.status === 'REPLIED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                    {review.status}
                                </span>
                            </div>

                            <p className="text-xl font-medium text-slate-700 dark:text-slate-200 italic leading-relaxed mb-10 text-center md:text-left">
                                "{review.comment}"
                            </p>

                            {review.reply ? (
                                <div className="bg-slate-50 dark:bg-black/50 rounded-[2.5rem] p-8 border border-emerald-500/20 relative overflow-hidden group/reply">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover/reply:opacity-100 transition-opacity" />
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                            <MessageCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 italic">Official Executive Response</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-600 dark:text-slate-400 italic leading-relaxed">"{review.reply}"</p>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="relative flex-1 w-full">
                                        <textarea placeholder="Compose a world-class response..." className="w-full p-6 bg-slate-50 dark:bg-black/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[100px] resize-none" />
                                        <MessageSquare className="absolute right-6 bottom-6 w-5 h-5 text-indigo-400" />
                                    </div>
                                    <button className="whitespace-nowrap px-12 py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/30">
                                        Dispatch Reply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPosts = () => (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h3 className="text-6xl font-black tracking-tight italic uppercase">Feed <span className="text-indigo-600">Architect</span></h3>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] mt-2">Broadcast your brand essence to the world</p>
                </div>
                <button className="flex items-center gap-4 px-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all group">
                    <Plus className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> Construct New Post
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {mockPosts.map((post) => (
                    <div key={post.id} className="relative group">
                        {/* Mobile Mockup Style */}
                        <div className="absolute inset-0 bg-indigo-500 rounded-[3.5rem] blur-3xl opacity-0 group-hover:opacity-10 transition-all duration-1000" />
                        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:-translate-y-4">
                            <div className="h-64 bg-gradient-to-br from-indigo-100 to-fuchsia-100 dark:from-indigo-950 dark:to-fuchsia-950 relative group/photo">
                                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                    <Globe className="w-48 h-48 text-indigo-500/20" />
                                </div>
                                <div className="absolute top-6 left-6 px-5 py-2 bg-white/95 dark:bg-slate-900/95 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md">
                                    {post.type}
                                </div>
                                <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center flex-col gap-4">
                                    <button className="p-4 bg-white rounded-2xl text-indigo-600 scale-0 group-hover/photo:scale-100 transition-transform duration-500 delay-100"><Eye className="w-6 h-6" /></button>
                                    <span className="text-white font-black text-[10px] uppercase tracking-widest">Preview Live Feed</span>
                                </div>
                            </div>
                            <div className="p-10 space-y-6">
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-[1.4] italic">"{post.content}"</p>
                                <div className="flex items-center justify-between pt-8 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${post.status === 'LIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} />
                                        <span className={`text-[11px] font-black italic tracking-widest uppercase ${post.status === 'LIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {post.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="flex items-center gap-2 text-[11px] font-black text-slate-400"><Eye className="w-4 h-4" /> 1.2k</span>
                                        <span className="flex items-center gap-2 text-[11px] font-black text-rose-500"><Heart className="w-4 h-4 fill-rose-500" /> 84</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderInsights = () => (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h3 className="text-6xl font-black tracking-tight italic uppercase italic">Search <span className="text-indigo-600">Intelligence</span></h3>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] mt-2">Neural mapping of customer connectivity</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-2 rounded-[2rem] border border-white dark:border-slate-800 shadow-xl flex gap-2">
                    {['7D', '30D', '90D', '1Y'].map((range) => (
                        <button key={range} className={`w-14 h-14 rounded-2xl text-[10px] font-black uppercase transition-all ${range === '30D' ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'text-slate-400 hover:bg-slate-100'}`}>
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Elite Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {[
                    { label: 'Satellite Reach', value: '42,520', unit: 'VIEWS', icon: MapPin, color: 'from-blue-500 to-indigo-600' },
                    { label: 'Discovery Engine', value: '18,240', unit: 'SEARCHES', icon: Globe, color: 'from-indigo-600 to-violet-700' },
                    { label: 'Navigational Flow', value: '1,420', unit: 'DIRECTS', icon: TrendingUp, color: 'from-violet-700 to-fuchsia-700' },
                    { label: 'Direct Conversion', value: '384', unit: 'CALLS', icon: Phone, color: 'from-fuchsia-700 to-rose-700' }
                ].map((kpi, i) => (
                    <div key={i} className="group relative">
                        <div className={`absolute -inset-1 bg-gradient-to-br ${kpi.color} rounded-[3rem] blur-xl opacity-0 group-hover:opacity-20 transition-all duration-700`} />
                        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 p-10 rounded-[3rem] shadow-sm overflow-hidden text-center">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-12 -mt-12" />
                            <div className={`w-16 h-16 bg-gradient-to-br ${kpi.color} rounded-2xl mx-auto mb-8 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 group-hover:rotate-12 transition-transform`}>
                                <kpi.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-5xl font-black mb-2 tabular-nums tracking-tighter italic">{kpi.value}</h3>
                            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-600 flex flex-col items-center gap-2">
                                {kpi.label}
                                <span className="text-slate-400 font-bold">{kpi.unit}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Neural Chart [Premium] */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[4rem] blur-[80px] opacity-5 group-hover:opacity-15 transition-opacity duration-1000" />
                <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[4rem] p-16 shadow-2xl overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px]" />
                    <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-8">
                        <div>
                            <h4 className="text-4xl font-black italic uppercase tracking-tight">Performance <span className="text-indigo-600">Trajectory</span></h4>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">Neural growth mapping across 12 cycles</p>
                        </div>
                        <div className="flex gap-10">
                            {[
                                { label: 'Direct Impact', color: 'bg-indigo-500' },
                                { label: 'Discovery Engine', color: 'bg-emerald-500' },
                            ].map((l, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 ${l.color} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-[400px] flex items-end justify-between gap-6 relative z-10">
                        {[35, 45, 30, 60, 40, 50, 75, 45, 65, 55, 85, 40].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col gap-4 items-center group/bar perspective-1000">
                                <div className="relative w-full h-full flex flex-col justify-end">
                                    <div style={{ height: `${h * 0.7}%` }} className="absolute bottom-0 w-full bg-indigo-500/20 rounded-t-[1.5rem] group-hover/bar:bg-indigo-500/30 transition-all duration-700" />
                                    <div style={{ height: `${h * 0.4}%` }} className="relative w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-[1.5rem] group-hover/bar:scale-y-110 group-hover/bar:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-700 origin-bottom" />
                                    <div style={{ height: `${h * 0.2}%` }} className="absolute bottom-0 w-full bg-emerald-500/60 blur-[1px] rounded-t-[1.5rem] translate-y-[-2px] group-hover/bar:h-[30%] transition-all duration-500" />
                                </div>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">CYCLE {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-[#020617] relative">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-20 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/20 blur-[120px] rounded-full animate-float delay-1000" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-12 space-y-12">
                {/* Immersive Header */}
                <header className="flex flex-col xl:flex-row items-center justify-between gap-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/50 dark:border-slate-800/50 shadow-2xl relative overflow-hidden group/header">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent via-indigo-500/5 to-fuchsia-500/5 pointer-events-none" />

                    <div className="space-y-6 relative z-10 text-center xl:text-left">
                        <div className="flex items-center justify-center xl:justify-start gap-4">
                            <div className="px-5 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30 animate-pulse">
                                Live Connection
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <RefreshCw className="w-3 h-3" /> Auto-Sync Active
                            </span>
                        </div>
                        <h1 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">
                            COMMAND <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 group-hover/header:tracking-widest transition-all duration-1000">CENTER</span>
                        </h1>
                        <div className="flex items-center justify-center xl:justify-start gap-3">
                            <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl group-hover/header:rotate-[360deg] transition-transform duration-1000">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-black italic leading-none">{gbpConfig.businessName}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Authorized Google Business Managed Entity</p>
                            </div>
                        </div>
                    </div>

                    {/* Elite Navigation [Sticky Style] */}
                    <nav className="flex items-center gap-4 bg-white/70 dark:bg-black/40 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-2xl overflow-x-auto max-w-full no-scrollbar relative z-10">
                        {[
                            { id: 'profile', icon: Layout, label: 'Architect' },
                            { id: 'reviews', icon: Star, label: 'Reputation' },
                            { id: 'posts', icon: Edit3, label: 'Broadcast' },
                            { id: 'photos', icon: Camera, label: 'Portfolio' },
                            { id: 'insights', icon: BarChart3, label: 'Intelligence' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-4 px-8 py-5 rounded-2xl transition-all duration-500 whitespace-nowrap group relative ${activeTab === tab.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'animate-bounce' : 'group-hover:scale-125 transition-transform'}`} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                                {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full blur-[2px]" />}
                            </button>
                        ))}
                    </nav>
                </header>

                <div className="relative min-h-[800px] z-10">
                    {activeTab === 'profile' && renderProfile()}
                    {activeTab === 'reviews' && renderReviews()}
                    {activeTab === 'posts' && renderPosts()}
                    {activeTab === 'photos' && <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-12">
                        <div className="flex items-center justify-between">
                            <h3 className="text-6xl font-black tracking-tight italic uppercase">Portfolio <span className="text-indigo-600">Grid</span></h3>
                            <button className="px-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-4 hover:scale-105 transition-all">
                                <Camera className="w-5 h-5" /> Import Assets
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-square bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-6 group cursor-pointer hover:border-indigo-500/50 hover:bg-slate-50 transition-all">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-black rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                        <Plus className="w-8 h-8 text-slate-300 group-hover:text-indigo-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Empty Asset Cell</span>
                                </div>
                            ))}
                        </div>
                    </div>}
                    {activeTab === 'insights' && renderInsights()}
                </div>
            </div>

            {/* Custom Styles Injection */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-30px) scale(1.1); }
                }
                .animate-float { animation: float 15s infinite ease-in-out; }
                .perspective-1000 { perspective: 1000px; }
                .rotate-y-2:hover { transform: rotateY(5deg) scale(1.02); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default GoogleBusiness;
