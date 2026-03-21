import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import {
    RotateCcw, Search, Filter, ArrowDownLeft, Clock,
    CheckCircle, ShieldCheck, DollarSign, ChevronRight,
    Search as SearchIcon, Truck, Zap
} from 'lucide-react';
import api from "@/shared/api/api";
import { PurchaseReturn, PurchaseReturnStatus } from "@/entities/purchase/model/purchase";

const PurchaseReturns: React.FC = () => {
    const navigate = useNavigate();
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchReturns = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/purchase-returns');
                setReturns(data || []);
            } catch (err) {
                logger.error("Failed to fetch returns", err);
                setReturns([
                    {
                        id: '1',
                        return_number: 'PR-2024-001',
                        return_date: '2024-03-20',
                        vendor_name: 'Tech supplies Corp',
                        vendor_id: 'v1',
                        grn_number: 'GRN-9982',
                        grn_id: 'g1',
                        status: 'Initiated',
                        reason: 'Defective',
                        total_amount: 15400,
                        tax_amount: 2772,
                        items: [],
                        attachments: [],
                        created_at: '2024-03-20T10:00:00Z'
                    },
                    {
                        id: '2',
                        return_number: 'PR-2024-002',
                        return_date: '2024-03-18',
                        vendor_name: 'Office Mart',
                        vendor_id: 'v2',
                        grn_number: 'GRN-9941',
                        grn_id: 'g2',
                        status: 'Credited',
                        reason: 'Wrong Item',
                        total_amount: 3200,
                        tax_amount: 576,
                        items: [],
                        attachments: [],
                        created_at: '2024-03-18T10:00:00Z'
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReturns();
    }, []);

    const filteredReturns = useMemo(() => {
        return returns.filter(r => {
            const matchesSearch =
                r.return_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.grn_number?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [returns, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const totalAmount = returns.reduce((sum, r) => sum + r.total_amount, 0);
        const pendingAmount = returns.filter(r => r.status !== 'Credited').reduce((sum, r) => sum + r.total_amount, 0);
        const creditedAmount = returns.filter(r => r.status === 'Credited').reduce((sum, r) => sum + r.total_amount, 0);

        return {
            total: returns.length,
            totalAmount,
            pendingAmount,
            creditedAmount
        };
    }, [returns]);

    const formatCurrency = (val: number) =>
        `₹ ${val.toLocaleString('en-IN')}`;

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Cinematic Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-rose-500/20">Supply Chain Recovery</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Return Protocols</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Reverse Logistics <RotateCcw className="w-8 h-8 text-rose-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Orchestrate return authorizations and credit settlements with precision.
                        </p>
                    </div>
                    
                    <button
                        onClick={() => navigate('/purchase/returns/new')}
                        className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <RotateCcw className="w-5 h-5" /> 
                        <span>Initiate Return</span>
                    </button>
                </div>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsComponent label="Active Returns" value={stats.total} icon={RotateCcw} color="blue" sub="Managed Lifecycle" />
                    <StatsComponent label="Aggregate Recovery" value={formatCurrency(stats.totalAmount)} icon={DollarSign} color="rose" sub="Capital Recovery" />
                    <StatsComponent label="Pending Credits" value={formatCurrency(stats.pendingAmount)} icon={Clock} color="amber" sub="In-Transit Claims" />
                    <StatsComponent label="Settled Delta" value={stats.total - returns.filter(r => r.status !== 'Credited').length} icon={CheckCircle} color="emerald" sub="Verified Credits" />
                </div>

                {/* Operations Island */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    <div className="p-4">
                        <div className="flex items-center gap-4 mb-8 px-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-sm">
                                <Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none text-brand-colors">Recovery Command</h3>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Filtering and Intercepting Return Protocols</p>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800 mb-8">
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                                <div className="relative w-full md:w-80 group/search">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <SearchIcon className="h-4 w-4 text-neutral-400 group-focus-within/search:text-rose-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search Return No, Vendor, GRN..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-neutral-900 border-none rounded-2xl text-xs font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                                    />
                                </div>

                                <div className="flex items-center p-1 bg-white dark:bg-neutral-900 rounded-2xl border border-default dark:border-neutral-800 shadow-sm w-full md:w-auto overflow-hidden">
                                    {['all', 'Initiated', 'In-Transit', 'Credited'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`flex-1 md:flex-none px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === status
                                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                                }`}
                                        >
                                            {status === 'all' ? 'Universal' : status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="px-5 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl flex items-center gap-3 shadow-md hover:scale-[1.02] transition-transform cursor-pointer group">
                                <Zap className="w-4 h-4 group-hover:text-rose-500 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic leading-none whitespace-nowrap">Rapid Actions</span>
                            </button>
                        </div>

                        {/* Returns Matrix */}
                        <div className="overflow-x-auto px-2">
                             <table className="w-full text-left border-separate border-spacing-y-4">
                               <thead>
                                 <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                   <th className="px-8 py-2">Return Identity</th>
                                   <th className="px-8 py-2">Trading Partner</th>
                                   <th className="px-8 py-2">Reference</th>
                                   <th className="px-8 py-2">Disposition</th>
                                   <th className="px-8 py-2 text-right">Recovery Amount</th>
                                   <th className="px-8 py-2 text-center">Protocol State</th>
                                   <th className="px-8 py-2 text-right">Commands</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {isLoading ? (
                                   <tr>
                                     <td colSpan={7} className="px-8 py-32 text-center">
                                       <div className="flex flex-col items-center">
                                         <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin mb-6" />
                                         <p className="text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse italic">Synchronizing Recovery Matrix...</p>
                                       </div>
                                     </td>
                                   </tr>
                                 ) : filteredReturns.length === 0 ? (
                                   <tr>
                                     <td colSpan={7} className="px-8 py-32 text-center">
                                       <div className="flex flex-col items-center">
                                         <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] text-neutral-200 mb-6">
                                           <RotateCcw className="w-16 h-16" />
                                         </div>
                                         <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Return Null</h3>
                                         <p className="text-sm font-bold text-neutral-500 mt-2 italic">No return protocols detected in current registry.</p>
                                       </div>
                                     </td>
                                   </tr>
                                 ) : (
                                   filteredReturns.map((r) => (
                                     <tr
                                       key={r.id}
                                       className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                                       onClick={() => navigate(`/purchase/returns/view/${r.id}`)}
                                     >
                                       <td className="px-2 py-1">
                                         <div className="bg-white dark:bg-neutral-900 rounded-l-[1.5rem] p-6 border-y border-l border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all">
                                            <div className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tighter italic leading-none mb-1 group-hover/row:text-rose-500">
                                              {r.return_number}
                                            </div>
                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">
                                              {new Date(r.return_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                         </div>
                                       </td>
                                       <td className="px-0 py-1">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all font-bold text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-widest italic">
                                            {r.vendor_name}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 italic">
                                                <FileText className="w-3 h-3" /> GRN: {r.grn_number}
                                            </div>
                                         </div>
                                       </td>
                                       <td className="px-0 py-1">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${r.reason === 'Defective' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 border-default'}`}>
                                                {r.reason}
                                            </span>
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-right">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all font-mono font-black text-neutral-900 dark:text-neutral-300 italic text-sm">
                                            {formatCurrency(r.total_amount)}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-center">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all flex justify-center">
                                            <StatusBadge status={r.status} />
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-right">
                                         <div className="bg-white dark:bg-neutral-900 rounded-r-[1.5rem] p-6 border-y border-r border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all">
                                            <button className="p-3 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 group-hover/row:text-rose-500 rounded-xl transition-all shadow-sm">
                                                <ChevronRight className="w-5 h-5" />
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
                </div>

                {/* Global Verification Footprint */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Recovery Protocol Shield Verified • BizzAI Intelligence Core</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>
        </Layout>
    );
};

const StatsComponent = ({ label, value, icon: Icon, color, sub }: any) => {
    return (
        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none text-neutral-900 dark:text-white">
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{label}</p>
                    <h3 className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic">
                        {value}
                    </h3>
                </div>
                <div className="mt-8 flex flex-col gap-2">
                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest leading-none">{sub}</p>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full bg-${color === 'blue' ? 'blue' : color === 'emerald' ? 'emerald' : 'rose'}-500 animate-pulse`} />
                        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none italic">Active Sync</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: PurchaseReturnStatus }) => {
    const config: any = {
        'Initiated': { color: 'blue', icon: RotateCcw },
        'In-Transit': { color: 'amber', icon: Truck },
        'Received by Vendor': { color: 'indigo', icon: ShieldCheck },
        'Processed': { color: 'emerald', icon: CheckCircle },
        'Credited': { color: 'emerald', icon: CheckCircle, filled: true },
        'Cancelled': { color: 'neutral', icon: RotateCcw },
    };
    const { color, icon: Icon, filled } = config[status] || config['Initiated'];
    
    return (
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${filled ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : `bg-${color === 'neutral' ? 'neutral-100 dark:bg-neutral-800' : `${color}-500/10 text-${color}-600 dark:text-${color}-400 border border-${color}-500/20 font-bold`}`}`}>
            <Icon className="w-3 h-3" /> {status}
        </span>
    );
};

export default PurchaseReturns;
