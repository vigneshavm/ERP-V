import React from 'react';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2, AlertCircle, TrendingUp, TrendingDown, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';
import outstandingDuesData from '../../../mockData/outstandingDuesData.json';

const OutstandingDuesMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-hidden flex flex-col transition-colors animate-fade-in relative">
            {/* Ambient Background - Matching Sales Register */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8">
                {/* Cyber Header - Unified with Sales Theme */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Outstanding <span className="text-amber-500">Dues</span>
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                                Risk Analysis
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Live Receivables Monitoring // Intelligence Grid</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-bold shadow-sm">
                            <Download className="w-4 h-4 text-amber-500" /> Export Matrix
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all text-xs font-black uppercase tracking-widest">
                            <Plus className="w-4 h-4" /> New Collection
                        </button>
                    </div>
                </div>

                {/* Neural Metrics Grid - Sales Theme Styled */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {outstandingDuesData.metrics.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 relative overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                                <div className={`p-2.5 rounded-xl ${
                                    stat.status === 'error' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                                    stat.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}>
                                    {stat.status === 'error' ? <ShieldAlert className="w-4 h-4" /> : 
                                     stat.status === 'warning' ? <AlertTriangle className="w-4 h-4" /> : 
                                     <BarChart2 className="w-4 h-4" />}
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-display font-black text-neutral-900 dark:text-white tabular-nums">{stat.value}</h3>
                                <div className={`flex items-center gap-1 text-[10px] font-bold ${
                                    stat.trend.startsWith('+') ? 'text-rose-500' : 'text-emerald-500'
                                }`}>
                                    {stat.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {stat.trend}
                                </div>
                            </div>
                            <div className="mt-5 h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${
                                        stat.status === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 
                                        stat.status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 
                                        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                    }`}
                                    style={{ width: '65%' }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filtering Infrastructure */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY RECORD NODE / CUSTOMER REFERENCE..." 
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold tracking-widest placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-amber-500/50 outline-none transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                            <Filter className="w-4 h-4" /> Filter Config
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl hover:bg-amber-500/20 transition-all text-[10px] font-black uppercase tracking-widest">
                            <BarChart2 className="w-4 h-4" /> Insights
                        </button>
                    </div>
                </div>

                {/* Industrial Data Workspace */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Record Node</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Timeline</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Entity Source</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Risk Slab</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Last Sync</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 text-right">Value Asset</th>
                                    <th className="px-8 py-5 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {outstandingDuesData.records.map((rec, i) => (
                                    <tr key={i} className="hover:bg-amber-500/[0.02] transition-all cursor-pointer group">
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-sm font-bold text-amber-500 group-hover:underline cursor-pointer tracking-tighter">{rec.id}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40"></div>
                                                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-200">{rec.date}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform inline-block">{rec.customer}</div>
                                            <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">B2B Institutional</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                                                rec.risk === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                rec.risk === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                rec.risk === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    rec.risk === 'Critical' ? 'bg-rose-500 animate-pulse' :
                                                    rec.risk === 'High' ? 'bg-orange-500' :
                                                    rec.risk === 'Medium' ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }`} />
                                                {rec.risk}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-neutral-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">{rec.lastContact}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-lg font-mono font-black text-neutral-900 dark:text-white tracking-tighter">{rec.amount}</div>
                                            <div className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-0.5">{rec.overdueDays} Days Overdue</div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Control Panel / Pagination */}
                    <div className="p-8 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                            Visualizing <span className="text-amber-500 font-black">06</span> of <span className="text-neutral-900 dark:text-white">24</span> High-Priority Records
                        </p>
                        <div className="flex gap-3">
                            <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 disabled:opacity-30 transition-all hover:bg-neutral-50" disabled>Previous Phase</button>
                            <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-500 hover:border-amber-500/50 transition-all shadow-sm">Next Phase</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OutstandingDuesMockUI;


