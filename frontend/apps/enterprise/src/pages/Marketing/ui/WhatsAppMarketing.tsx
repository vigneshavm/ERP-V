import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Send, Eye, Zap, Plus, LayoutDashboard,
    Smartphone, ShieldCheck, Filter, RefreshCw, Sparkles,
    ArrowRight, Users, ChevronLeft, Loader2, Target,
    TrendingUp, BarChart3, Layers, Shield, Copy, ArrowUpRight,
    Star, MessageCircle, Heart, AlertTriangle, Calendar,
    Tag, MousePointer2, Percent, Globe
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import { useUiStore } from "@/shared/lib/store/uiStore";
import { WhatsAppService } from "@/shared/api/whatsappService";
import { Tenant, Integrations } from "@/entities/session/model/core";

// Helper to safely access tenant from state
const useCurrentTenant = (): Tenant | null => {
    // 
    return useSelector((state: RootState) => {
        if (state.auth?.user?.tenantId) {
            return state.tenant?.tenants?.find((t: Tenant) => t.id === state.auth.user!.tenantId) || null;
        }
        return null;
    });
};

const WhatsAppMarketing: React.FC = () => {
    const currentTenant = useCurrentTenant();
    const integrations = currentTenant?.integrations;

    // View State
    const [activeTab, setActiveTabLocal] = useState<'campaigns' | 'audience' | 'templates' | 'coupons'>('campaigns');
    const [viewMode, setViewMode] = useState<'manager' | 'create'>('manager');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Mock Data
    const mockCampaigns: { id: string; name: string; status: string; date: string; recipients: number; revenue: string; conversion: string }[] = [
        { id: 'c1', name: 'Summer Blast 2026', status: 'COMPLETED', date: '2026-05-12', recipients: 4200, revenue: '₹4.2L', conversion: '4.2%' },
        { id: 'c2', name: 'Loyalty Tier Upgrade', status: 'COMPLETED', date: '2026-05-10', recipients: 1205, revenue: '₹1.8L', conversion: '8.1%' },
        { id: 'c3', name: 'Weekend Flash Sale', status: 'SCHEDULED', date: '2026-05-15', recipients: 10000, revenue: '---', conversion: '---' },
    ];

    useEffect(() => {
        const checkConnection = async () => {
            if (integrations && WhatsAppService.isConfigured(integrations)) {
                const status = await WhatsAppService.verifyConnection(integrations);
                setIsConnected(status.success);
            }
        };
        checkConnection();
    }, [integrations]);

    const renderCampaigns = () => (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Campaign Revenue', val: '₹12.4L', trend: '+18%', icon: DollarSign2 },
                    { label: 'Avg. Conversion', val: '5.2%', trend: '+0.8%', icon: Target },
                    { label: 'Messages Sent', val: '42.8K', trend: 'Monthly', icon: Send },
                    { label: 'Cost/Message', val: '₹0.48', trend: 'Stable', icon: Zap }
                ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{kpi.label}</p>
                            <h3 className="text-3xl font-black italic">{kpi.val}</h3>
                            <span className="text-[10px] font-bold text-emerald-500">{kpi.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Campaign Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-black italic uppercase">Broadcast <span className="text-indigo-600">Engine</span></h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage your one-to-many marketing blasts</p>
                    </div>
                    <button
                        onClick={() => setViewMode('create')}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                    >
                        Create Campaign
                    </button>
                </div>

                <div className="space-y-4">
                    {mockCampaigns.map(camp => (
                        <div key={camp.id} className="p-6 bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-between group hover:border-indigo-500/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-black italic uppercase text-slate-900 dark:text-white">{camp.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{camp.date} • {camp.recipients.toLocaleString()} Target</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-12 text-right">
                                <div>
                                    <p className="text-lg font-black italic">{camp.revenue}</p>
                                    <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase">Revenue</p>
                                </div>
                                <div>
                                    <p className="text-lg font-black italic text-emerald-600">{camp.conversion}</p>
                                    <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase">Conversion</p>
                                </div>
                                <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] ${camp.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600 animate-pulse'}`}>
                                    {camp.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAudience = () => (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
                <h3 className="text-4xl font-black italic uppercase italic mb-4">Audience <span className="text-indigo-400">Architect</span></h3>
                <p className="text-slate-400 font-bold italic mb-12">Target your customers with surgical precision based on their behavior.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: 'Location Filter', items: ['Mumbai Store', 'Pune Outlet', 'Bangalore Hub'], icon: Globe },
                        { title: 'Spending Tiers', items: ['VIP (>₹50k)', 'High (>₹20k)', 'New Visitors'], icon: Tag },
                        { title: 'Last Purchase', items: ['30 Days', '90 Days', 'Inactive'], icon: Calendar },
                        { title: 'Categories', items: ['Menswear', 'Footwear', 'Accessories'], icon: Layers }
                    ].map((filter, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4 mb-6">
                                <filter.icon className="w-5 h-5 text-indigo-400" />
                                <h4 className="font-black italic uppercase tracking-widest">{filter.title}</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {filter.items.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-white/10 text-[10px] font-bold rounded-lg">{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCoupons = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-700">
            {[
                { code: 'SUMMER20', title: 'Seasonal 20%', stats: '842 Used', roi: '12.4x', color: 'bg-indigo-600' },
                { code: 'LOYAL500', title: 'VIP Reward', stats: '150 Used', roi: '8.2x', color: 'bg-emerald-600' },
                { code: 'BOGO2026', title: 'Weekend Blast', stats: '2042 Claims', roi: '15.8x', color: 'bg-rose-600' }
            ].map((coupon, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl group border-b-[8px] border-b-indigo-500/10 hover:border-b-indigo-500 transition-all">
                    <div className={`${coupon.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl`}>
                        <Percent className="w-8 h-8" />
                    </div>
                    <div className="space-y-2 mb-8 text-center">
                        <p className="text-3xl font-black tracking-tighter uppercase">{coupon.code}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{coupon.title}</p>
                    </div>
                    <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-sm font-black italic">{coupon.stats}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Redemption</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black italic text-emerald-600">{coupon.roi}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ROI Multiplier</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50/50 dark:bg-[#020617] relative">
            <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto p-12 space-y-12">
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-indigo-600/20">PART A</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" /> MARKETING MODULE UNLOCKED
                            </span>
                        </div>
                        <h1 className="text-6xl font-black italic uppercase tracking-tighter">
                            WhatsApp <span className="text-indigo-600">Marketing</span>
                        </h1>
                    </div>
                    <div className="flex bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
                        {[
                            { id: 'campaigns', label: 'Campaigns', icon: Zap },
                            { id: 'audience', label: 'Audience', icon: Users },
                            { id: 'templates', label: 'Templates', icon: Layers },
                            { id: 'coupons', label: 'Coupons', icon: Tag }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTabLocal(t.id as any)}
                                className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === t.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </header>

                <main>
                    {activeTab === 'campaigns' && renderCampaigns()}
                    {activeTab === 'audience' && renderAudience()}
                    {activeTab === 'coupons' && renderCoupons()}
                    {activeTab === 'templates' && (
                        <div className="flex flex-col items-center justify-center p-20 bg-white/50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
                            <Layers className="w-16 h-16 text-slate-200 mb-6" />
                            <h3 className="text-2xl font-black italic uppercase text-slate-400">Template Library Loading...</h3>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// Internal icon proxy
const DollarSign2 = (props: any) => <div {...props} className="text-indigo-600 font-black text-2xl">₹</div>;

export default WhatsAppMarketing;
