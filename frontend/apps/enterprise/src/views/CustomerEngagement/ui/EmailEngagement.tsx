import React, { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    Send,
    CheckCircle2,
    Clock,
    AlertCircle,
    Inbox,
    User,
    ChevronRight,
    MessageSquare,
    Zap,
    Sparkles,
    Trash2,
    ShieldCheck,
    BarChart3,
    ArrowLeft,
    TrendingUp,
    LayoutDashboard,
    CreditCard,
    FileText,
    RotateCcw,
    Flag,
    BadgeAlert
} from 'lucide-react';
import { useUiStore } from "@/shared/lib/store/uiStore";

const EmailEngagement: React.FC = () => {
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>('t1');
    const [activeTab, setActiveTabLocal] = useState<'INBOX' | 'AUTOMATIONS' | 'INSIGHTS'>('INBOX');

    const threads = [
        {
            id: 't1',
            customerName: 'Aditi Sharma',
            subject: 'Missing item in my delivery #ORD-9942',
            lastMessage: "I received only 4 out of 5 items listed in the invoice. Please help.",
            time: '12m ago',
            status: 'OPEN',
            priority: 'HIGH',
            sentiment: 'NEGATIVE',
            lastResponse: 'Never',
            agent: 'Rahul K.',
            sla: '2h remaining'
        },
        {
            id: 't2',
            customerName: 'Vikram Malhotra',
            subject: 'Bulk order inquiry for Corporate Gifting',
            lastMessage: "Looking for 50 silk sarees. Can you provide a quotation by tomorrow?",
            time: '45m ago',
            status: 'PENDING',
            priority: 'MEDIUM',
            sentiment: 'POSITIVE',
            lastResponse: '10m ago',
            agent: 'Priya S.',
            sla: '18h remaining'
        },
        {
            id: 't3',
            customerName: 'Neha Kapoor',
            subject: 'Payment failed for invoice #INV-221',
            lastMessage: "I tried paying via UPI but it shows 'Transaction Pending' on my app.",
            time: '2h ago',
            status: 'OPEN',
            priority: 'HIGH',
            sentiment: 'NEUTRAL',
            lastResponse: 'Never',
            agent: 'Unassigned',
            sla: '30m remaining'
        }
    ];

    const selectedThread = threads.find(t => t.id === selectedThreadId) || threads[0];

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 h-[calc(100vh-10rem)] flex flex-col">
            {/* Header / Command Center */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-6 px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Inbox className="w-5 h-5 text-white/90" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight leading-none italic uppercase">
                                Customer <span className="text-indigo-600">Engagement</span>
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Email Hub</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                    <div className="hidden md:flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        {(['INBOX', 'AUTOMATIONS', 'INSIGHTS'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTabLocal(tab)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => useUiStore.getState().setActiveTab('GROW_DASHBOARD')}
                        className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all shadow-sm flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                        <Plus className="w-4 h-4" /> New Ticket
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-12 gap-8">
                {/* Inbox List */}
                <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email or order #..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter:</span>
                                <button className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">Active</button>
                                <button className="px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors font-medium">Unassigned</button>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {threads.map((thread) => (
                            <div
                                key={thread.id}
                                onClick={() => setSelectedThreadId(thread.id)}
                                className={`p-5 rounded-3xl cursor-pointer transition-all border-2 relative group ${selectedThreadId === thread.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-600 shadow-lg shadow-indigo-600/5' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-black text-slate-900 dark:text-white line-clamp-1">{thread.customerName}</h4>
                                    <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap ml-2">{thread.time}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-2 leading-tight line-clamp-1 italic">{thread.subject}</p>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">{thread.lastMessage}</p>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1 rounded-md ${thread.sentiment === 'POSITIVE' ? 'bg-emerald-100 text-emerald-600' : thread.sentiment === 'NEGATIVE' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                            <Sparkles className="w-3 h-3" />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${thread.priority === 'HIGH' ? 'text-rose-600' : 'text-amber-600'}`}>
                                            {thread.priority} Priest
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black">{thread.agent[0]}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversation View */}
                <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden relative">
                    {/* Thread Header */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-tight mb-2">
                                    {selectedThread.subject}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/30">
                                        <BadgeAlert className="w-3 h-3" /> SLA: {selectedThread.sla}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: #TKT-{selectedThread.id.toUpperCase()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-600 transition-colors">
                                    <Flag className="w-4 h-4" />
                                </button>
                                <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.03),transparent_50%)]">
                        <div className="flex flex-col items-center mb-4">
                            <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Today</span>
                        </div>

                        {/* Customer Message */}
                        <div className="flex gap-4 max-w-[85%]">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 text-indigo-600 font-black">
                                AS
                            </div>
                            <div className="space-y-2">
                                <div className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-tl-none shadow-sm">
                                    <p className="text-sm font-medium leading-relaxed italic">
                                        "Hi, I received my order #ORD-9942 this morning. However, looking at the silk saree, it seems to have a small tear near the border. I also noticed that the matching blouse piece is missing from the package. Can you please look into this immediately?"
                                    </p>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">10:42 AM • Sent from Android</span>
                            </div>
                        </div>

                        {/* AI Detection Notice */}
                        <div className="flex justify-center">
                            <div className="px-4 py-2 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl flex items-center gap-3">
                                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">AI: Sentiment detected as "Frustrated / Unhappy"</span>
                            </div>
                        </div>

                        {/* Agent Workspace (Reply) */}
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-4 bg-slate-900 dark:bg-indigo-950 rounded-3xl mb-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                                </div>
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    Suggested AI Reply
                                </h4>
                                <p className="text-xs font-medium text-slate-100 leading-relaxed italic mb-4">
                                    "I'm so sorry to hear about the damaged saree and missing blouse piece, Aditi. This isn't the experience we want for you. I've initiated an immediate replacement request and would like to offer a 10% discount on your next purchase as a gesture of apology. Shall I proceed?"
                                </p>
                                <button className="px-4 py-2 bg-white text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all">
                                    Use this Draft
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 min-h-[120px] font-medium"
                                    placeholder="Type your response or '/' for templates..."
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all">
                                        Send Reply <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer 360 & Analytics */}
                <div className="col-span-12 lg:col-span-3 space-y-8">
                    {/* View Switcher Overlay for Stats */}
                    <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[80px] -mr-16 -mt-16" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Engagement DNA
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Lifetime Value</p>
                                    <p className="text-2xl font-black italic">₹48.2K</p>
                                </div>
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Open Orders</p>
                                    <p className="text-2xl font-black italic">2</p>
                                </div>
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Overdue Status</p>
                                    <p className="text-2xl font-black text-rose-400 italic">None</p>
                                </div>
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Response Control */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Engagement Actions</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border border-transparent hover:border-indigo-100 group">
                                <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Email Bill</span>
                            </button>
                            <button className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border border-transparent hover:border-emerald-100 group">
                                <Zap className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Pay Link</span>
                            </button>
                            <button className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border border-transparent hover:border-amber-100 group">
                                <RotateCcw className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Return Label</span>
                            </button>
                            <button className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border border-transparent hover:border-indigo-100 group">
                                <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Ledger</span>
                            </button>
                        </div>
                    </div>

                    {/* SLA Health Indicator */}
                    <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl">
                        <div className="absolute top-0 right-0 p-6 opacity-20">
                            <Clock className="w-12 h-12" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Collection Recovery</h4>
                        <div className="flex items-center gap-4">
                            <h3 className="text-3xl font-black tracking-tighter italic">₹12.8L</h3>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-emerald-200">Recovered this month</span>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-white">
                                    <TrendingUp className="w-3 h-3 text-white" /> +14% vs last mo.
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                            <div className="bg-white h-full w-[65%]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailEngagement;
