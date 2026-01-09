import { AppDispatch, RootState } from '../index';
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
            // Push Sale
            const { error: saleError } = await supabase
                .from('sales')
                .insert([{
                    id: sale.id,
                    tenant_id: user?.tenantId,
                    branch_id: sale.branchId,
                    customer_id: sale.customerId && !sale.customerId.startsWith('c') ? sale.customerId : null,
                    date: sale.date,
                    total: sale.total,
                    sector: sale.sector,
                    payment_method: sale.paymentMethod,
                    tax_mode: sale.taxMode,
                    status: sale.status,
                    payment_status: sale.paymentStatus,
                    items: sale.items,
                    loyalty_points_earned: sale.loyaltyPointsEarned || 0,
                    redeemed_points: sale.redeemedPoints || 0,
                    redemption_amount: sale.redemptionAmount || 0
                }]);

            if (saleError) throw saleError;

            // Update Stock in Supabase for each item
            for (const item of sale.items) {
                const deductionQty = item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty;

                const { data: prod } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('id', item.id)
                    .single();

                if (prod) {
                    const newStock = Math.max(0, (prod.stock || 0) - deductionQty);
                    await supabase
                        .from('products')
                        .update({ stock: newStock })
                        .eq('id', item.id);
                }
            }

            // Sync Loyalty Points in Supabase (Relative update)
            if (sale.customerId && !sale.customerId.startsWith('c')) {
                const pointsEarned = sale.loyaltyPointsEarned || 0;
                const pointsRedeemed = sale.redeemedPoints || 0;
                const netPoints = pointsEarned - pointsRedeemed;

                if (netPoints !== 0) {
                    const { data: dbCust } = await supabase
                        .from('customers')
                        .select('points')
                        .eq('id', sale.customerId)
                        .single();

                    if (dbCust) {
                        await supabase
                            .from('customers')
                            .update({ points: (dbCust.points || 0) + netPoints })
                            .eq('id', sale.customerId);
                    }
                }
            }

        } catch (err) {
            console.error('Failed to sync sale to Supabase:', err);
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
