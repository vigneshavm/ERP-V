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
            <div className="space-y-6 animate-fade-in pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-rose-500/20 italic">Defect Telemetry</span>
                        </div>
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2 tracking-tight">
                            Returns Intelligence
                            <RotateCcw className="w-5 h-5 text-rose-500 animate-spin-slow" />
                        </h2>
                        <p className="text-neutral-500 text-sm mt-1 font-medium">Post-sale friction analysis &amp; quality control</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all text-neutral-600 dark:text-neutral-300">
                            <Download className="w-4 h-4" /> Batch QC Report
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
                        trend="flat"
                    />
                    <div className="bg-rose-600 text-white p-6 rounded-[2rem] shadow-xl shadow-rose-600/20 relative group overflow-hidden border border-rose-500/50 flex flex-col justify-between">
                        <ShieldAlert className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700 w-24 h-24" />
                        <div>
                            <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest mb-2 italic">Intelligence Insight</p>
                            <h3 className="text-xs font-bold leading-relaxed opacity-95">"Manufacturing defects are 15% higher in the 'Summer Silks' collection."</h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <p className="text-[9px] text-white/70 font-black uppercase tracking-widest">Quality Sync Active</p>
                        </div>
                    </div>
                </div>

                {/* Returns Registry */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-rose-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Return ID or Invoice..."
                                className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                             <button className="px-4 py-1.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border border-neutral-100 dark:border-neutral-700">All Returns</button>
                             <button className="px-4 py-1.5 text-neutral-500 hover:text-neutral-700 rounded-xl text-[9px] font-black uppercase tracking-widest">Defect Only</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">ID / Date</th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Customer / Source</th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Value / Qty</th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Defect Profile</th>
                                    <th className="text-right py-4 px-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                                {returns.map((ret) => (
                                    <tr key={ret.id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <td className="py-5 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">{ret.id}</span>
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {ret.date}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{ret.customer}</span>
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Inv #{ret.originalInvoice}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">₹{ret.amount.toLocaleString()}</span>
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase italic">{ret.items} Items</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit border ${
                                                    ret.defectCategory === 'MANUFACTURING' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                                    ret.defectCategory === 'LOGISTICS' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                    'bg-neutral-50 border-neutral-100 text-neutral-500'
                                                }`}>
                                                    {ret.defectCategory}
                                                </span>
                                                <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[180px]">"{ret.reason}"</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-right">
                                            <button className="p-2 hover:bg-white dark:hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-rose-500 transition-all border border-transparent hover:border-neutral-100 dark:hover:border-neutral-600 shadow-sm hover:shadow-md">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default POSReturnsIntelligence;
