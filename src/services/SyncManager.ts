import { db, OfflineSale } from './db';
import { supabase } from '../lib/supabase';
import { store, setDailyRecordSynced } from '../store';

export class SyncManager {
    private static isSyncing = false;
    private static isSyncingDF = false;

    static async syncOfflineSales() {
        if (this.isSyncing || !navigator.onLine) return;
        this.isSyncing = true;

        try {
            const pendingSales = await db.offlineSales
                .where('synced')
                .equals(0) // false
                .toArray();

            for (const sale of pendingSales) {
                try {
                    // Remove local-only properties before sending to Supabase
                    const { localId, synced, retryCount, ...supabaseSale } = sale as any;

                    const { error } = await supabase
                        .from('sales')
                        .insert([{
                            ...supabaseSale,
                            id: supabaseSale.id || undefined // Let DB generate ID if missing, or use provided
                        }]);

                    if (!error) {
                        await db.offlineSales.update(sale.localId!, { synced: true });
                        console.log(`Synced sale: ${sale.id}`);

                        // Deduct Stock in Supabase for each item in the synced sale
                        if (supabaseSale.items && Array.isArray(supabaseSale.items)) {
                            for (const item of supabaseSale.items) {
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
                        }

                        // NEW: Update Customer Loyalty Points in Supabase
                        if (supabaseSale.customerId && !supabaseSale.customerId.startsWith('c')) {
                            const pointsEarned = supabaseSale.loyaltyPointsEarned || 0;
                            const pointsRedeemed = supabaseSale.redeemedPoints || 0;
                            const netPoints = pointsEarned - pointsRedeemed;

                            if (netPoints !== 0) {
                                // Fetch current points to be safe
                                const { data: cust } = await supabase
                                    .from('customers')
                                    .select('points')
                                    .eq('id', supabaseSale.customerId)
                                    .single();

                                if (cust) {
                                    const newPoints = (cust.points || 0) + netPoints;
                                    await supabase
                                        .from('customers')
                                        .update({ points: newPoints })
                                        .eq('id', supabaseSale.customerId);
                                    console.log(`Updated points for customer ${supabaseSale.customerId}: ${newPoints}`);
                                }
                            }
                        }
                    } else {
                        console.error(`Error syncing sale ${sale.id}:`, error);
                        await db.offlineSales.update(sale.localId!, {
                            retryCount: (sale.retryCount || 0) + 1
                        });
                    }
                } catch (err) {
                    console.error(`Failed to sync sale ${sale.id}:`, err);
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }

    static async cacheProducts(products: any[]) {
        try {
            await db.products.bulkPut(products);
            await db.syncMetadata.put({ key: 'products_last_sync', lastSynced: new Date().toISOString() });
        } catch (err) {
            console.error('Failed to cache products:', err);
        }
    }

    static async cacheCustomers(customers: any[]) {
        try {
            await db.customers.bulkPut(customers);
            await db.syncMetadata.put({ key: 'customers_last_sync', lastSynced: new Date().toISOString() });
        } catch (err) {
            console.error('Failed to cache customers:', err);
        }
    }

    static async getOfflineProducts() {
        return await db.products.toArray();
    }

    static async getOfflineCustomers() {
        return await db.customers.toArray();
    }

    static async syncDailyFinanceEntries() {
        if (this.isSyncingDF || !navigator.onLine) return;
        this.isSyncingDF = true;

        try {
            const pending = await db.dailyFinanceQueue
                .where('synced')
                .equals(0)
                .toArray();

            for (const item of pending) {
                try {
                    const { recordId, operation, data } = item;
                    let result;

                    if (!supabase) throw new Error('Supabase client not initialized');

                    if (operation === 'INSERT') {
                        result = await supabase
                            .from('daily_finance')
                            .insert([data]);
                    } else if (operation === 'UPDATE') {
                        result = await supabase
                            .from('daily_finance')
                            .update(data)
                            .eq('id', recordId)
                            .eq('tenant_id', data.tenant_id);
                    } else if (operation === 'DELETE') {
                        result = await supabase
                            .from('daily_finance')
                            .delete()
                            .eq('id', recordId)
                            .eq('tenant_id', data.tenant_id);
                    }

                    if (result?.error) {
                        console.error(`Sync error for ${operation} ${recordId}:`, result.error);
                        await db.dailyFinanceQueue.update(item.localId!, {
                            error: result.error.message,
                            retryCount: (item.retryCount || 0) + 1
                        });
                    } else {
                        await db.dailyFinanceQueue.update(item.localId!, { synced: true });
                        console.log(`Synced ${operation} for ${recordId}`);

                        // Update Redux state
                        if (operation !== 'DELETE') {
                            store.dispatch(setDailyRecordSynced({ id: recordId, synced: true }));
                        }
                    }
                } catch (err: any) {
                    console.error(`Unexpected sync error for item ${item.recordId}:`, err);
                    await db.dailyFinanceQueue.update(item.localId!, {
                        error: err.message,
                        retryCount: (item.retryCount || 0) + 1
                    });
                }
            }
        } finally {
            this.isSyncingDF = false;
        }
    }
}
