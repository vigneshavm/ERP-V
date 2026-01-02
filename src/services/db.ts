import Dexie, { Table } from 'dexie';
import { Product } from '../types/product';
import { Customer, Sale } from '../types/sales';

export interface OfflineSale extends Sale {
    localId?: number;
    synced: boolean;
    retryCount: number;
}

export interface SyncMetadata {
    key: string;
    lastSynced: string;
}

export class AppDatabase extends Dexie {
    products!: Table<Product>;
    customers!: Table<Customer>;
    offlineSales!: Table<OfflineSale>;
    syncMetadata!: Table<SyncMetadata>;

    constructor() {
        super('ERPOfflineDB');
        this.version(1).stores({
            products: 'id, sku, barcode, name, category, branchId, tenantId',
            customers: 'id, name, phone, tenantId',
            offlineSales: '++localId, id, date, customerId, tenantId, synced',
            syncMetadata: 'key'
        });
    }
}

export const db = new AppDatabase();
