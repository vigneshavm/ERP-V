import { logger } from '@/shared/lib/logger';
import { AppDispatch, RootState } from "@/app/store";
import { Sale } from "@repo/shared";
import { calculateLoyaltyPoints } from "@/entities/session/model/loyaltyUtils";
import { updateCustomerPoints } from '@/entities/sales/model/posSlice';
import { recordSale } from '@/entities/sales/model/posSlice';
import { deductStock } from '@/entities/inventory/model/inventorySlice';
import { APP_CONFIG } from "@/app/config";
// import { supabase } from '../../lib/supabase'; // Removed
import { TransactionType, Sector } from "@repo/shared";
import { addTransaction } from '@/entities/finance/model/financeSlice';

export const processSale = (sale: any) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    const currentTenant = state.tenant.tenants.find((t: any) => t.id === user?.tenantId);

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
    sale.items.forEach((item: any) => {
        const deductionQty = item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty;
        dispatch(deductStock({ id: item.id, qty: deductionQty }));
    });

    // 2. Push to Backend API if Online
    if (navigator.onLine) {
        import("@/shared/api/api").then(module => {
            const api = module.default;
            api.post('/sales-invoice/sync', {
                sale_json: {
                    ...sale,
                    tenant_id: user?.tenantId
                }
            }).then(({ data }) => {
                if (data && data.success) {
                    logger.info(`Synced sale atomically via thunk: ${sale.id}`);
                }
            }).catch(err => {
                logger.error('Failed to sync sale atomically to Backend:', err as any);
            });
        });
    }

    // 3. Record Financial Transaction (Local)
    let branchName: string | undefined = sale.branchId;

    if (!branchName) {
        const tenantBranches = (state.tenant.tenants || []).flatMap((t: any) => (t.locations || []).flatMap((l: any) => l.branches || []));
        if (tenantBranches.length === 1) branchName = tenantBranches[0].name;
    }

    if (!branchName) {
        const dbBranch = (state.tenant.branches || []).find((b: any) => b.id === sale.branchId || b.name === sale.branchId);
        if (dbBranch) branchName = dbBranch.name;
    }

    const descBranch = branchName || 'Unknown Branch';

    dispatch(addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        type: TransactionType.INCOME as any,
        category: 'Sales',
        amount: sale.total,
        date: sale.date,
        description: `Sale - Invoice #${sale.id}`,
        branchId: sale.branchId,
        paymentMethod: sale.paymentMethod || 'Cash',
        sector: sale.sector as Sector,
    } as any));
};
