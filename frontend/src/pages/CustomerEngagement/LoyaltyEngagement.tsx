import React, { useState } from 'react';
import {
    Gift,
    Star,
    TrendingUp,
    Users,
    Award,
    Coins,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Settings,
    Plus,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Clock,
    Zap,
    ChevronRight,
    LayoutDashboard,
    Smartphone,
    Mail,
    CreditCard,
    AlertCircle,
    UserCheck,
    Percent,
    Crown,
    History,
    Download
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { setActiveTab } from '@/redux/slices/uiSlice';

const LoyaltyEngagement: React.FC = () => {
    const dispatch = useDispatch();
    const [activeSection, setActiveSection] = useState<'DASHBOARD' | 'WALLET' | 'RULES' | 'TIERS'>('DASHBOARD');

    const tiers = [
        { id: 'bronze', name: 'Bronze', minSpend: 0, multiplier: 1, members: 8420, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-200' },
        { id: 'silver', name: 'Silver', minSpend: 10000, multiplier: 1.25, members: 2150, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-300' },
        { id: 'gold', name: 'Gold', minSpend: 50000, multiplier: 1.5, members: 640, color: 'text-warning', bg: 'bg-warning/10', border: 'border-amber-200' },
        { id: 'vip', name: 'VIP', minSpend: 150000, multiplier: 2, members: 124, color: 'text-primary', bg: 'bg-primary/10', border: 'border-indigo-200' }
    ];

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-sm flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Crown className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none italic uppercase">
                            Loyalty <span className="text-primary">& Rewards</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Drive customer retention with automated tiers, complex rules, and AI insights.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => dispatch(setActiveTab('GROW_DASHBOARD'))}
                        className="p-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-sm transition-all shadow-sm"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-3 px-6 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                        <Plus className="w-4 h-4" /> Add Rule
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-fit shadow-sm">
                {(['DASHBOARD', 'WALLET', 'RULES', 'TIERS'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveSection(tab)}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeSection === 'DASHBOARD' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* KPI Pulse */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Active Members', value: '11,334', change: '+12%', icon: Users, color: 'text-primary', bg: 'bg-indigo-50' },
                            { label: 'Points Issued', value: '1.2M', change: '₹12.4L Value', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Redemption Rate', value: '34.2%', change: '+5.4% ROI', icon: Percent, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Loyalty Revenue', value: '₹48.2L', change: '18% of Total', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' }
                        ].map((kpi, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bg} dark:opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
                                <kpi.icon className={`w-8 h-8 ${kpi.color} mb-4 relative z-10`} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">{kpi.label}</p>
                                <h3 className="text-3xl font-black mb-1 relative z-10">{kpi.value}</h3>
                                <p className="text-[10px] font-bold text-success flex items-center gap-1 relative z-10">{kpi.change}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Tier Distribution */}
                        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black italic uppercase tracking-tight">Tier Distribution</h3>
                                <button className="text-[10px] font-black uppercase tracking-widest text-primary">View Tier Factory</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {tiers.map(tier => (
                                    <div key={tier.id} className={`p-6 rounded-[2rem] border-2 ${tier.border} ${tier.bg} relative group hover:scale-105 transition-all cursor-pointer`}>
                                        <div className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border ${tier.border} flex items-center justify-center ${tier.color} mb-4`}>
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <h4 className={`text-sm font-black uppercase tracking-widest ${tier.color} mb-1`}>{tier.name}</h4>
                                        <p className="text-2xl font-black mb-2">{tier.members}</p>
                                        <div className="w-full h-1.5 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                                            <div className={`h-full bg-current ${tier.color}`} style={{ width: `${(tier.members / 11334) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Intelligence Layer */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">
                            <div className="bg-slate-900 dark:bg-indigo-950 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                                <div className="flex items-center gap-2 mb-6 text-primary">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Retention AI</h4>
                                </div>
                                <h3 className="text-xl font-black mb-6 tracking-tight leading-tight italic">Churn Risk Detected</h3>
                                <div className="space-y-4">
                                    <div className="p-5 bg-white/5 border border-white/10 rounded-sm">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">High Risk Segment</p>
                                        <p className="text-sm font-medium italic mb-3">84 "Silver" members haven't shopped in 45 days.</p>
                                        <button className="w-full py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors">
                                            Send Bonus 200 Pts Blast
                                        </button>
                                    </div>
                                    <div className="p-5 bg-white/5 border border-white/10 rounded-sm">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-success mb-2">Growth Opportunity</p>
                                        <p className="text-sm font-medium italic mb-1">Top 2% customers are currently Gold.</p>
                                        <p className="text-xs text-slate-400 font-medium italic">Suggest VIP upgrade with "Fast-Track" promo.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'RULES' && (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div>
                            <h3 className="text-xl font-black italic uppercase tracking-tight">Rules Architect</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Define earning & redemption logic</p>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all">
                            <Zap className="w-4 h-4" /> New Automation
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="space-y-4">
                            {[
                                { name: 'Standard Earning', rule: '1 Pt per ₹100 spent', status: 'ACTIVE', type: 'EARNING' },
                                { name: 'Festival Bonus', rule: '2x Multiplier on Ethnic Wear', status: 'SCHEDULED', type: 'BONUS' },
                                { name: 'VIP Redemption', rule: '1 Pt = ₹0.50 for VIPs', status: 'ACTIVE', type: 'REDEMPTION' },
                                { name: 'First Purchase', rule: 'Fixed 500 Pts for new users', status: 'ACTIVE', type: 'EARNING' }
                            ].map((rule, idx) => (
                                <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${rule.type === 'EARNING' ? 'bg-success/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                            {rule.type === 'EARNING' ? <ArrowUpRight className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{rule.name}</h4>
                                            <p className="text-sm font-medium text-slate-500 italic mt-0.5">{rule.rule}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${rule.status === 'ACTIVE' ? 'bg-success/10 text-emerald-600' : 'bg-warning/10 text-amber-600'}`}>
                                            {rule.status}
                                        </span>
                                        <button className="p-3 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-primary transition-colors shadow-sm">
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'WALLET' && (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black italic uppercase tracking-tight">Loyalty Wallet Manager</h3>
                            <div className="flex gap-2">
                                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-all border border-slate-200 dark:border-slate-700">
                                    <Download className="w-5 h-5" />
                                </button>
                                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-all border border-slate-200 dark:border-slate-700">
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, phone or customer ID..."
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-sm text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-50 dark:border-slate-800">
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Tier</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Points Balance</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Lifetime Earned</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {[
                                    { name: 'Aditi Sharma', phone: '9876543210', tier: 'VIP', balance: '12,450', lifetime: '45,000', color: 'text-primary', bg: 'bg-indigo-50' },
                                    { name: 'Vikram Malhotra', phone: '9988776655', tier: 'Gold', balance: '4,120', lifetime: '18,500', color: 'text-warning', bg: 'bg-amber-50' },
                                    { name: 'Neha Kapoor', phone: '9123456789', tier: 'Silver', balance: '840', lifetime: '5,200', color: 'text-slate-400', bg: 'bg-slate-50' },
                                    { name: 'Rahul Khanna', phone: '9001122334', tier: 'Bronze', balance: '120', lifetime: '1,200', color: 'text-orange-500', bg: 'bg-orange-50' }
                                ].map((row, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 ${row.bg} ${row.color} rounded-xl flex items-center justify-center font-black`}>
                                                    {row.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white">{row.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-1 bg-white dark:bg-slate-800 border-2 rounded-full text-[9px] font-black uppercase tracking-widest ${row.color}`}>
                                                {row.tier}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <p className="font-black text-sm text-primary">{row.balance}</p>
                                        </td>
                                        <td className="p-8">
                                            <p className="font-black text-sm">{row.lifetime}</p>
                                        </td>
                                        <td className="p-8 text-right">
                                            <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-colors shadow-sm">
                                                <History className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoyaltyEngagement;
