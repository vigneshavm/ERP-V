import React, { useState } from 'react';
import { Search, Filter, Plus, Users, UserPlus, Phone, Mail, MapPin, Briefcase, Activity, ChevronRight, Zap } from 'lucide-react';
import customerData from '../../../mockData/customerData.json';

interface Customer {
    id: string;
    name: string;
    handle: string;
    tier: 'Platinum' | 'Gold' | 'Standard';
    spent: string;
    lastActive: string;
    avatar: string;
    status: 'Active' | 'Dormant';
}

const IconMap: Record<string, React.ElementType> = {
    Users, Activity, Briefcase
};

const MOCK_CUSTOMERS: Customer[] = customerData.MOCK_CUSTOMERS as Customer[];

const CustomerMockUI: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-indigo-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-indigo-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 flex h-screen overflow-hidden">
                {/* Slim Sidebar */}
                <aside className="w-20 border-r border-default glass-panel backdrop-blur-xl flex flex-col items-center py-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-12">
                        <Users className="w-6 h-6 text-main" />
                    </div>
                    <nav className="flex flex-col gap-6">
                        {customerData.sidebarNav.map((item, idx) => {
                            const Icon = IconMap[item.iconName];
                            return (
                                <button key={idx} className={`p-3 rounded-xl transition-all ${item.active ? 'bg-indigo-500/20 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]' : 'text-secondary hover:text-main hover:bg-card'}`}>
                                    {Icon && <Icon className="w-6 h-6" />}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <header className="h-24 px-10 flex items-center justify-between border-b border-default bg-slate-900/20 backdrop-blur-md">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                                Client Directory
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs uppercase tracking-widest font-black">CRM Active</span>
                            </h1>
                            <p className="text-sm text-secondary mt-1 font-medium tracking-wide">Manage customer relationships and intelligence data.</p>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="relative group">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-indigo-400 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search registry..." 
                                    className="w-72 glass-panel border border-default rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-main placeholder:text-slate-600"
                                />
                            </div>
                            <button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-main font-bold text-sm tracking-wide rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2">
                                <UserPlus className="w-4 h-4" /> Add Client
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 flex overflow-hidden">
                        {/* List Section */}
                        <div className="w-1/3 border-r border-default flex flex-col bg-slate-900/10">
                            <div className="p-6 border-b border-default flex justify-between items-center">
                                <h2 className="text-xs font-black uppercase tracking-widest text-muted">Total Contacts ({customerData.totalContacts})</h2>
                                <button className="text-muted hover:text-main transition-colors">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {MOCK_CUSTOMERS.map((customer, idx) => (
                                    <div key={customer.id} className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 ${idx === 0 ? 'bg-card border-indigo-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-slate-900/30 border-default hover:bg-card/40 hover:border-default'}`}>
                                        <div className="relative">
                                            <img src={customer.avatar} alt={customer.name} className="w-12 h-12 rounded-full object-cover border-2 border-default group-hover:border-indigo-400 transition-colors" />
                                            {customer.status === 'Active' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-main truncate">{customer.name}</h3>
                                            <p className="text-xs text-secondary font-mono truncate">{customer.handle}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1 mb-1 ${customer.tier === 'Platinum' ? 'bg-indigo-500/10 text-indigo-400' : customer.tier === 'Gold' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-muted'}`}>
                                                {customer.tier === 'Platinum' && <Zap className="w-3 h-3" />}
                                                {customer.tier}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detail Section */}
                        <div className="flex-1 flex flex-col overflow-y-auto p-10 relative">
                            {/* Profile Hero */}
                            <div className="flex items-start gap-8 mb-12 relative z-10">
                                <img src={MOCK_CUSTOMERS[0].avatar} alt={MOCK_CUSTOMERS[0].name} className="w-32 h-32 rounded-3xl object-cover shadow-2xl border-4 border-default" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-4xl font-black text-main tracking-tight">{MOCK_CUSTOMERS[0].name}</h2>
                                        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> Platinum Member
                                        </span>
                                    </div>
                                    <p className="text-muted font-mono mb-6">{MOCK_CUSTOMERS[0].handle}</p>
                                    
                                    <div className="flex gap-4">
                                        <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-default rounded-xl text-sm font-bold text-main transition-colors flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> Message
                                        </button>
                                        <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-default rounded-xl text-sm font-bold text-main transition-colors flex items-center gap-2">
                                            <Phone className="w-4 h-4" /> Call
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-6 mb-12 relative z-10">
                                {customerData.stats.map((stat, i) => (
                                    <div key={i} className="glass-panel border border-default rounded-2xl p-6 backdrop-blur-sm hover:bg-card/40 transition-colors">
                                        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">{stat.label}</p>
                                        <p className="text-3xl font-black text-main mb-1">{stat.value}</p>
                                        <p className="text-xs text-indigo-400 font-medium">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Activity */}
                            <div className="relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted mb-6">Recent Transactions</h3>
                                <div className="glass-panel border border-default rounded-2xl overflow-hidden backdrop-blur-sm">
                                    {customerData.recentTransactions.map((tx, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 border-b border-default last:border-0 hover:bg-card/40 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-main">Order #{tx.orderId}</p>
                                                    <p className="text-xs text-secondary mt-0.5">{tx.date} • {tx.items} items</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <span className="text-sm font-mono font-bold text-main">{tx.amount}</span>
                                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerMockUI;
