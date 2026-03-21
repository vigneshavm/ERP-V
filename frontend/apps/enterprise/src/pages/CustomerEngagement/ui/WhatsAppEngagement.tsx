import React, { useState } from 'react';
import {
    MessageSquare, Send, User, Search, Filter,
    MoreVertical, Paperclip, Smile, ShieldCheck,
    Clock, Smartphone, CheckCircle2, AlertCircle,
    TrendingUp, Star, DollarSign, ListChecks, ArrowRight,
    Sparkles, Zap, Layout, Settings, BarChart3,
    AlertTriangle, Bot, MessageCircle, RefreshCw
} from 'lucide-react';

const WhatsAppEngagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'automations' | 'insights'>('inbox');
    const [selectedChat, setSelectedChat] = useState<string | null>('c1');

    // Mock Data
    const chats = [
        { id: 'c1', name: 'Rahul Sharma', lastMsg: 'I have not received my invoice yet.', time: '12:45 PM', status: 'OPEN', priority: 'HIGH', sentiment: 'Angry' },
        { id: 'c2', name: 'Priya Patel', lastMsg: 'Thank you for the quick delivery!', time: '11:20 AM', status: 'RESOLVED', priority: 'LOW', sentiment: 'Happy' },
        { id: 'c3', name: 'Amit Verma', lastMsg: 'Payment link is not working.', time: 'Yesterday', status: 'PENDING', priority: 'MEDIUM', sentiment: 'Neutral' },
    ];

    const customer360 = {
        name: 'Rahul Sharma',
        spend: '₹42,500',
        outstanding: '₹8,400',
        visits: 12,
        loyalty: 840,
        lastVisit: '12 Jan 2026',
        tag: 'VIP'
    };

    const automations = [
        { id: 'a1', event: 'Bill Generated', template: 'Invoice Link', status: true },
        { id: 'a2', event: 'Payment Pending', template: 'Reminder', status: true },
        { id: 'a3', event: 'Delivery Shipped', template: 'Tracking', status: false },
        { id: 'a4', event: 'Loyalty Earned', template: 'Points Update', status: true },
    ];

    const renderInbox = () => (
        <div className="flex h-[800px] bg-white dark:bg-[var(--erp-bg)] rounded-[3rem] border border-default dark:border-default shadow-2xl overflow-hidden animate-in fade-in duration-700">
            {/* Chat List */}
            <div className="w-[380px] border-r border-default dark:border-default flex flex-col">
                <div className="p-8 border-b border-default dark:border-default">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black italic uppercase">Threads</h2>
                        <div className="flex gap-2">
                            <button className="p-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-xl"><Search className="w-4 h-4" /></button>
                            <button className="p-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-xl"><Filter className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat.id)}
                            className={`p-6 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all ${selectedChat === chat.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)]/50'}`}
                        >
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                {selectedChat === chat.id ? <User className="w-6 h-6 text-main" /> : <User className="w-6 h-6 text-muted" />}
                                {chat.sentiment === 'Angry' && <div className="absolute bottom-0 right-0 w-4 h-4 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-black italic uppercase text-xs truncate">{chat.name}</h4>
                                    <span className={`text-[8px] font-bold ${selectedChat === chat.id ? 'text-indigo-200' : 'text-muted'}`}>{chat.time}</span>
                                </div>
                                <p className={`text-[10px] font-bold italic truncate ${selectedChat === chat.id ? 'text-indigo-100' : 'text-muted'}`}>{chat.lastMsg}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-[var(--erp-bg-sunken)]/30 dark:bg-[var(--erp-bg)]/20">
                <div className="p-8 border-b border-default dark:border-default flex items-center justify-between bg-white dark:bg-[var(--erp-bg)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                            <Smartphone className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic uppercase">Rahul Sharma</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Store Assistant Assigned</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-[10px] font-black uppercase tracking-widest rounded-xl">Assign</button>
                        <button className="px-6 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20">Mark Resolved</button>
                    </div>
                </div>

                <div className="flex-1 p-12 overflow-y-auto space-y-8">
                    {/* Placeholder Messages */}
                    <div className="flex justify-start">
                        <div className="max-w-md p-6 bg-white dark:bg-[var(--erp-card)] rounded-[2rem] rounded-tl-none shadow-sm border border-default dark:border-default">
                            <p className="text-sm font-bold italic">I have not received my invoice for the purchase I made yesterday at the Mumbai store.</p>
                            <span className="text-[8px] text-muted font-bold block mt-4">12:42 PM • SEEN</span>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <div className="max-w-md p-6 bg-indigo-600 text-white rounded-[2rem] rounded-tr-none shadow-xl shadow-indigo-600/10">
                            <p className="text-sm font-bold italic">Checking that for you right away, Rahul. Let me pull up your transaction.</p>
                            <span className="text-[8px] text-indigo-200 font-bold block mt-4">12:44 PM • DELIVERED</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div className="px-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-full text-[8px] font-black text-muted uppercase tracking-widest border border-default dark:border-default">
                            AI Detected: Negative Sentiment (Angry)
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white dark:bg-[var(--erp-bg)] border-t border-default dark:border-default">
                    <div className="flex gap-4 p-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-[2rem] items-center">
                        <button className="p-2 text-muted"><Paperclip className="w-5 h-5" /></button>
                        <input
                            type="text"
                            placeholder="Type to chat..."
                            className="flex-1 bg-transparent outline-none font-bold italic text-sm text-secondary dark:text-muted"
                        />
                        <button className="p-2 text-muted"><Smile className="w-5 h-5" /></button>
                        <button className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20"><Send className="w-5 h-5" /></button>
                    </div>
                    <div className="flex gap-4 mt-6 ml-4">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Suggestions:</span>
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Send Invoice Link</button>
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Apologize for delay</button>
                    </div>
                </div>
            </div>

            {/* Customer 360 Right Sidebar */}
            <div className="w-[320px] bg-white dark:bg-[var(--erp-bg)] border-l border-default dark:border-default p-10 flex flex-col gap-10">
                <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-[2.5rem] mx-auto flex items-center justify-center text-white mb-6 shadow-2xl">
                        <User className="w-12 h-12" />
                    </div>
                    <h4 className="text-2xl font-black italic uppercase">{customer360.name}</h4>
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-widest">{customer360.tag} CUSTOMER</span>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 rounded-3xl">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Lifetime Spend</p>
                        <p className="text-xl font-black italic">{customer360.spend}</p>
                    </div>
                    <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Outstanding</p>
                        <p className="text-xl font-black italic text-rose-500">{customer360.outstanding}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 rounded-2xl">
                            <p className="text-[8px] font-bold text-muted uppercase mb-1">Visits</p>
                            <p className="text-sm font-black italic">{customer360.visits}</p>
                        </div>
                        <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 rounded-2xl">
                            <p className="text-[8px] font-bold text-muted uppercase mb-1">Loyalty</p>
                            <p className="text-sm font-black italic">{customer360.loyalty}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <button className="w-full py-4 bg-[var(--erp-bg)] dark:bg-white text-main rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3">
                        <Sparkles className="w-4 h-4" /> AI Insights
                    </button>
                    <p className="text-[9px] text-muted italic text-center mt-4">Predicted Churn Risk: <span className="text-emerald-500 font-bold">Low (12%)</span></p>
                </div>
            </div>
        </div>
    );

    const renderAutomations = () => (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
                <h3 className="text-4xl font-black italic uppercase italic mb-4">Event <span className="text-indigo-200">Triggers</span></h3>
                <p className="text-indigo-100 font-bold italic opacity-80 mb-12">Automate operational communication with zero manual intervention.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {automations.map(auto => (
                        <div key={auto.id} className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 hover:bg-white/20 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className={`w-12 h-6 rounded-full relative cursor-pointer flex items-center px-1 ${auto.status ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${auto.status ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <h4 className="text-xl font-black italic uppercase mb-2">{auto.event}</h4>
                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Template: {auto.template}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[var(--erp-bg)] p-12 rounded-[4rem] border border-default dark:border-default shadow-xl">
                    <h4 className="text-2xl font-black italic uppercase mb-8">POS Integration</h4>
                    <div className="space-y-6">
                        {[
                            'Send Bill on WhatsApp',
                            'Send Payment Link',
                            'Send Order Status',
                            'Send Refund Confirmation'
                        ].map(btn => (
                            <div key={btn} className="p-6 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-3xl flex items-center justify-between">
                                <span className="font-bold italic text-secondary dark:text-muted">{btn}</span>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[8px] font-black rounded-lg uppercase tracking-widest">ENABLED</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-[var(--erp-bg)] dark:bg-[var(--erp-bg)] p-12 rounded-[4rem] text-main flex flex-col justify-center items-center text-center space-y-6">
                    <Bot className="w-16 h-16 text-indigo-400" />
                    <h3 className="text-3xl font-black italic uppercase">AI Co-Pilot</h3>
                    <p className="text-muted font-bold italic max-w-sm">Our AI scans incoming messages to suggest high-conversion replies and detect emergency issues.</p>
                    <button className="px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl">Manage AI Rules</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-bg)] relative">
            <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-12 space-y-12">
                <header className="flex items-center justify-between bg-white/40 dark:bg-[var(--erp-bg)]/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white dark:border-default/50 shadow-2xl">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                            <MessageCircle className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">PART B</span>
                                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> PREMIUM ENGAGEMENT MODULE
                                </span>
                            </div>
                            <h1 className="text-5xl font-black italic uppercase tracking-tighter">
                                Customer <span className="text-indigo-600 font-black">Engagement</span>
                            </h1>
                        </div>
                    </div>

                    <nav className="flex bg-white/70 dark:bg-[var(--erp-bg)]/40 p-2 rounded-2xl border border-white dark:border-default shadow-xl">
                        {[
                            { id: 'inbox', label: 'Inbox', icon: Layout },
                            { id: 'automations', label: 'Automations', icon: Zap },
                            { id: 'insights', label: 'ROI Insights', icon: BarChart3 }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === t.id ? 'bg-[var(--erp-bg)] dark:bg-white text-main shadow-xl' : 'text-muted hover:text-main dark:hover:text-main'}`}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        ))}
                    </nav>
                </header>

                <main>
                    {activeTab === 'inbox' && renderInbox()}
                    {activeTab === 'automations' && renderAutomations()}
                    {activeTab === 'insights' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-in fade-in duration-700">
                            {[
                                { label: 'Revenue Recovered', val: '₹4.8L', icon: DollarSign, color: 'text-emerald-500' },
                                { label: 'Returns Prevented', val: '142', icon: RefreshCw, color: 'text-indigo-500' },
                                { label: 'Avg Support SLA', val: '4m 20s', icon: Clock, color: 'text-rose-500' },
                                { label: 'CSAT Score', val: '4.8/5.0', icon: Star, color: 'text-amber-500' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-[var(--erp-bg)] p-10 rounded-[3rem] border border-default dark:border-default shadow-xl">
                                    <stat.icon className={`w-8 h-8 ${stat.color} mb-6`} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">{stat.label}</p>
                                    <h3 className="text-3xl font-black italic">{stat.val}</h3>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default WhatsAppEngagement;
