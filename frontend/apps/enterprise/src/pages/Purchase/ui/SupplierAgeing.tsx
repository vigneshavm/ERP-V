import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from "@/shared/ui/Layout/Layout";
import {
    Calendar,
    Search,
    RefreshCcw,
    TrendingUp,
    AlertTriangle,
    Download,
    ChevronRight,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import api from "@/shared/api/api";
import { RootState } from "@/app/store/store";
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

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
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SupplierAgeing[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const user = useSelector((state: RootState) => state.auth.user);

    const fetchAgeing = async () => {
        setLoading(true);
        try {
            const response = await api.get('/purchases/suppliers/ageing-analysis');
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error: any) {
            console.error('Fetch Ageing Error:', error);
            toast.error('Failed to load ageing report');
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

    const handleExport = () => {
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

    const MetricCard = ({ title, value, color, icon: Icon }: any) => (
        <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm transition-all hover:border-primary/30">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">₹{value.toLocaleString()}</h3>
                </div>
                <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" />
                            Accounts Payable Ageing
                        </h2>
                        <p className="text-neutral-500 text-sm mt-1">Strategic debt analysis for procurement cashflow planning</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button
                            onClick={fetchAgeing}
                            className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-primary rounded-lg transition-all shadow-sm">
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MetricCard title="Recent (0-30)" value={totals["0-30"]} color="emerald" icon={TrendingUp} />
                    <MetricCard title="Due (31-60)" value={totals["31-60"]} color="amber" icon={AlertTriangle} />
                    <MetricCard title="Critical (61-90)" value={totals["61-90"]} color="orange" icon={AlertTriangle} />
                    <MetricCard title="Arrears (90+)" value={totals["90+"]} color="rose" icon={AlertTriangle} />
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter by supplier name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Payables</p>
                                <p className="text-lg font-black text-rose-600">₹{totals.total.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-900/50 text-[11px] uppercase tracking-widest font-black text-neutral-500 dark:text-neutral-400">
                                    <th className="px-6 py-4">Supplier</th>
                                    <th className="px-6 py-4 text-right">0-30 Days</th>
                                    <th className="px-6 py-4 text-right">31-60 Days</th>
                                    <th className="px-6 py-4 text-right">61-90 Days</th>
                                    <th className="px-6 py-4 text-right">90+ Days</th>
                                    <th className="px-6 py-4 text-right">Total Due</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                <p className="text-sm font-medium text-neutral-400">Generating ageing report...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-neutral-400 text-sm font-medium">
                                            No outstanding payables found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((row) => (
                                        <tr key={row.supplierId} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold text-xs group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        {row.businessName.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{row.businessName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-medium ${row.buckets["0-30"] > 0 ? 'text-neutral-900 dark:text-neutral-200' : 'text-neutral-300'}`}>
                                                    ₹{row.buckets["0-30"].toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-medium ${row.buckets["31-60"] > 0 ? 'text-amber-600' : 'text-neutral-300'}`}>
                                                    ₹{row.buckets["31-60"].toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-bold ${row.buckets["61-90"] > 0 ? 'text-orange-600' : 'text-neutral-300'}`}>
                                                    ₹{row.buckets["61-90"].toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-black ${row.buckets["90+"] > 0 ? 'text-rose-600 underline' : 'text-neutral-300'}`}>
                                                    ₹{row.buckets["90+"].toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right bg-neutral-50/50 dark:bg-neutral-900/20">
                                                <span className="text-sm font-black text-primary">₹{row.totalDue.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/suppliers/${row.supplierId}/ledger`)}
                                                    className="p-2 text-neutral-400 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                                                    title="View Ledger"
                                                >
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <AlertTriangle className="text-primary w-5 h-5 flex-shrink-0" />
                    <p className="text-xs text-primary font-medium">
                        <strong>Advice:</strong> Prioritize payments for "Arrears (90+)" to avoid supplier relationship damage and interest penalties.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default SupplierAgeing;
