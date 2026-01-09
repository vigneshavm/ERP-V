import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer, { deductStock, addStockBulk } from './inventorySlice';
import posReducer, { recordSale, setCustomer, addCustomer, updateCustomerPoints, addSession, removeSession, setRedeemedPoints, setActiveSession, setTaxMode, setActiveCounter, holdCurrentBill, resumeBill, discardHeldBill, removeFromCart, clearCart } from './posSlice';
import financeReducer, { addTransaction, addDailyRecord, updateDailyRecord, deleteDailyRecord, setDailyRecordSynced } from './financeSlice';
import laborReducer from './laborSlice';
import purchaseReducer, { approveOrder, addOrder } from './purchaseSlice';
import tenantReducer, { authReducer, settingsReducer, incrementCounterBillNumber } from './tenantSlice';
import vendorReducer, { recordVendorTransaction, fetchVendors } from './vendorSlice';
import uiReducer from './uiSlice';
import { db } from '../services/db';
import { SyncManager } from '../services/SyncManager';

import { PurchaseOrder } from '../types/purchase';
import { TransactionType } from '../types/common';
import { CartItem } from '../types/sales';
import { Sale, Customer } from '../types/sales';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config';
import { calculateLoyaltyPoints } from '../utils/loyalty';
import { Tenant } from '../types/tenant';

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
        vendor: vendorReducer,
        ui: uiReducer,
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
export * from './vendorSlice';
export * from './uiSlice';


// --- Thunks migrated from old store.ts ---

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
            // Using a loop for now (Sequential update)
            for (const item of sale.items) {
                const deductionQty = item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty;

                // Fetch latest stock to be "safe" (still not atomic but better than assuming local is perfect)
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
        type: TransactionType.INCOME, // Use Enum
        category: 'Sales',
        amount: sale.total,
        date: sale.date,
        description: `Sale #${sale.id} - ${descBranch} (${sale.counterName || 'Counter'}) (${sale.paymentMethod})`,
        sector: sale.sector,
        branchId: sale.branchId
    }));
};

export const processPurchaseApproval = (order: PurchaseOrder) => (dispatch: AppDispatch, getState: () => RootState) => {
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

    // Record Vendor Transaction if vendorId exists
    if (order.vendorId) {
        dispatch(recordVendorTransaction(
            order.vendorId,
            'PURCHASE',
            order.total,
            `Purchase Bill #${order.id}`,
            order.id
        ));
    }
};
const calculateTier = (points: number): 'Silver' | 'Gold' | 'Platinum' | 'General' => {
    if (points >= 5000) return 'Platinum';
    if (points >= 2000) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'General';
};

export const lookupOrCreateCustomer = (phone: string, name?: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    const { customers } = state.pos;

    if (!user?.tenantId) return;

    // 1. Check local state first
    const existingLocal = customers.find(c => c.phone === phone);
    if (existingLocal) {
        const updatedLocal = { ...existingLocal, tier: calculateTier(existingLocal.points) };
        alert(`Existing customer found for ${phone}: ${existingLocal.name}. Selecting profile.`);
        dispatch(setCustomer(updatedLocal.id));
        return updatedLocal;
    }

    // 2. Check Supabase
    if (APP_CONFIG.USE_SUPABASE && supabase) {
        try {
            const { data: dbCust, error: fetchErr } = await supabase
                .from('customers')
                .select('*')
                .eq('tenant_id', user.tenantId)
                .eq('phone', phone)
                .single();

            if (dbCust) {
                const customer: Customer = {
                    id: dbCust.id,
                    name: dbCust.name,
                    phone: dbCust.phone,
                    points: dbCust.points || 0,
                    tier: calculateTier(dbCust.points || 0),
                    tenantId: dbCust.tenant_id
                };
                alert(`Existing customer found in database for ${phone}: ${customer.name}. Selecting profile.`);
                dispatch(addCustomer(customer));
                dispatch(setCustomer(customer.id));
                return customer;
            }

            // 3. Create new if not found (Lite-weight creation)
            const newCustData = {
                tenant_id: user.tenantId,
                phone: phone,
                name: name || 'Walk-in Customer',
                points: 0
            };

            alert(`Creating new profile for ${phone}: ${newCustData.name}`);

            const { data: createdCust, error: createErr } = await supabase
                .from('customers')
                .insert([newCustData])
                .select()
                .single();

            if (createErr) {
                // Handle Duplicate (Race condition or existing but fetch failed)
                if (createErr.code === '23505') {
                    const { data: retryCust } = await supabase
                        .from('customers')
                        .select('*')
                        .eq('tenant_id', user.tenantId)
                        .eq('phone', phone)
                        .single();

                    if (retryCust) {
                        alert(`A customer with phone ${phone} already exists (${retryCust.name}). Selecting existing profile.`);
                        const customer: Customer = {
                            id: retryCust.id,
                            name: retryCust.name,
                            phone: retryCust.phone,
                            points: retryCust.points || 0,
                            tier: calculateTier(retryCust.points || 0),
                            tenantId: retryCust.tenant_id
                        };
                        dispatch(addCustomer(customer));
                        dispatch(setCustomer(customer.id));
                        return customer;
                    }
                }
                throw createErr;
            }

            if (createdCust) {
                const customer: Customer = {
                    id: createdCust.id,
                    name: createdCust.name,
                    phone: createdCust.phone,
                    points: createdCust.points || 0,
                    tier: 'General',
                    tenantId: createdCust.tenant_id
                };
                dispatch(addCustomer(customer));
                dispatch(setCustomer(customer.id));
                return customer;
            }
        } catch (err) {
            console.error('Customer lookup/creation failed:', err);
        }
    }

    // Fallback: Create local-only temp customer if Supabase fails or is disabled
    const tempCustomer: Customer = {
        id: `temp-${Date.now()}`,
        name: name || 'Walk-in Customer',
        phone: phone,
        points: 0,
        tier: 'General',
        tenantId: user.tenantId
    };
    dispatch(addCustomer(tempCustomer));
    dispatch(setCustomer(tempCustomer.id));
    return tempCustomer;
};

export const saveDailyFinanceRecord = (record: any) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    if (!user) return;

    const supabaseData = {
        id: record.id,
        tenant_id: user.tenantId,
        date: record.date,
        cash_sales: parseFloat(record.cashSales) || 0,
        online_sales: parseFloat(record.onlineSales) || 0,
        expenses: parseFloat(record.expenses) || 0,
        cash_in_drawer: parseFloat(record.cashInDrawer) || 0,
        notes: record.notes || '',
        timestamp: record.timestamp || new Date().toISOString()
    };

    try {
        // 1. Save to Offline Queue
        await db.dailyFinanceQueue.add({
            recordId: record.id,
            operation: 'INSERT',
            data: supabaseData,
            synced: false,
            retryCount: 0,
            timestamp: new Date().toISOString()
        });

        // 2. Optimistic Update (Redux)
        dispatch(addDailyRecord({ ...record, tenantId: user.tenantId, synced: false }));

        // 3. Immediate Sync
        if (navigator.onLine && supabase) {
            const { error } = await supabase.from('daily_finance').insert([supabaseData]);
            if (!error) {
                await db.dailyFinanceQueue.where({ recordId: record.id, operation: 'INSERT' }).modify({ synced: true });
                dispatch(setDailyRecordSynced({ id: record.id, synced: true }));
                console.log('Daily finance record synced immediately');
            } else {
                console.error('Immediate sync failed:', error);
            }
        }
    } catch (err) {
        console.error('Failed to queue daily finance record:', err);
    }
};

export const updateDailyFinanceRecord = (record: any) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    if (!user) return;

    const supabaseData = {
        tenant_id: user.tenantId,
        date: record.date,
        cash_sales: parseFloat(record.cashSales) || 0,
        online_sales: parseFloat(record.onlineSales) || 0,
        expenses: parseFloat(record.expenses) || 0,
        cash_in_drawer: parseFloat(record.cashInDrawer) || 0,
        notes: record.notes || '',
        timestamp: record.timestamp || new Date().toISOString()
    };

    try {
        // 1. Queue Update
        await db.dailyFinanceQueue.add({
            recordId: record.id,
            operation: 'UPDATE',
            data: supabaseData,
            synced: false,
            retryCount: 0,
            timestamp: new Date().toISOString()
        });

        // 2. Optimistic Update (Redux)
        dispatch(updateDailyRecord({ ...record, synced: false }));

        // 3. Immediate Sync
        if (navigator.onLine && supabase) {
            const { error } = await supabase.from('daily_finance').update(supabaseData).eq('id', record.id).eq('tenant_id', user.tenantId);
            if (!error) {
                await db.dailyFinanceQueue.where({ recordId: record.id, operation: 'UPDATE' }).modify({ synced: true });
                dispatch(setDailyRecordSynced({ id: record.id, synced: true }));
                console.log('Daily finance update synced immediately');
            } else {
                console.error('Immediate update sync failed:', error);
            }
        }
    } catch (err) {
        console.error('Failed to queue daily finance update:', err);
    }
};

export const deleteDailyFinanceRecord = (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    if (!user) return;

    try {
        // 1. Queue Delete
        await db.dailyFinanceQueue.add({
            recordId: id,
            operation: 'DELETE',
            data: { tenant_id: user.tenantId },
            synced: false,
            retryCount: 0,
            timestamp: new Date().toISOString()
        });

        // 2. Optimistic Update (Redux)
        dispatch(deleteDailyRecord(id));

        // 3. Immediate Sync
        if (navigator.onLine && supabase) {
            const { error } = await supabase.from('daily_finance').delete().eq('id', id).eq('tenant_id', user.tenantId);
            if (!error) {
                await db.dailyFinanceQueue.where({ recordId: id, operation: 'DELETE' }).modify({ synced: true });
                console.log('Daily finance deletion synced immediately');
            } else {
                console.error('Immediate delete sync failed:', error);
            }
        }
    } catch (err) {
        console.error('Failed to queue daily finance deletion:', err);
    }
};
