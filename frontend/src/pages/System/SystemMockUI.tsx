import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Cpu, Database, RefreshCw, Shield, FileSearch, 
    Activity, ArrowRight, MoreHorizontal, Download, 
    Server, Globe, Lock, Code, Zap, Package, 
    Terminal, User, DollarSign, Layers
} from 'lucide-react';
import { salesInvoices, purchases, inventory, branches } from '../../data';
import Layout from '../../components/shared/Layout';

const SystemMockUI: React.FC = () => {
    const navigate = useNavigate();

    const healthMetrics = useMemo(() => {
        return [
            { label: 'Data Latency', val: '12ms', sub: 'NOMINAL PERFORMANCE', icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Sync Integrity', val: '99.9%', sub: 'REPLICATION ACTIVE', icon: RefreshCw, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Database Node', val: '4.2GB', sub: 'PRIMARY CLUSTER', icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { label: 'Security Layer', val: 'Tier 4', sub: 'ENCRYPTION ACTIVE', icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ];
    }, []);

    const modules = [
        { label: 'Sales Engine', status: 'ACTIVE', color: 'emerald', icon: Zap },
        { label: 'Procurement Core', status: 'ACTIVE', color: 'emerald', icon: Server },
        { label: 'Inventory Hub', status: 'ACTIVE', color: 'emerald', icon: Package },
        { label: 'Finance Ledger', status: 'STANDBY', color: 'amber', icon: DollarSign },
        { label: 'HR Management', status: 'ACTIVE', color: 'emerald', icon: User },
        { label: 'POS Terminal', status: 'ONLINE', color: 'emerald', icon: Terminal }
    ];

    const auditLogs = useMemo(() => {
        return [
            { time: '14:22:15', user: 'Admin.Root', action: 'SCHEMA_UPDATE', module: 'Inventory', ip: '192.168.1.1', status: 'Success', color: 'emerald' },
            { time: '13:45:02', user: 'System.Bot', action: 'BATCH_SYNC', module: 'Purchase', ip: '127.0.0.1', status: 'Success', color: 'emerald' },
            { time: '11:12:33', user: 'Manager.Alpha', action: 'CREDENTIAL_CHANGE', module: 'Security', ip: '45.22.11.9', status: 'Warning', color: 'amber' },
            { time: '09:05:11', user: 'Sales.User2', action: 'INVOICE_DELETE', module: 'Sales', ip: '110.12.3.45', status: 'Flagged', color: 'rose' },
            { time: '08:15:59', user: 'System.Auto', action: 'BACKUP_GEN', module: 'Core', ip: '10.0.0.5', status: 'Success', color: 'emerald' }
        ];
    }, []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            System <span className="text-primary">Architecture</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Infrastructure Control Node // Admin Console V4
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Download className="w-4 h-4 text-primary" /> Export Logs
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <RefreshCw className="w-4 h-4" /> Force Protocol Sync
                        </button>
                    </div>
                </div>

                {/* Health Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {healthMetrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black ${card.color} uppercase tracking-[0.2em] transition-colors`}>{card.sub}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                    {/* Left Sidebar - Modules */}
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-6 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" /> Active Core Modules
                            </h3>
                            <div className="space-y-4">
                                {modules.map((mod, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer border-b border-neutral-50 dark:border-neutral-800/50 pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-sm text-neutral-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                                <mod.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-tight">{mod.label}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border bg-${mod.color}-500/10 text-${mod.color}-500 border-${mod.color}-500/20`}>{mod.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 p-6 rounded-sm flex flex-col gap-3 relative overflow-hidden group">
                            <Lock className="w-12 h-12 absolute -right-4 -bottom-4 text-primary/10 group-hover:scale-110 transition-transform" />
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Security Protocol v4.2</h4>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                                End-to-end cryptographic shielding active for all transaction nodes. Zero-trust architecture enforced.
                            </p>
                        </div>
                    </div>

                    {/* Right Content - Audit Logs */}
                    <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white flex items-center gap-2">
                                    <FileSearch className="w-4 h-4 text-primary" /> Institutional Audit Trail
                                </h3>
                                <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden lg:block" />
                                <div className="flex gap-4">
                                    {['ALL EVENTS', 'SECURITY', 'DATA', 'SYSTEM'].map((tab, idx) => (
                                        <button key={tab} className={`text-[9px] font-black uppercase tracking-widest transition-all ${idx === 0 ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}>{tab}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                    <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Identity</th>
                                        <th className="px-6 py-4">Protocol action</th>
                                        <th className="px-6 py-4">Module</th>
                                        <th className="px-6 py-4">Terminal IP</th>
                                        <th className="px-6 py-4">State</th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {auditLogs.map((ev, idx) => (
                                        <tr key={idx} className="hover:bg-primary/[0.02] transition-all group">
                                            <td className="px-6 py-4"><span className="text-[10px] font-mono font-bold text-neutral-400">{ev.time}</span></td>
                                            <td className="px-6 py-4"><span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tight">{ev.user}</span></td>
                                            <td className="px-6 py-4"><span className="text-[10px] font-black text-primary uppercase tracking-widest">{ev.action}</span></td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                                                    {ev.module}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4"><span className="text-[10px] font-mono text-neutral-500">{ev.ip}</span></td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-${ev.color}-500 shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest text-${ev.color}-500`}>{ev.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="p-2 text-neutral-300 hover:text-primary transition-all">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SystemMockUI;
