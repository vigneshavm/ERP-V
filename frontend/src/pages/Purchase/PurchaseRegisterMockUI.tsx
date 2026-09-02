import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Filter, Search, Plus, Download, ChevronRight, ShieldCheck, FileText, Factory, 
    Package, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { purchases, suppliers } from '../../data';
import Layout from '../../components/shared/Layout';

const PurchaseRegisterMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const processedPurchases = useMemo(() => {
        return purchases.map(p => {
            const supplier = suppliers.find(s => s.id === p.supplier_id);
            return {
                ...p,
                supplierName: supplier?.name || 'Unknown Entity'
            };
        });
    }, []);

    const filteredPurchases = useMemo(() => {
        return processedPurchases.filter(p => {
            const matchesSearch = 
                p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [processedPurchases, searchQuery, statusFilter]);

    const metrics = useMemo(() => {
        const totalAmount = purchases.reduce((sum, p) => sum + p.total, 0);
        const totalTax = purchases.reduce((sum, p) => sum + p.gst, 0);
        return [
            { label: 'Total Procurement', val: `₹${(totalAmount/100000).toFixed(2)}L`, sub: 'LIFETIME QUANTUM', icon: Package, bg: 'bg-primary/10', color: 'text-primary' },
            { label: 'Tax Contribution', val: `₹${(totalTax/10000).toFixed(2)}K`, sub: 'GST COMPLIANCE', icon: ShieldCheck, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
            { label: 'Pending Arrival', val: '12', sub: 'LOGISTICS DELAY', icon: AlertCircle, bg: 'bg-amber-500/10', color: 'text-amber-500' },
            { label: 'Volume Index', val: `${purchases.length}`, sub: 'VOUCHER COUNT', icon: TrendingUp, bg: 'bg-indigo-500/10', color: 'text-indigo-500' }
        ];
    }, []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Purchase <span className="text-primary">Register</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Institutional Procurement Ledger // Archive Node V4
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Download className="w-4 h-4 text-primary" /> Export Dataset
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> New Acquisition
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-black text-neutral-400 group-hover:text-primary uppercase tracking-[0.2em] transition-colors">{card.sub}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Data Grid Section */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH VOUCHER / ENTITY..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-6 text-[10px] font-black tracking-widest uppercase focus:border-primary outline-none transition-all text-neutral-900 dark:text-white shadow-inner" 
                                />
                            </div>
                            <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                                <Filter className="w-4 h-4" /> Global Protocol
                            </button>
                        </div>
                        <div className="flex gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-800">
                            {['All', 'RECEIVED', 'PENDING', 'CANCELLED'].map((tab) => (
                                <button 
                                    key={tab} 
                                    onClick={() => setStatusFilter(tab)}
                                    className={`px-5 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === tab ? 'bg-white dark:bg-neutral-900 text-primary shadow-sm' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Record identity</th>
                                    <th className="px-8 py-5">Temporal node</th>
                                    <th className="px-8 py-5">Institutional entity</th>
                                    <th className="px-8 py-5 text-center">Protocol state</th>
                                    <th className="px-8 py-5 text-right">Quantum (INR)</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredPurchases.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-primary/[0.02] transition-all group cursor-pointer" onClick={() => navigate(`/purchase/detail/${rec.id}`)}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <span className="font-mono text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">{rec.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">{rec.date}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2.5">
                                                <Factory className="w-4 h-4 text-primary/50" />
                                                <span className="text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-tight">{rec.supplierName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${rec.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                    {rec.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-mono text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">
                                            ₹{rec.total.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <button className="p-3 text-neutral-400 hover:text-white bg-neutral-50 dark:bg-neutral-800 hover:bg-primary rounded-sm transition-all shadow-sm border border-neutral-200 dark:border-neutral-700">
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit Context */}
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-sm flex items-center gap-6">
                    <div className="p-4 bg-primary/10 rounded-sm border border-primary/20">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Institutional Governance Layer Active</h4>
                        <p className="text-xs text-neutral-500 font-bold mt-1 italic uppercase tracking-widest leading-relaxed">All procurement transactions are cryptographically indexed for the institutional audit trail. System status: NORMAL.</p>
                    </div>
                    <button className="ml-auto p-3 text-neutral-400 hover:text-primary transition-all">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseRegisterMockUI;
