import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import { useBranchResolver } from "@/hooks/useBranchResolver";
import { useGRNData } from '../hooks/useGRNData';
import GRNStats from '../Components/GRNStats';
import GRNFilters from '../Components/GRNFilters';
import GRNTable from '../Components/GRNTable';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";

const GoodsReceived: React.FC = () => {
    const navigate = useNavigate();
    const { currentBranchId, getBranchName } = useBranchResolver();
    const { filteredRecords, filters, stats } = useGRNData();

    return (
        <Layout>
            <div className="page-shell">
                <PageHeader
                    title="Goods Received Notes"
                    description={`Track incoming shipments and receiving verification • ${getBranchName(currentBranchId)}`}
                    actions={
                        <>
                            <button className="px-4 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-lg text-sm font-medium hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 flex items-center gap-2">
                                <Download className="w-4 h-4" /> Export
                            </button>
                            <button
                                onClick={() => navigate('/purchase/grn/new')}
                                className="px-4 py-2 bg-success text-main rounded-lg text-sm font-bold hover:bg-success/90 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Receive Goods
                            </button>
                        </>
                    }
                />

                <GRNStats stats={stats} />

                {/* Receipt Progress */}
                <div className="bg-gradient-to-r from-success/10 to-primary/10 p-4 rounded-xl border border-success/20">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Overall Receipt Progress</span>
                        <span className="text-sm font-bold text-success">
                            {stats.totalExpected > 0 ? Math.round((stats.totalReceived / stats.totalExpected) * 100) : 0}%
                        </span>
                    </div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
                            style={{ width: `${stats.totalExpected > 0 ? (stats.totalReceived / stats.totalExpected) * 100 : 0}%` }}
                        />
                    </div>
                </div>

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
        </Layout>
    );
};

export default GoodsReceived;

