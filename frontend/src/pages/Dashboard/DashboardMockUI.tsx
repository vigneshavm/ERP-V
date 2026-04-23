import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Users, Box, Banknote, ShieldCheck, Zap, AlertTriangle, Briefcase, ChevronRight } from 'lucide-react';

const DashboardMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-y-auto">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Header Section */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                            Central Command
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Activity className="w-3 h-3" /> System Nominal
                            </span>
                        </h1>
                        <p className="text-slate-400 font-medium tracking-wide mt-2">Institutional fiscal and operational overview.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">Current Cycle</p>
                        <p className="text-2xl font-mono font-bold text-indigo-400">Q2 2026</p>
                    </div>
                </header>

                {/* Primary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Gross Revenue', val: '₹14.2M', trend: '+12.5%', isUp: true, icon: Banknote, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'Active Orders', val: '842', trend: '+5.2%', isUp: true, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                        { label: 'Inventory Cost', val: '₹4.8M', trend: '-2.1%', isUp: false, icon: Box, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                        { label: 'Client Base', val: '4,291', trend: '+18.4%', isUp: true, icon: Users, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' }
                    ].map((kpi, i) => (
                        <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
                            <div className={`absolute -right-6 -top-6 w-24 h-24 ${kpi.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-3 ${kpi.bg} ${kpi.color} rounded-2xl border ${kpi.border}`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${kpi.isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                    {kpi.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {kpi.trend}
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="text-3xl font-black text-white tabular-nums tracking-tighter mb-1">{kpi.val}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Analytics Chart Area */}
                    <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Revenue Trajectory</h3>
                                <p className="text-xs text-slate-500 mt-1">Daily fiscal performance across all operational nodes.</p>
                            </div>
                            <div className="flex gap-2">
                                {['1W', '1M', '3M', '1Y'].map((t, i) => (
                                    <button key={t} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${i === 1 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:bg-slate-800/50 border border-transparent'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 min-h-[300px] flex items-end gap-3 pt-10 relative">
                            {/* Mock Bar Chart */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                {[1, 2, 3, 4, 5].map(line => (
                                    <div key={line} className="w-full h-px bg-slate-700" />
                                ))}
                            </div>
                            {[40, 65, 45, 80, 55, 90, 75, 100, 60, 85, 70, 95].map((h, i) => (
                                <div key={i} className="flex-1 group relative flex flex-col justify-end h-full">
                                    <div 
                                        className={`w-full rounded-t-lg transition-all duration-1000 ${i === 7 ? 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-slate-800 group-hover:bg-indigo-500/50'}`}
                                        style={{ height: `${h}%` }}
                                    />
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded shadow-xl transition-opacity z-20">
                                        ₹{h}k
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alerts / Action Center */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">System Alerts</h3>
                            <span className="w-6 h-6 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-[10px] font-black">3</span>
                        </div>
                        <div className="flex-1 space-y-4">
                            {[
                                { title: 'Low Stock: Neural Link Gen 3', desc: 'Only 15 units remaining in Main Warehouse.', icon: Box, color: 'rose' },
                                { title: 'Pending Approval', desc: 'Purchase Order #PO-2026-042 awaits authorization.', icon: ShieldCheck, color: 'amber' },
                                { title: 'Unreconciled Bank Entries', desc: '5 entries found in HDFC statement sync.', icon: Banknote, color: 'indigo' },
                                { title: 'Server Load Spike', desc: 'Database node scaling activated successfully.', icon: Zap, color: 'emerald' }
                            ].map((alert, i) => (
                                <div key={i} className="p-4 rounded-2xl border border-slate-800/50 bg-slate-900/50 hover:bg-slate-800/50 transition-colors cursor-pointer group flex items-start gap-4">
                                    <div className={`p-2 rounded-xl bg-${alert.color}-500/10 text-${alert.color}-400 mt-1`}>
                                        <alert.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{alert.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{alert.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 rounded-xl border border-slate-700 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                            View All Events <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardMockUI;
