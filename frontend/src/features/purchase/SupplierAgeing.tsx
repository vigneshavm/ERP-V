import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import {
    Search,
    RefreshCcw,
    TrendingUp,
    AlertTriangle,
    Download,
    Filter,
    ArrowUpRight,
    Zap,
    Activity,
    Clock,
    Info,
    BarChart3
} from 'lucide-react';
import api from "../../services/api";

interface AgeingBucket {
    "0-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
}

interface SupplierAgeing {
    supplierId: string;
    businessName: string;
    buckets: AgeingBucket;
    totalDue: number;
}

const SupplierAgeing: React.FC = () => {
    const navigate = useNavigate();
    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SupplierAgeing[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAgeing = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const response = await api.get('/api/purchases/suppliers/ageing-analysis');
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error: any) {
            console.error('Fetch Ageing Error:', error);
            // No sample fallback: show that loading failed rather than records that don't exist.
            setData([]);
            setLoadError((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not load supplier ageing. Check your connection and refresh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgeing();
    }, []);

    const filteredData = useMemo(() => {
        return data.filter(s =>
            s.businessName.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => b.totalDue - a.totalDue);
    }, [data, searchTerm]);

    const totals = useMemo(() => {
        const t = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0, total: 0 };
        data.forEach(s => {
            t["0-30"] += s.buckets["0-30"];
            t["31-60"] += s.buckets["31-60"];
            t["61-90"] += s.buckets["61-90"];
            t["90+"] += s.buckets["90+"];
            t.total += s.totalDue;
        });
        return t;
    }, [data]);

    const handleExport = async () => {
        const XLSX = await import('xlsx');
        const exportData = filteredData.map(s => ({
            'Supplier': s.businessName,
            '0-30 Days': s.buckets["0-30"],
            '31-60 Days': s.buckets["31-60"],
            '61-90 Days': s.buckets["61-90"],
            '90+ Days': s.buckets["90+"],
            'Total Outstanding': s.totalDue
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Supplier Ageing");
        XLSX.writeFile(wb, `Supplier_Ageing_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-20">
                <PageHeader
                    title="Supplier Ageing Surveillance"
                    description="Strategic accounts payable analysis for institutional cashflow optimization."
                    breadcrumbs={[
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Ageing Matrix' }
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExport}
                                className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95"
                            >
                                <Download className="w-4 h-4" /> Export Node Data
                            </button>
                            <button
                                onClick={fetchAgeing}
                                className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-95"
                            >
                                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    }
                />
                {loadError && (
                    <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{loadError}</div>
                )}

                {/* KPI Pulse Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Active (0-30)', val: totals["0-30"], icon: TrendingUp, color: 'text-success', bg: 'bg-emerald-50' },
                        { label: 'Warning (31-60)', val: totals["31-60"], icon: Clock, color: 'text-warning', bg: 'bg-amber-50' },
                        { label: 'Critical (61-90)', val: totals["61-90"], icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
                        { label: 'In Arrears (90+)', val: totals["90+"], icon: AlertTriangle, color: 'text-danger', bg: 'bg-rose-50' }
                    ].map((card, i) => (
                        <div key={i} className="ui-panel p-8 group hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className={`p-4 ${card.bg} ${card.color} rounded-sm group-hover:scale-110 transition-all duration-500`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="relative z-10">
                                <p className="ui-label leading-none mb-2">{card.label}</p>
                                <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase tabular-nums">₹{card.val.toLocaleString()}</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        </div>
                    ))}
                </div>

                {/* Audit Control Matrix */}
                <div className="ui-panel p-8 flex flex-col md:flex-row gap-6 justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative w-full md:w-[500px]">
                        <label className="ui-label mb-3 block">Entity Search</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search supplier by institutional name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-end gap-6 w-full md:w-auto">
                        <div className="text-right">
                            <p className="ui-label mb-1 leading-none">Aggregate Outstanding</p>
                            <p className="text-3xl font-black text-rose-600 tabular-nums tracking-tighter">₹{totals.total.toLocaleString()}</p>
                        </div>
                        <button className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm text-neutral-400 hover:text-primary transition-all active:scale-95">
                            <Filter className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Ageing Matrix Grid */}
                <div className="ui-panel overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 ui-label border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5">Institutional Supplier</th>
                                    <th className="px-8 py-5 text-right">0-30 Days</th>
                                    <th className="px-8 py-5 text-right">31-60 Days</th>
                                    <th className="px-8 py-5 text-right">61-90 Days</th>
                                    <th className="px-8 py-5 text-right">90+ Arrears</th>
                                    <th className="px-8 py-5 text-right">Total Node Quantum</th>
                                    <th className="px-8 py-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30 animate-pulse">
                                                <BarChart3 className="w-12 h-12" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Generating Ageing Report...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30 grayscale max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                    <Info className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-widest text-center">No Data Nodes Found</p>
                                                    <p className="text-xs font-bold mt-2 italic leading-relaxed text-center">Institutional payables are fully reconciled or no supplier data exists.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((row) => (
                                        <tr key={row.supplierId} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-sm bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-500 font-black text-xs uppercase tracking-widest border border-neutral-100 dark:border-neutral-800">
                                                        {row.businessName.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{row.businessName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right tabular-nums">
                                                <span className={`text-xs font-black ${row.buckets["0-30"] > 0 ? 'text-neutral-900 dark:text-white' : 'text-neutral-300 dark:text-neutral-700'}`}>
                                                    ₹{row.buckets["0-30"].toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right tabular-nums">
                                                <span className={`text-xs font-black ${row.buckets["31-60"] > 0 ? 'text-warning' : 'text-neutral-300 dark:text-neutral-700'}`}>
                                                    ₹{row.buckets["31-60"].toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right tabular-nums">
                                                <span className={`text-xs font-black ${row.buckets["61-90"] > 0 ? 'text-orange-500 underline' : 'text-neutral-300 dark:text-neutral-700'}`}>
                                                    ₹{row.buckets["61-90"].toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right tabular-nums">
                                                <span className={`text-xs font-black ${row.buckets["90+"] > 0 ? 'text-rose-600 underline decoration-2 underline-offset-4' : 'text-neutral-300 dark:text-neutral-700'}`}>
                                                    ₹{row.buckets["90+"].toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right tabular-nums bg-primary/5 dark:bg-primary/10">
                                                <span className="text-sm font-black text-primary">₹{row.totalDue.toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => navigate(`/suppliers/${row.supplierId}/ledger`)}
                                                        className="p-3 text-neutral-300 hover:text-primary hover:bg-primary/5 rounded-sm transition-all active:scale-95"
                                                    >
                                                        <ArrowUpRight className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 animate-in zoom-in-95 duration-700">
                    <div className="p-3 bg-primary/10 rounded-sm">
                        <Zap className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Strategic Advice</p>
                        <p className="text-xs font-bold text-primary/80 leading-relaxed italic">
                            Prioritize settlement nodes in the "90+ Arrears" vector to minimize institutional interest penalties and optimize supplier relationship stability.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SupplierAgeing;
