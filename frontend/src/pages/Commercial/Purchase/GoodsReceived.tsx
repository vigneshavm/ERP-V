import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../../redux/store";
import { setActiveTab } from "../../../redux/slices/uiSlice";
import { useBranchResolver } from "../../../hooks/useBranchResolver";
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import {
    Search,
    Calendar,
    Package,
    Truck,
    CheckCircle,
    Clock,
    FileText,
    Download,
    Plus,
    Eye,
    Box,
    ClipboardCheck,
    AlertTriangle
} from 'lucide-react';

interface GoodsReceivedNote {
    id: string;
    poId: string;
    poNumber: string;
    vendorName: string;
    receivedDate: string;
    expectedItems: number;
    receivedItems: number;
    status: 'COMPLETE' | 'PARTIAL' | 'PENDING';
    branchId: string;
    inspector?: string;
    notes?: string;
}

const GoodsReceived: React.FC = () => {
    const dispatch = useDispatch();
    const { orders } = useSelector((state: RootState) => state.purchase);
    const { currentSector, currentBranch, user } = useSelector((state: RootState) => state.auth);
    const { getBranchName } = useBranchResolver();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Generate GRN records from approved purchase orders
    const grnRecords: GoodsReceivedNote[] = useMemo(() => {
        return orders
            .filter(o => o.status === 'Approved')
            .map(order => {
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                // Simulate varying receipt status
                const receivedRatio = Math.random();
                const receivedItems = Math.floor(totalItems * receivedRatio);

                let status: GoodsReceivedNote['status'] = 'COMPLETE';
                if (receivedItems === 0) status = 'PENDING';
                else if (receivedItems < totalItems) status = 'PARTIAL';

                return {
                    id: `GRN-${order.id.substring(0, 6)}`,
                    poId: order.id,
                    poNumber: order.po_number,
                    vendorName: order.vendor_name,
                    receivedDate: order.po_date,
                    expectedItems: totalItems,
                    receivedItems: receivedItems,
                    status,
                    branchId: order.branch_id || currentBranch || 'Main',
                    inspector: user?.name || 'System'
                };
            });
    }, [orders, currentSector, currentBranch, user]);

    // Apply filters
    const filteredRecords = useMemo(() => {
        return grnRecords.filter(grn => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!grn.vendorName.toLowerCase().includes(search) &&
                    !grn.id.toLowerCase().includes(search) &&
                    !grn.poNumber.toLowerCase().includes(search)) {
                    return false;
                }
            }
            if (statusFilter !== 'ALL' && grn.status !== statusFilter) return false;
            if (dateFrom && new Date(grn.receivedDate) < new Date(dateFrom)) return false;
            if (dateTo) {
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                if (new Date(grn.receivedDate) >= nextDay) return false;
            }
            return true;
        });
    }, [grnRecords, searchTerm, statusFilter, dateFrom, dateTo]);

    // Summary stats
    const completeCount = filteredRecords.filter(g => g.status === 'COMPLETE').length;
    const partialCount = filteredRecords.filter(g => g.status === 'PARTIAL').length;
    const pendingCount = filteredRecords.filter(g => g.status === 'PENDING').length;
    const totalExpected = filteredRecords.reduce((acc, g) => acc + g.expectedItems, 0);
    const totalReceived = filteredRecords.reduce((acc, g) => acc + g.receivedItems, 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETE':
                return <span className="px-2 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Complete
                </span>;
            case 'PARTIAL':
                return <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Partial
                </span>;
            case 'PENDING':
                return <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-bold rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                </span>;
            default:
                return null;
        }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Goods Received Notes"
                    description={`Track incoming shipments and receiving verification • ${getBranchName(currentBranch)}`}
                    actions={
                        <>
                            <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                                <Download className="w-4 h-4" /> Export
                            </button>
                            <button
                                className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success/90 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Receive Goods
                            </button>
                        </>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-secondary uppercase">Total GRNs</p>
                            <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">{filteredRecords.length}</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-secondary uppercase">Complete</p>
                            <CheckCircle className="w-4 h-4 text-success" />
                        </div>
                        <p className="text-2xl font-bold text-success">{completeCount}</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-secondary uppercase">Partial</p>
                            <AlertTriangle className="w-4 h-4 text-warning" />
                        </div>
                        <p className="text-2xl font-bold text-warning">{partialCount}</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-secondary uppercase">Pending</p>
                            <Clock className="w-4 h-4 text-neutral-400" />
                        </div>
                        <p className="text-2xl font-bold text-muted">{pendingCount}</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-secondary uppercase">Items Received</p>
                            <Box className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-lg font-bold text-neutral-900 dark:text-white">
                            {totalReceived} <span className="text-sm text-neutral-400">/ {totalExpected}</span>
                        </p>
                    </div>
                </div>

                {/* Receipt Progress */}
                <div className="bg-gradient-to-r from-success/10 to-primary/10 p-4 rounded-xl border border-success/20">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Overall Receipt Progress</span>
                        <span className="text-sm font-bold text-success">{totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0}%</span>
                    </div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
                            style={{ width: `${totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0}%` }}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">Search</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="GRN #, PO #, or Vendor..."
                                className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">From Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />
                            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">To Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                            />
                            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">Status</label>
                        <select
                            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="COMPLETE">Complete</option>
                            <option value="PARTIAL">Partial</option>
                            <option value="PENDING">Pending</option>
                        </select>
                    </div>

                    <button
                        onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); setStatusFilter('ALL'); }}
                        className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold"
                    >
                        Clear
                    </button>
                </div>

                {/* GRN Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-secondary uppercase text-xs font-medium">
                                <tr>
                                    <th className="p-4">GRN #</th>
                                    <th className="p-4">PO Reference</th>
                                    <th className="p-4">Vendor</th>
                                    <th className="p-4">Received Date</th>
                                    <th className="p-4">Branch</th>
                                    <th className="p-4 text-center">Items</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {filteredRecords.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <ClipboardCheck className="w-8 h-8 text-neutral-300" />
                                            <p>No goods received notes found</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    filteredRecords.map(grn => (
                                        <tr key={grn.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                            <td className="p-4 font-mono text-xs text-success font-medium">{grn.id}</td>
                                            <td className="p-4 font-mono text-xs text-primary">{grn.poNumber}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Truck className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium text-neutral-900 dark:text-white">{grn.vendorName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-secondary">
                                                {new Date(grn.receivedDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-neutral-500">{getBranchName(grn.branchId)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`font-bold ${grn.receivedItems < grn.expectedItems ? 'text-warning' : 'text-success'}`}>
                                                    {grn.receivedItems}
                                                </span>
                                                <span className="text-neutral-400"> / {grn.expectedItems}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {getStatusBadge(grn.status)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg" title="View Details">
                                                        <Eye className="w-4 h-4 text-primary" />
                                                    </button>
                                                    {grn.status !== 'COMPLETE' && (
                                                        <button className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-lg hover:bg-success/20">
                                                            Receive
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                        {filteredRecords.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">No GRN records</div>
                        ) : (
                            filteredRecords.map(grn => (
                                <div key={grn.id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-mono text-xs text-success font-medium">{grn.id}</p>
                                            <p className="font-bold text-neutral-900 dark:text-white">{grn.vendorName}</p>
                                            <p className="text-xs text-neutral-500">PO: {grn.poNumber}</p>
                                        </div>
                                        {getStatusBadge(grn.status)}
                                    </div>
                                    <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg mt-2">
                                        <div className="text-sm">
                                            <span className="font-bold text-primary">{grn.receivedItems}</span>
                                            <span className="text-neutral-400"> / {grn.expectedItems} items</span>
                                        </div>
                                        <p className="text-xs text-neutral-500">{new Date(grn.receivedDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GoodsReceived;

