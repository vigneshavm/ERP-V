import React from 'react';
import { Cpu, Database, RefreshCw, Shield, FileSearch, HardDrive, Activity, AlertTriangle, CheckCircle2, Clock, ArrowRight, MoreHorizontal, Download } from 'lucide-react';
import systemData from '../../mockData/systemData.json';

const IconMap: Record<string, React.ElementType> = {
    Activity, RefreshCw, FileSearch, Database, HardDrive, Shield, Cpu
};

const SystemMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-slate-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[10%] w-[45%] h-[45%] bg-card/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[0%] left-[0%] w-[35%] h-[35%] bg-zinc-700/10 rounded-full blur-[140px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                            System & Architecture
                            <span className="px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-muted rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Cpu className="w-3 h-3" /> Admin Console
                            </span>
                        </h1>
                        <p className="text-sm text-secondary mt-1 font-medium">Sync, data management, audit logs, and infrastructure intelligence.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-card hover:bg-card text-main font-bold text-sm tracking-wide rounded-xl transition-all border border-default flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export Audit
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-slate-600 to-zinc-600 hover:from-slate-500 hover:to-zinc-500 text-main font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(100,116,139,0.3)] flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Force Sync
                        </button>
                    </div>
                </header>

                {/* System Health Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {systemData.healthMetrics.map((card, i) => {
                        const Icon = IconMap[card.icon];
                        return (
                            <div key={i} className={`glass-panel backdrop-blur-md rounded-2xl p-6 border ${card.border} group hover:bg-card/80 transition-all cursor-pointer`}>
                                <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}>
                                    {Icon && <Icon className="w-5 h-5" />}
                                </div>
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{card.label}</p>
                                <p className="text-2xl font-black tracking-tighter mt-1 text-main">{card.val}</p>
                                <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-6 flex-1">
                    {/* Left — System Modules */}
                    <div className="w-72 flex flex-col gap-4">
                        <div className="glass-panel backdrop-blur-xl border border-default rounded-3xl p-5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">System Modules</h3>
                            {systemData.modules.map((mod, i) => {
                                const Icon = IconMap[mod.icon];
                                return (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-default last:border-0 group cursor-pointer">
                                        <div className="flex items-center gap-2.5">
                                            {Icon && <Icon className="w-4 h-4 text-secondary group-hover:text-main transition-colors" />}
                                            <span className="text-sm font-bold text-main">{mod.label}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-${mod.color}-500/10 text-${mod.color}-400 border border-${mod.color}-500/20`}>{mod.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right — Audit Log Table */}
                    <div className="flex-1 glass-panel backdrop-blur-xl border border-default rounded-3xl flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-default flex justify-between items-center bg-card">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                <FileSearch className="w-4 h-4" /> Recent Audit Events
                            </h3>
                            <div className="flex gap-2">
                                {systemData.auditTabs.map((tab, idx) => (
                                    <button key={tab} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${idx === 0 ? 'bg-card text-main border border-default' : 'text-secondary hover:text-main'}`}>{tab}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-app sticky top-0 z-20 backdrop-blur-md">
                                    <tr>
                                        {['Timestamp', 'User', 'Action', 'Module', 'IP Address', 'Status', ''].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {systemData.auditLogs.map((ev, idx) => (
                                        <tr key={idx} className="hover:bg-card/30 transition-colors group">
                                            <td className="px-6 py-4"><span className="text-xs font-mono text-muted">{ev.time}</span></td>
                                            <td className="px-6 py-4"><span className="text-sm font-bold text-main">{ev.user}</span></td>
                                            <td className="px-6 py-4"><span className="text-sm font-bold text-main">{ev.action}</span></td>
                                            <td className="px-6 py-4"><span className="px-2.5 py-1 bg-card border border-default rounded-lg text-[10px] font-black uppercase tracking-widest text-muted">{ev.module}</span></td>
                                            <td className="px-6 py-4"><span className="text-xs font-mono text-secondary">{ev.ip}</span></td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {ev.status === 'Flagged' ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : ev.status === 'Warning' ? <Clock className="w-3.5 h-3.5 text-amber-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                                    <span className={`text-[10px] font-black uppercase tracking-widest text-${ev.color}-400`}>{ev.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-muted hover:text-main bg-card hover:bg-card rounded-lg transition-colors"><ArrowRight className="w-3.5 h-3.5" /></button>
                                                <button className="p-1.5 text-muted hover:text-main bg-card hover:bg-card rounded-lg transition-colors"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SystemMockUI;
