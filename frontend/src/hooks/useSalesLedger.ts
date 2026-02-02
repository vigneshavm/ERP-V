import { useState, useCallback } from 'react';
// import { supabase } from '../lib/supabase'; // Removed
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { getTable, DATA_MODE } from "../services/dataSource";

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
            // DEMO MODE: Use getTable abstraction
            if (DATA_MODE === 'DEMO') {
                let data = await getTable<any>('sales_invoices', { filters: { tenant_id: tenantId } });

                // Apply client-side filters for demo
                if (filters.searchQuery) {
                    const q = filters.searchQuery.toLowerCase();
                    data = data.filter(item =>
                        (item.invoice_no || '').toLowerCase().includes(q) ||
                        (item.customer_name || '').toLowerCase().includes(q) ||
                        (item.customer_phone || '').includes(q)
                    );
                }
                if (filters.status !== 'ALL') {
                    data = data.filter(item => item.status === filters.status);
                }
                if (filters.paymentMode !== 'ALL') {
                    data = data.filter(item => item.payment_mode === filters.paymentMode);
                }
                if (filters.dateFrom) {
                    data = data.filter(item => item.date >= filters.dateFrom);
                }
                if (filters.dateTo) {
                    data = data.filter(item => item.date <= filters.dateTo);
                }

                // Sort by date descending
                data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const total = data.length;
                const from = (page - 1) * itemsPerPage;
                const paged = data.slice(from, from + itemsPerPage);

                setInvoices(paged.map(item => ({
                    id: item.id,
                    invoiceNo: item.invoice_no,
                    date: item.date,
                    customerName: item.customer_name || 'Guest',
                    customerPhone: item.customer_phone || '-',
                    netAmount: item.net_amount || 0,
                    paidAmount: item.paid_amount || 0,
                    balanceAmount: item.balance_amount || 0,
                    status: item.status,
                    paymentMode: item.payment_mode || 'CASH',
                    dueDate: item.due_date
                })));
                setTotalCount(total);

                const totalSales = paged.reduce((acc, curr) => acc + (curr.net_amount || 0), 0);
                const collected = paged.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0);
                setStats({
                    totalSales,
                    collected,
                    outstanding: totalSales - collected,
                    overdue: paged.filter(i => i.status === 'OVERDUE').reduce((acc, curr) => acc + (curr.balance_amount || 0), 0)
                });

                setLoading(false);
                return;
            }

            // DB MODE: Original Supabase query
            setLoading(false);
            return;
            /*
                        let query = supabase
                            .from('sales_invoices')
                            .select('*', { count: 'exact' })
                            .eq('tenant_id', tenantId);
            
                        // 2. Apply Filters
                        if (filters.searchQuery) {
                            // Using basic text search on specific columns for now for compatibility
                            query = query.or(`invoice_no.ilike.%${filters.searchQuery}%,customer_name.ilike.%${filters.searchQuery}%,customer_phone.ilike.%${filters.searchQuery}%`);
                        }
            
                        if (filters.status !== 'ALL') {
                            query = query.eq('status', filters.status);
                        }
            
                        if (filters.paymentMode !== 'ALL') {
                            query = query.eq('payment_mode', filters.paymentMode);
                        }
            
                        if (filters.dateFrom) {
                            query = query.gte('date', filters.dateFrom);
                        }
            
                        if (filters.dateTo) {
                            query = query.lte('date', filters.dateTo);
                        }
            
                        // 3. Pagination
                        const from = (page - 1) * itemsPerPage;
                        const to = from + itemsPerPage - 1;
            
                        const { data, error, count } = await query
                            .order('date', { ascending: false })
                            .range(from, to);
            
                        if (error) throw error;
            */
            setLoading(false);

            /*
                        if (data) {
                            setInvoices(data.map((item: any) => ({
                                id: item.id,
                                invoiceNo: item.invoice_no,
                                date: item.date,
                                customerName: item.customer_name || 'Guest',
                                customerPhone: item.customer_phone || '-',
                                netAmount: item.net_amount || 0,
                                paidAmount: item.paid_amount || 0,
                                balanceAmount: item.balance_amount || 0,
                                status: item.status,
                                paymentMode: item.payment_mode || 'CASH',
                                dueDate: item.due_date
                            })));
                            setTotalCount(count || 0);
            
                            // Simple aggregation on client for the view + simple total
                            // Real impl should allow RPC for stats.
                            const totalSales = data.reduce((acc: number, curr: any) => acc + (curr.net_amount || 0), 0);
                            const collected = data.reduce((acc: number, curr: any) => acc + (curr.paid_amount || 0), 0);
                            setStats({
                                totalSales,
                                collected,
                                outstanding: totalSales - collected,
                                overdue: 0 // logic needed
                            });
                        }
            */
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
