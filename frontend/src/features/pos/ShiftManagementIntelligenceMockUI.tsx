import React, { useMemo } from 'react';
import { Clock, ShieldCheck, Zap, Users, Monitor, TrendingUp, ArrowRightLeft, Plus, Terminal, User } from 'lucide-react';
import Layout from '../../components/shared/Layout/index';

const ShiftManagementIntelligenceMockUI: React.FC = () => {
    const metrics = useMemo(() => [
        { title: 'Active Shifts', value: '08', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { title: 'Avg Duration', value: '7.4h', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { title: 'Reconciled', value: '100%', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { title: 'Volume/Shift', value: '₹2.4k', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' }
    ], []);

    const shifts = useMemo(() => [
        { terminal: 'TERMINAL_A1', cashier: 'Alex V.', status: 'ACTIVE', time: 'Started 08:00 AM', amount: '₹12,450' },
        { terminal: 'TERMINAL_B2', cashier: 'Sarah M.', status: 'ACTIVE', time: 'Started 09:30 AM', amount: '₹8,200' },
        { terminal: 'COUNTER_MAIN', cashier: 'John D.', status: 'CLOSED', time: 'Ended 05:00 PM', amount: '₹24,100' }
    ], []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                            Shift <span className="text-primary italic">Operations</span>
                            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5" /> Live Control
                            </span>
                        </h1>
                        <p className="text-[10px] text-neutral-500 mt-1 font-black uppercase tracking-[0.2em] opacity-70">Terminal Handover & Drawer Management</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-main font-black uppercase tracking-widest text-[10px] rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-primary" /> System Logs
                        </button>
                        <button className="h-11 px-8 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Open New Shift
                        </button>
                    </div>
                </header>

                {/* Operational Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((kpi, idx) => (
                        <div key={idx} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-4 rounded-sm ${kpi.bg} ${kpi.color} border border-current/10`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Operational</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{kpi.title}</p>
                                <p className="text-3xl font-display font-black tracking-tighter text-main tabular-nums">{kpi.value}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Shift Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                Terminal Node Matrix
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Protocol Sync Nominal</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-4">
                            {shifts.map((shift, i) => (
                                <div key={i} className="flex justify-between items-center p-6 bg-neutral-50 dark:bg-neutral-950 rounded-sm border border-neutral-200 dark:border-neutral-800 group hover:border-primary/30 transition-all cursor-pointer">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-sm bg-white dark:bg-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 shadow-sm group-hover:text-primary transition-colors">
                                            <Terminal className="w-6 h-6 text-neutral-300" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-main uppercase tracking-tight italic">{shift.terminal}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <User className="w-3.5 h-3.5 text-neutral-400" />
                                                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{shift.cashier}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${shift.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700'}`}>
                                            {shift.status}
                                        </span>
                                        <p className="text-[10px] font-mono text-neutral-400 mt-2 flex items-center justify-end gap-1.5 opacity-60">
                                            <Clock className="w-3 h-3" /> {shift.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-6 group-hover:rotate-45 transition-all duration-1000">
                                <TrendingUp className="w-10 h-10 text-primary/40" />
                            </div>
                            <h2 className="text-sm font-black text-main uppercase tracking-[0.2em] mb-4">Performance Index</h2>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed uppercase tracking-widest opacity-60 mb-8">
                                Variance tracking and automated cash-drop triggers initialized for current cycle.
                            </p>
                            <div className="w-full space-y-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-neutral-400">Target Efficiency</span>
                                    <span className="text-main">94%</span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="w-[85%] h-full bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 p-6 rounded-sm flex items-center gap-4 group cursor-pointer hover:bg-primary/10 transition-all">
                            <div className="p-3 bg-primary text-white rounded-sm shadow-lg shadow-primary/20">
                                <ArrowRightLeft className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-main uppercase tracking-widest">Pending Handovers</h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">2 Cycles Awaiting Review</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ShiftManagementIntelligenceMockUI;
