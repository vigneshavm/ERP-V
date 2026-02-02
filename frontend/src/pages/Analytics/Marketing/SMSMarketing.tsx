import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import {
    MessageSquare, Send, Calendar, Users, BarChart3,
    Shield, Zap, CheckCircle, AlertCircle, Plus,
    Filter, Search, Layers, TrendingUp, Clock,
    ChevronRight, ArrowUpRight, Copy, Trash2, Edit3,
    Smartphone, Mail, Bell, Target, Sparkles, Star
} from 'lucide-react';
import { SMSCampaign, SMSConfig } from "../../../types/tenant";

const SMSMarketing: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const [activeTab, setActiveTab] = useState<'campaigns' | 'insights' | 'templates' | 'config'>('campaigns');

    const activeTenant = tenants.find(t => t.id === user?.tenantId);

    // Mock SMS Config if not present
    const smsConfig: SMSConfig = activeTenant?.smsConfig || {
        isConnected: true,
        provider: 'MSG91',
        apiKeyConfigured: true,
        senderId: 'VIGNES',
        metrics: {
            totalSent: 12450,
            totalDelivered: 12100,
            averageOpenRate: 98.2
        },
        campaigns: [
            { id: 's1', name: 'Pongal Special Flush', content: 'Happy Pongal! Grab 20% off on all ethnic wear. Valid till Sunday. Shop now!', status: 'COMPLETED', sentAt: '2026-01-12T09:00:00Z', recipientCount: 5000, deliveredCount: 4950, clickedCount: 840, estimatedCost: 750 },
            { id: 's2', name: 'Weekend Alert', content: 'New Arrivals are here! Visit our Chennai store for an exclusive preview.', status: 'SCHEDULED', scheduledAt: '2026-01-17T10:00:00Z', recipientCount: 2500, deliveredCount: 0, clickedCount: 0, estimatedCost: 375 },
            { id: 's3', name: 'Flash Sale Reminder', content: 'Wait! Your cart is missing you. Use code SAVE10 for an extra 10% off.', status: 'DRAFT', recipientCount: 1200, deliveredCount: 0, clickedCount: 0, estimatedCost: 180 },
        ]
    };

    const renderCampaigns = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <input type="text" placeholder="Search Campaign DNA..." className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm" />
                </div>
                <button className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all group">
                    <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Construct Blast
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {smsConfig.campaigns.map((camp) => (
                    <div key={camp.id} className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[2.5rem] blur opacity-0 group-hover:opacity-10 transition duration-500" />
                        <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 p-8 rounded-[2.5rem] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 transition-all hover:translate-x-2">
                            <div className="flex items-center gap-6 flex-1">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${camp.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <Send className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black italic uppercase tracking-tight">{camp.name}</h4>
                                    <p className="text-sm font-bold text-slate-500 line-clamp-1 max-w-md italic">"{camp.content}"</p>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span className={`flex items-center gap-1.5 ${camp.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${camp.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                            {camp.status}
                                        </span>
                                        <span className="text-slate-400">{camp.sentAt ? new Date(camp.sentAt).toLocaleDateString() : 'Drafted'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-12 text-center lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-12">
                                <div>
                                    <p className="text-2xl font-black italic">{camp.recipientCount}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipients</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black italic text-indigo-600">{camp.deliveredCount}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivered</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black italic text-emerald-600">{((camp.clickedCount / (camp.deliveredCount || 1)) * 100).toFixed(1)}%</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CTR pulse</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="p-3 bg-slate-50 dark:bg-black/50 text-slate-500 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button className="p-3 bg-slate-50 dark:bg-black/50 text-slate-500 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderInsights = () => (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Neural Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Network Reach', val: '124.5K', icon: Zap, color: 'text-indigo-600', trend: '+12%' },
                    { label: 'Deliverability', val: '98.2%', icon: Target, color: 'text-emerald-600', trend: '+0.5%' },
                    { label: 'Conversion Flow', val: '4,280', icon: TrendingUp, color: 'text-violet-600', trend: '+8%' },
                    { label: 'Estimated ROI', val: '14.2x', icon: Sparkles, color: 'text-amber-600', trend: '+2.4x' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 p-8 rounded-[3rem] shadow-sm group hover:border-indigo-500/30 transition-all text-center">
                        <div className={`w-14 h-14 ${kpi.color} bg-white dark:bg-black rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <kpi.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-5xl font-black tracking-tighter italic tabular-nums mb-1">{kpi.val}</h3>
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
                            <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{kpi.trend} This Month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual Heatmap Placeholder */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 p-12 rounded-[4rem] text-center space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
                <div className="max-w-xl mx-auto space-y-4 relative z-10">
                    <BarChart3 className="w-20 h-20 text-indigo-200 mx-auto group-hover:scale-110 transition-transform duration-700" />
                    <h3 className="text-4xl font-black italic uppercase">Direct <span className="text-indigo-600">Connectivity</span> Mapping</h3>
                    <p className="text-slate-500 font-bold italic">Analyzing the volumetric flow of direct messaging across your customer segments.</p>
                </div>
                <div className="flex items-end justify-center gap-6 h-64 mt-12">
                    {[40, 70, 45, 90, 65, 80, 55, 95, 75, 40].map((h, i) => (
                        <div key={i} className="flex-1 max-w-[40px] bg-gradient-to-t from-indigo-600 to-violet-500 rounded-2xl group/bar relative" style={{ height: `${h}%` }}>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">{h}% Capacity</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-[#020617] relative">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-20 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/20 blur-[120px] rounded-full animate-float delay-1000" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-12 space-y-12">
                {/* Standalone Premium Header */}
                <header className="flex flex-col xl:flex-row items-center justify-between gap-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/50 dark:border-slate-800/50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent via-indigo-500/5 to-violet-500/5 pointer-events-none" />

                    <div className="space-y-6 relative z-10 text-center xl:text-left">
                        <div className="flex items-center justify-center xl:justify-start gap-4">
                            <div className="px-5 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30">
                                SMS Core Active
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Secure Encryption Active
                            </span>
                        </div>
                        <h1 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">
                            SMS COMMAND <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">CENTER</span>
                        </h1>
                        <p className="text-slate-500 font-bold italic text-lg opacity-80 max-w-xl">
                            Elite direct-to-customer communication engine. Zero latency, hyper-segmented broadcasting.
                        </p>
                    </div>

                    {/* Elite Navigation */}
                    <nav className="flex items-center gap-4 bg-white/70 dark:bg-black/40 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-2xl relative z-10">
                        {[
                            { id: 'campaigns', icon: Zap, label: 'Broadcasts' },
                            { id: 'insights', icon: BarChart3, label: 'Intelligence' },
                            { id: 'templates', icon: Layers, label: 'Architect' },
                            { id: 'config', icon: Shield, label: 'Gateway' }
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

                {/* Main Content Area */}
                <div className="relative min-h-[700px] z-10">
                    {activeTab === 'campaigns' && renderCampaigns()}
                    {activeTab === 'insights' && renderInsights()}
                    {activeTab === 'templates' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {[
                                { title: 'Flash Sale Hero', desc: 'Direct discount alert for loyalty customers.', usage: '2.4k used', icon: Target },
                                { title: 'The Update Echo', desc: 'Notify audience of new arrivals or store moves.', usage: '1.1k used', icon: Bell },
                                { title: 'Loyalty pulse', desc: 'Points balance and redemption reminders.', usage: '840 used', icon: Star },
                            ].map((template, idx) => (
                                <div key={idx} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 p-10 rounded-[3rem] shadow-sm relative group cursor-pointer hover:border-indigo-500/50 transition-all">
                                    <div className="absolute top-8 right-8 w-12 h-12 bg-slate-50 dark:bg-black rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
                                        <Copy className="w-5 h-5" />
                                    </div>
                                    <template.icon className="w-12 h-12 text-indigo-600 mb-8" />
                                    <h4 className="text-2xl font-black italic uppercase tracking-tight mb-2">{template.title}</h4>
                                    <p className="text-sm font-bold text-slate-500 italic mb-8">{template.desc}</p>
                                    <div className="flex items-center justify-between pt-8 border-t border-slate-50 dark:border-slate-800">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{template.usage}</span>
                                        <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'config' && (
                        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 p-12 rounded-[4rem] shadow-2xl space-y-12">
                                <div className="text-center space-y-4">
                                    <h3 className="text-4xl font-black italic uppercase">Gateway <span className="text-indigo-600">Architect</span></h3>
                                    <p className="text-slate-500 font-bold max-w-md mx-auto italic">Configure your direct messaging satellite connections. All credentials are encrypted with military-grade standards.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4 group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Primary Provider</label>
                                        <select className="w-full p-5 bg-slate-50 dark:bg-black/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer">
                                            <option>MSG91 Intelligence</option>
                                            <option>Twilio Global Core</option>
                                            <option>Custom Gateway DNA</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4 group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Verified Sender ID</label>
                                        <input type="text" defaultValue="VIGNES" className="w-full p-5 bg-slate-50 dark:bg-black/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase tracking-widest" />
                                    </div>
                                    <div className="space-y-4 group md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">API Authentication Matrix</label>
                                        <div className="relative">
                                            <input type="password" value="****************************************" className="w-full p-5 bg-slate-50 dark:bg-black/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" readOnly />
                                            <Edit3 className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-indigo-400 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all">
                                    Re-Connect Gateway Matrix
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                .animate-float { animation: float 12s infinite ease-in-out; }
            `}} />
        </div>
    );
};

export default SMSMarketing;
