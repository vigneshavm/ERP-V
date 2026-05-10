import React from 'react';
import { Activity, Clock, ShieldCheck, DollarSign, Zap, Users, Monitor, TrendingUp, ArrowRightLeft, CreditCard, Plus } from 'lucide-react';
import shiftManagementIntelligenceData from '../../mockData/shiftManagementIntelligenceData.json';

const IconMap: Record<string, React.ElementType> = {
    Activity, Clock, ShieldCheck, DollarSign, Zap, Users, Monitor, TrendingUp, ArrowRightLeft, CreditCard
};

const ShiftManagementIntelligenceMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-indigo-500/30 overflow-y-auto">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-main flex items-center gap-4">
                            Shift Operations
                            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Live Control
                            </span>
                        </h1>
                        <p className="text-muted font-medium tracking-wide mt-2">Managing terminal handovers and drawer reconciliations.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all text-xs font-black uppercase tracking-widest">
                            <Plus className="w-4 h-4" /> Open New Shift
                        </button>
                    </div>
                </header>

                {/* Operational Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {shiftManagementIntelligenceData.metrics.map((kpi, idx) => {
                        const Icon = IconMap[kpi.icon] || Activity;
                        return (
                            <div key={idx} className="glass-panel border border-default rounded-3xl p-6 group hover:border-indigo-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">ACTIVE</span>
                                </div>
                                <p className="text-3xl font-black text-main tracking-tighter mb-1">{kpi.value}</p>
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{kpi.title}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Monitoring Station */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Live Status */}
                    <div className="lg:col-span-2 glass-panel rounded-3xl border border-default overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-default flex justify-between items-center bg-card/30">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-secondary flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-indigo-400" /> Terminal Node Status
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Sync: 100%</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {shiftManagementIntelligenceData.shifts.map((shift, i) => (
                                <div key={i} className="p-5 bg-card/50 rounded-2xl border border-default flex justify-between items-center hover:translate-x-1 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-app rounded-xl border border-default flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-all">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-main tracking-tight">{shift.terminal}</h3>
                                            <p className="text-[11px] font-bold text-secondary flex items-center gap-1.5 mt-1">
                                                <ShieldCheck className="w-3 h-3 text-emerald-400" /> {shift.cashier}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            {shift.status}
                                        </span>
                                        <p className="text-[10px] font-mono text-secondary mt-2 flex items-center justify-end gap-1.5 opacity-60">
                                            <Clock className="w-3 h-3" /> {shift.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="space-y-8">
                        <div className="glass-panel p-8 rounded-3xl border border-default flex flex-col items-center text-center group hover:border-indigo-500/30 transition-all">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:rotate-12 transition-all duration-500">
                                <TrendingUp className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-black text-main mb-2 tracking-tight">Drawer Performance</h2>
                            <p className="text-xs text-secondary font-medium leading-relaxed px-4">Variance analysis and automated cash-drop reminders will trigger here.</p>
                            
                            <div className="w-full mt-8 pt-8 border-t border-default space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-secondary">Expected Cash</span>
                                    <span className="text-main">₹4,250.00</span>
                                </div>
                                <div className="w-full h-1.5 bg-app rounded-full overflow-hidden">
                                    <div className="w-[85%] h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl border border-default bg-indigo-600/5 flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl text-white">
                                <ArrowRightLeft className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-main uppercase tracking-widest">Shift Handovers</h3>
                                <p className="text-[10px] font-bold text-secondary mt-1">2 Handovers pending review.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ShiftManagementIntelligenceMockUI;
