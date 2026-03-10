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
import { Customer } from "@repo/shared-kernel";

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-indigo-600/20">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">{customer.name}</h2>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5">
                                    <Smile className="w-3 h-3" /> High Satisfaction
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium text-sm">
                                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {customer.phone}</span>
                                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {customer.email || 'No Email'}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {customer.address || 'Inferred Location'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-12 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Customer Intelligence Layer */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* Satisfaction Card */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Satisfaction Trend</p>
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">92%</h3>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest italic">+5.4% from last month</p>
                        </div>

                        {/* Loyalty Card */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Loyalty Status</p>
                                <Crown className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{customer.tier || 'BRONZE'}</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{customer.points.toLocaleString()} Points Balance</p>
                        </div>

                        {/* Revenue Card */}
                        <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2.5rem] text-white">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Lifetime Value</p>
                                <Zap className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-3xl font-black mb-1">₹{(customer.totalPurchases || 0).toLocaleString()}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Across {customer.purchaseCount || 0} Invoices</p>
                        </div>
                    </div>

                    {/* Detailed CX Stream */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <History className="w-4 h-4" /> Experience History
                            </h4>
                            <div className="space-y-4">
                                {/* Last Feedback */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12" />
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="flex gap-1 text-amber-500">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < cxData.lastFeedback.rating ? 'fill-current' : 'opacity-20'}`} />)}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cxData.lastFeedback.date}</span>
                                    </div>
                                    <p className="text-sm font-medium italic text-slate-700 dark:text-slate-300 mb-4 leading-relaxed line-clamp-2">
                                        "{cxData.lastFeedback.comment}"
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                                            <MessageSquare className="w-3 h-3 text-indigo-600" /> {cxData.lastFeedback.channel}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">
                                            <Smile className="w-3 h-3" /> Positive Sentiment
                                        </div>
                                    </div>
                                </div>

                                {/* Placeholder for past complaints or additional feed */}
                                <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No unresolved complaints found</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Shortcuts */}
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-600 transition-all group">
                                <span className="text-xs font-black uppercase tracking-widest">Send Promo Blast</span>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </button>
                            <button className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-600 transition-all group">
                                <span className="text-xs font-black uppercase tracking-widest">Request Testimonial</span>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Customer360Modal;
