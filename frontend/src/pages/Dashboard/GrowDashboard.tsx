import React, { useEffect, useState } from 'react';
import { Rocket, TrendingUp, Users, ShoppingCart, ArrowRight, LayoutGrid, Sparkles, MessageSquare, Bell, Clock, Target as TargetIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from "../../redux/slices/uiSlice";
import { RootState, AppDispatch } from "../../redux/store";
import { getDashboardStats } from "../../redux/slices/reportsSlice";
import { getAllItems } from "../../redux/slices/inventorySlice";
import { googleBusinessService, GoogleBusinessProfileData } from "../../services/googleBusinessService";
import { StoreService } from "../../services/storeService";
import { WhatsAppService } from "../../services/whatsappService";

const GrowDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { lowStockItems } = useSelector((state: RootState) => state.inventory);
    const { dashboardStats } = useSelector((state: RootState) => state.reports);

    const [isLoading, setIsLoading] = useState(true);
    const [googleProfile, setGoogleProfile] = useState<GoogleBusinessProfileData | null>(null);
    const [syncStats, setSyncStats] = useState<any>(null);
    const [marketingStats, setMarketingStats] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    dispatch(getDashboardStats()),
                    dispatch(getAllItems()),
                    googleBusinessService.getProfile().then(setGoogleProfile).catch(console.error),
                    StoreService.getSyncStats({}).then(setSyncStats).catch(console.error),
                    WhatsAppService.getMarketingAnalytics({} as any).then(setMarketingStats).catch(console.error)
                ]);
            } catch (error) {
                console.error("Error fetching growth data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [dispatch]);

    // Dynamic Stats
    const stats = [
        {
            label: 'Total Online Sales',
            value: syncStats ? `₹${(syncStats.ordersSynced * 450).toLocaleString()}` : '₹0', // Estimation based on orders
            change: '+12.5%',
            target: 'Target: ₹50k',
            icon: TrendingUp,
            color: 'text-success',
            bg: 'bg-success/10'
        },
        {
            label: 'Website Visitors',
            value: googleProfile?.insights?.websiteClicks?.toLocaleString() || '0',
            change: '+18.2%',
            target: `Views: ${googleProfile?.insights?.views?.toLocaleString() || 0}`,
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            label: 'Conversion Rate',
            value: syncStats && googleProfile?.insights?.websiteClicks
                ? `${((syncStats.ordersSynced / googleProfile.insights.websiteClicks) * 100).toFixed(2)}%`
                : '0.00%',
            change: marketingStats?.conversion || '+0.8%',
            target: `ROI: ${marketingStats?.revenue || '0'}`,
            icon: ShoppingCart,
            color: 'text-purple-500',
            bg: 'bg-accent/10'
        },
    ];

    // Dynamic Alerts
    const alerts = [
        ...(googleProfile?.reviews?.slice(0, 1).map(r => ({
            title: 'Google Business Profile',
            message: `New ${r.rating}★ review from ${r.reviewer}: "${r.comment.substring(0, 40)}..."`,
            type: 'action',
            icon: MessageSquare
        })) || []),
        {
            title: 'Inventory Warning',
            message: lowStockItems.length > 0
                ? `${lowStockItems.length} items are low on stock and need replenishment.`
                : 'All online items are well-stocked.',
            type: lowStockItems.length > 0 ? 'warning' : 'insight',
            icon: Bell
        },
        {
            title: 'Campaign Insight',
            message: marketingStats
                ? `WhatsApp campaigns reaching ${marketingStats.openRate} engagement.`
                : 'Connect WhatsApp to see campaign insights.',
            type: 'insight',
            icon: Sparkles
        },
    ].slice(0, 3);

    // Fallback if no alerts
    if (alerts.length < 3) {
        alerts.push({
            title: 'System Status',
            message: syncStats ? `Last sync successful ${new Date(syncStats.lastSync).toLocaleTimeString()} ago.` : 'Initializing sync engine...',
            type: 'insight',
            icon: Rocket
        });
    }

    const milestoneProgress = syncStats ? Math.min(Math.round(((syncStats.ordersSynced * 450) / 50000) * 100), 100) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Minimal High-Impact Hero */}
            <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-10 lg:p-14 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-primary/20 text-primary">
                            <Sparkles className="w-3 h-3" /> Intelligent Growth Engine
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 leading-tight">
                            Accelerate your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Digital Commerce.</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-400 mb-10 leading-relaxed font-medium">
                            Manage online presence, automate marketing, and analyze growth with AI-driven insights from your command center.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => dispatch(setActiveTab('GROW_HUB'))}
                                className="px-10 py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                <LayoutGrid className="w-4 h-4" /> Growth Hub
                            </button>
                            <button
                                onClick={() => dispatch(setActiveTab('GROW_PERFORMANCE'))}
                                className="px-10 py-5 bg-slate-800 text-white border border-slate-700 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all flex items-center gap-3 active:scale-95"
                            >
                                Performance <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Compact Highlight Tiles */}
                    <div className="grid grid-cols-1 gap-4 w-full lg:w-72">
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 group transition-all hover:bg-white/10">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Sync Status</h4>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${syncStats?.syncStatus === 'SUCCESS' ? 'bg-success/20' : 'bg-warning/20'} flex items-center justify-center`}>
                                    <Rocket className={`w-5 h-5 ${syncStats?.syncStatus === 'SUCCESS' ? 'text-success' : 'text-warning'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-black">{syncStats ? (syncStats.syncStatus === 'SUCCESS' ? 'All Systems Operational' : 'Sync in Progress') : 'Checking status...'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                        <Clock className="w-2 h-2" /> {syncStats ? `Last Sync: ${new Date(syncStats.lastSync).toLocaleTimeString()}` : 'Detecting...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 group transition-all hover:bg-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Next Milestone</h4>
                                <TargetIcon className="w-3 h-3 text-primary opacity-50" />
                            </div>
                            <p className="text-sm font-black mb-1">₹50,000 Sales Target</p>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                    style={{ width: `${milestoneProgress}%` }}
                                />
                            </div>
                            <p className="text-[9px] text-slate-500 font-bold mt-1 text-right">{milestoneProgress}% Complete</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm z-10 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-6">
                            <div className={`p-4 rounded-sm ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 dark:bg-success/10 px-3 py-1 rounded-full">{stat.change}</span>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</h3>
                        <p className="text-[10px] font-bold text-slate-400 italic">{stat.target}</p>
                    </div>
                ))}
            </div>

            {/* Global Insights Feed */}
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black tracking-tight">Recent Insights & Alerts</h3>
                    <button className="text-xs font-bold text-primary hover:text-indigo-700 transition-colors uppercase tracking-widest">Mark all read</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {alerts.map((alert, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-sm border border-slate-100 dark:border-slate-700 flex items-start gap-4 hover:border-indigo-500/50 transition-colors group">
                            <div className={`mt-1 p-2 rounded-lg ${alert.type === 'action' ? 'bg-primary/10 text-primary' : alert.type === 'warning' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'} group-hover:scale-110 transition-transform`}>
                                <alert.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black mb-1">{alert.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{alert.message}</p>
                            </div>
                        </div>
                    ))}
                    {alerts.length === 0 && !isLoading && (
                        <div className="col-span-3 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                            No active biological signals detected.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrowDashboard;
