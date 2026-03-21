import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect } from 'react';
import Layout from "@/shared/ui/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import BusinessSubNav from './BusinessSubNav.js';
import api from "@/shared/api/api";
import { toast } from 'react-toastify';

interface MarketingStat {
    label: string;
    value: string;
    trend: string;
    icon: string;
}

interface MarketingChannel {
    id: string;
    name: string;
    description: string;
    icon: string;
    isConnected: boolean;
    status: 'active' | 'disconnected' | 'pending';
    metrics: {
        Reach: string;
        Conversion: string;
    };
    color: string;
}

const MarketingTools: React.FC = () => {
    const [stats, setStats] = useState<MarketingStat[]>([
        { label: 'Total Reach', value: '45.2K', trend: '+12.5%', icon: '🚀' },
        { label: 'Engagement', value: '18.4%', trend: '+4.2%', icon: '📈' },
        { label: 'Total Leads', value: '1,284', trend: '+8.1%', icon: '👥' },
        { label: 'Marketing ROI', value: '4.8x', trend: '+0.5%', icon: '💰' }
    ]);

    const [channels, setChannels] = useState<MarketingChannel[]>([
        {
            id: 'meta',
            name: 'Meta Ads Manager',
            description: 'Run automated ads across Facebook & Instagram with AI optimization.',
            icon: '♾️',
            isConnected: false,
            status: 'disconnected',
            metrics: { Reach: '0', Conversion: '0%' },
            color: 'blue'
        },
        {
            id: 'google',
            name: 'Google Merchant Center',
            description: 'Sync your inventory with Google Search and Shopping automatically.',
            icon: '🔍',
            isConnected: false,
            status: 'disconnected',
            metrics: { Reach: '0', Conversion: '0%' },
            color: 'red'
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp Business API',
            description: 'Direct messaging and high-conversion automated broadcasts.',
            icon: '💬',
            isConnected: true,
            status: 'active',
            metrics: { Reach: '12.4K', Conversion: '42.8%' },
            color: 'emerald'
        }
    ]);

    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchMarketingData();
    }, []);

    const fetchMarketingData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/marketing/status');
            if (response.data.success) {
                // Merge real data with local descriptions
                const updatedChannels = channels.map(c => {
                    const serverStatus = response.data.data.find((s: any) => s.id === c.id);
                    if (serverStatus) {
                        return {
                            ...c,
                            isConnected: serverStatus.isConnected,
                            status: serverStatus.status as any,
                            metrics: serverStatus.metrics || c.metrics
                        };
                    }
                    return c;
                });
                setChannels(updatedChannels);
            }
        } catch (error: any) {
            logger.error('Error fetching marketing status:', error);
            // Non-critical: Use fallback data if API fails
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (channelId: string) => {
        if (channelId === 'meta') {
            const clientID = '123456789'; // Dummy for now
            const redirectUri = encodeURIComponent(`${window.location.origin}/business/meta-callback`);
            window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientID}&redirect_uri=${redirectUri}&scope=ads_management,ads_read,business_management`;
        } else {
            toast.info(`${channelId} connection coming soon!`);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="page-shell">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
                      </div>

            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title="Growth Ecosystem"
                description="Harness the power of AI-driven marketing and global sales channels."
                breadcrumbs={[
                    { label: 'Dashboard', link: '/' },
                    { label: 'Business', link: '/business/online-shop' },
                    { label: 'Growth Center' }
                ]}
            />
            {/* <BusinessSubNav /> */}

            {/* Performance Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-6 border border-default shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-150 transition-transform"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-2xl">{stat.icon}</div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{stat.trend}</span>
                            </div>
                            <h4 className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h4>
                            <p className="text-3xl font-black text-main tracking-tighter">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Channels Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {channels.map((channel) => (
                    <div key={channel.id} className="bg-white rounded-[2.5rem] border border-default shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col group relative overflow-hidden">
                        {/* Status Ribbon */}
                        <div className={`absolute top-6 right -6 rotate-45 w-32 text-center text-[8px] font-black uppercase tracking-widest py-1 border shadow-sm z-20 ${channel.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-[var(--erp-bg-sunken)] text-muted border-default'
                            }`}>
                            {channel.status}
                        </div>

                        <div className="p-8 pb-4">
                            <div className={`w-16 h-16 rounded-3xl bg-${channel.color}-50 text-3xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:bg-${channel.color}-600 group-hover:text-main transition-all duration-500`}>
                                {channel.icon}
                            </div>
                            <h3 className="text-xl font-black text-main mb-3 tracking-tight italic">{channel.name}</h3>
                            <p className="text-muted text-sm leading-relaxed font-medium mb-6">{channel.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-[var(--erp-bg-sunken)] rounded-2xl border border-default/50">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Reach</p>
                                    <p className="text-lg font-black text-main">{channel.metrics.Reach}</p>
                                </div>
                                <div className="p-4 bg-[var(--erp-bg-sunken)] rounded-2xl border border-default/50">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Conv.</p>
                                    <p className="text-lg font-black text-main">{channel.metrics.Conversion}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto p-8 pt-0">
                            {channel.isConnected ? (
                                <button
                                    onClick={() => handleConnect(channel.id)}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white border-2 border-gray-900 text-main hover:bg-[var(--erp-bg)] hover:text-main transition-all shadow-xl shadow-gray-100 active:scale-95`}
                                >
                                    Manage Channel ⚙️
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleConnect(channel.id)}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-[var(--erp-bg)] text-main hover:bg-black transition-all shadow-2xl shadow-gray-200 active:scale-95`}
                                >
                                    Activate Connector 🚀
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Smart Insights Banner */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[120px] opacity-10 -mr-48 -mt-48 animate-pulse"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-8 border border-white/20">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-400 mr-2"></span>
                            AI Business Advisor
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight tracking-tight">
                            "Connect <span className="text-indigo-400 italic">Meta Marketing</span> to unlock <br className="hidden md:block" /> AI-driven buyer personas."
                        </h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-2">
                            <span className="px-4 py-2 bg-[var(--erp-bg-sunken)] rounded-xl border border-default text-xs font-bold opacity-80">Predictive Analytics</span>
                            <span className="px-4 py-2 bg-[var(--erp-bg-sunken)] rounded-xl border border-default text-xs font-bold opacity-80">Churn Reduction</span>
                            <span className="px-4 py-2 bg-[var(--erp-bg-sunken)] rounded-xl border border-default text-xs font-bold opacity-80">Trend Analysis</span>
                        </div>
                    </div>
                    <div className="w-full md:w-auto">
                        <button
                            onClick={() => handleConnect('meta')}
                            className="px-10 py-5 bg-white text-main rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-[var(--erp-bg-sunken)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:scale-95"
                        >
                            Explore AI Insights
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MarketingTools;
