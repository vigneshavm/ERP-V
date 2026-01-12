import { AppDispatch, RootState } from '../types';
import { Sale } from '../../types/sales';
import { calculateLoyaltyPoints } from '../../utils/loyalty';
import { updateCustomerPoints } from '../posSlice';
import { recordSale } from '../posSlice';
import { deductStock } from '../inventorySlice';
import { APP_CONFIG } from '../../config';
import { supabase } from '../../lib/supabase';
import { TransactionType } from '../../types/common';
import { addTransaction } from '../financeSlice';

export const processSale = (sale: Sale) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    const currentTenant = state.tenant.tenants.find(t => t.id === user?.tenantId);

    // 0. Calculate Loyalty Points (if not already calculated)
    if (currentTenant && sale.customerId && !sale.loyaltyPointsEarned) {
        const earned = calculateLoyaltyPoints(sale.items, currentTenant);
        if (earned > 0) {
            sale.loyaltyPointsEarned = earned;
            dispatch(updateCustomerPoints({ id: sale.customerId, points: earned }));
        }
    } else if (sale.loyaltyPointsEarned && sale.customerId) {
        // Points already calculated (e.g. from POSLogic), just update local state
        dispatch(updateCustomerPoints({ id: sale.customerId, points: sale.loyaltyPointsEarned }));
    }

    // 0.1 Deduct Redemption Points
    if (sale.redeemedPoints && sale.customerId) {
        dispatch(updateCustomerPoints({ id: sale.customerId, points: -sale.redeemedPoints }));
    }

    // 1. Update Local Redux State (Optimistic)
    dispatch(recordSale(sale));
    sale.items.forEach(item => {
        const deductionQty = item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty;
        dispatch(deductStock({ id: item.id, qty: deductionQty }));
    });

    // 2. Push to Supabase if Online & Enabled
    if (APP_CONFIG.USE_SUPABASE && supabase && navigator.onLine) {
        try {
            // Optimized: Sync the entire sale and its inventory impact in one atomic transaction
            const { error } = await supabase.rpc('sync_sale_with_inventory', {
                p_sale_json: {
                    ...sale,
                    tenant_id: user?.tenantId
                }
            });

            if (error) throw error;
            console.log(`Synced sale atomically via thunk: ${sale.id}`);
        } catch (err) {
            console.error('Failed to sync sale atomically to Supabase:', err);
        }
    }

    // 3. Record Financial Transaction (Local)
    let branchName: string | undefined = sale.branchId;

    if (!branchName) {
        const tenantBranches = (state.tenant.tenants || []).flatMap(t => (t.locations || []).flatMap((l: any) => l.branches || []));
        if (tenantBranches.length === 1) branchName = tenantBranches[0].name;
    }

    if (!branchName) {
        const dbBranch = (state.tenant.branches || []).find(b => b.id === sale.branchId || b.name === sale.branchId);
        if (dbBranch) branchName = dbBranch.name;
    }

    const descBranch = branchName || 'Unknown Branch';

    dispatch(addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        type: TransactionType.INCOME,
        category: 'Sales',
        amount: sale.total,
        date: sale.date,
        description: `Sale #${sale.id} - ${descBranch} (${sale.counterName || 'Counter'}) (${sale.paymentMethod})`,
        sector: sale.sector,
        branchId: sale.branchId
    }));
};
