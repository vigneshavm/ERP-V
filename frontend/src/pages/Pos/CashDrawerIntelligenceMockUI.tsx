import React, { useMemo } from 'react';
import { Activity, Clock, ShieldCheck, DollarSign, Zap, ArrowRight, User, Terminal } from 'lucide-react';
import { salesInvoices, MockSalesInvoice } from '../../data';
import Layout from '../../components/shared/Layout';

const CashDrawerIntelligenceMockUI: React.FC = () => {
    const metrics = useMemo(() => {
        const totalCashSales = (salesInvoices as MockSalesInvoice[]).reduce((sum, s) => sum + s.total, 0);
        return [
            { title: 'Liquid Reserve', value: `₹${(totalCashSales/1000).toFixed(1)}k`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { title: 'Terminal Uptime', value: '18h 42m', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
            { title: 'Integrity Score', value: '100%', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { title: 'Ops Velocity', value: '14 tx/h', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ];
    }, []);

    const shifts = useMemo(() => [
        { terminal: 'TERMINAL_01', cashier: 'Alex Johnson', status: 'ACTIVE', time: 'Started 08:00 AM', amount: '₹12,450' },
        { terminal: 'TERMINAL_02', cashier: 'Sarah Smith', status: 'ACTIVE', time: 'Started 09:30 AM', amount: '₹8,200' },
        { terminal: 'KIOSK_A', cashier: 'Automated', status: 'ONLINE', time: 'System Ready', amount: '₹1,500' }
    ], []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                            Drawer <span className="text-primary italic">Intelligence</span>
                            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5" /> Ops Dashboard
                            </span>
                        </h1>
                        <p className="text-[10px] text-neutral-500 mt-1 font-black uppercase tracking-[0.2em] opacity-70">Physical Liquidity & Terminal Oversight</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-main font-black uppercase tracking-widest text-[10px] rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-primary" /> Terminals
                        </button>
                        <button className="h-11 px-8 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90">
                            Reconcile All
                        </button>
                    </div>
                </header>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((kpi, idx) => (
                        <div key={idx} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-4 rounded-sm ${kpi.bg} ${kpi.color} border border-current/10`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black ${kpi.color} uppercase tracking-[0.2em] transition-colors`}>Nominal</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{kpi.title}</p>
                                <p className="text-3xl font-display font-black tracking-tighter text-main tabular-nums">{kpi.value}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Operational Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                Live Node Status // Terminals
                            </h2>
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
                                                <User className="w-3 h-3 text-neutral-400" />
                                                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{shift.cashier}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-lg font-display font-black text-main tabular-nums tracking-tighter">{shift.amount}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">{shift.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
                        <div className="w-32 h-32 rounded-full border-2 border-dashed border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-8 relative z-10 group-hover:rotate-45 transition-transform duration-1000">
                            <DollarSign className="w-12 h-12 text-neutral-200 dark:text-neutral-700" />
                        </div>
                        <h2 className="text-sm font-black text-main uppercase tracking-[0.2em] mb-4 relative z-10">Advanced Analytics</h2>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs font-medium leading-relaxed uppercase tracking-widest opacity-60 mb-8 relative z-10">
                            Drill-down insights for cash variances, drops, and disbursements will be computed upon shift finalization.
                        </p>
                        <button className="w-full py-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-3 relative z-10">
                            Audit Reports <ArrowRight className="w-4 h-4" />
                        </button>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CashDrawerIntelligenceMockUI;
