import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer, { deductStock, addStockBulk } from './inventorySlice';
import posReducer, { recordSale } from './posSlice';
import financeReducer, { addTransaction } from './financeSlice';
import laborReducer from './laborSlice';
import purchaseReducer, { approveOrder } from './purchaseSlice';
import tenantReducer, { authReducer, settingsReducer } from './tenantSlice';
import { PurchaseOrder } from '../types/purchase';
import { TransactionType } from '../types/common';
import { Sale } from '../types/sales';
export const store = configureStore({
    reducer: {
        inventory: inventoryReducer,
        pos: posReducer,
        finance: financeReducer,
        labor: laborReducer,
        purchase: purchaseReducer,
        tenant: tenantReducer,
        auth: authReducer,
        settings: settingsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export actions for easier imports in components
export * from './inventorySlice';
export * from './posSlice';
export * from './financeSlice';
export * from './laborSlice';
export * from './purchaseSlice';
export * from './tenantSlice';

// --- Thunks migrated from old store.ts ---

export const processSale = (sale: Sale) => (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(recordSale(sale));
    sale.items.forEach(item => {
        const deductionQty = item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty;
        dispatch(deductStock({ id: item.id, qty: deductionQty }));
    });

    // Resolve branch name: prefer sale.branchId, then tenant locations, then DB branches, else fallback
    const state = getState();
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
        type: TransactionType.INCOME, // Use Enum
        category: 'Sales',
        amount: sale.total,
        date: sale.date,
        description: `Sale #${sale.id.substr(0, 6)} - ${descBranch} (${sale.paymentMethod})`,
        sector: sale.sector,
        branchId: sale.branchId
    }));
    // dispatch(clearCurrentSession()); // Handled in recordSale reducer
};

export const processPurchaseApproval = (order: PurchaseOrder) => (dispatch: AppDispatch) => {
    dispatch(approveOrder(order.id));
    dispatch(addStockBulk(order.items.map(i => ({
        sku: i.sku || 'UNKNOWN',
        qty: i.qty,
        cost: i.cost,
        price: undefined,
        name: i.name,
        category: 'Uncategorized', // Default
        productType: 'General', // Default
        sector: order.sector,
        branch: order.branchId
    }))));
    dispatch(addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        type: TransactionType.EXPENSE, // Use Enum
        category: 'Inventory Restock',
        amount: order.total,
        date: new Date().toISOString(),
        description: `Invoice Payment - ${order.vendor} (${order.branchId})`,
        sector: order.sector,
        branchId: order.branchId
    }));
};
