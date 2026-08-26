import React, { useState } from 'react';
import {
    Ticket,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    TrendingUp,
    Users,
    ArrowRight,
    BarChart3,
    Zap,
    Sparkles,
    Eye,
    Clock,
    LayoutDashboard,
    AlertTriangle,
    ShieldAlert,
    Share2,
    Calendar,
    MousePointer2,
    CheckCircle2
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '@/redux/slices/uiSlice';

const MarketingCoupons: React.FC = () => {
    const dispatch = useDispatch();
    const [viewMode, setViewMode] = useState<'inventory' | 'create'>('inventory');

    const coupons = [
        {
            id: 'cp1',
            code: 'SUMMER50',
            type: 'PERCENTAGE',
            value: '50%',
            status: 'ACTIVE',
            usage: '1,240 / 5,000',
            revenue: '₹1,24,500',
            expiry: '2026-08-31',
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            id: 'cp2',
            code: 'WELCOME100',
            type: 'FIXED',
            value: '₹100 Off',
            status: 'ACTIVE',
            usage: '842 / Unlimited',
            revenue: '₹84,200',
            expiry: 'No Expiry',
            color: 'text-emerald-600',
            bg: 'bg-success/10'
        },
        {
            id: 'cp3',
            code: 'FESTIVAL2026',
            type: 'BOGO',
            value: 'Buy 1 Get 1',
            status: 'SCHEDULED',
            usage: '0 / 1,000',
            revenue: '₹0',
            expiry: '2026-10-30',
            color: 'text-amber-600',
            bg: 'bg-warning/10'
        }
    ];

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200 dark:border-emerald-800/50';
            case 'SCHEDULED': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-blue-200 dark:border-blue-800/50';
            case 'EXPIRED': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 border-rose-200 dark:border-rose-800/50';
            default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                        Marketing <span className="text-primary dark:text-primary">Coupons</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Incentivize growth with high-performance discount architecture.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Create Coupon
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('GROW_DASHBOARD'))}
                        className="flex items-center gap-2 px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-sm transition-all shadow-sm active:scale-95"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Premium Coupon KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Sales Revenue', value: '₹4,82,500', icon: BarChart3, color: 'text-primary', trend: '+24% from ads', sub: 'Last 30 days' },
                    { label: 'Redemption Rate', value: '32.4%', icon: Ticket, color: 'text-emerald-600', trend: 'High conversion', sub: 'vs 18% industry' },
                    { label: 'Avg. Discount Val', value: '₹145', icon: Zap, color: 'text-blue-600', trend: 'Optimal margin', sub: 'Healthy balance' },
                    { label: 'Unique Customers', value: '3,842', icon: Users, color: 'text-amber-600', trend: '+12% win-back', sub: 'New vs Returning' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">{kpi.label}</p>
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="text-3xl font-black mb-1">{kpi.value}</h3>
                                    <p className="text-[9px] font-bold text-success flex items-center gap-1 uppercase tracking-widest">
                                        {kpi.trend}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 bg-slate-50 dark:bg-slate-900/50 rounded-sm flex items-center justify-center ${kpi.color}`}>
                                    <kpi.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-[9px] mt-4 text-slate-400 italic font-medium">{kpi.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coupon Inventory Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black italic tracking-tight">Active Coupons</h3>
                            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                                {coupons.length} Active
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search codes..."
                                    className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold w-full md:w-48 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                />
                            </div>
                            <button className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary transition-all shadow-sm">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Coupon Identity</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Value</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Revenue</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 ${coupon.bg} ${coupon.color} rounded-sm flex flex-col items-center justify-center border border-current opacity-70`}>
                                                    <Ticket className="w-5 h-5 mb-0.5" />
                                                    <span className="text-[8px] font-black uppercase">{coupon.type.slice(0, 3)}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-slate-900 dark:text-white tracking-widest">{coupon.code}</p>
                                                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all">
                                                            <Share2 className="w-3 h-3 text-slate-400" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usage: {coupon.usage}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className="text-sm font-black text-primary">{coupon.value}</span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex flex-col">
                                                <span className="text-sm font-black">{coupon.revenue}</span>
                                                <span className="text-[9px] font-bold text-success uppercase tracking-tighter">ROI 12x</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right space-y-2">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(coupon.status)}`}>
                                                {coupon.status}
                                            </span>
                                            <p className="text-[9px] font-bold text-slate-400 italic">Expires: {coupon.expiry}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Insights Analyzed: 142</span>
                    </div>
                </div>

                {/* Intelligence Side Panel */}
                <div className="space-y-8">
                    {/* Fraud Prevention Widget */}
                    <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center gap-2 mb-4 opacity-80">
                            <ShieldAlert className="w-5 h-5 text-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Security Pulse</span>
                        </div>
                        <h4 className="text-xl font-black mb-2 tracking-tight">AI Fraud Sentinel</h4>
                        <p className="text-sm font-medium text-rose-100 leading-relaxed opacity-90 italic">
                            Redemption patterns are 100% healthy. No multi-account abuse detected in the last 24 hours.
                        </p>
                        <div className="mt-6 flex items-center justify-between bg-white/10 p-4 rounded-sm border border-white/10">
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60">Risk Profile</p>
                                <p className="text-sm font-black">Very Low</p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                        </div>
                    </div>

                    {/* AI Suggestions Box */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group border border-slate-800">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-primary shadow-indigo-500" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Growth Optimization</h4>
                        </div>
                        <h3 className="text-xl font-black mb-4 tracking-tight leading-tight italic">Viral Potential Detected!</h3>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">
                            "SUMMER50" is being shared heavily on WhatsApp. Increase stock for beachwear to capitalize on the 32% growth.
                        </p>
                        <button className="w-full py-4 bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                            Launch Shared Viral Campaign
                        </button>
                    </div>

                    {/* Attribution Visualization */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center justify-between">
                            Attribution Sources <TrendingUp className="w-4 h-4" />
                        </h4>
                        <div className="space-y-6">
                            {[
                                { name: 'WhatsApp Shares', value: '42%', color: 'bg-emerald-500' },
                                { name: 'Instagram Ads', value: '28%', color: 'bg-indigo-500' },
                                { name: 'Email Newsletter', value: '20%', color: 'bg-blue-500' },
                                { name: 'Other', value: '10%', color: 'bg-slate-300' }
                            ].map((src, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{src.name}</span>
                                        <span className="text-xs font-black">{src.value}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${src.color}`}
                                            style={{ width: src.value }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-indigo-600 transition-all">
                            View Detailed Attribution Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingCoupons;

