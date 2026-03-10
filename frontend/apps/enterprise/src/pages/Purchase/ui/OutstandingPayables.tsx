import React from 'react';
import { FileSpreadsheet, Printer, Search } from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
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
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Outstanding Payables"
                    description="Advanced tracking and aging analysis for supplier liabilities"
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={exportToExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-600 transition-all shadow-sm"
                            >
                                <FileSpreadsheet size={16} /> Export
                            </button>
                            <button
                                onClick={printReport}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm"
                            >
                                <Printer size={16} /> Print
                            </button>
                        </div>
                    }
                />

                <PayablesStats
                    totalPayable={totalPayable}
                    totalOverdue={totalOverdue}
                    processedBills={processedBills}
                    dueSoonAmount={dueSoonAmount}
                    criticalVendorsCount={criticalVendorsCount}
                />

                <PayablesAgingProfile
                    agingAnalysis={agingAnalysis}
                    totalPayable={totalPayable}
                />

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

                <PayablesTable
                    viewMode={viewMode}
                    filteredBills={filteredBills}
                    vendorSummary={vendorSummary}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    onQuickPayment={handleQuickPayment}
                />

                {/* Empty State */}
                {filteredBills.length === 0 && (
                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-300">
                                <Search size={32} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">No matching payables</h3>
                                <p className="text-xs text-slate-400 mt-1">Adjust your filters or search terms to find what you're looking for.</p>
                            </div>
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('All'); setVendorFilter(''); }}
                                className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest px-4 py-2 border border-emerald-200 rounded-lg"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                    <div>Showing {filteredBills.length} of {processedBills.length} Outstanding Items</div>
                    <div className="flex items-center gap-2">
                        System Last Updated: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default OutstandingPayables;

