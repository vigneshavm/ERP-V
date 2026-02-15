import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export interface SalesLedgerItem {
    id: string;
    invoiceNo: string;
    date: string;
    customerName: string;
    customerPhone: string;
    netAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
    paymentMode: string;
    dueDate?: string;
}

export interface LedgerFilters {
    searchQuery: string;
    status: string;
    paymentMode: string;
    dateFrom: string;
    dateTo: string;
}

export const useSalesLedger = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenantId = user?.tenantId;

    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<SalesLedgerItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({
        totalSales: 0,
        collected: 0,
        outstanding: 0,
        overdue: 0
    });

    const fetchLedger = useCallback(async (
        page: number,
        itemsPerPage: number,
        filters: LedgerFilters
    ) => {
        if (!tenantId) return;

        setLoading(true);
        try {
            // DB MODE: Fetch from API
            // For now, keeping it empty as per existing structure but removing DEMO logic
            setLoading(false);
            return;
        } catch (err) {
            console.error('Error fetching ledger:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    return {
        fetchLedger,
        invoices,
        loading,
        totalCount,
        stats
    };
};
