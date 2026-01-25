import { db, OfflineSale } from './db';
import { supabase } from '../../../src/lib/supabase';
import { store } from '../redux/store';
import { setDailyRecordSynced } from '../redux/slices/financeSlice';
import { DATA_MODE } from './dataSource';
import { SyncIntelligenceService } from './SyncIntelligenceService';

export class SyncManager {
    private static isSyncing = false;
    private static isSyncingDF = false;

    static async syncOfflineSales() {
        if (DATA_MODE === 'DEMO') return; // Skip sync in demo mode
        if (this.isSyncing || !navigator.onLine) return;
        this.isSyncing = true;

        try {
            const pendingSales = await db.offlineSales
                .where('synced')
                .equals(0) // false
                .toArray();

            for (const sale of pendingSales) {
                try {
                    // Optimized: Sync the entire sale and its inventory impact in one atomic transaction
                    const { error } = await supabase.rpc('sync_sale_with_inventory', {
                        p_sale_json: sale
                    });

                    if (!error) {
                        await db.offlineSales.update(sale.localId!, { synced: true });
                        console.log(`Synced sale atomically: ${sale.id}`);

                        // Log to Sync Intelligence Ledger
                        await SyncIntelligenceService.logEvent({
                            deviceId: 'LOCAL_POS', // In real system, get actual device ID
                            branchId: sale.branchId || 'UNKNOWN',
                            eventType: 'SALE',
                            entityId: sale.id!,
                            entityType: 'Invoice',
                            status: 'SYNCED',
                            payload: { total: sale.total, itemsCount: sale.items?.length }
                        });
                    } else {
                        console.error(`Error syncing sale atomically ${sale.id}:`, error);
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

    static async getOfflineProducts(tenantId: string) {
        if (!tenantId) return [];
        return await db.products
            .where('tenantId')
            .equals(tenantId)
            .toArray();
    }

    static async getOfflineCustomers(tenantId: string) {
        if (!tenantId) return [];
        return await db.customers
            .where('tenantId')
            .equals(tenantId)
            .toArray();
    }

    static async syncDailyFinanceEntries() {
        if (DATA_MODE === 'DEMO') return; // Skip sync in demo mode
        if (this.isSyncingDF || !navigator.onLine) return;
        this.isSyncingDF = true;
        // ... rest of the code ...

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

                        // Log to Sync Intelligence Ledger
                        await SyncIntelligenceService.logEvent({
                            deviceId: 'LOCAL_POS',
                            branchId: data.branch_id || 'UNKNOWN',
                            eventType: operation === 'INSERT' ? 'PAYMENT' : 'STOCK_ADJUST', // Simplification for demo
                            entityId: recordId,
                            entityType: 'DailyFinance',
                            status: 'SYNCED',
                            payload: { operation }
                        });
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
