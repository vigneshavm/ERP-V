import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../../redux/store";
import { useBranchResolver } from "../../../hooks/useBranchResolver";

export interface GoodsReceivedNote {
    id: string;
    grnNumber?: string;
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

export const useGRNData = () => {
    const { orders, grns } = useSelector((state: RootState) => state.purchase);
    const { currentSector, currentBranch, user } = useSelector((state: RootState) => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Use real GRNs from Redux, fall back to PO-derived ones if empty (for demo/initial state)
    const grnRecords = useMemo(() => {
        if (grns && grns.length > 0) {
            return grns.map(grn => {
                const totalItems = grn.items.reduce((sum, item) => sum + item.orderedQty, 0);
                const receivedItems = grn.items.reduce((sum, item) => sum + item.receivedQty, 0);

                // Map GRNStatus to local status
                let status: 'COMPLETE' | 'PARTIAL' | 'PENDING' = 'PENDING';
                if (grn.status === 'Accepted') status = 'COMPLETE';
                else if (grn.status === 'Partial') status = 'PARTIAL';
                else if (grn.status === 'Rejected') status = 'PENDING';

                return {
                    id: grn.id,
                    grnNumber: grn.grnNumber,
                    poId: grn.poId,
                    poNumber: grn.poNumber,
                    vendorName: grn.vendorName,
                    receivedDate: grn.receivedDate,
                    expectedItems: totalItems,
                    receivedItems: receivedItems,
                    status: status,
                    branchId: grn.branch_id || currentBranch || 'Main',
                    inspector: grn.created_by,
                    notes: grn.notes
                } as GoodsReceivedNote;
            });
        }

        return orders
            .filter(o => o.status === 'Approved' || o.status === 'Partial Receipt' || o.status === 'Fully Received')
            .map(order => {
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const receivedItems = order.items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);

                let status: 'COMPLETE' | 'PARTIAL' | 'PENDING' = 'PARTIAL';
                if (receivedItems === 0) status = 'PENDING';
                else if (receivedItems >= totalItems) status = 'COMPLETE';

                return {
                    id: `GRN-${order.id.substring(0, 6)}`,
                    grnNumber: `GRN-${order.id.substring(0, 6)}`,
                    poId: order.id,
                    poNumber: order.po_number,
                    vendorName: order.vendor_name,
                    receivedDate: order.po_date,
                    expectedItems: totalItems,
                    receivedItems: receivedItems,
                    status,
                    branchId: order.branch_id || currentBranch || 'Main',
                    inspector: user?.name || 'System'
                } as GoodsReceivedNote;
            });
    }, [orders, grns, currentSector, currentBranch, user]);

    // Apply filters
    const filteredRecords = useMemo(() => {
        return grnRecords.filter((grn) => {
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
    const stats = useMemo(() => {
        const completeCount = filteredRecords.filter((g) => g.status === 'COMPLETE').length;
        const partialCount = filteredRecords.filter((g) => g.status === 'PARTIAL').length;
        const pendingCount = filteredRecords.filter((g) => g.status === 'PENDING').length;
        const totalExpected = filteredRecords.reduce((acc, g) => acc + g.expectedItems, 0);
        const totalReceived = filteredRecords.reduce((acc, g) => acc + g.receivedItems, 0);

        return {
            completeCount,
            partialCount,
            pendingCount,
            totalExpected,
            totalReceived,
            totalCount: filteredRecords.length
        };
    }, [filteredRecords]);

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setSearchTerm('');
        setStatusFilter('ALL');
    };

    return {
        grnRecords,
        filteredRecords,
        filters: {
            searchTerm, setSearchTerm,
            statusFilter, setStatusFilter,
            dateFrom, setDateFrom,
            dateTo, setDateTo,
            clearFilters
        },
        stats
    };
};
