import Dexie, { Table } from 'dexie';
import { Product } from "../types/product";
import { Customer, Sale } from "../types/sales";
import { SyncLedgerEntry } from "../types/tenant";

export interface OfflineSale extends Sale {
    localId?: number;
    synced: boolean;
    retryCount: number;
}

export interface SyncMetadata {
    key: string;
    lastSynced: string;
}

export interface DailyFinanceQueueItem {
    localId?: number;
    recordId: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    data: any;
    synced: boolean;
    retryCount: number;
    timestamp: string;
    error?: string;
}

export class AppDatabase extends Dexie {
    products!: Table<Product>;
    customers!: Table<Customer>;
    offlineSales!: Table<OfflineSale>;
    syncMetadata!: Table<SyncMetadata>;
    dailyFinanceQueue!: Table<DailyFinanceQueueItem>;
    syncLedger!: Table<SyncLedgerEntry>;

    constructor() {
        super('ERPOfflineDB');
        this.version(1).stores({
            products: 'id, sku, barcode, name, category, branchId, tenantId',
            customers: 'id, name, phone, tenantId',
            offlineSales: '++localId, id, date, customerId, tenantId, synced',
            syncMetadata: 'key',
            dailyFinanceQueue: '++localId, recordId, synced, operation'
        });
        // v2 adds this device's sync event log (SyncIntelligenceService.logEvent); existing tables unchanged.
        this.version(2).stores({
            syncLedger: 'id, timestamp, status'
        });
    }
}

export const db = new AppDatabase();
