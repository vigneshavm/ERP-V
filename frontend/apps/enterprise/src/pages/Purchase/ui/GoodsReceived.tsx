import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Package, Truck, ShieldCheck, Zap } from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import { useBranchResolver } from "@/hooks/useBranchResolver";
import { useGRNData } from '../hooks/useGRNData';
import GRNStats from '../Components/GRNStats';
import GRNFilters from '../Components/GRNFilters';
import GRNTable from '../Components/GRNTable';

const GoodsReceived: React.FC = () => {
    const navigate = useNavigate();
    const { currentBranchId, getBranchName } = useBranchResolver();
    const { filteredRecords, filters, stats } = useGRNData();

    const receiptProgress = stats.totalExpected > 0 ? Math.round((stats.totalReceived / stats.totalExpected) * 100) : 0;

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Cinematic Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">Inbound Logistics</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{getBranchName(currentBranchId)}</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Inventory Manifests <Package className="w-8 h-8 text-emerald-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Verification and audit of incoming material protocols and logistics flow.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <button className="p-3.5 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 text-neutral-400 hover:text-emerald-500 rounded-2xl transition-all shadow-sm group">
                            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/purchase/grn/new')}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Receive Goods</span>
                        </button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <GRNStats stats={stats} />

                {/* Logistics Velocity Oscillator */}
                <div className="erp-card rounded-[2.5rem] p-8 border-none shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <Truck className="w-32 h-32 text-emerald-500" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none text-brand-colors font-mono">Logistics Velocity</h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Overall Manifest Processing Progress</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-emerald-500 italic leading-none">{receiptProgress}%</span>
                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Real-time Fulfillment</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative h-4 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-default dark:border-neutral-800 p-0.5">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-blue-500 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            style={{ width: `${receiptProgress}%` }}
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
                        </div>
                    </div>
                    
                    <div className="mt-6 flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest italic leading-none">Received: {stats.totalReceived}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest italic leading-none">Expected: {stats.totalExpected}</span>
                        </div>
                    </div>
                </div>

                {/* Operations Command Island */}
                <div className="space-y-8">
                    <GRNFilters
                        searchTerm={filters.searchTerm}
                        statusFilter={filters.statusFilter}
                        dateFrom={filters.dateFrom}
                        dateTo={filters.dateTo}
                        onSearchChange={filters.setSearchTerm}
                        onStatusChange={filters.setStatusFilter}
                        onDateFromChange={filters.setDateFrom}
                        onDateToChange={filters.setDateTo}
                        onClear={filters.clearFilters}
                    />

                    <GRNTable
                        records={filteredRecords}
                        onView={(id) => navigate(`/purchase/grn/view/${id}`)}
                        onCreateBill={(id) => navigate(`/purchase/bills/new/${id}`)}
                    />
                </div>

                {/* Global Verification Footprint */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Logistics Protocol Shield Verified • BizzAI Intelligence Core</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>
        </Layout>
    );
};

export default GoodsReceived;
