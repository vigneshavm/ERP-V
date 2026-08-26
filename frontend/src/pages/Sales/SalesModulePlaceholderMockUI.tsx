import React, { useMemo } from 'react';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2, Zap, ArrowRight, Layers } from 'lucide-react';
import { salesInvoices, MockSalesInvoice } from '../../data';
import Layout from '../../components/shared/Layout';

const SalesModulePlaceholderMockUI: React.FC = () => {
    const metrics = useMemo(() => {
        const totalSales = (salesInvoices as MockSalesInvoice[]).reduce((sum, s) => sum + s.total, 0);
        return [
            { label: 'Market Velocity', value: `₹${(totalSales/100000).toFixed(1)}L`, sub: 'VOLUME 24H' },
            { label: 'Active Channels', value: '12', sub: 'NODES ONLINE' },
            { label: 'Conversion', value: '4.2%', sub: 'INDEX SCORE' },
            { label: 'Avg Ticket', value: '₹1,250', sub: 'PER TRANSACTION' }
        ];
    }, []);

    const records = useMemo(() => (salesInvoices as MockSalesInvoice[]).slice(0, 10), []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                            Sales <span className="text-primary italic">Hub</span>
                            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5" /> Intelligence
                            </span>
                        </h1>
                        <p className="text-[10px] text-neutral-500 mt-1 font-black uppercase tracking-[0.2em] opacity-70">Commerce Orchestration & Node Management</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-main font-black uppercase tracking-widest text-[10px] rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2">
                            <Download className="w-4 h-4 text-primary" /> Export Matrix
                        </button>
                        <button className="h-11 px-8 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Initialize Order
                        </button>
                    </div>
                </header>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((kpi, idx) => (
                        <div key={idx} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-3 rounded-sm bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                                    <BarChart2 className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-black text-neutral-400 group-hover:text-primary uppercase tracking-[0.2em] transition-colors">{kpi.sub}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-main tabular-nums">{kpi.value}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Data Grid Section */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="relative w-full lg:w-96">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                            <input 
                                type="text" 
                                placeholder="SEARCH PROTOCOLS / ENTITIES..." 
                                className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-6 text-[10px] font-black tracking-widest uppercase focus:border-primary outline-none transition-all text-main shadow-inner" 
                            />
                        </div>
                        <div className="flex gap-3">
                            <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 hover:bg-neutral-50 transition-all">
                                <Filter className="w-4 h-4" /> System Filters
                            </button>
                            <button className="p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:text-primary transition-all">
                                <Layers className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Protocol ID</th>
                                    <th className="px-8 py-5">Temporal Node</th>
                                    <th className="px-8 py-5">Client Identity</th>
                                    <th className="px-8 py-5 text-right">Value (INR)</th>
                                    <th className="px-8 py-5 text-center">State</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {records.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-primary/[0.02] transition-all group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm font-black text-xs">
                                                    SH
                                                </div>
                                                <span className="font-mono text-sm font-black text-main group-hover:translate-x-1 transition-transform">{rec.invoice_no}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{rec.date}</td>
                                        <td className="px-8 py-6 text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-tight">Main Tenant Entity</td>
                                        <td className="px-8 py-6 text-right font-mono text-sm font-black text-main tabular-nums tracking-tighter">
                                            ₹{rec.total.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className="px-4 py-1.5 rounded-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                                    {rec.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <button className="p-3 text-neutral-300 hover:text-white bg-neutral-50 dark:bg-neutral-900 hover:bg-primary rounded-sm transition-all border border-neutral-200 dark:border-neutral-800">
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                        <span>Showing {records.length} of {salesInvoices.length} nodes recorded</span>
                        <div className="flex gap-2">
                            <button className="px-6 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:bg-neutral-50 transition-all opacity-50 cursor-not-allowed">Previous</button>
                            <button className="px-6 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:bg-neutral-50 transition-all">Next Node</button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesModulePlaceholderMockUI;
