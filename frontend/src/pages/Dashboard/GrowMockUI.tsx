import React, { useMemo } from 'react';
import { 
    Zap, Store, BarChart2, Globe, TrendingUp, Star, ShoppingBag, 
    Mail, MessageSquare, Share2, ArrowRight, Users, Package,
    Target, Rocket, MousePointer2, ExternalLink
} from 'lucide-react';
import { inventory, customers, salesInvoices, MockSalesInvoice } from '../../data';
import Layout from '../../components/shared/Layout';

const GrowMockUI: React.FC = () => {
    const metrics = useMemo(() => {
        const totalCustomers = customers.length;
        const totalSales = (salesInvoices as MockSalesInvoice[]).reduce((sum, inv) => sum + inv.total, 0);
        
        return [
            { label: 'E-Commerce Volume', val: `₹${(totalSales/100000).toFixed(1)}L`, sub: 'Quantum Throughput', icon: ShoppingBag, color: 'text-lime-500', bg: 'bg-lime-500/10', border: 'border-lime-500/20' },
            { label: 'Conversion Index', val: '4.2%', sub: '+0.8% Velocity', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Audience Reach', val: totalCustomers.toLocaleString(), sub: 'Institutional Nodes', icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
            { label: 'Asset Exposure', val: inventory.length, sub: 'SKU Visibility', icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }
        ];
    }, []);

    const channels = [
        { title: 'Global Storefront', icon: Globe, color: 'lime', stats: [{l:'Visits', v:'12k'}, {l:'Orders', v:'420'}, {l:'Revenue', v:'₹8.2L'}], cta: 'Manage Shop' },
        { title: 'Marketplace Sync', icon: Store, color: 'emerald', stats: [{l:'Nodes', v:'04'}, {l:'Sync Status', v:'100%'}, {l:'Alerts', v:'0'}], cta: 'Channels' },
        { title: 'Predictive Ads', icon: Target, color: 'sky', stats: [{l:'Spend', v:'₹12k'}, {l:'ROAS', v:'4.2x'}, {l:'Clicks', v:'8.4k'}], cta: 'Ad Console' }
    ];

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Commerce <span className="text-lime-500">Accelerator</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Growth Intelligence Hub // Node G-9
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <ExternalLink className="w-4 h-4 text-lime-500" /> View Storefront
                        </button>
                        <button className="h-12 px-8 bg-lime-500 text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-lime-500/20 flex items-center gap-3 hover:opacity-90">
                            <Rocket className="w-4 h-4" /> Launch Campaign
                        </button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-lime-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-black ${card.color} uppercase tracking-[0.2em]`}>Live Metrics</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse mt-1" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                                <p className={`text-[9px] font-black ${card.color} uppercase tracking-widest mt-2`}>{card.sub}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-lime-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Growth Channels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {channels.map((ch, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 space-y-8 group hover:border-lime-500/50 transition-all shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-sm bg-${ch.color}-500/10 text-${ch.color}-500 border border-${ch.color}-500/20`}>
                                        <ch.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white">{ch.title}</h3>
                                </div>
                                <ArrowRight className={`w-4 h-4 text-neutral-300 group-hover:text-${ch.color}-500 transition-all group-hover:translate-x-1`} />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                {ch.stats.map((s, si) => (
                                    <div key={si} className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-sm border border-neutral-100 dark:border-neutral-800">
                                        <p className="text-sm font-black text-neutral-900 dark:text-white tabular-nums uppercase">{s.v}</p>
                                        <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-1">{s.l}</p>
                                    </div>
                                ))}
                            </div>

                            <button className={`w-full h-12 bg-${ch.color}-500/5 hover:bg-${ch.color}-500 text-${ch.color}-500 hover:text-white border border-${ch.color}-500/20 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all`}>
                                {ch.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Interaction Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-auto">
                    {[
                        { title: 'Intelligence Feed', icon: MessageSquare, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                        { title: 'Global Exposure', icon: Share2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
                    ].map((ch, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex items-center justify-between group cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-sm ${ch.bg} ${ch.color}`}>
                                    <ch.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white">{ch.title}</h4>
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic">Optimization Node SI-V4 Active</p>
                                </div>
                            </div>
                            <MousePointer2 className="w-4 h-4 text-neutral-300 group-hover:text-primary transition-all group-hover:scale-110" />
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default GrowMockUI;
