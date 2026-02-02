import { useState, useCallback, useEffect } from 'react';
// import { supabase } from '../lib/supabase'; // Removed
import { SalesReturn } from "../types/salesReturn";
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export const useSalesReturnManager = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenantId = user?.tenantId;

    const [isProcessing, setIsProcessing] = useState(false);
    const [returnsHistory, setReturnsHistory] = useState<SalesReturn[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchReturns = useCallback(async () => {
        if (!tenantId) return;
        setLoadingHistory(true);
        /*
                const { data, error } = await supabase
                    .from('sales_returns')
                    .select(`
                        *,
                        items:sales_return_items(*)
                    `)
                    .eq('tenant_id', tenantId)
                    .order('created_at', { ascending: false })
                    .limit(50);
        
                if (!error && data) {
                    // Need to map custom join if necessary, but naming convention usually matches 
                    // if we use camelCard in types but snake_case in DB, we need a mapper.
                    // My types use camelCase. Supabase returns snake_case.
                    // I'll add a mapper.
                    const mapped = data.map((r: any) => ({
                        id: r.id,
                        tenantId: r.tenant_id,
                        branchId: r.branch_id,
                        invoiceId: r.invoice_id,
                        customerId: r.customer_id,
                        customerName: '', // Join not trivial without another query or view, stick to ID for now or lookup in component
                        returnDate: r.return_date,
                        subtotal: r.subtotal,
                        taxAmount: r.tax_amount,
                        totalRefundAmount: r.total_refund_amount,
                        status: r.status,
                        refundMethod: r.refund_method,
                        refundStatus: r.refund_status,
                        notes: r.notes,
                        items: r.items?.map((i: any) => ({
                            id: i.id,
                            salesReturnId: i.sales_return_id,
                            productId: i.product_id,
                            quantity: i.quantity,
                            unitPrice: i.unit_price,
                            lineTotal: i.line_total,
                            condition: i.condition
                        }))
                    }));
                    setReturnsHistory(mapped);
                }
        */
        setLoadingHistory(false);
    }, [tenantId]);

    const processReturn = async (returnData: SalesReturn) => {
        setIsProcessing(true);
        try {
            // Transform to snake_case payload if RPC expects JSON param names inside to be camelCase, 
            // but my RPC does `p_return_data->>'tenantId'`. So camelCase in JSON blobl is fine.

            const payload = {
                tenantId: returnData.tenantId,
                branchId: returnData.branchId,
                invoiceId: returnData.invoiceId,
                customerId: returnData.customerId,
                returnDate: returnData.returnDate,
                subtotal: returnData.subtotal,
                taxAmount: returnData.taxAmount,
                totalRefundAmount: returnData.totalRefundAmount,
                refundMethod: returnData.refundMethod,
                returnReason: returnData.returnReason,
                notes: returnData.notes,
                createdBy: user?.id
            };

            const itemsPayload = returnData.items?.map(i => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                lineTotal: i.lineTotal,
                condition: i.condition,
                reason: i.reason
            }));

            /*
                        const { data, error } = await supabase.rpc('process_sales_return', {
                            p_return_data: payload,
                            p_items: itemsPayload
                        });
            
                        if (error) throw error;
            */
            const data: any = null;

            // Refresh history
            fetchReturns();

            return { success: true, data };
        } catch (error) {
            console.error('Return processing failed:', error);
            return { success: false, error };
        } finally {
            setIsProcessing(false);
        }
    };

    // Load initial history
    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    return {
        processReturn,
        returnsHistory,
        loadingHistory,
        isProcessing,
        refreshReturns: fetchReturns
    };
};
