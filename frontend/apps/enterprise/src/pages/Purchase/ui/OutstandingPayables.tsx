import React from 'react';
import { FileSpreadsheet, Printer, Search, ShieldCheck, Database, Zap, Download } from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import { useOutstandingPayables } from '../hooks/useOutstandingPayables';
import PayablesStats from '../Components/PayablesStats';
import PayablesAgingProfile from '../Components/PayablesAgingProfile';
import PayablesFilters from '../Components/PayablesFilters';
import PayablesTable from '../Components/PayablesTable';

const OutstandingPayables: React.FC = () => {
    const {
        isLoading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        vendorFilter,
        setVendorFilter,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        viewMode,
        setViewMode,
        processedBills,
        filteredBills,
        vendorSummary,
        agingAnalysis,
        totalPayable,
        totalOverdue,
        suppliers,
        exportToExcel,
        printReport,
        handleQuickPayment
    } = useOutstandingPayables();

    const dueSoonAmount = processedBills
        .filter(b => b.daysOverdue <= 0 && Math.abs(b.daysOverdue) <= 7)
        .reduce((acc, b) => acc + b.outstandingAmount, 0);

    const criticalVendorsCount = vendorSummary.filter(v => v.overdue > 0).length;

    const handleSort = (field: any) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Cinematic Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">Fiscal Strategy</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Liability Command</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Outstanding Matrix <Database className="w-8 h-8 text-indigo-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Precision tracking and ageing analysis for global supplier liabilities.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToExcel}
                            className="p-3.5 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 text-neutral-400 hover:text-emerald-500 rounded-2xl transition-all shadow-sm group"
                        >
                            <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={printReport}
                            className="p-3.5 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 text-neutral-400 hover:text-blue-500 rounded-2xl transition-all shadow-sm group"
                        >
                            <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <PayablesStats
                    totalPayable={totalPayable}
                    totalOverdue={totalOverdue}
                    processedBills={processedBills}
                    dueSoonAmount={dueSoonAmount}
                    criticalVendorsCount={criticalVendorsCount}
                />

                {/* Ageing Profile Island */}
                <PayablesAgingProfile
                    agingAnalysis={agingAnalysis}
                    totalPayable={totalPayable}
                />

                {/* Registry Matrix Island */}
                <div className="space-y-8">
                     <PayablesFilters
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        vendorFilter={vendorFilter}
                        onVendorFilterChange={setVendorFilter}
                        suppliers={suppliers}
                    />

                    {isLoading ? (
                         <div className="erp-card rounded-[3rem] p-32 flex flex-col items-center justify-center border-none shadow-sm">
                            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-6" />
                            <p className="text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse italic">Synchronizing Liability Matrix...</p>
                        </div>
                    ) : (
                        <PayablesTable
                            viewMode={viewMode}
                            filteredBills={filteredBills}
                            vendorSummary={vendorSummary}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                            onQuickPayment={handleQuickPayment}
                        />
                    )}
                </div>

                 {/* Empty Registry State */}
                 {!isLoading && filteredBills.length === 0 && (
                    <div className="erp-card rounded-[3rem] py-32 text-center border-none shadow-sm">
                        <div className="flex flex-col items-center">
                            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] text-neutral-200 mb-6">
                                <Search className="w-16 h-16" />
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Node Null</h3>
                            <p className="text-sm font-bold text-neutral-500 mt-2 italic">Zero liability detected in current audit parameters.</p>
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('All'); setVendorFilter(''); }}
                                className="mt-8 px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:scale-105 transition-transform"
                            >
                                Reset Analysis Matrix
                            </button>
                        </div>
                    </div>
                )}

                {/* Registry Log Footer */}
                <div className="flex items-center justify-between px-8 py-4 bg-white/50 dark:bg-neutral-900/50 rounded-2xl border border-default dark:border-neutral-800">
                    <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 italic">
                        Auditing {filteredBills.length} <span className="text-indigo-500">/</span> {processedBills.length} Transaction Segments
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">Matrix Synchronized: {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>

                {/* Global Verification Footprint */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Fiscal Protocol Shield Verified • BizzAI Intelligence Core</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>
        </Layout>
    );
};

export default OutstandingPayables;
