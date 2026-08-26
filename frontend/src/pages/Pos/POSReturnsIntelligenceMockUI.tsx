import React, { useMemo } from 'react';
import { Filter, Search, Plus, Download, ChevronRight, ChevronLeft, BarChart2, RotateCcw, TrendingDown, Package, ShieldAlert, Terminal, Users, Zap, User } from 'lucide-react';
import { salesInvoices, branches, employees, MockSalesInvoice } from '../../data';
import Layout from '../../components/shared/Layout';

const POSReturnsIntelligenceMockUI: React.FC = () => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const returns = useMemo(() => {
        // Mocking some returns based on sales data for high-fidelity
        return (salesInvoices as MockSalesInvoice[]).filter(inv => inv.status === 'CANCELLED').map(inv => ({
            id: `RET-${inv.invoice_no.split('-').pop()}`,
            terminal: 'Main Terminal',
            cashier: 'System Admin',
            time: inv.date,
            amount: inv.total,
            status: 'Settled'
        }));
    }, []);

    const metrics = useMemo(() => [
        { label: 'Return Volume', val: '₹8.2k', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'Return Rate', val: '1.8%', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Restock Rate', val: '92%', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Audit Points', val: '04', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
    ], []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                        <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                            POS <span className="text-rose-500 italic">Returns</span>
                            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <RotateCcw className="w-3.5 h-3.5" /> Reverse Logistics
                            </span>
                        </h1>
                        <p className="text-[10px] text-neutral-500 mt-1 font-black uppercase tracking-[0.2em] opacity-70">Refund Monitoring & Inventory Restoration</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-main font-black uppercase tracking-widest text-[10px] rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2">
                            <Download className="w-4 h-4 text-rose-500" /> Export Matrix
                        </button>
                        <button className="h-11 px-8 bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 hover:opacity-90">
                            <BarChart2 className="w-4 h-4" /> Analyze Trends
                        </button>
                    </div>
                </header>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((kpi, idx) => (
                        <div key={idx} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-rose-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-4 rounded-sm ${kpi.bg} ${kpi.color} border border-current/10`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black ${kpi.color} uppercase tracking-[0.2em]`}>Stable</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                                <p className="text-3xl font-display font-black tracking-tighter text-main tabular-nums">{kpi.val}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-sm flex items-center gap-6">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" />
                        <input 
                            type="text" 
                            placeholder="SEARCH RETURN VOUCHERS / ENTITIES..." 
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-6 text-[10px] font-black tracking-widest uppercase focus:border-rose-500 outline-none transition-all text-main shadow-inner" 
                        />
                    </div>
                    <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 hover:bg-neutral-50 transition-all">
                        <Filter className="w-4 h-4" /> System Filters
                    </button>
                </div>

                {/* Data Grid */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Return Protocol ID</th>
                                    <th className="px-8 py-5">Temporal Node</th>
                                    <th className="px-8 py-5">Audit Officer</th>
                                    <th className="px-8 py-5 text-right">Refund Value</th>
                                    <th className="px-8 py-5 text-center">State</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {returns.length > 0 ? returns.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-rose-500/[0.02] transition-all group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-sm bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                                                    <RotateCcw className="w-5 h-5" />
                                                </div>
                                                <span className="font-mono text-sm font-black text-main group-hover:translate-x-1 transition-transform">{rec.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{rec.time}</td>
                                        <td className="px-8 py-6 text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-tight">{rec.cashier}</td>
                                        <td className="px-8 py-6 text-right font-mono text-sm font-black text-rose-500 tabular-nums tracking-tighter">
                                            ₹{rec.amount.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className="px-4 py-1.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest">
                                                    {rec.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <button className="p-3 text-neutral-300 hover:text-white bg-neutral-50 dark:bg-neutral-900 hover:bg-rose-500 rounded-sm transition-all border border-neutral-200 dark:border-neutral-800">
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <RotateCcw className="w-12 h-12 text-neutral-300" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">No Reverse Logistics Recorded</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default POSReturnsIntelligenceMockUI;
