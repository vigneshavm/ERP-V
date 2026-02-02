import React, { useState, useEffect } from 'react';
import {
    Activity,
    Server,
    Smartphone,
    Monitor,
    ShieldCheck,
    AlertTriangle,
    Zap,
    History,
    RefreshCcw,
    Database,
    Lock,
    Globe,
    Cpu,
    Network,
    ArrowRight,
    Search,
    Filter,
    MoreHorizontal,
    Trash2,
    Power,
    Map
} from 'lucide-react';
import { SyncIntelligenceService } from "../../../../services/SyncIntelligenceService";
import { DeviceRegistryEntry, SyncLedgerEntry } from "../../../../types/tenant";

const SyncIntelligence: React.FC = () => {
    const [devices, setDevices] = useState<DeviceRegistryEntry[]>([]);
    const [ledger, setLedger] = useState<SyncLedgerEntry[]>([]);
    const [anomalies, setAnomalies] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'DEVICES' | 'LEDGER' | 'BACKUPS'>('DASHBOARD');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        const devList = await SyncIntelligenceService.getDevices();
        const ledList = await SyncIntelligenceService.getLedger();
        const anomalyList = await SyncIntelligenceService.detectAnomalies(devList);
        setDevices(devList);
        setLedger(ledList);
        setAnomalies(anomalyList);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-indigo-600/20 transition-all duration-1000" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full -ml-32 -mb-32 blur-[80px]" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 border border-indigo-500/30">
                            <Cpu className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight leading-none italic uppercase">
                                Sync <span className="text-indigo-400">Intelligence</span>
                            </h1>
                            <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">The Nervous System of Retail Reliability</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Pulse Active
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Auto-refreshing every 5s</span>
                    </div>
                    <button className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">
                        <ShieldCheck className="w-4 h-4" /> Global Force Resync
                    </button>
                </div>
            </div>

            {/* Navigation Layer */}
            <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-[2rem] w-fit shadow-lg">
                {(['DASHBOARD', 'DEVICES', 'LEDGER', 'BACKUPS'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'DASHBOARD' && (
                <div className="space-y-8 animate-in fade-in duration-700">
                    {/* Critical Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Active Nodes', value: devices.filter(d => d.isOnline).length, total: devices.length, icon: Server, color: 'text-indigo-400' },
                            { label: 'Sync Health', value: '98.4%', total: 'Target: 99.9%', icon: Activity, color: 'text-emerald-400' },
                            { label: 'Pending Ops', value: devices.reduce((acc, d) => acc + d.pendingOps, 0), total: 'Across Fleet', icon: Database, color: 'text-amber-400' },
                            { label: 'Anomalies', value: anomalies.length, total: 'Last 24h', icon: AlertTriangle, color: 'text-rose-400' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl group hover:border-indigo-500/30 transition-all">
                                <stat.icon className={`w-8 h-8 ${stat.color} mb-6`} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-white mb-1 group-hover:scale-110 origin-left transition-transform">{stat.value}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.total}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Status Heatmap / Map Placeholder */}
                        <div className="col-span-12 lg:col-span-8 bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
                                    <Map className="w-6 h-6 text-indigo-500" /> Geographic Node Topology
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Healthy</span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-widest"><span className="w-2 h-2 bg-amber-500 rounded-full" /> Lagging</span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 uppercase tracking-widest"><span className="w-2 h-2 bg-rose-500 rounded-full" /> Disconnected</span>
                                </div>
                            </div>

                            {/* Visual Topology Representation */}
                            <div className="h-64 flex items-center justify-center border border-slate-800/50 rounded-3xl bg-slate-950/50 relative">
                                <div className="absolute inset-0 overflow-hidden opacity-20">
                                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                                </div>
                                <div className="z-10 flex items-center gap-12">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 animate-pulse">
                                            <Globe className="w-10 h-10" />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-400 uppercase">Cloud HUB</span>
                                    </div>
                                    <div className="w-32 h-[2px] bg-gradient-to-r from-indigo-500 to-emerald-500 relative">
                                        <div className="absolute top-1/2 left-0 w-2 h-2 bg-emerald-400 rounded-full -translate-y-1/2 animate-ping" style={{ left: '20%' }} />
                                        <div className="absolute top-1/2 left-0 w-2 h-2 bg-emerald-400 rounded-full -translate-y-1/2 animate-ping" style={{ left: '60%' }} />
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                                            <Server className="w-10 h-10" />
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-400 uppercase">Branch Server</span>
                                    </div>
                                    <div className="w-32 h-[2px] bg-gradient-to-r from-emerald-500 to-rose-500 relative">
                                        <div className="absolute top-1/2 left-0 w-2 h-2 bg-rose-400 rounded-full -translate-y-1/2" style={{ left: '40%' }} />
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-400">
                                            <Monitor className="w-10 h-10" />
                                        </div>
                                        <span className="text-[10px] font-black text-rose-400 uppercase">POS Terminals</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Anomaly Panel */}
                        <div className="col-span-12 lg:col-span-4 bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-xl">
                            <div className="flex items-center gap-3 mb-8 text-indigo-400">
                                <Zap className="w-6 h-6 animate-pulse" />
                                <h3 className="text-xl font-black italic uppercase tracking-tight text-white">Anomaly Alerts</h3>
                            </div>
                            <div className="space-y-4">
                                {anomalies.map((alert, i) => (
                                    <div key={i} className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start gap-4 animate-in slide-in-from-right-4 duration-300">
                                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-white leading-tight mb-2 uppercase italic tracking-tight">{alert}</p>
                                            <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">
                                                Resolve Now →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {anomalies.length === 0 && (
                                    <div className="p-8 text-center bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                                        <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">System architecture stable. All nodes reporting healthy sync states.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'DEVICES' && (
                <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white">Device Control Panel</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Manage {devices.length} registered nodes across the network</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input type="text" placeholder="Search devices..." className="pl-12 pr-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500 transition-all w-72" />
                            </div>
                            <button className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"><Filter className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 border-b border-slate-800">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Node Identifier</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Branch</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Last Pulse</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Queue</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Reliability</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {devices.map((device) => (
                                    <tr key={device.id} className="group hover:bg-white/5 transition-all">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-4 rounded-2xl border ${device.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'} shadow-sm`}>
                                                    {device.platform === 'Windows' || device.platform === 'macOS' ? <Monitor className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white uppercase tracking-tight text-lg">{device.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{device.id}</span>
                                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                        <span className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest">v{device.appVersion}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-all">
                                                {device.branchId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`text-xs font-black ${device.isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                    {new Date(device.lastSyncAt).toLocaleTimeString()}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${device.isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {device.isOnline ? 'Active Sync' : 'Interrupted'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center text-white font-black">
                                            {device.pendingOps}
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${device.syncHealth > 80 ? 'bg-emerald-500' : device.syncHealth > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${device.syncHealth}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{device.syncHealth}% Health Score</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-400/30 transition-all shadow-sm" title="Force Resync">
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 hover:border-rose-400/30 transition-all shadow-sm" title="Freeze Device">
                                                    <Power className="w-4 h-4" />
                                                </button>
                                                <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-sm" title="Manage Diagnostics">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'LEDGER' && (
                <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-500">
                    <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white">Sync Event Ledger</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Transaction-level audit trail for all nodes</p>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {ledger.map((entry) => (
                            <div key={entry.id} className="p-8 hover:bg-white/5 transition-all flex items-center justify-between relative group overflow-hidden">
                                {entry.status === 'CONFLICT' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />}
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs ${entry.status === 'SYNCED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : entry.status === 'CONFLICT' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                            {entry.status.charAt(0)}
                                        </div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{entry.status}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <h4 className="text-xl font-black text-white uppercase tracking-tight italic">{entry.id}</h4>
                                            <ArrowRight className="w-4 h-4 text-slate-700" />
                                            <span className="px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest shadow-sm">
                                                {entry.eventType} → {entry.entityId}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                                            <span className="flex items-center gap-1.5"><Monitor className="w-3 h-3" /> {entry.deviceId}</span>
                                            <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                            <span className="flex items-center gap-1.5"><History className="w-3 h-3" /> {new Date(entry.timestamp).toLocaleString()}</span>
                                            <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                            <span className="flex items-center gap-1.5 text-slate-600"><Lock className="w-3 h-3" /> HASH: {entry.hash.substring(0, 12)}...</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button className="flex items-center gap-3 px-6 py-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/30 hover:text-indigo-400 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                                        View Payload
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Monetization / Admin Layer Footer */}
            <div className="bg-gradient-to-r from-indigo-900/20 to-transparent p-10 rounded-[3rem] border border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h4 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Synchronization Intelligence <span className="text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-full text-[10px] font-black align-middle ml-2">PREMIUM</span></h4>
                    <p className="text-sm text-slate-400 font-medium">Powering zero-loss retail operations with transaction-level auditing and anomaly detection.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all shadow-xl">
                        View Audit Log
                    </button>
                    <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all shadow-indigo-600/20">
                        Configuration Console
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncIntelligence;
