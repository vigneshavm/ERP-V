import { db } from './db';
import api from './api';
import { store } from "../redux/store";
import { setDailyRecordSynced } from "../redux/slices/financeSlice";
import { SyncIntelligenceService } from './SyncIntelligenceService';

export class SyncManager {
    private static isSyncingSelection = false;
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
                    // Optimized: Sync the entire sale and its inventory impact in one atomic transaction
                    // Replaced Supabase RPC with API call
                    const { data } = await api.post('/sales-invoice/sync', {
                        sale_json: sale
                    });

                    // Assuming API returns success
                    await db.offlineSales.update(sale.localId!, { synced: true });
                    console.log(`Synced sale: ${sale.id}`);

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

                } catch (err) {
                    console.error(`Failed to sync sale ${sale.id}:`, err);
                    // Update retry count if needed
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

                    // Use API instead of Supabase
                    // Assuming generic sync endpoint or mapped endpoints
                    const endpoint = '/finance/sync'; // Placeholder
                    await api.post(endpoint, {
                        recordId,
                        operation,
                        data,
                        tenant_id: data.tenant_id
                    });

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
                        eventType: operation === 'INSERT' ? 'PAYMENT' : 'STOCK_ADJUST',
                        entityId: recordId,
                        entityType: 'DailyFinance',
                        status: 'SYNCED',
                        payload: { operation }
                    });

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
