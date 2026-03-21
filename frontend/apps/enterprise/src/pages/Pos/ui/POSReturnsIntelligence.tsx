import React, { useState, useMemo } from 'react';
import {
    RotateCcw,
    AlertCircle,
    TrendingDown,
    TrendingUp,
    Box,
    Search,
    Filter,
    Download,
    Calendar,
    ArrowRight,
    Tag,
    Trash2,
    CheckCircle2,
    ShieldAlert,
    BarChart3
} from 'lucide-react';
import Layout from '@/shared/ui/Layout/Layout';
import MetricCard from '@/shared/ui/Feedback/MetricCard';
import PageShell from '@/shared/ui/Layout/PageShell';

interface ReturnRecord {
    id: string;
    date: string;
    originalInvoice: string;
    customer: string;
    items: number;
    amount: number;
    reason: string;
    defectCategory: 'MANUFACTURING' | 'LOGISTICS' | 'CUSTOMER_CHANGE' | 'EXPIRED';
    status: 'PROCESSED' | 'PENDING_QC' | 'RESTOCKED';
}

const POSReturnsIntelligence: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const returns: ReturnRecord[] = useMemo(() => [
        {
            id: 'RET-1024',
            date: '2026-03-08',
            originalInvoice: 'INV-8892',
            customer: 'Aditi Sharma',
            items: 2,
            amount: 4500,
            reason: 'Fabric defect in left sleeve',
            defectCategory: 'MANUFACTURING',
            status: 'PENDING_QC'
        },
        {
            id: 'RET-1023',
            date: '2026-03-07',
            originalInvoice: 'INV-8875',
            customer: 'Rohan Varma',
            items: 1,
            amount: 1200,
            reason: 'Wrong size delivered',
            defectCategory: 'LOGISTICS',
            status: 'RESTOCKED'
        },
        {
            id: 'RET-1022',
            date: '2026-03-07',
            originalInvoice: 'INV-8860',
            customer: 'Priya K.',
            items: 3,
            amount: 8900,
            reason: 'Color fade after first look',
            defectCategory: 'MANUFACTURING',
            status: 'PROCESSED'
        }
    ], []);

    const metrics = useMemo(() => {
        const totalReturns = returns.length;
        const totalValue = returns.reduce((acc, r) => acc + r.amount, 0);
        const defectRate = 2.4; // Simulated %
        const restockRate = 65; // Simulated %
        return { totalReturns, totalValue, defectRate, restockRate };
    }, [returns]);

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-rose-500/20 italic">Defect Telemetry</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Quality Assurance</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Returns Intelligence <RotateCcw className="w-8 h-8 text-rose-500 animate-spin-slow" />
                        </h2>
                        <p className="text-sm text-neutral-500 mt-2 font-medium flex items-center gap-2 italic">
                            Post-sale friction analysis and quality control logistics.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 erp-card rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-[var(--erp-bg-sunken)] transition-all active:scale-95 border-none">
                            <Download className="w-4 h-4 text-rose-500" /> Export QC Report
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Return Rate"
                        value={`${metrics.defectRate}%`}
                        subtext="v. Sales Volume"
                        icon={TrendingDown}
                        color="rose"
                        trend="up"
                    />
                    <MetricCard
                        title="Returns Value"
                        value={`₹${(metrics.totalValue / 1000).toFixed(1)}K`}
                        subtext="Impacted Revenue"
                        icon={ShieldAlert}
                        color="amber"
                        trend="up"
                    />
                    <MetricCard
                        title="Restock Yield"
                        value={`${metrics.restockRate}%`}
                        subtext="Inventory Recovery"
                        icon={Box}
                        color="emerald"
                        trend="neutral"
                    />
                    <div className="bg-rose-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-rose-600/20 relative group overflow-hidden border border-rose-500/50 flex flex-col justify-between">
                        <ShieldAlert className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700 w-24 h-24" />
                        <div>
                            <span className="px-2 py-0.5 bg-white/20 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-md mb-4 inline-block">Intelligence Insight</span>
                            <h3 className="text-sm font-black leading-relaxed mt-2 italic shadow-sm">"Manufacturing defects are 15% higher in the 'Summer Silks' collection."</h3>
                        </div>
                        <div className="mt-6 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]" />
                            <p className="text-[10px] text-rose-100 font-black uppercase tracking-widest">Quality Sync Active</p>
                        </div>
                    </div>
                </div>

                {/* Returns Registry */}
                <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-rose-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Return ID or Invoice..."
                                className="w-full pl-12 pr-6 py-4 erp-card border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 shadow-inner bg-white dark:bg-neutral-900 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-[var(--erp-bg-sunken)] dark:bg-neutral-800 p-1.5 rounded-2xl border border-default dark:border-neutral-700">
                            <button className="px-5 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-main rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-default dark:border-neutral-700">All Returns</button>
                            <button className="px-5 py-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors font-black">Defect Only</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs tabular-nums border-collapse">
                            <thead>
                                <tr className="border-b border-default dark:border-neutral-800 bg-[var(--erp-bg-sunken)]/50">
                                    <th className="py-5 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">ID / Date</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Customer / Source</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Value / Qty</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Defect Profile</th>
                                    <th className="text-right py-5 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {returns.map((ret) => (
                                    <tr key={ret.id} className="group hover:bg-rose-500/5 transition-all border-b border-default last:border-0 overflow-hidden">
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">{ret.id}</span>
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {ret.date}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{ret.customer}</span>
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Inv #{ret.originalInvoice}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">₹{ret.amount.toLocaleString()}</span>
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase italic">{ret.items} Items</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit border ${ret.defectCategory === 'MANUFACTURING' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                                    ret.defectCategory === 'LOGISTICS' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                        'bg-[var(--erp-bg-sunken)] border-default text-neutral-500'
                                                    }`}>
                                                    {ret.defectCategory}
                                                </span>
                                                <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[180px]">"{ret.reason}"</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <button className="p-2.5 bg-[var(--erp-bg-sunken)] dark:bg-neutral-800 hover:bg-rose-500 hover:text-white rounded-xl text-neutral-400 transition-all shadow-sm active:scale-95">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageShell>
        </Layout>
    );
};

export default POSReturnsIntelligence;
