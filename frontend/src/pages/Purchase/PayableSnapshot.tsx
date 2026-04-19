import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Users, AlertTriangle, ShieldCheck, Activity, ChevronRight, ArrowUpRight } from 'lucide-react';
import api from '../../services/api';
import { useBranchResolver } from '../../hooks/useBranchResolver';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { useNavigate } from 'react-router-dom';

const PayableSnapshot: React.FC = () => {
    const navigate = useNavigate();
    const { currentBranchId } = useBranchResolver();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/purchases/suppliers/reports');
            if (data && data.success) {
                setData(data.data);
            }
        } catch (err) {
            console.error("Failed to load snapshot", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentBranchId]);

    if (loading && !data) {
        return (
            <Layout>
                <div className="flex justify-center items-center py-40">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Liability Nodes...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const { payables, overdue } = data || {};
    const totalPayable = payables?.totalPayables || 0;
    const totalOverdue = payables?.totalOverdue || 0;
    const topOverdueSuppliers = overdue || [];

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Payable Surveillance"
                    description="Real-time monitoring of institutional liabilities and critical overdue nodes."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Snapshot' }
                    ]}
                    actions={
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Nodes
                        </button>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Primary Exposure Cards */}
                    <div className="md:col-span-8 space-y-8">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/10">
                            <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1000">
                                <Activity className="w-64 h-64" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <ShieldCheck className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Aggregate Liability Exposure</p>
                                </div>
                                <h2 className="text-6xl font-black tracking-tighter tabular-nums">₹{totalPayable.toLocaleString('en-IN')}</h2>
                                <p className="text-sm font-bold text-indigo-200/80 mt-6 flex items-center gap-2 italic">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" /> Consolidated institutional payables across all branches
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-10 rounded-[3.5rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <AlertTriangle className="w-48 h-48" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Critical Overdue Volume</h3>
                                    </div>
                                    <p className="text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tighter tabular-nums">₹{totalOverdue.toLocaleString('en-IN')}</p>
                                    <p className="text-xs font-bold text-neutral-400 mt-2 italic">Immediate capital allocation required for {topOverdueSuppliers.length} nodes.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/purchase/ageing-analysis')}
                                    className="px-8 py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Review Ageing Intel
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Side Intelligence Panel */}
                    <div className="md:col-span-4 space-y-8">
                        <div className="bg-neutral-900 dark:bg-neutral-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-10 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                                <Users className="w-48 h-48" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-primary">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">Priority Payments</h3>
                                </div>

                                <div className="space-y-4">
                                    {topOverdueSuppliers.slice(0, 4).map((sup: any, idx: number) => (
                                        <div key={idx} className="p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group/item">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-neutral-200 uppercase tracking-tighter truncate">{sup.supplierName || sup.businessName}</p>
                                                    <p className="text-[10px] font-black text-rose-500 mt-1 uppercase tracking-widest italic">{sup.daysOverdue || '0'} Days Overdue</p>
                                                </div>
                                                <p className="text-sm font-black text-white ml-4 tabular-nums">₹{(sup.totalAmount || sup.amount || 0).toLocaleString()}</p>
                                            </div>
                                            <button 
                                                onClick={() => navigate('/purchase/payments/add', { state: { vendorId: sup.supplierId || sup._id } })}
                                                className="w-full mt-3 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                Initialize Settlement <ArrowUpRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {topOverdueSuppliers.length === 0 && (
                                        <div className="py-12 text-center opacity-30">
                                            <ShieldCheck className="w-12 h-12 mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Institutional Integrity Intact<br/>No Critical Overdue Detected</p>
                                        </div>
                                    )}
                                </div>

                                {topOverdueSuppliers.length > 4 && (
                                    <button
                                        onClick={() => navigate('/purchase/ageing-analysis')}
                                        className="w-full text-center text-[10px] font-black text-neutral-500 hover:text-primary uppercase tracking-widest transition-colors py-4 group"
                                    >
                                        View All {topOverdueSuppliers.length} Nodes <ChevronRight className="w-3 h-3 inline ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-10 rounded-[3.5rem] space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl text-amber-500 shadow-sm border border-amber-100 dark:border-amber-900/20">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h4 className="text-[10px] font-black text-amber-900/60 dark:text-amber-400 uppercase tracking-widest leading-none">Institutional Advisory</h4>
                            </div>
                            <div className="space-y-4">
                                {totalOverdue > 0 ? (
                                    <p className="text-[11px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed italic opacity-80 border-l-2 border-amber-500/30 pl-4">
                                        Significant overdue volume detected. Prioritize settlement of aged nodes to maintain supply-chain integrity.
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed italic opacity-80 border-l-2 border-emerald-500/30 pl-4">
                                        Liability distribution aligns with optimized ERP cash-flow patterns for the current fiscal cycle.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PayableSnapshot;
