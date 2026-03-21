import React from 'react';
import {
    X,
    User,
    TrendingUp,
    Star,
    MessageSquare,
    AlertCircle,
    Crown,
    ShoppingBag,
    History,
    Smile,
    Frown,
    Meh,
    Zap,
    Phone,
    Mail,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { Customer } from "@repo/shared";

interface Customer360ModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer & { totalPurchases?: number; purchaseCount?: number; lastPurchase?: string | null };
}

const Customer360Modal: React.FC<Customer360ModalProps> = ({ isOpen, onClose, customer }) => {
    if (!isOpen) return null;

    // Mock CX Data based on Intelligence System
    const cxData = {
        satisfactionTrend: 'UP', // UP, DOWN, STABLE
        csatScore: 4.8,
        npsCategory: 'PROMOTER',
        lastFeedback: {
            date: '2026-01-10',
            rating: 5,
            comment: 'Excellent service and product quality. Highly satisfied!',
            channel: 'WHATSAPP',
            sentiment: 'POSITIVE'
        },
        complaintsCount: 0,
        riskLevel: 'LOW'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--erp-bg)]/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-slate-950 w-full max-w-5xl rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border border-default animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="p-10 border-b border-default flex justify-between items-start bg-[var(--erp-bg)]/60 backdrop-blur-3xl">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 text-main flex items-center justify-center text-4xl font-black shadow-2xl shadow-indigo-600/40 border border-white/20 font-mono italic">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-5 mb-2">
                                <h2 className="text-4xl font-black text-main italic uppercase tracking-tight">{customer.name}</h2>
                                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 flex items-center gap-2 italic shadow-lg shadow-emerald-500/5">
                                    <Smile className="w-3.5 h-3.5" /> High Satisfaction Node
                                </span>
                            </div>
                            <div className="flex items-center gap-6 text-muted font-black text-[10px] uppercase tracking-widest italic">
                                <span className="flex items-center gap-2.5 transition-colors hover:text-indigo-400 cursor-default"><Phone className="w-3.5 h-3.5" /> {customer.phone}</span>
                                <span className="flex items-center gap-2.5 transition-colors hover:text-indigo-400 cursor-default"><Mail className="w-3.5 h-3.5" /> {customer.email || 'offline_identity'}</span>
                                <span className="flex items-center gap-2.5 transition-colors hover:text-indigo-400 cursor-default"><MapPin className="w-3.5 h-3.5" /> {customer.address || 'global_reach'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-[var(--erp-bg-sunken)] border border-transparent hover:border-default rounded-[1.5rem] transition-all group">
                        <X className="w-7 h-7 text-muted group-hover:text-main" />
                    </button>
                </div>

                <div className="p-10 grid grid-cols-12 gap-10 max-h-[75vh] overflow-y-auto custom-scrollbar bg-[var(--erp-bg)]/40 backdrop-blur-3xl">
                    {/* Customer Intelligence Layer */}
                    <div className="col-span-12 lg:col-span-5 space-y-8">
                        {/* Satisfaction Card */}
                        <div className="erp-card p-8 rounded-[3rem] border border-emerald-500/20 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="flex justify-between items-start mb-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60 italic">Satisfaction Velocity</p>
                                <TrendingUp className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-5xl font-black text-main mb-2 font-mono italic">92.4%</h3>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                                +5.4% Optimized Efficiency
                            </p>
                        </div>

                        {/* Loyalty Card */}
                        <div className="erp-card p-8 rounded-[3rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                            <div className="flex justify-between items-start mb-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/60 italic">Partner Tier Integrity</p>
                                <Crown className="w-6 h-6 text-amber-500 shadow-xl shadow-amber-500/20" />
                            </div>
                            <h3 className="text-5xl font-black text-main mb-2 font-mono italic">{customer.tier || 'STRATEGIC'}</h3>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">{customer.points.toLocaleString()} Loyalty Nodes Accrued</p>
                        </div>

                        {/* Revenue Card */}
                        <div className="erp-card p-8 rounded-[3rem] border border-default bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
                            <div className="flex justify-between items-start mb-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Net Lifetime Value</p>
                                <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
                            </div>
                            <h3 className="text-5xl font-black text-main mb-2 font-mono italic">₹{(customer.totalPurchases || 0).toLocaleString()}</h3>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Consolidated from {customer.purchaseCount || 0} Fiscal Events</p>
                        </div>
                    </div>

                    {/* Detailed CX Stream */}
                    <div className="col-span-12 lg:col-span-7 space-y-10">
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted mb-8 flex items-center gap-3 italic">
                                <History className="w-5 h-5 text-indigo-400" /> Historical Sentiment Feed
                            </h4>
                            <div className="space-y-6">
                                {/* Last Feedback */}
                                <div className="p-8 bg-[var(--erp-bg-sunken)] rounded-[2.5rem] border border-default relative group overflow-hidden hover:border-indigo-500/20 transition-all shadow-xl backdrop-blur-lg">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="flex gap-1.5 text-amber-400">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < cxData.lastFeedback.rating ? 'fill-current shadow-lg shadow-amber-400/20' : 'opacity-10'}`} />)}
                                        </div>
                                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.25em] font-mono italic">{cxData.lastFeedback.date}</span>
                                    </div>
                                    <p className="text-base font-black italic text-muted mb-8 leading-relaxed">
                                        "{cxData.lastFeedback.comment}"
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2.5 px-4 py-2 bg-[var(--erp-bg-sunken)] border border-default rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg group-hover:bg-white/10 transition-colors">
                                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shadow-xl shadow-indigo-400/20" /> {cxData.lastFeedback.channel}
                                        </div>
                                        <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30">
                                            <Smile className="w-3.5 h-3.5" /> High Affinity
                                        </div>
                                    </div>
                                </div>

                                {/* Placeholder for past complaints or additional feed */}
                                <div className="p-10 text-center border-2 border-dashed border-default rounded-[3rem] group hover:border-indigo-500/20 transition-colors">
                                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] italic">Zero Friction Events Logged in Current Cycle</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Shortcuts */}
                        <div className="grid grid-cols-2 gap-6">
                            <button className="flex items-center justify-between p-6 bg-[var(--erp-bg-sunken)] border border-default rounded-[2rem] hover:border-indigo-500/40 hover:bg-white/10 transition-all group shadow-xl">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted group-hover:text-main transition-colors italic">Incentivize Node</span>
                                <ArrowRight className="w-5 h-5 text-secondary group-hover:text-indigo-400 group-hover:translate-x-1.5 transition-all" />
                            </button>
                            <button className="flex items-center justify-between p-6 bg-[var(--erp-bg-sunken)] border border-default rounded-[2rem] hover:border-emerald-500/40 hover:bg-white/10 transition-all group shadow-xl">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted group-hover:text-main transition-colors italic">Solicit Validation</span>
                                <ArrowRight className="w-5 h-5 text-secondary group-hover:text-emerald-400 group-hover:translate-x-1.5 transition-all" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Customer360Modal;

